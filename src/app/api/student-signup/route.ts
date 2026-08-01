import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, full_name, join_code } = body;

    if (!email || !password || !full_name || !join_code) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // Look up class by join code
    const { data: classData, error: classError } = await adminClient
      .from("classes")
      .select("id")
      .eq("join_code", join_code)
      .single();

    if (classError || !classData) {
      return NextResponse.json({ error: "Invalid join code. Please check with your teacher." }, { status: 400 });
    }

    // Create auth user (admin API, no email required)
    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    if (!userData.user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    // Create profile
    const { error: profileError } = await adminClient.from("profiles").insert({
      id: userData.user.id,
      full_name,
      role: "student",
      class_id: classData.id,
    });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Student signup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}