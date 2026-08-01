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

  let query = adminClient.from("homework").select("*").eq("class_id", profile.class_id);

  // Students only see homework that is visible (visible_from <= now)
  if (profile.role === "student") {
    query = query.lte("visible_from", new Date().toISOString());
  }

  const { data } = await query.order("created_at", { ascending: false });
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

  const { data: profile } = await adminClient.from("profiles").select("class_id").eq("id", user.id).single();
  if (!profile?.class_id) return NextResponse.json({ error: "No class" }, { status: 404 });

  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || "";
    const due_date = (formData.get("due_date") as string) || null;
    const visible_from = (formData.get("visible_from") as string) || new Date().toISOString();
    const attachment = formData.get("attachment") as File | null;

    let attachmentUrl: string | null = null;
    if (attachment && attachment.size > 0) {
      const fileName = `homework/${profile.class_id}/${Date.now()}-${attachment.name}`;
      const arrBuf = await attachment.arrayBuffer();
      const { error: upErr } = await adminClient.storage.from("School").upload(fileName, arrBuf, { contentType: attachment.type });
      if (!upErr) {
        const { data: urlData } = adminClient.storage.from("School").getPublicUrl(fileName);
        attachmentUrl = urlData.publicUrl;
      }
    }

    const { error } = await adminClient.from("homework").insert({
      class_id: profile.class_id,
      title,
      description: description || null,
      due_date: due_date || null,
      visible_from,
      attachment_url: attachmentUrl,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  // JSON fallback
  const body = await request.json();
  const { error } = await adminClient.from("homework").insert({ class_id: profile.class_id, ...body });
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

  await adminClient.from("homework").delete().eq("id", id);
  return NextResponse.json({ success: true });
}