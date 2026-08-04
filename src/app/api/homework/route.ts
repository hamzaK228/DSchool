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
      class_id: profile.class_id, title,
      description: description || null, due_date: due_date || null,
      visible_from, attachment_url: attachmentUrl,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  const body = await request.json();
  const { error } = await adminClient.from("homework").insert({ class_id: profile.class_id, ...body });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

export async function PUT(request: NextRequest) {
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
  let updateData: any = {};
  let attachmentUrl: string | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    updateData.title = formData.get("title") as string;
    updateData.description = formData.get("description") as string || null;
    updateData.due_date = formData.get("due_date") as string || null;
    updateData.visible_from = formData.get("visible_from") as string || null;

    const attachment = formData.get("attachment") as File | null;
    if (attachment && attachment.size > 0) {
      const fileName = `homework/${profile.class_id}/${Date.now()}-${attachment.name}`;
      const arrBuf = await attachment.arrayBuffer();
      const { error: upErr } = await adminClient.storage.from("School").upload(fileName, arrBuf, { contentType: attachment.type });
      if (!upErr) {
        const { data: urlData } = adminClient.storage.from("School").getPublicUrl(fileName);
        updateData.attachment_url = urlData.publicUrl;
      }
    }

    // Clean up undefined fields
    Object.keys(updateData).forEach(k => {
      if (updateData[k] === null && k !== 'description' && k !== 'due_date' && k !== 'visible_from' && k !== 'attachment_url') delete updateData[k];
    });

    const { error } = await adminClient.from("homework").update(updateData).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  const body = await request.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { error } = await adminClient.from("homework").update(fields).eq("id", id);
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