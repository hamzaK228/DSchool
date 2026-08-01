import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(1),
  class_name: z.string().min(1),
});

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, full_name, class_name } = parsed.data;

    // Use service_role to create user (bypasses email confirmation and rate limits)
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: userData, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });

    if (createError) {
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      );
    }

    if (!userData.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    const userId = userData.user.id;
    const joinCode = generateJoinCode();

    // Create class
    const { data: classData, error: classError } = await adminClient
      .from("classes")
      .insert({ name: class_name, teacher_id: userId, join_code: joinCode })
      .select()
      .single();

    if (classError || !classData) {
      return NextResponse.json(
        { error: "Failed to create class: " + (classError?.message ?? "") },
        { status: 500 }
      );
    }

    // Create profile
    const { error: profileError } = await adminClient.from("profiles").insert({
      id: userId,
      full_name,
      role: "teacher",
      class_id: classData.id,
    });

    if (profileError) {
      return NextResponse.json(
        { error: "Failed to create profile: " + profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Teacher account created. You can now sign in at /login.",
    });
  } catch (error) {
    console.error("Teacher signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}