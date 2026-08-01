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
      <header className="border-b border-border bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <Link href="/student" className="font-display text-xl text-ink hover:text-warm-600 transition-colors">
              Hi, {profile?.full_name?.split(" ")[0]}
            </Link>
            {classData && <p className="text-xs text-ink/40 mt-0.5">{classData.name}</p>}
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden sm:flex items-center gap-1">
              <Link href="/student/homework" className="px-3 py-1.5 text-sm text-ink/60 hover:text-ink hover:bg-warm-50 rounded-lg transition-colors">Homework</Link>
              <Link href="/student/announcements" className="px-3 py-1.5 text-sm text-ink/60 hover:text-ink hover:bg-warm-50 rounded-lg transition-colors">Announcements</Link>
              <Link href="/student/surveys" className="px-3 py-1.5 text-sm text-ink/60 hover:text-ink hover:bg-warm-50 rounded-lg transition-colors">Surveys</Link>
              <Link href="/student/messages" className="px-3 py-1.5 text-sm text-ink/60 hover:text-ink hover:bg-warm-50 rounded-lg transition-colors">Messages</Link>
              <Link href="/student/exams" className="px-3 py-1.5 text-sm text-ink/60 hover:text-ink hover:bg-warm-50 rounded-lg transition-colors">Exams</Link>
              <Link href="/student/attendance" className="px-3 py-1.5 text-sm text-ink/60 hover:text-ink hover:bg-warm-50 rounded-lg transition-colors">Attendance</Link>
              <Link href="/student/grades" className="px-3 py-1.5 text-sm text-ink/60 hover:text-ink hover:bg-warm-50 rounded-lg transition-colors">Grades</Link>
            </nav>
            <button onClick={handleLogout} className="text-sm text-ink/40 hover:text-accent-red transition-colors">Sign Out</button>
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

      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border px-4 py-2 flex items-center justify-around z-50">
        <Link href="/student/homework" className="flex flex-col items-center gap-0.5 text-xs text-ink/40 hover:text-warm-600 transition-colors py-1"><span>📝</span> Homework</Link>
        <Link href="/student/announcements" className="flex flex-col items-center gap-0.5 text-xs text-ink/40 hover:text-warm-600 transition-colors py-1"><span>📢</span> Announce</Link>
        <Link href="/student/surveys" className="flex flex-col items-center gap-0.5 text-xs text-ink/40 hover:text-warm-600 transition-colors py-1"><span>📊</span> Surveys</Link>
        <Link href="/student/messages" className="flex flex-col items-center gap-0.5 text-xs text-ink/40 hover:text-warm-600 transition-colors py-1"><span>💬</span> Messages</Link>
      </nav>
    </div>
  );
}