import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  let email: string;
  let password: string;

  const contentType = request.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const body = await request.json();
      email = body.email;
      password = body.password;
    } else {
      const formData = await request.formData();
      email = formData.get("email") as string;
      password = formData.get("password") as string;
    }
  } catch {
    return NextResponse.redirect(
      new URL("/login?error=Invalid%20request", request.url)
    );
  }

  if (!email || !password) {
    return NextResponse.redirect(
      new URL("/login?error=Email%20and%20password%20required", request.url)
    );
  }

  // Use a Map to capture cookies set by Supabase
  const cookieMap = new Map<string, { value: string; options: Record<string, unknown> }>();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieMap.set(name, { value, options });
          });
        },
      },
    }
  );

  const { data, error: authError } =
    await supabase.auth.signInWithPassword({ email, password });

  if (authError || !data.user) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(authError?.message || "Login failed")}`,
        request.url
      )
    );
  }

  // Get profile using service_role
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const redirectPath = profile?.role === "teacher" ? "/teacher" : "/student";

  // Create redirect response and copy captured cookies
  const redirectResponse = NextResponse.redirect(
    new URL(redirectPath, request.url),
    303
  );

  cookieMap.forEach(({ value, options }, name) => {
    redirectResponse.cookies.set(name, value, {
      path: "/",
      maxAge: (options.maxAge as number) || 60 * 60 * 24 * 7,
      sameSite: "lax",
      ...options,
    });
  });

  return redirectResponse;
}