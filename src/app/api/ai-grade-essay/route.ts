import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role, class_id")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "teacher") {
    return NextResponse.json({ error: "Only teachers can grade" }, { status: 403 });
  }

  const body = await request.json();
  const { exam_id, submission_id } = body;

  if (!exam_id || !submission_id) {
    return NextResponse.json({ error: "exam_id and submission_id are required" }, { status: 400 });
  }

  const { data: exam } = await adminClient
    .from("exams")
    .select("*")
    .eq("id", exam_id)
    .eq("class_id", profile.class_id)
    .single();

  if (!exam) {
    return NextResponse.json({ error: "Exam not found or not in your class" }, { status: 404 });
  }

  const { data: submission } = await adminClient
    .from("exam_submissions")
    .select("*")
    .eq("id", submission_id)
    .eq("exam_id", exam_id)
    .single();

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  const questions = Array.isArray(exam.questions) ? exam.questions : [];
  const answers = Array.isArray(submission.answers) ? submission.answers : [];
  const essayQuestions = questions.filter((q: any) => q.type === "essay");

  if (essayQuestions.length === 0) {
    return NextResponse.json({ error: "No essay questions in this exam" }, { status: 400 });
  }

  // Build the grading prompt
  let promptLines: string[] = [
    "You are grading a student's exam. For each essay question below, provide:",
    "1. A precise percentage score from 0 to 100. Use ANY integer in this range — 11, 23, 45, 67, 32, 34, 78, 87, 99, 95, etc. Do NOT round to multiples of 5 or 10. Be exact based on answer quality.",
    "   - 0-10%: no answer or completely irrelevant",
    "   - 11-25%: very poor, almost no understanding",
    "   - 26-40%: poor, major gaps, minimal understanding",
    "   - 41-55%: below average, significant errors",
    "   - 56-70%: average, some correct points but incomplete",
    "   - 71-85%: good, mostly correct with minor issues",
    "   - 86-95%: very good, thorough with small gaps",
    "   - 96-100%: excellent, complete mastery",
    "2. A brief assessment (1-3 sentences) explaining why the student earned that percentage",
    "3. Constructive feedback (1-2 sentences) for improvement",
    "",
    "CRITICAL: Use the FULL 0-100 range. A student who got 3 out of 5 key points right should get around 60%, not 50% or 75%. Be precise — if the answer deserves 67%, say 67, not 65 or 70.",
    "",
    "Respond ONLY with a JSON array of objects with fields: question_index (number), percent (number 0-100), assessment (string), feedback (string).",
    "Do NOT include markdown code blocks or any other text. ONLY the raw JSON array.",
    "",
    "EXAM QUESTIONS AND ANSWERS:",
    "",
  ];

  essayQuestions.forEach((q: any, idx: number) => {
    const answer = answers.find((a: any) => a.question_index === idx);
    promptLines.push(`--- Essay Question ${idx + 1} (${q.points || 5} pts) ---`);
    promptLines.push(`Question: ${q.text}`);
    promptLines.push(`Student Answer: ${answer?.text || "(no answer)"}`);
    promptLines.push("");
  });

  const prompt = promptLines.join("\n");

  if (!DEEPSEEK_API_KEY) {
    return NextResponse.json({ error: "DeepSeek API key not configured" }, { status: 500 });
  }

  // Call DeepSeek API (OpenAI-compatible)
  try {
    const deepseekRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        max_tokens: 2000,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: "You are an expert teacher grading student essays. You provide fair, constructive feedback. You ONLY respond with valid JSON arrays, never markdown or extra text.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!deepseekRes.ok) {
      const errText = await deepseekRes.text();
      console.error("DeepSeek API error:", errText);
      return NextResponse.json({ error: "AI grading service unavailable. Please try again." }, { status: 502 });
    }

    const aiData = await deepseekRes.json();
    const responseText = aiData.choices?.[0]?.message?.content || "[]";

    // Extract JSON from response (handle cases where AI wraps in markdown)
    let jsonStr = responseText.trim();
    // Remove markdown code block if present
    jsonStr = jsonStr.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "");
    // Try to find JSON array
    const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
    jsonStr = jsonMatch ? jsonMatch[0] : jsonStr;

    let grades: any[];
    try {
      grades = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse DeepSeek response:", responseText);
      return NextResponse.json({ error: "AI returned invalid format. Please try again." }, { status: 500 });
    }

    if (!Array.isArray(grades) || grades.length === 0) {
      return NextResponse.json({ error: "AI returned empty grades. Please try again." }, { status: 500 });
    }

    // Parse grades: use pure 0-100% percentages — no point conversion
    grades = grades.map((g: any, idx: number) => {
      const percent = Math.max(0, Math.min(Math.round(g.percent ?? 0), 100));

      return {
        question_index: g.question_index ?? idx,
        percent,
        assessment: g.assessment || "No assessment provided.",
        feedback: g.feedback || "No feedback provided.",
      };
    });

    // Calculate overall average percentage across all essays
    const overallPercent: number = Math.round(
      grades.reduce((sum: number, g: any) => sum + g.percent, 0) / grades.length
    );

    // Save AI grades to submission
    await adminClient
      .from("exam_submissions")
      .update({
        ai_grades: grades,
        score: overallPercent, // store overall percent as score
        total: 100,            // out of 100%
      })
      .eq("id", submission_id);

    return NextResponse.json({
      grades,
      overall_percent: overallPercent,
      mode: "deepseek",
    });
  } catch (err: any) {
    console.error("AI grading error:", err);
    return NextResponse.json({ error: "Failed to grade essays: " + err.message }, { status: 500 });
  }
}