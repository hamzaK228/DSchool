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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  let classData = null;
  let homework: unknown[] = [];
  let announcements: unknown[] = [];

  if (profile.class_id) {
    const { data: cls } = await adminClient
      .from("classes")
      .select("*")
      .eq("id", profile.class_id)
      .single();

    classData = cls;

    const { data: hw } = await adminClient
      .from("homework")
      .select("*")
      .eq("class_id", profile.class_id)
      .order("created_at", { ascending: false })
      .limit(3);

    homework = hw || [];

    const { data: ann } = await adminClient
      .from("announcements")
      .select("*")
      .eq("class_id", profile.class_id)
      .order("created_at", { ascending: false })
      .limit(3);

    announcements = ann || [];
  }

  return NextResponse.json({
    profile,
    classData,
    homework,
    announcements,
  });
}