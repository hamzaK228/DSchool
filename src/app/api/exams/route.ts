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
    .select("class_id")
    .eq("id", user.id)
    .single();

  if (!profile?.class_id)
    return NextResponse.json({ error: "No class" }, { status: 404 });

  const query = adminClient
    .from("exams")
    .select("*")
    .eq("class_id", profile.class_id)
    .order("created_at", { ascending: false });

  // If teacher requests all, also check for visibility constraint for students
  // Students: only see exams where visible_from <= now
  const { data: userProfile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userProfile?.role === "student") {
    const now = new Date().toISOString();
    // Filter: visible_from is in the past, and (closes_at is null or in the future)
    const { data } = await adminClient
      .from("exams")
      .select("*")
      .eq("class_id", profile.class_id)
      .lte("visible_from", now)
      .order("created_at", { ascending: false });

    // Also filter client-side for closes_at
    const filtered = (data || []).filter(
      (ex: any) => !ex.closes_at || new Date(ex.closes_at) > new Date()
    );
    return NextResponse.json(filtered);
  }

  const { data } = await query;
  return NextResponse.json(data || []);
}

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
    .select("class_id")
    .eq("id", user.id)
    .single();

  if (!profile?.class_id)
    return NextResponse.json({ error: "No class" }, { status: 404 });

  const body = await request.json();
  const { title, questions, time_limit_minutes, visible_from, closes_at } = body;

  if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: "Title and at least one question are required" }, { status: 400 });
  }

  const { error } = await adminClient.from("exams").insert({
    class_id: profile.class_id,
    title,
    questions,
    time_limit_minutes: time_limit_minutes || null,
    visible_from: visible_from || new Date().toISOString(),
    closes_at: closes_at || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await adminClient.from("exams").delete().eq("id", id);
  return NextResponse.json({ success: true });
}