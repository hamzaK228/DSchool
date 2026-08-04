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

  // Get messages for this class where user is sender or receiver
  const { data: messages } = await adminClient
    .from("messages")
    .select("*")
    .eq("class_id", profile.class_id)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: true });

  if (!messages || messages.length === 0) {
    return NextResponse.json([]);
  }

  // Collect unique user IDs to fetch their names
  const userIds = [...new Set(messages.flatMap((m: any) => [m.sender_id, m.receiver_id]))];
  const { data: profiles } = await adminClient
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  const nameMap: Record<string, string> = {};
  (profiles || []).forEach((p: any) => {
    nameMap[p.id] = p.full_name;
  });

  // Attach names
  const enriched = messages.map((m: any) => ({
    ...m,
    sender_name: nameMap[m.sender_id] || "Unknown",
    receiver_name: nameMap[m.receiver_id] || "Unknown",
  }));

  return NextResponse.json(enriched);
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
  const { receiver_id, body: messageBody } = body;

  if (!receiver_id || !messageBody?.trim()) {
    return NextResponse.json({ error: "receiver_id and body are required" }, { status: 400 });
  }

  const { data: inserted, error } = await adminClient
    .from("messages")
    .insert({
      class_id: profile.class_id,
      sender_id: user.id,
      receiver_id,
      body: messageBody.trim(),
    })
    .select("*, profiles!messages_sender_id_fkey(full_name)")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ success: true, message: inserted });
}