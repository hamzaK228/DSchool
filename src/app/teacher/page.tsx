"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import type { Profile, Class, Homework } from "@/lib/types";

export default function TeacherDashboard() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [classData, setClassData] = useState<Class | null>(null);
  const [roster, setRoster] = useState<Profile[]>([]);
  const [recentHomework, setRecentHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/teacher-data");
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          if (res.status === 401) {
            window.location.href = "/login";
            return;
          }
          setError(err.error || "Failed to load data");
          setLoading(false);
          return;
        }

        const data = await res.json();
        setProfile(data.profile);
        setClassData(data.classData);
        setRoster(data.roster || []);
        setRecentHomework(data.homework || []);
      } catch {
        setError("Network error. Please try again.");
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
          <button
            onClick={() => (window.location.href = "/login")}
            className="px-6 py-2 bg-ink text-paper rounded-xl"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/teacher" className="flex flex-col leading-none">
            <span className="text-lg font-bold text-black tracking-tight">Mister Deniz</span>
            <span className="text-xs text-gray-400 tracking-[0.3em] uppercase">edu-portal</span>
          </Link>
          {classData && (
            <p className="hidden md:block text-xs text-gray-500">
              {classData.name} · Join code:{" "}
              <code className="font-mono text-black font-semibold bg-gray-100 px-1.5 py-0.5 rounded">{classData.join_code}</code>
            </p>
          )}
          <div className="flex items-center gap-6">
            <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-gray-600">
              <Link href="/teacher/homework" className="hover:text-black transition-colors">Homework</Link>
              <Link href="/teacher/announcements" className="hover:text-black transition-colors">Announcements</Link>
              <Link href="/teacher/surveys" className="hover:text-black transition-colors">Surveys</Link>
              <Link href="/teacher/messages" className="hover:text-black transition-colors">Messages</Link>
              <Link href="/teacher/exams" className="hover:text-black transition-colors">Exams</Link>
              <Link href="/teacher/attendance" className="hover:text-black transition-colors">Attendance</Link>
            </nav>
            <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-black transition-colors">Sign Out</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 grid gap-8 md:grid-cols-2">
        <section className="bg-white border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-ink">Roster</h2>
            <span className="text-sm text-ink/30 font-mono">
              {roster.length} student{roster.length !== 1 ? "s" : ""}
            </span>
          </div>
          {roster.length === 0 ? (
            <p className="text-ink/30 text-sm">No students yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {roster.map((student) => (
                <li
                  key={student.id}
                  className="py-2.5 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-warm-100 flex items-center justify-center text-xs font-medium text-warm-700">
                    {student.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <span className="text-sm text-ink/80">
                    {student.full_name}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-ink">
              Recent Homework
            </h2>
            <Link
              href="/teacher/homework"
              className="text-sm text-warm-600 hover:text-warm-700 transition-colors"
            >
              View all &rarr;
            </Link>
          </div>
          {recentHomework.length === 0 ? (
            <p className="text-ink/30 text-sm">No homework assigned yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentHomework.map((hw) => (
                <li key={hw.id} className="py-2.5">
                  <Link
                    href={`/teacher/submissions/${hw.id}`}
                    className="block hover:text-warm-600 transition-colors"
                  >
                    <p className="text-sm font-medium text-ink/80">
                      {hw.title}
                    </p>
                    {hw.due_date && (
                      <p className="text-xs text-ink/30 mt-0.5">
                        Due: {new Date(hw.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="md:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/teacher/homework"
            className="bg-white border border-border rounded-xl p-4 hover:border-warm-400 hover:shadow-sm transition-all"
          >
            <p className="text-2xl mb-1">📝</p>
            <p className="text-sm font-medium text-ink/80">Assign Homework</p>
          </Link>
          <Link
            href="/teacher/announcements"
            className="bg-white border border-border rounded-xl p-4 hover:border-warm-400 hover:shadow-sm transition-all"
          >
            <p className="text-2xl mb-1">📢</p>
            <p className="text-sm font-medium text-ink/80">Post Announcement</p>
          </Link>
          <Link
            href="/teacher/surveys"
            className="bg-white border border-border rounded-xl p-4 hover:border-warm-400 hover:shadow-sm transition-all"
          >
            <p className="text-2xl mb-1">📊</p>
            <p className="text-sm font-medium text-ink/80">Create Survey</p>
          </Link>
          <Link
            href="/teacher/messages"
            className="bg-white border border-border rounded-xl p-4 hover:border-warm-400 hover:shadow-sm transition-all"
          >
            <p className="text-2xl mb-1">💬</p>
            <p className="text-sm font-medium text-ink/80">Messages</p>
          </Link>
          <Link
            href="/teacher/exams"
            className="bg-white border border-border rounded-xl p-4 hover:border-warm-400 hover:shadow-sm transition-all"
          >
            <p className="text-2xl mb-1">📝</p>
            <p className="text-sm font-medium text-ink/80">Exams</p>
          </Link>
          <Link
            href="/teacher/attendance"
            className="bg-white border border-border rounded-xl p-4 hover:border-warm-400 hover:shadow-sm transition-all"
          >
            <p className="text-2xl mb-1">📋</p>
            <p className="text-sm font-medium text-ink/80">Attendance</p>
          </Link>
          <a
            href="/api/export-roster"
            className="bg-white border border-border rounded-xl p-4 hover:border-warm-400 hover:shadow-sm transition-all"
          >
            <p className="text-2xl mb-1">📥</p>
            <p className="text-sm font-medium text-ink/80">Export Roster</p>
          </a>
        </section>
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-around z-50">
        <Link href="/teacher/homework" className="flex flex-col items-center gap-0.5 text-[9px] text-gray-500 hover:text-black transition-colors py-1"><span className="text-sm">📝</span>Homework</Link>
        <Link href="/teacher/announcements" className="flex flex-col items-center gap-0.5 text-[9px] text-gray-500 hover:text-black transition-colors py-1"><span className="text-sm">📢</span>Announce</Link>
        <Link href="/teacher/surveys" className="flex flex-col items-center gap-0.5 text-[9px] text-gray-500 hover:text-black transition-colors py-1"><span className="text-sm">📊</span>Surveys</Link>
        <Link href="/teacher/messages" className="flex flex-col items-center gap-0.5 text-[9px] text-gray-500 hover:text-black transition-colors py-1"><span className="text-sm">💬</span>Msg</Link>
      </nav>
    </div>
  );
}