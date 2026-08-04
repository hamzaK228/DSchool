import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await adminClient
    .from("profiles")
    .select("class_id,role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "teacher" && profile?.class_id) {
    // Fetch submissions for exams that belong to teacher's class
    const { data: teacherExams } = await adminClient
      .from("exams")
      .select("id")
      .eq("class_id", profile.class_id);
    const examIds = (teacherExams || []).map((e: any) => e.id);
    if (examIds.length === 0) return NextResponse.json([]);

    const { data } = await adminClient
      .from("exam_submissions")
      .select("*, profiles(full_name)")
      .in("exam_id", examIds);
    return NextResponse.json(data || []);
  } else {
    // Student gets only their own submissions
    const { data } = await adminClient
      .from("exam_submissions")
      .select("*")
      .eq("student_id", user.id);
    return NextResponse.json(data || []);
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { exam_id, answers, score, total } = body;

  if (!exam_id || !answers) {
    return NextResponse.json({ error: "exam_id and answers are required" }, { status: 400 });
  }

  const { error } = await adminClient.from("exam_submissions").upsert({
    exam_id,
    student_id: user.id,
    answers,
    score,
    total,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}