"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { surveySchema } from "@/lib/validations";
import type { Survey } from "@/lib/types";

export default function TeacherSurveys() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ question: "", optionsText: "", closes_at: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    const res = await fetch("/api/surveys");
    if (res.ok) {
      const data = await res.json();
      setSurveys(data);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");

    const options = form.optionsText.split("\n").map((o) => o.trim()).filter((o) => o.length > 0);
    const result = surveySchema.safeParse({ question: form.question, options, closes_at: form.closes_at || undefined });
    if (!result.success) { setError(result.error.issues[0].message); return; }

    setSubmitting(true);
    const res = await fetch("/api/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: form.question, options, closes_at: form.closes_at || null }),
    });

    if (!res.ok) {
      const err = await res.json();
      setError(err.error || "Failed");
      setSubmitting(false);
      return;
    }

    setForm({ question: "", optionsText: "", closes_at: "" });
    setShowForm(false);
    setSubmitting(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/surveys?id=${id}`, { method: "DELETE" });
    loadData();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-warm-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <Link href="/teacher" className="text-sm text-warm-400 hover:text-warm-600 transition-colors">&larr; Dashboard</Link>
            <h1 className="font-display text-2xl text-ink mt-1">Surveys</h1>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-ink text-paper text-sm font-medium rounded-xl hover:bg-ink/90 transition-colors">
            {showForm ? "Cancel" : "+ New"}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-6 space-y-4 animate-fade-in-up">
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1.5">Question</label>
              <input type="text" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl outline-none focus:border-warm-400 transition-colors" placeholder="Survey question" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1.5">Options (one per line)</label>
              <textarea value={form.optionsText} onChange={(e) => setForm({ ...form, optionsText: e.target.value })} rows={4} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl outline-none focus:border-warm-400 transition-colors resize-none font-mono text-sm" placeholder="Option A&#10;Option B&#10;Option C" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1.5">Closes At (optional)</label>
              <input type="datetime-local" value={form.closes_at} onChange={(e) => setForm({ ...form, closes_at: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl outline-none focus:border-warm-400 transition-colors" />
            </div>
            {error && <p className="text-accent-red text-sm bg-accent-red/5 px-4 py-2.5 rounded-lg">{error}</p>}
            <button type="submit" disabled={submitting} className="w-full py-2.5 bg-ink text-paper font-medium rounded-xl hover:bg-ink/90 transition-colors disabled:opacity-50">
              {submitting ? "Creating..." : "Create Survey"}
            </button>
          </form>
        )}

        {surveys.length === 0 ? (
          <div className="text-center py-20"><p className="text-ink/30 text-lg">No surveys created yet.</p></div>
        ) : (
          <div className="space-y-3">
            {surveys.map((survey) => (
              <div key={survey.id} className="bg-white border border-border rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-ink">{survey.question}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(Array.isArray(survey.options) ? survey.options : []).map((opt: string, i: number) => (
                        <span key={i} className="text-xs bg-warm-50 text-warm-700 px-2 py-0.5 rounded">{opt}</span>
                      ))}
                    </div>
                    <p className="text-xs text-ink/30 mt-3">
                      Created {new Date(survey.created_at).toLocaleDateString()}
                      {survey.closes_at && ` · Closes ${new Date(survey.closes_at).toLocaleString()}`}
                    </p>
                  </div>
                  <button onClick={() => handleDelete(survey.id)} className="text-xs text-ink/20 hover:text-accent-red transition-colors flex-shrink-0">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}