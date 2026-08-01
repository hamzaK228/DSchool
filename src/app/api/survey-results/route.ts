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

  const { data: profile } = await adminClient.from("profiles").select("class_id").eq("id", user.id).single();
  if (!profile?.class_id) return NextResponse.json({ error: "No class" }, { status: 404 });

  const { data: surveys } = await adminClient.from("surveys").select("*").eq("class_id", profile.class_id).order("created_at", { ascending: false });
  if (!surveys) return NextResponse.json([]);

  const results = await Promise.all(surveys.map(async (survey) => {
    const { data: responses } = await adminClient.from("survey_responses").select("*").eq("survey_id", survey.id);
    const options = Array.isArray(survey.options) ? survey.options : [];
    const counts: Record<string, number> = {};
    options.forEach((o: string) => { counts[o] = 0; });
    (responses || []).forEach((r: any) => { if (counts[r.answer] !== undefined) counts[r.answer]++; });
    const total = (responses || []).length;
    return { ...survey, total_responses: total, results: options.map((o: string) => ({ option: o, count: counts[o] || 0, percent: total > 0 ? Math.round((counts[o] / total) * 100) : 0 })) };
  }));

  return NextResponse.json(results);
}