"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function StudentAttendance() {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/attendance")
      .then(r => r.json())
      .then(d => setAttendance(d || []))
      .finally(() => setLoading(false));
  }, []);

  const present = attendance.filter(a => a.status === "present").length;
  const absent = attendance.filter(a => a.status === "absent").length;
  const late = attendance.filter(a => a.status === "late").length;

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-warm-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4"><Link href="/student" className="text-sm text-warm-400">&larr; Dashboard</Link><h1 className="font-display text-2xl text-ink mt-1">My Attendance</h1></div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex gap-4 mb-6 text-sm">
          <span className="text-accent-green">✓ Present: {present}</span>
          <span className="text-accent-red">✗ Absent: {absent}</span>
          <span className="text-warm-500">⏰ Late: {late}</span>
        </div>
        {attendance.length === 0 ? <div className="text-center py-20"><p className="text-ink/30 text-lg">No attendance records yet.</p></div> : (
          <div className="space-y-2">
            {attendance.map((a: any) => (
              <div key={a.id} className="bg-white border border-border rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-ink/70">{new Date(a.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                <span className={`text-sm font-medium px-3 py-1 rounded-lg ${a.status === "present" ? "bg-accent-green/10 text-accent-green" : a.status === "absent" ? "bg-accent-red/10 text-accent-red" : "bg-warm-100 text-warm-700"}`}>{a.status}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}