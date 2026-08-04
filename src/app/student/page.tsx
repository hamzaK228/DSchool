"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import type { Profile, Class, Homework, Announcement } from "@/lib/types";

export default function StudentDashboard() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [classData, setClassData] = useState<Class | null>(null);
  const [recentHomework, setRecentHomework] = useState<Homework[]>([]);
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/student-data");
        if (!res.ok) {
          if (res.status === 401) {
            window.location.href = "/login";
            return;
          }
          setError("Failed to load data");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setProfile(data.profile);
        setClassData(data.classData);
        setRecentHomework(data.homework || []);
        setRecentAnnouncements(data.announcements || []);
      } catch {
        setError("Network error");
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-warm-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-accent-red mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-ink text-paper rounded-xl">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <>
      <main className="max-w-6xl w-full mx-auto px-6 py-10 space-y-10 animate-fade-in">
        
        {/* Editorial Page Header */}
        <section className="border-b border-border pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <span className="text-[11px] font-bold text-primary tracking-widest uppercase font-sans">
              Student Cabinet
            </span>
            <h1 className="text-3xl md:text-5xl font-display text-ink mt-1 font-medium">
              My Studies
            </h1>
            {classData && (
              <p className="font-serif-body italic text-sm text-ink-light mt-1.5">
                Classroom: <strong className="font-semibold text-primary">{classData.name}</strong> · Registered student
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-serif-body italic text-ink-light bg-paper-light border border-border px-3 py-1.5 rounded-lg shadow-sm">
              Welcome, {profile?.full_name || "Student"}
            </span>
          </div>
        </section>

        {/* Dashboard Grid */}
        <div className="grid gap-8 md:grid-cols-2">
          {/* Recent Homework Card */}
          <section className="bg-paper-light border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6 border-b border-border pb-3">
                <h2 className="font-display text-lg text-ink font-semibold flex items-center gap-2">
                  <span className="text-primary">✦</span> Recent Homework
                </h2>
                <Link
                  href="/student/homework"
                  className="text-xs font-bold text-primary hover:text-primary-dark tracking-wide uppercase transition-colors"
                >
                  View All &rarr;
                </Link>
              </div>

              {recentHomework.length === 0 ? (
                <p className="text-ink-light/50 text-xs font-serif-body italic py-8 text-center">
                  No homework assignments published yet. You are all caught up!
                </p>
              ) : (
                <ul className="divide-y divide-border/60 max-h-[280px] overflow-y-auto pr-1">
                  {recentHomework.map((hw) => (
                    <li key={hw.id} className="py-3 hover:bg-paper-dark/25 px-2 rounded-xl transition-colors">
                      <Link href="/student/homework" className="block group">
                        <div className="flex justify-between items-start gap-4">
                          <p className="text-sm font-semibold text-ink group-hover:text-primary transition-colors">
                            {hw.title}
                          </p>
                          <span className="text-[10px] font-bold text-primary tracking-widest uppercase border border-primary/20 px-2 py-0.5 rounded">
                            Open
                          </span>
                        </div>
                        {hw.due_date && (
                          <p className="text-[11px] text-ink-light/60 font-mono mt-1 flex items-center gap-1">
                            <span>📅 Due:</span>
                            <span className="font-semibold text-primary">{new Date(hw.due_date).toLocaleDateString()}</span>
                          </p>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Announcements Card */}
          <section className="bg-paper-light border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-6 border-b border-border pb-3">
                <h2 className="font-display text-lg text-ink font-semibold flex items-center gap-2">
                  <span className="text-primary">✦</span> Announcements
                </h2>
                <Link
                  href="/student/announcements"
                  className="text-xs font-bold text-primary hover:text-primary-dark tracking-wide uppercase transition-colors"
                >
                  View All &rarr;
                </Link>
              </div>

              {recentAnnouncements.length === 0 ? (
                <p className="text-ink-light/50 text-xs font-serif-body italic py-8 text-center">
                  No classroom announcements posted recently.
                </p>
              ) : (
                <ul className="divide-y divide-border/60 max-h-[280px] overflow-y-auto pr-1">
                  {recentAnnouncements.map((ann) => (
                    <li key={ann.id} className="py-3.5 hover:bg-paper-dark/25 px-2 rounded-xl transition-colors">
                      <Link href="/student/announcements" className="block group">
                        <p className="text-sm font-semibold text-ink group-hover:text-primary transition-colors">
                          {ann.title}
                        </p>
                        <p className="text-xs text-ink-light/75 font-serif-body mt-1 line-clamp-2 leading-relaxed">
                          {ann.body}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Quick Actions Grid */}
          <section className="md:col-span-2 space-y-4">
            <h2 className="font-display text-lg text-ink font-semibold border-b border-border pb-2.5">
              Cabinet Services
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
              <Link
                href="/student/homework"
                className="bg-paper-light border border-border rounded-xl p-4 hover:border-primary/30 transition-all duration-300 card-hover flex flex-col items-center text-center group"
              >
                <div className="w-9 h-9 rounded-full bg-primary/5 flex items-center justify-center text-base mb-2.5 border border-primary/10 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  📝
                </div>
                <p className="text-[10px] font-bold text-ink/80 tracking-wide uppercase font-sans">Homework</p>
              </Link>
              
              <Link
                href="/student/announcements"
                className="bg-paper-light border border-border rounded-xl p-4 hover:border-primary/30 transition-all duration-300 card-hover flex flex-col items-center text-center group"
              >
                <div className="w-9 h-9 rounded-full bg-primary/5 flex items-center justify-center text-base mb-2.5 border border-primary/10 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  📢
                </div>
                <p className="text-[10px] font-bold text-ink/80 tracking-wide uppercase font-sans">News</p>
              </Link>
              
              <Link
                href="/student/surveys"
                className="bg-paper-light border border-border rounded-xl p-4 hover:border-primary/30 transition-all duration-300 card-hover flex flex-col items-center text-center group"
              >
                <div className="w-9 h-9 rounded-full bg-primary/5 flex items-center justify-center text-base mb-2.5 border border-primary/10 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  📊
                </div>
                <p className="text-[10px] font-bold text-ink/80 tracking-wide uppercase font-sans">Surveys</p>
              </Link>
              
              <Link
                href="/student/messages"
                className="bg-paper-light border border-border rounded-xl p-4 hover:border-primary/30 transition-all duration-300 card-hover flex flex-col items-center text-center group"
              >
                <div className="w-9 h-9 rounded-full bg-primary/5 flex items-center justify-center text-base mb-2.5 border border-primary/10 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  💬
                </div>
                <p className="text-[10px] font-bold text-ink/80 tracking-wide uppercase font-sans">Messages</p>
              </Link>
              
              <Link
                href="/student/exams"
                className="bg-paper-light border border-border rounded-xl p-4 hover:border-primary/30 transition-all duration-300 card-hover flex flex-col items-center text-center group"
              >
                <div className="w-9 h-9 rounded-full bg-primary/5 flex items-center justify-center text-base mb-2.5 border border-primary/10 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  ✏️
                </div>
                <p className="text-[10px] font-bold text-ink/80 tracking-wide uppercase font-sans">Exams</p>
              </Link>
              
              <Link
                href="/student/attendance"
                className="bg-paper-light border border-border rounded-xl p-4 hover:border-primary/30 transition-all duration-300 card-hover flex flex-col items-center text-center group"
              >
                <div className="w-9 h-9 rounded-full bg-primary/5 flex items-center justify-center text-base mb-2.5 border border-primary/10 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  📋
                </div>
                <p className="text-[10px] font-bold text-ink/80 tracking-wide uppercase font-sans">Attendance</p>
              </Link>

              <Link
                href="/student/grades"
                className="bg-paper-light border border-border rounded-xl p-4 hover:border-primary/30 transition-all duration-300 card-hover flex flex-col items-center text-center group"
              >
                <div className="w-9 h-9 rounded-full bg-primary/5 flex items-center justify-center text-base mb-2.5 border border-primary/10 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  🏆
                </div>
                <p className="text-[10px] font-bold text-ink/80 tracking-wide uppercase font-sans">Grades</p>
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Mobile Sticky bottom menu for quick access */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-primary border-t border-primary-dark/50 px-4 py-2 flex items-center justify-around z-50 shadow-lg">
        <Link href="/student/homework" className="flex flex-col items-center gap-0.5 text-[9px] text-paper/70 hover:text-white transition-colors py-1">
          <span className="text-sm">📝</span> Homework
        </Link>
        <Link href="/student/announcements" className="flex flex-col items-center gap-0.5 text-[9px] text-paper/70 hover:text-white transition-colors py-1">
          <span className="text-sm">📢</span> News
        </Link>
        <Link href="/student/surveys" className="flex flex-col items-center gap-0.5 text-[9px] text-paper/70 hover:text-white transition-colors py-1">
          <span className="text-sm">📊</span> Surveys
        </Link>
        <Link href="/student/messages" className="flex flex-col items-center gap-0.5 text-[9px] text-paper/70 hover:text-white transition-colors py-1">
          <span className="text-sm">💬</span> Messages
        </Link>
      </nav>
    </>
  );
}