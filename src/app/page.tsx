"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LandingPage() {
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single()
          .then(({ data: profile }) => {
            setUser(profile);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });
  }, []);

  const dashboardLink = user?.role === "teacher" ? "/teacher" : "/student";

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-20 relative overflow-hidden">
      {/* Decorative top-right accent */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-warm-100/40 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
      {/* Decorative bottom-left accent */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-warm-200/20 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg text-center">
        {/* Bracket decoration */}
        <p className="text-warm-400 font-mono text-xs tracking-[0.3em] uppercase mb-8 animate-fade-in">
          Simple · School · Portal
        </p>

        <h1 className="text-5xl md:text-6xl font-display font-normal text-ink leading-[1.1] mb-6 animate-fade-in-up stagger-1">
          A quieter <br />
          <span className="text-warm-600 italic">classroom&shy;space</span>
        </h1>

        <p className="text-ink/60 text-lg leading-relaxed max-w-md mx-auto mb-12 animate-fade-in-up stagger-2">
          Homework, announcements, surveys, and messages — all in one place.
          No noise, no clutter.
        </p>

        {loading ? (
          <div className="animate-fade-in-up stagger-3">
            <div className="inline-block w-5 h-5 border-2 border-warm-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : user ? (
          <div className="animate-fade-in-up stagger-3">
            <Link
              href={dashboardLink}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-ink text-paper font-medium rounded-full hover:bg-ink/90 transition-colors duration-200"
            >
              Go to Dashboard
              <span className="text-lg">&rarr;</span>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3 items-center animate-fade-in-up stagger-3">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-ink text-paper font-medium rounded-full hover:bg-ink/90 transition-colors duration-200"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center px-8 py-3.5 border-2 border-border text-ink font-medium rounded-full hover:border-warm-400 hover:bg-warm-50 transition-all duration-200"
              >
                Join a Class
              </Link>
            </div>
            <Link
              href="/teacher/signup"
              className="text-xs text-ink/30 hover:text-warm-600 transition-colors"
            >
              I'm a teacher — create an account
            </Link>
          </div>
        )}

        {/* Footer line */}
        <p className="mt-20 text-xs text-ink/30 font-mono animate-fade-in stagger-5">
          Built for classrooms. Not distraction.
        </p>
      </div>
    </main>
  );
}