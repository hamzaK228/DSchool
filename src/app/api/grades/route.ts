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

  const { data: profile } = await adminClient.from("profiles").select("class_id,role").eq("id", user.id).single();
  if (!profile?.class_id) return NextResponse.json({ error: "No class" }, { status: 404 });

  if (profile.role === "teacher") {
    const { data } = await adminClient.from("submissions").select("*, homework(title), profiles!submissions_student_id_fkey(full_name)").eq("teacher_reviewed", true).order("submitted_at", { ascending: false });
    return NextResponse.json(data || []);
  } else {
    const { data } = await adminClient.from("submissions").select("*, homework(title)").eq("student_id", user.id).order("submitted_at", { ascending: false });
    return NextResponse.json(data || []);
  }
}