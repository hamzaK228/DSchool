"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { homeworkSchema } from "@/lib/validations";
import type { Homework } from "@/lib/types";

export default function TeacherHomework() {
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", due_date: "", visible_from: "" });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [showAi, setShowAi] = useState(false);

  const loadData = async () => {
    const res = await fetch("/api/homework");
    if (res.ok) { const data = await res.json(); setHomeworkList(data); }
    setLoading(false);
  };
  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setForm({ title: "", description: "", due_date: "", visible_from: "" });
    setAttachment(null);
    setEditingId(null);
    setShowForm(false);
    setShowAi(false);
    setAiPrompt("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    setSubmitting(true);

    if (editingId) {
      if (attachment) {
        const fd = new FormData();
        fd.append("id", editingId);
        fd.append("title", form.title);
        fd.append("description", form.description);
        if (form.due_date) fd.append("due_date", form.due_date);
        if (form.visible_from) fd.append("visible_from", form.visible_from);
        fd.append("attachment", attachment);
        const res = await fetch("/api/homework", { method: "PUT", body: fd });
        if (!res.ok) { const err = await res.json(); setError(err.error || "Failed"); setSubmitting(false); return; }
      } else {
        const res = await fetch("/api/homework", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...form, visible_from: form.visible_from || undefined }),
        });
        if (!res.ok) { const err = await res.json(); setError(err.error || "Failed"); setSubmitting(false); return; }
      }
    } else {
      if (attachment) {
        const fd = new FormData();
        fd.append("title", form.title);
        fd.append("description", form.description);
        if (form.due_date) fd.append("due_date", form.due_date);
        if (form.visible_from) fd.append("visible_from", form.visible_from);
        fd.append("attachment", attachment);
        const res = await fetch("/api/homework", { method: "POST", body: fd });
        if (!res.ok) { const err = await res.json(); setError(err.error || "Failed"); setSubmitting(false); return; }
      } else {
        const res = await fetch("/api/homework", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, visible_from: form.visible_from || new Date().toISOString() }) });
        if (!res.ok) { const err = await res.json(); setError(err.error || "Failed"); setSubmitting(false); return; }
      }
    }
    resetForm(); setSubmitting(false); loadData();
  };

  const handleEdit = (hw: Homework) => {
    setForm({
      title: hw.title,
      description: hw.description || "",
      due_date: hw.due_date || "",
      visible_from: hw.visible_from || "",
    });
    setEditingId(hw.id);
    setShowForm(true);
    setShowAi(false);
  };

  const handleDelete = async (id: string) => { await fetch(`/api/homework?id=${id}`, { method: "DELETE" }); loadData(); };

  const handleAiAssist = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "homework", prompt: aiPrompt }),
      });
      if (res.ok) {
        const data = await res.json();
        setForm({
          title: data.title || "",
          description: data.description || "",
          due_date: data.due_date || "",
          visible_from: "",
        });
        setError("");
      } else {
        setError("AI generation failed");
      }
    } catch { setError("AI generation failed"); }
    setAiLoading(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-warm-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <Link href="/teacher" className="text-sm text-warm-400 hover:text-warm-600 transition-colors">&larr; Dashboard</Link>
            <h1 className="font-display text-2xl text-ink mt-1">Homework</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { setShowAi(!showAi); if (editingId) setEditingId(null); if (!showAi) setShowForm(false); }} className="px-3 py-2 text-xs font-medium border border-warm-400 text-warm-600 rounded-xl hover:bg-warm-50 transition-colors">
              {showAi ? "Cancel AI" : "🤖 AI Assist"}
            </button>
            <button onClick={() => { if (editingId) resetForm(); else setShowForm(!showForm); setShowAi(false); }} className="px-4 py-2 bg-ink text-paper text-sm font-medium rounded-xl hover:bg-ink/90 transition-colors">
              {showForm ? "Cancel" : "+ New"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* AI Assistant panel */}
        {showAi && (
          <div className="bg-white border border-warm-200 rounded-2xl p-5 space-y-3 animate-fade-in-up">
            <h3 className="text-sm font-semibold text-warm-700">🤖 AI Homework Generator</h3>
            <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} rows={2} className="w-full px-3 py-2 border border-border rounded-xl text-sm outline-none focus:border-warm-400 resize-none" placeholder="e.g. Write a homework about photosynthesis for 7th graders" />
            <div className="flex gap-2">
              <button onClick={handleAiAssist} disabled={aiLoading || !aiPrompt.trim()} className="px-4 py-2 bg-warm-500 text-white text-xs font-medium rounded-xl hover:bg-warm-600 transition-colors disabled:opacity-50">
                {aiLoading ? "Generating..." : "Generate Homework"}
              </button>
              <button onClick={async () => { await navigator.clipboard.writeText(aiPrompt); setAiPrompt(""); }} className="px-3 py-2 text-xs border border-border rounded-xl">Clear</button>
            </div>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-6 space-y-4 animate-fade-in-up">
            <h3 className="text-sm font-semibold text-ink/60 uppercase tracking-wider">{editingId ? "Edit Assignment" : "Create Assignment"}</h3>
            <div><label className="block text-sm font-medium text-ink/70 mb-1.5">Title</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 border border-border rounded-xl bg-white outline-none focus:border-warm-400 text-sm" required /></div>
            <div><label className="block text-sm font-medium text-ink/70 mb-1.5">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 border border-border rounded-xl bg-white outline-none focus:border-warm-400 text-sm resize-none" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-ink/70 mb-1.5">Due Date</label><input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="w-full px-4 py-2.5 border border-border rounded-xl bg-white outline-none focus:border-warm-400 text-sm" /></div>
              <div><label className="block text-sm font-medium text-ink/70 mb-1.5">Visible From</label><input type="datetime-local" value={form.visible_from} onChange={(e) => setForm({ ...form, visible_from: e.target.value })} className="w-full px-4 py-2.5 border border-border rounded-xl bg-white outline-none focus:border-warm-400 text-sm" /></div>
            </div>
            <div><label className="block text-sm font-medium text-ink/70 mb-1.5">Attachment</label><input type="file" onChange={(e) => setAttachment(e.target.files?.[0] || null)} className="block text-xs text-ink/50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-warm-50 file:text-warm-700" />{attachment && <p className="text-xs text-warm-600 mt-1">📎 {attachment.name}</p>}</div>
            {error && <p className="text-accent-red text-sm bg-accent-red/5 px-4 py-2.5 rounded-lg">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-ink text-paper font-medium rounded-xl hover:bg-ink/90 transition-colors disabled:opacity-50">{submitting ? "Saving..." : editingId ? "Update" : "Publish"}</button>
              {editingId && <button type="button" onClick={resetForm} className="px-4 py-2.5 border border-border text-ink/60 rounded-xl text-sm">Cancel</button>}
            </div>
          </form>
        )}

        {homeworkList.length === 0 ? (
          <div className="text-center py-20"><p className="text-ink/30 text-lg">No homework yet.</p></div>
        ) : (
          <div className="space-y-3">
            {homeworkList.map((hw) => (
              <div key={hw.id} className="bg-white border border-border rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-ink">{hw.title}</h3>
                  {hw.description && <p className="text-sm text-ink/50 mt-1 line-clamp-2">{hw.description}</p>}
                  {hw.due_date && <span className="text-xs bg-warm-50 text-warm-700 px-2 py-0.5 rounded mt-2 inline-block">Due: {new Date(hw.due_date).toLocaleDateString()}</span>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/teacher/submissions/${hw.id}`} className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-warm-50 transition-colors">Review</Link>
                  <button onClick={() => handleEdit(hw)} className="px-3 py-1.5 text-xs font-medium text-warm-600 hover:bg-warm-50 rounded-lg transition-colors">Edit</button>
                  <button onClick={() => handleDelete(hw.id)} className="text-xs text-ink/20 hover:text-accent-red transition-colors">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}