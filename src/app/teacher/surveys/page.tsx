"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function TeacherSurveys() {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ question: "", closes_at: "" });
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const loadData = async () => {
    const [sRes, rRes] = await Promise.all([fetch("/api/surveys"), fetch("/api/survey-results")]);
    if (sRes.ok) setSurveys(await sRes.json());
    if (rRes.ok) setResults(await rRes.json());
    setLoading(false);
  };
  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setForm({ question: "", closes_at: "" });
    setOptions(["", ""]);
    setEditingId(null);
    setShowForm(false);
    setShowAi(false);
    setAiPrompt("");
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOpts = [...options]; newOpts[index] = value; setOptions(newOpts);
  };
  const addOption = () => setOptions([...options, ""]);
  const removeOption = (i: number) => { if (options.length <= 2) return; setOptions(options.filter((_, idx) => idx !== i)); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    const filtered = options.filter((o) => o.trim().length > 0);
    if (filtered.length < 2) { setError("At least 2 options required"); return; }
    setSubmitting(true);

    const method = editingId ? "PUT" : "POST";
    const body: any = { question: form.question, options: filtered, closes_at: form.closes_at || null };
    if (editingId) body.id = editingId;

    const res = await fetch("/api/surveys", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) { setError((await res.json()).error || "Failed"); setSubmitting(false); return; }
    resetForm(); setSubmitting(false); loadData();
  };

  const handleEdit = (s: any) => {
    setForm({ question: s.question, closes_at: s.closes_at || "" });
    setOptions(Array.isArray(s.options) ? s.options : []);
    setEditingId(s.id);
    setShowForm(true);
    setShowAi(false);
  };

  const handleDelete = async (id: string) => { await fetch(`/api/surveys?id=${id}`, { method: "DELETE" }); loadData(); };

  const handleAiAssist = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai-assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "survey", prompt: aiPrompt }) });
      if (res.ok) {
        const data = await res.json();
        setForm({ question: data.question || "", closes_at: data.closes_at ? data.closes_at.slice(0, 16) : "" });
        setOptions(data.options || ["", ""]);
        setShowForm(true);
        setError("");
      }
    } catch { setError("AI generation failed"); }
    setAiLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-warm-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div><Link href="/teacher" className="text-sm text-warm-400 hover:text-warm-600 transition-colors">&larr; Dashboard</Link><h1 className="font-display text-2xl text-ink mt-1">Surveys</h1></div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { setShowResults(!showResults); setShowForm(false); setShowAi(false); }} className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${showResults ? "bg-warm-200 text-warm-800" : "bg-white border border-border text-ink/60 hover:bg-warm-50"}`}>{showResults ? "All surveys" : "Results"}</button>
            <button onClick={() => { setShowAi(!showAi); if (!showAi) setShowForm(false); resetForm(); }} className="px-3 py-2 text-xs font-medium border border-warm-400 text-warm-600 rounded-xl hover:bg-warm-50 transition-colors">{showAi ? "Cancel AI" : "🤖 AI"}</button>
            <button onClick={() => { if (editingId) resetForm(); else setShowForm(!showForm); setShowAi(false); }} className="px-4 py-2 bg-ink text-paper text-sm font-medium rounded-xl hover:bg-ink/90 transition-colors">{showForm ? "Cancel" : "+ New"}</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {showAi && (
          <div className="bg-white border border-warm-200 rounded-2xl p-5 space-y-3 animate-fade-in-up">
            <h3 className="text-sm font-semibold text-warm-700">🤖 AI Survey Generator</h3>
            <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} rows={2} className="w-full px-3 py-2 border border-border rounded-xl text-sm outline-none focus:border-warm-400 resize-none" placeholder="e.g. Favorite learning style survey" />
            <button onClick={handleAiAssist} disabled={aiLoading || !aiPrompt.trim()} className="px-4 py-2 bg-warm-500 text-white text-xs font-medium rounded-xl hover:bg-warm-600 transition-colors disabled:opacity-50">{aiLoading ? "Generating..." : "Generate"}</button>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-6 space-y-4 animate-fade-in-up">
            <h3 className="text-sm font-semibold text-ink/60 uppercase tracking-wider">{editingId ? "Edit Survey" : "New Survey"}</h3>
            <div><label className="block text-sm font-medium text-ink/70 mb-1.5">Question</label><input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl outline-none focus:border-warm-400 text-sm" required /></div>
            <div className="space-y-2">
              <div className="flex items-center justify-between"><label className="text-sm font-medium text-ink/70">Options ({options.length})</label><button type="button" onClick={addOption} className="text-xs text-warm-500">+ Add option</button></div>
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input value={opt} onChange={(e) => handleOptionChange(i, e.target.value)} className="flex-1 px-3 py-2 bg-white border border-border rounded-lg outline-none focus:border-warm-400 text-sm" placeholder={`Option ${i + 1}`} required />
                  <button type="button" onClick={() => removeOption(i)} className="text-xs text-ink/20 hover:text-accent-red">&times;</button>
                </div>
              ))}
            </div>
            <div><label className="block text-sm font-medium text-ink/70 mb-1.5">Closes At (optional)</label><input type="datetime-local" value={form.closes_at} onChange={(e) => setForm({ ...form, closes_at: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl outline-none focus:border-warm-400 text-sm" /></div>
            {error && <p className="text-accent-red text-sm bg-accent-red/5 px-4 py-2.5 rounded-lg">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-ink text-paper font-medium rounded-xl hover:bg-ink/90 transition-colors disabled:opacity-50">{submitting ? "Saving..." : editingId ? "Update" : "Create"}</button>
              {editingId && <button type="button" onClick={resetForm} className="px-4 py-2.5 border border-border text-ink/60 rounded-xl text-sm">Cancel</button>}
            </div>
          </form>
        )}

        {showResults ? (
          results.length === 0 ? (<div className="text-center py-20"><p className="text-ink/30 text-lg">No survey data yet.</p></div>) : (
            <div className="space-y-6">{results.map((r: any) => (
              <div key={r.id} className="bg-white border border-border rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div><h3 className="font-medium text-ink">{r.question}</h3><p className="text-xs text-ink/30">{r.total_responses} response{r.total_responses !== 1 ? "s" : ""}</p></div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(r)} className="text-xs text-warm-600 hover:underline">Edit</button>
                    <button onClick={() => handleDelete(r.id)} className="text-xs text-ink/20 hover:text-accent-red">Delete</button>
                  </div>
                </div>
                <div className="space-y-2">{(r.results || []).map((opt: any, i: number) => {
                  const colors = ["bg-warm-400", "bg-accent-blue", "bg-accent-green-light", "bg-warm-500", "bg-accent-red-light"];
                  return (<div key={i}><div className="flex justify-between text-xs text-ink/60 mb-0.5"><span>{opt.option}</span><span>{opt.count} ({opt.percent}%)</span></div><div className="w-full bg-warm-50 rounded-full h-5"><div className={`h-full rounded-full ${colors[i % colors.length]}`} style={{ width: `${opt.percent}%`, minWidth: opt.count > 0 ? "20px" : "0" }} /></div></div>);
                })}</div>
              </div>
            ))}</div>
          )
        ) : surveys.length === 0 ? (<div className="text-center py-20"><p className="text-ink/30 text-lg">No surveys yet.</p></div>) : (
          <div className="space-y-3">{surveys.map((survey: any) => (
            <div key={survey.id} className="bg-white border border-border rounded-2xl p-5 flex items-start justify-between gap-4">
              <div><h3 className="font-medium text-ink">{survey.question}</h3>
                <div className="flex flex-wrap gap-1.5 mt-2">{(Array.isArray(survey.options) ? survey.options : []).map((opt: string, i: number) => (<span key={i} className="text-xs bg-warm-50 text-warm-700 px-2 py-0.5 rounded">{opt}</span>))}</div>
                <p className="text-xs text-ink/30 mt-2">{new Date(survey.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => handleEdit(survey)} className="px-3 py-1.5 text-xs font-medium text-warm-600 hover:bg-warm-50 rounded-lg transition-colors">Edit</button>
                <button onClick={() => handleDelete(survey.id)} className="text-xs text-ink/20 hover:text-accent-red">Delete</button>
              </div>
            </div>
          ))}</div>
        )}
      </main>
    </div>
  );
}