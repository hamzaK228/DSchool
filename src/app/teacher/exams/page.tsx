"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function TeacherExams() {
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", questions: "", time_limit_minutes: "", visible_from: "", closes_at: "" });
  const [error, setError] = useState("");

  const load = async () => {
    const r = await fetch("/api/exams"); if (r.ok) setExams(await r.json()); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    // Parse questions: "Question?|A|B|C|D" format (D = 4th option is correct, 0-indexed answer=3)
    const lines = form.questions.split("\n").filter(l => l.trim());
    if (lines.length === 0) { setError("Add at least one question"); return; }
    const parsed = lines.map(line => {
      const parts = line.split("|").map(p => p.trim());
      return { question: parts[0], options: parts.slice(1, 5), correct: parts.length >= 5 ? parseInt(parts[4]) - 1 : 0 };
    });

    const r = await fetch("/api/exams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: form.title, questions: parsed, time_limit_minutes: form.time_limit_minutes ? parseInt(form.time_limit_minutes) : null, visible_from: form.visible_from || new Date().toISOString(), closes_at: form.closes_at || null }) });
    if (!r.ok) { setError((await r.json()).error || "Failed"); return; }
    setForm({ title: "", questions: "", time_limit_minutes: "", visible_from: "", closes_at: "" }); setShowForm(false); load();
  };

  const handleDelete = async (id: string) => { await fetch(`/api/exams?id=${id}`, { method: "DELETE" }); load(); };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-warm-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div><Link href="/teacher" className="text-sm text-warm-400">&larr; Dashboard</Link><h1 className="font-display text-2xl text-ink mt-1">Exams</h1></div>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-ink text-paper text-sm rounded-xl">{showForm ? "Cancel" : "+ New Exam"}</button>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-6 space-y-4">
            <div><label className="block text-sm font-medium text-ink/70 mb-1.5">Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 border border-border rounded-xl bg-white outline-none focus:border-warm-400" required /></div>
            <div><label className="block text-sm font-medium text-ink/70 mb-1.5">Questions (one per line: Question?|Option A|Option B|Option C|Correct#)</label><textarea value={form.questions} onChange={e => setForm({ ...form, questions: e.target.value })} rows={6} className="w-full px-4 py-2.5 border border-border rounded-xl bg-white outline-none focus:border-warm-400 font-mono text-sm resize-none" placeholder="What is 2+2?|3|4|5|6|2&#10;Capital of France?|London|Paris|Berlin|Madrid|2" required /><p className="text-xs text-ink/30 mt-1">Format: Question?|A|B|C|D|CorrectNum (1-4). First line is question, last number is the correct answer.</p></div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="block text-sm font-medium text-ink/70 mb-1.5">Time (min)</label><input type="number" value={form.time_limit_minutes} onChange={e => setForm({ ...form, time_limit_minutes: e.target.value })} className="w-full px-4 py-2.5 border border-border rounded-xl bg-white outline-none focus:border-warm-400" /></div>
              <div><label className="block text-sm font-medium text-ink/70 mb-1.5">Visible From</label><input type="datetime-local" value={form.visible_from} onChange={e => setForm({ ...form, visible_from: e.target.value })} className="w-full px-4 py-2.5 border border-border rounded-xl bg-white outline-none focus:border-warm-400" /></div>
              <div><label className="block text-sm font-medium text-ink/70 mb-1.5">Closes At</label><input type="datetime-local" value={form.closes_at} onChange={e => setForm({ ...form, closes_at: e.target.value })} className="w-full px-4 py-2.5 border border-border rounded-xl bg-white outline-none focus:border-warm-400" /></div>
            </div>
            {error && <p className="text-accent-red text-sm bg-accent-red/5 px-4 py-2.5 rounded-lg">{error}</p>}
            <button type="submit" className="w-full py-2.5 bg-ink text-paper rounded-xl">Create Exam</button>
          </form>
        )}
        {exams.length === 0 ? <div className="text-center py-20"><p className="text-ink/30 text-lg">No exams yet.</p></div> : exams.map((ex: any) => (
          <div key={ex.id} className="bg-white border border-border rounded-2xl p-5">
            <div className="flex justify-between"><div><h3 className="font-medium text-ink">{ex.title}</h3><p className="text-xs text-ink/30 mt-1">{(Array.isArray(ex.questions) ? ex.questions : []).length} questions{ex.time_limit_minutes ? ` · ${ex.time_limit_minutes} min` : ""}</p></div><button onClick={() => handleDelete(ex.id)} className="text-xs text-ink/20 hover:text-accent-red">Delete</button></div>
          </div>
        ))}
      </main>
    </div>
  );
}