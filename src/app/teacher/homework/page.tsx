"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { homeworkSchema } from "@/lib/validations";
import type { Homework } from "@/lib/types";

export default function TeacherHomework() {
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", due_date: "", visible_from: "" });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    const res = await fetch("/api/homework");
    if (res.ok) { const data = await res.json(); setHomeworkList(data); }
    setLoading(false);
  };
  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    const result = homeworkSchema.safeParse(form);
    if (!result.success) { setError(result.error.issues[0].message); return; }
    setSubmitting(true);

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
    setForm({ title: "", description: "", due_date: "", visible_from: "" }); setAttachment(null); setShowForm(false); setSubmitting(false); loadData();
  };

  const handleDelete = async (id: string) => { await fetch(`/api/homework?id=${id}`, { method: "DELETE" }); loadData(); };

  const formatVisible = (v: string | null) => {
    if (!v) return ""; const d = new Date(v);
    return d > new Date() ? `📅 Releases ${d.toLocaleDateString()}` : `Visible since ${d.toLocaleDateString()}`;
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-warm-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div><Link href="/teacher" className="text-sm text-warm-400 hover:text-warm-600 transition-colors">&larr; Dashboard</Link><h1 className="font-display text-2xl text-ink mt-1">Homework</h1></div>
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-ink text-paper text-sm font-medium rounded-xl hover:bg-ink/90 transition-colors">{showForm ? "Cancel" : "+ New"}</button>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white border border-border rounded-2xl p-6 space-y-4 animate-fade-in-up">
            <div><label className="block text-sm font-medium text-ink/70 mb-1.5">Title</label><input type="text" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl outline-none focus:border-warm-400 transition-colors" placeholder="Homework title" required /></div>
            <div><label className="block text-sm font-medium text-ink/70 mb-1.5">Description (optional)</label><textarea value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} rows={3} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl outline-none focus:border-warm-400 transition-colors resize-none" placeholder="Details..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-ink/70 mb-1.5">Due Date (optional)</label><input type="date" value={form.due_date} onChange={(e)=>setForm({...form,due_date:e.target.value})} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl outline-none focus:border-warm-400 transition-colors" /></div>
              <div><label className="block text-sm font-medium text-ink/70 mb-1.5">Visible From</label><input type="datetime-local" value={form.visible_from} onChange={(e)=>setForm({...form,visible_from:e.target.value})} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl outline-none focus:border-warm-400 transition-colors" /><p className="text-xs text-ink/30 mt-0.5">When students can see this</p></div>
            </div>
            <div><label className="block text-sm font-medium text-ink/70 mb-1.5">Attachment (PDF, DOC, etc.)</label><input type="file" onChange={(e)=>setAttachment(e.target.files?.[0]||null)} className="block text-sm text-ink/50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-warm-50 file:text-warm-700 hover:file:bg-warm-100 transition-colors" />{attachment && <p className="text-xs text-ink/50 mt-1">📎 {attachment.name}</p>}</div>
            {error && <p className="text-accent-red text-sm bg-accent-red/5 px-4 py-2.5 rounded-lg">{error}</p>}
            <button type="submit" disabled={submitting} className="w-full py-2.5 bg-ink text-paper font-medium rounded-xl hover:bg-ink/90 transition-colors disabled:opacity-50">{submitting?"Creating...":"Create Homework"}</button>
          </form>
        )}
        {homeworkList.length===0?(<div className="text-center py-20"><p className="text-ink/30 text-lg">No homework assigned yet.</p></div>):(
          <div className="space-y-3">{homeworkList.map((hw)=>(
            <div key={hw.id} className="bg-white border border-border rounded-2xl p-5 hover:border-warm-300 transition-colors">
              <div className="flex items-start justify-between gap-4"><div className="flex-1 min-w-0">
                <h3 className="font-medium text-ink">{hw.title}</h3>
                {hw.description&&<p className="text-sm text-ink/50 mt-1 line-clamp-2">{hw.description}</p>}
                {hw.attachment_url&&<a href={hw.attachment_url} target="_blank" className="text-xs text-warm-600 hover:underline mt-1 block">📎 Download file</a>}
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-ink/30">{hw.due_date&&<span>Due: {new Date(hw.due_date).toLocaleDateString()}</span>}<span className="text-warm-500">{formatVisible(hw.visible_from)}</span></div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0"><Link href={`/teacher/submissions/${hw.id}`} className="text-xs text-warm-600 hover:text-warm-700 font-medium transition-colors">Review</Link><button onClick={()=>handleDelete(hw.id)} className="text-xs text-ink/20 hover:text-accent-red transition-colors">Delete</button></div></div>
            </div>
          ))}</div>
        )}
      </main>
    </div>
  );
}