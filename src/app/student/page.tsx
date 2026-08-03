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
    <div className="min-h-screen bg-paper">
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/student" className="flex flex-col leading-none">
            <span className="text-lg font-bold text-black tracking-tight">Mister Deniz</span>
            <span className="text-xs text-gray-400 tracking-[0.3em] uppercase">edu-portal</span>
          </Link>
          <span className="hidden md:block text-xs text-gray-500">Hi, {profile?.full_name?.split(" ")[0]} · {classData?.name}</span>
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-gray-600">
              <Link href="/student/homework" className="hover:text-black transition-colors">Homework</Link>
              <Link href="/student/announcements" className="hover:text-black transition-colors">Announcements</Link>
              <Link href="/student/surveys" className="hover:text-black transition-colors">Surveys</Link>
              <Link href="/student/messages" className="hover:text-black transition-colors">Messages</Link>
              <Link href="/student/exams" className="hover:text-black transition-colors">Exams</Link>
              <Link href="/student/attendance" className="hover:text-black transition-colors">Attendance</Link>
              <Link href="/student/grades" className="hover:text-black transition-colors">Grades</Link>
            </nav>
            <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-black transition-colors">Sign Out</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 grid gap-8 md:grid-cols-2">
        <section className="bg-white border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-ink">Recent Homework</h2>
            <Link href="/student/homework" className="text-sm text-warm-600 hover:text-warm-700 transition-colors">View all &rarr;</Link>
          </div>
          {recentHomework.length === 0 ? (
            <p className="text-ink/30 text-sm">No homework yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentHomework.map((hw) => (
                <li key={hw.id} className="py-2.5">
                  <p className="text-sm font-medium text-ink/80">{hw.title}</p>
                  {hw.due_date && <p className="text-xs text-ink/30 mt-0.5">Due: {new Date(hw.due_date).toLocaleDateString()}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-ink">Announcements</h2>
            <Link href="/student/announcements" className="text-sm text-warm-600 hover:text-warm-700 transition-colors">View all &rarr;</Link>
          </div>
          {recentAnnouncements.length === 0 ? (
            <p className="text-ink/30 text-sm">No announcements yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentAnnouncements.map((ann) => (
                <li key={ann.id} className="py-2.5">
                  <p className="text-sm font-medium text-ink/80">{ann.title}</p>
                  <p className="text-xs text-ink/30 mt-0.5 line-clamp-1">{ann.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link href="/student/homework" className="bg-white border border-border rounded-xl p-4 hover:border-warm-400 hover:shadow-sm transition-all"><p className="text-2xl mb-1">📝</p><p className="text-sm font-medium text-ink/80">Homework</p></Link>
          <Link href="/student/announcements" className="bg-white border border-border rounded-xl p-4 hover:border-warm-400 hover:shadow-sm transition-all"><p className="text-2xl mb-1">📢</p><p className="text-sm font-medium text-ink/80">Announcements</p></Link>
          <Link href="/student/surveys" className="bg-white border border-border rounded-xl p-4 hover:border-warm-400 hover:shadow-sm transition-all"><p className="text-2xl mb-1">📊</p><p className="text-sm font-medium text-ink/80">Surveys</p></Link>
          <Link href="/student/messages" className="bg-white border border-border rounded-xl p-4 hover:border-warm-400 hover:shadow-sm transition-all"><p className="text-2xl mb-1">💬</p><p className="text-sm font-medium text-ink/80">Messages</p></Link>
          <Link href="/student/exams" className="bg-white border border-border rounded-xl p-4 hover:border-warm-400 hover:shadow-sm transition-all"><p className="text-2xl mb-1">📝</p><p className="text-sm font-medium text-ink/80">Exams</p></Link>
          <Link href="/student/attendance" className="bg-white border border-border rounded-xl p-4 hover:border-warm-400 hover:shadow-sm transition-all"><p className="text-2xl mb-1">📋</p><p className="text-sm font-medium text-ink/80">Attendance</p></Link>
          <Link href="/student/grades" className="bg-white border border-border rounded-xl p-4 hover:border-warm-400 hover:shadow-sm transition-all"><p className="text-2xl mb-1">🏆</p><p className="text-sm font-medium text-ink/80">Grades</p></Link>
        </section>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-around z-50">
        <Link href="/student/homework" className="flex flex-col items-center gap-0.5 text-[9px] text-gray-500 hover:text-black transition-colors py-1"><span className="text-sm">📝</span>HW</Link>
        <Link href="/student/announcements" className="flex flex-col items-center gap-0.5 text-[9px] text-gray-500 hover:text-black transition-colors py-1"><span className="text-sm">📢</span>News</Link>
        <Link href="/student/surveys" className="flex flex-col items-center gap-0.5 text-[9px] text-gray-500 hover:text-black transition-colors py-1"><span className="text-sm">📊</span>Survey</Link>
        <Link href="/student/messages" className="flex flex-col items-center gap-0.5 text-[9px] text-gray-500 hover:text-black transition-colors py-1"><span className="text-sm">💬</span>Msg</Link>
      </nav>
    </div>
  );
}