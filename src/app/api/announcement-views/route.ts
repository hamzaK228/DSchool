import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });

export async function POST(request: NextRequest) {
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { announcement_id } = await request.json();
  if (!announcement_id) return NextResponse.json({ error: "Missing announcement_id" }, { status: 400 });

  await adminClient.from("announcement_views").upsert({ announcement_id, student_id: user.id });
  return NextResponse.json({ success: true });
}

export async function GET(request: NextRequest) {
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await adminClient.from("profiles").select("class_id,role").eq("id", user.id).single();
  if (!profile?.class_id) return NextResponse.json({ error: "No class" }, { status: 404 });

  if (profile.role === "teacher") {
    const aId = request.nextUrl.searchParams.get("announcement_id");
    let query = adminClient.from("announcement_views").select("*");
    if (aId) query = query.eq("announcement_id", aId);
    const { data } = await query;
    return NextResponse.json(data || []);
  } else {
    const { data } = await adminClient.from("announcement_views").select("*").eq("student_id", user.id);
    return NextResponse.json(data || []);
  }
}