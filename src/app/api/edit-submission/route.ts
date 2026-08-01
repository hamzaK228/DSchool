import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });

export async function PUT(request: NextRequest) {
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { submission_id, grade, teacher_reviewed } = body;
  if (!submission_id) return NextResponse.json({ error: "Missing submission_id" }, { status: 400 });

  const update: Record<string, any> = {};
  if (grade !== undefined) update.grade = grade;
  if (teacher_reviewed !== undefined) update.teacher_reviewed = teacher_reviewed;

  const { error } = await adminClient.from("submissions").update(update).eq("id", submission_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}