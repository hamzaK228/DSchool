import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!DEEPSEEK_API_KEY) {
    return NextResponse.json({ error: "AI service not configured" }, { status: 500 });
  }

  const body = await request.json();
  const { type, prompt } = body;

  if (!type || !prompt) {
    return NextResponse.json({ error: "type and prompt are required" }, { status: 400 });
  }

  let systemPrompt = "";
  let userPrompt = "";

  switch (type) {
    case "homework":
      systemPrompt = "You are an expert teacher creating homework assignments. Respond ONLY with a valid JSON object. No markdown, no extra text.";
      userPrompt = `Create a homework assignment based on this prompt: "${prompt}"

Return a JSON object with:
- title: a clear, engaging title
- description: 2-3 sentence description of the task, instructions, or prompt for students
- due_date: suggest a reasonable due date in YYYY-MM-DD format (use a date 5-7 days from now)
- points: suggested point value as a number (10-100)

Example: {"title": "Chemistry Lab Report", "description": "Write a detailed lab report...", "due_date": "2026-03-15", "points": 50}

ONLY the JSON object, nothing else.`;
      break;

    case "announcement":
      systemPrompt = "You are an expert teacher writing school announcements. Respond ONLY with a valid JSON object. No markdown, no extra text.";
      userPrompt = `Create a school announcement based on this prompt: "${prompt}"

Return a JSON object with:
- title: a clear, attention-grabbing title
- body: 2-4 sentence announcement message that is professional and warm

Example: {"title": "Important: Science Fair Next Week", "body": "Dear students, the annual Science Fair will be held on Friday..."}

ONLY the JSON object, nothing else.`;
      break;

    case "survey":
      systemPrompt = "You are an expert teacher creating classroom surveys. Respond ONLY with a valid JSON object. No markdown, no extra text.";
      userPrompt = `Create a classroom survey based on this prompt: "${prompt}"

Return a JSON object with:
- question: the survey question (one clear, neutral question)
- options: an array of 3-5 answer options as strings
- closes_at: suggest a closing date in ISO format (3-5 days from now)

Example: {"question": "Which topic would you like to review?", "options": ["Algebra", "Geometry", "Statistics", "Trigonometry"], "closes_at": "2026-03-15T23:59:00Z"}

ONLY the JSON object, nothing else.`;
      break;

    case "exam":
      systemPrompt = "You are an expert teacher creating exam questions. Respond ONLY with a valid JSON object. No markdown, no extra text.";
      userPrompt = `Create an exam based on this prompt: "${prompt}"

Return a JSON object with:
- title: a clear exam title
- time_limit_minutes: suggested time limit (15-60)
- questions: an array of 3-6 question objects, each with:
  - id: "q_auto_N" where N is 1-based index
  - type: "multiple_choice"
  - text: the question text
  - options: array of 4 answer choices
  - correct: index (0-3) of the correct answer
  - points: point value (1-10)
  - image_url: null

Example:
{
  "title": "Biology Quiz - Cell Structure",
  "time_limit_minutes": 20,
  "questions": [
    {
      "id": "q_auto_1",
      "type": "multiple_choice",
      "text": "What is the powerhouse of the cell?",
      "options": ["Nucleus", "Mitochondria", "Ribosome", "Golgi body"],
      "correct": 1,
      "points": 5,
      "image_url": null
    }
  ]
}

ONLY the JSON object, nothing else.`;
      break;

    default:
      return NextResponse.json({ error: "Invalid type. Use: homework, announcement, survey, or exam" }, { status: 400 });
  }

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
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!deepseekRes.ok) {
      const errText = await deepseekRes.text();
      console.error("DeepSeek assist error:", errText);
      return NextResponse.json({ error: "AI service unavailable" }, { status: 502 });
    }

    const aiData = await deepseekRes.json();
    const responseText = aiData.choices?.[0]?.message?.content || "{}";

    let jsonStr = responseText.trim();
    jsonStr = jsonStr.replace(/^```json?\s*/i, "").replace(/\s*```$/i, "");
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    jsonStr = jsonMatch ? jsonMatch[0] : jsonStr;

    const result = JSON.parse(jsonStr);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("AI assist error:", err);
    return NextResponse.json({ error: "Failed to generate: " + err.message }, { status: 500 });
  }
}