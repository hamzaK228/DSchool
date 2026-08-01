import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
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

  const { data: profile } = await adminClient.from("profiles").select("class_id").eq("id", user.id).single();
  if (!profile?.class_id) return NextResponse.json({ error: "No class" }, { status: 404 });

  const { data: classData } = await adminClient.from("classes").select("name").eq("id", profile.class_id).single();
  const { data: students } = await adminClient.from("profiles").select("full_name").eq("class_id", profile.class_id).eq("role", "student").order("full_name");

  const rows = ["Name"].join(",") + "\n" + (students || []).map((s: any) => `"${s.full_name}"`).join("\n");

  return new NextResponse(rows, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${classData?.name || "roster"}_roster.csv"`,
    },
  });
}