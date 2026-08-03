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
          .then(({ data: profile }) => { setUser(profile); setLoading(false); });
      } else {
        setLoading(false);
      }
    });
  }, []);

  const dashboardLink = user?.role === "teacher" ? "/teacher" : "/student";

  return (
    <main className="min-h-screen bg-[#f5f0eb]">
      {/* Header Navigation */}
      <header className="bg-[#1e1e1e] text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo mark */}
            <div className="relative w-10 h-10">
              <svg viewBox="0 0 40 40" className="w-10 h-10 logo-mark">
                <circle cx="20" cy="20" r="18" fill="none" stroke="#A51C30" strokeWidth="1.5" />
                <circle cx="20" cy="20" r="12" fill="none" stroke="#A51C30" strokeWidth="1" />
                <line x1="20" y1="2" x2="20" y2="10" stroke="#A51C30" strokeWidth="1.5" />
                <line x1="20" y1="30" x2="20" y2="38" stroke="#A51C30" strokeWidth="1.5" />
                <line x1="2" y1="20" x2="10" y2="20" stroke="#A51C30" strokeWidth="1.5" />
                <line x1="30" y1="20" x2="38" y2="20" stroke="#A51C30" strokeWidth="1.5" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-[#A51C30]">Mister Deniz</p>
              <p className="text-[10px] text-gray-400 tracking-widest uppercase">edu-portal</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm tracking-wide">
            <Link href="/" className="text-[#A51C30] font-medium">Main Page</Link>
            <Link href="/student/homework" className="text-gray-300 hover:text-white transition-colors">Academics</Link>
            <Link href="/student/announcements" className="text-gray-300 hover:text-white transition-colors">News</Link>
            <a href="#" className="text-gray-300 hover:text-white transition-colors">About</a>
          </nav>

          <div className="flex items-center gap-4">
            {!loading && (
              user ? (
                <Link href={dashboardLink} className="px-5 py-2 bg-[#A51C30] text-[#1e1e1e] text-sm font-semibold rounded-full hover:bg-[#C8102E] transition-colors">
                  Dashboard
                </Link>
              ) : (
                <Link href="/login" className="px-5 py-2 bg-[#A51C30] text-[#1e1e1e] text-sm font-semibold rounded-full hover:bg-[#C8102E] transition-colors">
                  SIGN IN
                </Link>
              )
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#A51C30] via-[#C44D5A] to-[#faf5f5] py-28">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <p className="text-white/60 text-sm tracking-[0.3em] uppercase mb-4 animate-fade-in font-medium">Welcome to</p>
          <h1 className="text-5xl md:text-7xl font-normal text-white mb-3 animate-fade-in-up stagger-1 tracking-tight">
            Mister Deniz
          </h1>
          <p className="text-2xl md:text-3xl text-white/70 font-light mb-8 animate-fade-in-up stagger-2">
            edu-portal
          </p>
          <p className="text-white/60 text-lg max-w-xl mx-auto mb-10 animate-fade-in-up stagger-3 leading-relaxed">
            Your complete classroom companion. Homework, announcements, exams, attendance, and more — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up stagger-4">
            <Link
              href="/signup"
              className="px-8 py-3.5 bg-white text-[#A51C30] font-semibold rounded-full hover:bg-[#f0e0e0] transition-all duration-300 shadow-lg"
            >
              JOIN A CLASS
            </Link>
            <Link
              href="/teacher/signup"
              className="px-8 py-3.5 border-2 border-white/40 text-white font-semibold rounded-full hover:border-white hover:bg-white/10 transition-all duration-300"
            >
              I'm a Teacher
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-5xl mx-auto px-6 py-20 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#e0d8cf] card-hover animate-fade-in-up stagger-1">
          <div className="text-3xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-[#1e1e1e] mb-2">Homework & Exams</h3>
          <p className="text-sm text-gray-500">Submit assignments, take exams, and track your grades all in one place.</p>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#e0d8cf] card-hover animate-fade-in-up stagger-2">
          <div className="text-3xl mb-4">📢</div>
          <h3 className="text-lg font-semibold text-[#1e1e1e] mb-2">Announcements</h3>
          <p className="text-sm text-gray-500">Stay updated with class news, announcements with images, and read receipts.</p>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-[#e0d8cf] card-hover animate-fade-in-up stagger-3">
          <div className="text-3xl mb-4">💬</div>
          <h3 className="text-lg font-semibold text-[#1e1e1e] mb-2">Direct Messages</h3>
          <p className="text-sm text-gray-500">Message your teacher directly. Real-time chat keeps communication flowing.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1e1e1e] text-gray-400 py-12 text-center text-sm">
        <p className="text-[#A51C30] font-semibold mb-1">Mister Deniz edu-portal</p>
        <p>Built for classrooms. Not distraction.</p>
      </footer>
    </main>
  );
}