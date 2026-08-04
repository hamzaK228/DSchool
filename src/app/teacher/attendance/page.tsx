"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function TeacherAttendance() {
  const [roster, setRoster] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const r = await fetch("/api/teacher-data");
      if (r.ok) {
        const d = await r.json();
        setRoster(d.roster || []);
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (roster.length === 0) return;
    const load = async () => {
      const r = await fetch(`/api/attendance?date=${date}`);
      if (r.ok) {
        const data = await r.json();
        const map: Record<string, string> = {};
        data.forEach((a: any) => { map[a.student_id] = a.status; });
        setAttendance(map);
      }
    };
    load();
  }, [date, roster]);

  const toggleStatus = async (studentId: string, currentStatus: string) => {
    const next = currentStatus === "present" ? "absent" : currentStatus === "absent" ? "late" : "present";
    setSaving(true);
    const r = await fetch("/api/attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ student_id: studentId, date, status: next }) });
    if (r.ok) setAttendance({ ...attendance, [studentId]: next });
    setSaving(false);
  };

  const present = Object.values(attendance).filter(s => s === "present").length;
  const absent = Object.values(attendance).filter(s => s === "absent").length;
  const late = Object.values(attendance).filter(s => s === "late").length;

  const statusColor = (s: string) => s === "present" ? "bg-accent-green/10 text-accent-green" : s === "absent" ? "bg-accent-red/10 text-accent-red" : "bg-warm-100 text-warm-700";

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-warm-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <Link href="/teacher" className="text-sm text-warm-400 hover:text-warm-600">&larr; Dashboard</Link>
          <div className="flex items-center justify-between mt-1"><h1 className="font-display text-2xl text-ink">Attendance</h1></div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6 flex items-center gap-4">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-4 py-2.5 border border-border rounded-xl bg-white outline-none focus:border-warm-400" />
          <div className="flex gap-3 text-sm">
            <span className="text-accent-green">✓ {present}</span>
            <span className="text-accent-red">✗ {absent}</span>
            <span className="text-warm-500">⏰ {late}</span>
          </div>
        </div>
        {saving && <p className="text-sm text-ink/30 mb-2">Saving...</p>}
        <div className="space-y-2">
          {roster.map((s: any) => {
            const status = attendance[s.id] || "absent";
            return (
              <div key={s.id} className="bg-white border border-border rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-ink/80">{s.full_name}</span>
                <div className="flex gap-1">
                  {["present", "late", "absent"].map(st => (
                    <button key={st} onClick={() => toggleStatus(s.id, status)} className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${status === st ? statusColor(st) : "text-ink/20 hover:bg-warm-50"}`}>
                      {st === "present" ? "Present" : st === "absent" ? "Absent" : "Late"}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}