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
        supabase.from("profiles").select("role").eq("id", data.user.id).single()
          .then(({ data: profile }) => { setUser(profile); setLoading(false); });
      } else { setLoading(false); }
    });
  }, []);

  const dashboardLink = user?.role === "teacher" ? "/teacher" : "/student";

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          {/* Logo — text only */}
          <Link href="/" className="flex flex-col leading-none">
            <span className="text-xl font-bold text-black tracking-tight">Mister Deniz</span>
            <span className="text-sm text-gray-400 tracking-[0.3em] uppercase">edu-portal</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-10 text-sm font-medium text-gray-600">
            <Link href="/" className="hover:text-black transition-colors">Main Page</Link>
            <Link href="/student/homework" className="hover:text-black transition-colors">Academics</Link>
            <Link href="/student/announcements" className="hover:text-black transition-colors">News</Link>
            <a href="#" className="hover:text-black transition-colors">About</a>
          </nav>

          {/* Sign In */}
          <div className="flex items-center gap-4">
            {!loading && (
              user ? (
                <Link href={dashboardLink} className="px-6 py-2.5 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors">
                  Dashboard
                </Link>
              ) : (
                <Link href="/login" className="px-6 py-2.5 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors">
                  SIGN IN
                </Link>
              )
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-black via-gray-900 to-gray-100 text-white py-32">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-gray-400 text-xs tracking-[0.3em] uppercase mb-6 animate-fade-in">Welcome</p>
          <h1 className="text-6xl md:text-8xl font-bold mb-4 animate-fade-in-up stagger-1 tracking-tight">
            Mister Deniz
          </h1>
          <p className="text-2xl text-gray-400 font-light mb-8 animate-fade-in-up stagger-2">
            edu-portal
          </p>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-12 animate-fade-in-up stagger-3 leading-relaxed font-light">
            Your complete classroom companion — homework, announcements, exams, attendance, and direct messaging.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up stagger-4">
            <Link href="/signup" className="px-10 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg">
              JOIN A CLASS
            </Link>
            <Link href="/login" className="px-10 py-4 border-2 border-white/30 text-white font-semibold rounded-lg hover:border-white/60 transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 text-center text-sm text-gray-400">
        <p className="font-semibold text-black mb-1">Mister Deniz edu-portal</p>
        <p>Built for classrooms. Not distraction.</p>
      </footer>
    </main>
  );
}