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

  const { data } = await adminClient.from("announcements").select("*").eq("class_id", profile.class_id).order("created_at", { ascending: false });
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
    const body = formData.get("body") as string;
    const image = formData.get("image") as File | null;

    if (!title || !body) {
      return NextResponse.json({ error: "Title and body are required" }, { status: 400 });
    }

    let imageUrl: string | null = null;
    if (image && image.size > 0) {
      const fileName = `announcements/${profile.class_id}/${Date.now()}-${image.name}`;
      const arrayBuffer = await image.arrayBuffer();
      const { error: uploadError } = await adminClient.storage
        .from("School")
        .upload(fileName, arrayBuffer, { contentType: image.type, upsert: false });
      if (!uploadError) {
        const { data: urlData } = adminClient.storage.from("School").getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }
    }

    const { error } = await adminClient.from("announcements").insert({ class_id: profile.class_id, title, body, image_url: imageUrl });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  const reqBody = await request.json();
  const { error } = await adminClient.from("announcements").insert({ class_id: profile.class_id, ...reqBody });
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

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const id = formData.get("id") as string;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const updateData: any = {
      title: formData.get("title") as string,
      body: formData.get("body") as string,
    };

    const image = formData.get("image") as File | null;
    if (image && image.size > 0) {
      const fileName = `announcements/${profile.class_id}/${Date.now()}-${image.name}`;
      const arrayBuffer = await image.arrayBuffer();
      const { error: uploadError } = await adminClient.storage
        .from("School")
        .upload(fileName, arrayBuffer, { contentType: image.type, upsert: false });
      if (!uploadError) {
        const { data: urlData } = adminClient.storage.from("School").getPublicUrl(fileName);
        updateData.image_url = urlData.publicUrl;
      }
    }

    const { error } = await adminClient.from("announcements").update(updateData).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
  }

  const body = await request.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { error } = await adminClient.from("announcements").update(fields).eq("id", id);
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

  await adminClient.from("announcements").delete().eq("id", id);
  return NextResponse.json({ success: true });
}