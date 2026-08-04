"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import type { Announcement } from "@/lib/types";

export default function TeacherAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", body: "" });
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const loadData = async () => {
    const res = await fetch("/api/announcements");
    if (res.ok) setAnnouncements(await res.json());
    setLoading(false);
  };
  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setForm({ title: "", body: "" });
    setImage(null);
    setEditingId(null);
    setShowForm(false);
    setShowAi(false);
    setAiPrompt("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    setSubmitting(true);

    const method = editingId ? "PUT" : "POST";

    if (image) {
      const fd = new FormData();
      if (editingId) fd.append("id", editingId);
      fd.append("title", form.title);
      fd.append("body", form.body);
      fd.append("image", image);
      const res = await fetch("/api/announcements", { method, body: fd });
      if (!res.ok) { const err = await res.json(); setError(err.error || "Failed"); setSubmitting(false); return; }
    } else {
      const body: any = { title: form.title, body: form.body };
      if (editingId) body.id = editingId;
      const res = await fetch("/api/announcements", {
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) { const err = await res.json(); setError(err.error || "Failed"); setSubmitting(false); return; }
    }
    resetForm(); setSubmitting(false); loadData();
  };

  const handleEdit = (ann: Announcement) => {
    setForm({ title: ann.title, body: ann.body });
    setEditingId(ann.id);
    setShowForm(true);
    setShowAi(false);
  };

  const handleDelete = async (id: string) => { await fetch(`/api/announcements?id=${id}`, { method: "DELETE" }); loadData(); };

  const handleAiAssist = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai-assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "announcement", prompt: aiPrompt }) });
      if (res.ok) {
        const data = await res.json();
        setForm({ title: data.title || "", body: data.body || "" });
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
          <div><Link href="/teacher" className="text-sm text-warm-400 hover:text-warm-600 transition-colors">&larr; Dashboard</Link><h1 className="font-display text-2xl text-ink mt-1">Announcements</h1></div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { if (showAi) { setShowAi(false); } else { setShowAi(true); setShowForm(false); } }} className="px-3 py-2 text-xs font-medium border border-warm-400 text-warm-600 rounded-xl hover:bg-warm-50 transition-colors">{showAi ? "Cancel AI" : "🤖 AI Assist"}</button>
            <button onClick={() => { if (editingId) resetForm(); else setShowForm(!showForm); setShowAi(false); }} className="px-4 py-2 bg-ink text-paper text-sm font-medium rounded-xl hover:bg-ink/90 transition-colors">{showForm ? "Cancel" : "+ New"}</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {showAi && (
          <div className="bg-white border border-warm-200 rounded-2xl p-5 space-y-3 animate-fade-in-up">
            <h3 className="text-sm font-semibold text-warm-700">🤖 AI Announcement Generator</h3>
            <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} rows={2} className="w-full px-3 py-2 border border-border rounded-xl text-sm outline-none focus:border-warm-400 resize-none" placeholder="e.g. Write an announcement about parent-teacher night" />
            <div className="flex gap-2">
              <button onClick={handleAiAssist} disabled={aiLoading || !aiPrompt.trim()} className="px-4 py-2 bg-warm-500 text-white text-xs font-medium rounded-xl hover:bg-warm-600 transition-colors disabled:opacity-50">{aiLoading ? "Generating..." : "Generate"}</button>
            </div>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-6 space-y-4 animate-fade-in-up">
            <h3 className="text-sm font-semibold text-ink/60 uppercase tracking-wider">{editingId ? "Edit Announcement" : "New Announcement"}</h3>
            <div><label className="block text-sm font-medium text-ink/70 mb-1.5">Title</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 border border-border rounded-xl bg-white outline-none focus:border-warm-400 text-sm" required /></div>
            <div><label className="block text-sm font-medium text-ink/70 mb-1.5">Body</label><textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4} className="w-full px-4 py-2.5 border border-border rounded-xl bg-white outline-none focus:border-warm-400 text-sm resize-none" required /></div>
            <div><label className="block text-sm font-medium text-ink/70 mb-1.5">Image (optional)</label><input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} className="block text-xs text-ink/50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-medium file:bg-warm-50 file:text-warm-700" />{image && <img src={URL.createObjectURL(image)} alt="preview" className="w-24 h-24 object-cover rounded-xl mt-2" />}</div>
            {error && <p className="text-accent-red text-sm bg-accent-red/5 px-4 py-2.5 rounded-lg">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-ink text-paper font-medium rounded-xl hover:bg-ink/90 transition-colors disabled:opacity-50">{submitting ? "Saving..." : editingId ? "Update" : "Post"}</button>
              {editingId && <button type="button" onClick={resetForm} className="px-4 py-2.5 border border-border text-ink/60 rounded-xl text-sm">Cancel</button>}
            </div>
          </form>
        )}

        {announcements.length === 0 ? (<div className="text-center py-20"><p className="text-ink/30 text-lg">No announcements yet.</p></div>) : (
          <div className="space-y-3">
            {announcements.map((ann: any) => (
              <div key={ann.id} className="bg-white border border-border rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0"><h3 className="font-medium text-ink">{ann.title}</h3><p className="text-sm text-ink/60 mt-1">{ann.body}</p>{ann.image_url && <img src={ann.image_url} alt="" className="mt-3 rounded-xl max-h-48 object-cover" />}<p className="text-xs text-ink/30 mt-2">{new Date(ann.created_at).toLocaleString()}</p></div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => handleEdit(ann)} className="px-3 py-1.5 text-xs font-medium text-warm-600 hover:bg-warm-50 rounded-lg transition-colors">Edit</button>
                    <button onClick={() => handleDelete(ann.id)} className="text-xs text-ink/20 hover:text-accent-red transition-colors">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}