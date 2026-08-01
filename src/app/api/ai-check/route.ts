import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

/**
 * Local AI detection heuristic — no external API needed.
 * Checks common patterns in AI-generated text.
 */
function analyzeText(text: string): { label: "low" | "medium" | "high"; notes: string } {
  const normalized = text.trim();
  const wordCount = normalized.split(/\s+/).length;
  const sentences = normalized.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const avgWordsPerSentence = sentences.length > 0 ? wordCount / sentences.length : 0;

  let score = 0;
  const reasons: string[] = [];

  // 1. Very short text — hard to tell
  if (wordCount < 20) {
    return { label: "low", notes: "Text too short to analyze meaningfully." };
  }

  // 2. High average words per sentence (AI tends to write longer sentences)
  if (avgWordsPerSentence > 25) {
    score += 20;
    reasons.push("long, complex sentences (avg " + Math.round(avgWordsPerSentence) + " words)");
  }

  // 3. Very formal/structured language (common in AI responses)
  const formalPhrases = [
    "in conclusion",
    "furthermore",
    "moreover",
    "nevertheless",
    "consequently",
    "it is important to note",
    "one could argue",
    "in other words",
    "as a result",
    "it should be noted",
  ];
  let formalCount = 0;
  const lowerText = normalized.toLowerCase();
  formalPhrases.forEach((phrase) => {
    const count = (lowerText.match(new RegExp(phrase, "g")) || []).length;
    formalCount += count;
  });
  if (formalCount >= 3) {
    score += 25;
    reasons.push("uses formal transitional phrases");
  } else if (formalCount >= 1) {
    score += 10;
    reasons.push("some formal phrasing detected");
  }

  // 4. Repetitive structure — AI often uses the same sentence starters
  const firstWords = sentences.map((s) => s.trim().split(/\s+/).slice(0, 2).join(" ").toLowerCase());
  const uniqueStarters = new Set(firstWords).size;
  const repetitionRatio = uniqueStarters / Math.max(sentences.length, 1);
  if (repetitionRatio < 0.5 && sentences.length > 3) {
    score += 15;
    reasons.push("repetitive sentence structure");
  }

  // 5. Very consistent paragraph lengths
  const paragraphs = normalized.split(/\n\n+/).filter((p) => p.trim().length > 0);
  if (paragraphs.length >= 3) {
    const paraLengths = paragraphs.map((p) => p.split(/\s+/).length);
    const avgPara = paraLengths.reduce((a, b) => a + b, 0) / paraLengths.length;
    const maxDev = Math.max(...paraLengths.map((l) => Math.abs(l - avgPara)));
    if (maxDev < avgPara * 0.3) {
      score += 10;
      reasons.push("very uniform paragraph lengths");
    }
  }

  // 6. Contains "as an AI" or similar self-referential patterns
  if (lowerText.includes("as an ai") || lowerText.includes("as a language model") || lowerText.includes("i am an ai")) {
    score += 40;
    reasons.push("self-referential AI phrasing detected");
  }

  // Determine label
  let label: "low" | "medium" | "high";
  if (score >= 40) label = "high";
  else if (score >= 20) label = "medium";
  else label = "low";

  const notes =
    reasons.length > 0
      ? "Detected: " + reasons.join("; ") + "."
      : "No strong AI-generation patterns detected.";

  return { label, notes };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { homework_id, text_content } = body;

    if (!homework_id || !text_content) {
      return NextResponse.json({ error: "Missing homework_id or text_content" }, { status: 400 });
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: submission } = await adminClient
      .from("submissions")
      .select("*")
      .eq("homework_id", homework_id)
      .eq("student_id", user.id)
      .eq("submission_type", "text")
      .single();

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    // Run local heuristic check (no external API)
    const { label, notes } = analyzeText(text_content);

    await adminClient
      .from("submissions")
      .update({ ai_check_label: label, ai_check_notes: notes })
      .eq("id", submission.id);

    return NextResponse.json({ status: "ok", label, notes });
  } catch (error) {
    console.error("AI check error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}