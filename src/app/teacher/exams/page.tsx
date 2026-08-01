"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function TeacherExams() {
  const [exams, setExams] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewingResults, setViewingResults] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", questions: "", time_limit_minutes: "", visible_from: "", closes_at: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const [eRes, sRes] = await Promise.all([fetch("/api/exams"), fetch("/api/exam-submissions")]);
    if (eRes.ok) setExams(await eRes.json());
    if (sRes.ok) setSubmissions(await sRes.json());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    const lines = form.questions.split("\n").filter((l) => l.trim());
    if (lines.length === 0) { setError("Add at least one question"); return; }
    const parsed = lines.map((line) => {
      const parts = line.split("|").map((p) => p.trim());
      return { question: parts[0], options: parts.slice(1, 5), correct: parts.length >= 5 ? parseInt(parts[4]) - 1 : 0 };
    });

    setSubmitting(true);
    const r = await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: form.title, questions: parsed, time_limit_minutes: form.time_limit_minutes ? parseInt(form.time_limit_minutes) : null, visible_from: form.visible_from || new Date().toISOString(), closes_at: form.closes_at || null }),
    });
    if (!r.ok) { setError((await r.json()).error || "Failed"); setSubmitting(false); return; }
    setForm({ title: "", questions: "", time_limit_minutes: "", visible_from: "", closes_at: "" });
    setShowForm(false);
    setSubmitting(false);
    load();
  };

  const handleDelete = async (id: string) => { await fetch(`/api/exams?id=${id}`, { method: "DELETE" }); load(); };

  const getExamSubmissions = (examId: string) => submissions.filter((s: any) => s.exam_id === examId);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-warm-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <Link href="/teacher" className="text-sm text-warm-400 hover:text-warm-600 transition-colors">&larr; Dashboard</Link>
            <h1 className="font-display text-2xl text-ink mt-1">Exams</h1>
          </div>
          <div className="flex gap-2">
            {viewingResults && (
              <button onClick={() => setViewingResults(null)} className="px-4 py-2 text-sm font-medium bg-white border border-border rounded-xl hover:bg-warm-50 transition-colors">
                All Exams
              </button>
            )}
            <button onClick={() => { setShowForm(!showForm); setViewingResults(null); }} className="px-4 py-2 bg-ink text-paper text-sm font-medium rounded-xl hover:bg-ink/90 transition-colors">
              {showForm ? "Cancel" : "+ New Exam"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-6 space-y-4 animate-slide-down">
            <div><label className="block text-sm font-medium text-ink/70 mb-1.5">Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 border border-border rounded-xl bg-white outline-none focus:border-warm-400" placeholder="e.g. Math Quiz 1" required /></div>
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1.5">Questions</label>
              <textarea value={form.questions} onChange={(e) => setForm({ ...form, questions: e.target.value })} rows={6} className="w-full px-4 py-2.5 border border-border rounded-xl bg-white outline-none focus:border-warm-400 font-mono text-sm resize-none" placeholder={`What is 2+2?|3|4|5|6|2\nCapital of France?|London|Paris|Berlin|Madrid|2`} required />
              <p className="text-xs text-ink/30 mt-1">Format per line: Question?|OptionA|OptionB|OptionC|OptionD|Correct# (1-4)</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><label className="block text-sm font-medium text-ink/70 mb-1.5">Time (min)</label><input type="number" value={form.time_limit_minutes} onChange={(e) => setForm({ ...form, time_limit_minutes: e.target.value })} className="w-full px-4 py-2.5 border border-border rounded-xl bg-white outline-none focus:border-warm-400" placeholder="No limit" /></div>
              <div><label className="block text-sm font-medium text-ink/70 mb-1.5">Visible From</label><input type="datetime-local" value={form.visible_from} onChange={(e) => setForm({ ...form, visible_from: e.target.value })} className="w-full px-4 py-2.5 border border-border rounded-xl bg-white outline-none focus:border-warm-400" /></div>
              <div><label className="block text-sm font-medium text-ink/70 mb-1.5">Closes At</label><input type="datetime-local" value={form.closes_at} onChange={(e) => setForm({ ...form, closes_at: e.target.value })} className="w-full px-4 py-2.5 border border-border rounded-xl bg-white outline-none focus:border-warm-400" /></div>
            </div>
            {error && <p className="text-accent-red text-sm bg-accent-red/5 px-4 py-2.5 rounded-lg">{error}</p>}
            <button type="submit" disabled={submitting} className="w-full py-2.5 bg-ink text-paper font-medium rounded-xl hover:bg-ink/90 transition-colors disabled:opacity-50">
              {submitting ? "Creating..." : "Create Exam"}
            </button>
          </form>
        )}

        {viewingResults ? (
          <div className="space-y-4 animate-fade-in-up">
            {(() => {
              const examSubs = getExamSubmissions(viewingResults);
              const exam = exams.find((e) => e.id === viewingResults);
              if (!exam) return <div className="text-center py-20"><p className="text-ink/30">Exam not found.</p></div>;
              return (
                <div className="bg-white border border-border rounded-2xl p-6">
                  <h2 className="font-display text-xl text-ink mb-1">{exam.title} — Results</h2>
                  <p className="text-xs text-ink/30 mb-4">{examSubs.length} student{examSubs.length !== 1 ? "s" : ""} submitted</p>
                  {examSubs.length === 0 ? (
                    <p className="text-ink/30 text-sm">No submissions yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {examSubs.map((sub: any, i: number) => (
                        <div key={sub.id} className="border border-border rounded-xl px-4 py-3 flex items-center justify-between animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                          <span className="text-sm font-medium text-ink/80">{sub.profiles?.full_name || "Unknown Student"}</span>
                          <span className="text-sm font-medium text-accent-green">
                            {sub.score}/{sub.total} ({sub.total > 0 ? Math.round((sub.score / sub.total) * 100) : 0}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-20"><p className="text-ink/30 text-lg">No exams yet. Create your first exam!</p></div>
        ) : (
          <div className="space-y-3">
            {exams.map((ex: any) => {
              const subs = getExamSubmissions(ex.id);
              const questions = Array.isArray(ex.questions) ? ex.questions : [];
              return (
                <div key={ex.id} className="bg-white border border-border rounded-2xl p-5 card-hover animate-fade-in-up">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-ink">{ex.title}</h3>
                      <p className="text-xs text-ink/30 mt-1">
                        {questions.length} questions{ex.time_limit_minutes ? ` · ${ex.time_limit_minutes} min` : ""}
                        {subs.length > 0 && ` · ${subs.length} submitted`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setViewingResults(ex.id)} className="px-3 py-1.5 text-xs font-medium text-warm-600 hover:bg-warm-50 rounded-lg transition-colors">
                        {subs.length > 0 ? `View Results (${subs.length})` : "No results yet"}
                      </button>
                      <button onClick={() => handleDelete(ex.id)} className="text-xs text-ink/20 hover:text-accent-red transition-colors">Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}