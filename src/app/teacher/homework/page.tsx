"use client";

import { useEffect, useState } from "react";
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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-20 flex justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10 space-y-8 animate-fade-in">
      {/* Subpage Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <Link href="/teacher" className="text-xs font-bold text-primary hover:text-primary-dark transition-colors uppercase tracking-wider">
            &larr; Back to Dashboard
          </Link>
          <h1 className="font-display text-3xl md:text-4xl text-ink font-medium mt-1.5">
            Homework Cabinet
          </h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="sm:self-end px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-full hover:bg-primary-dark transition-colors uppercase tracking-wider btn-press shadow-md"
        >
          {showForm ? "Cancel Assignment" : "+ New Assignment"}
        </button>
      </div>

      {/* Show Form section */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-paper-light border border-border rounded-2xl p-6 md:p-8 space-y-5 shadow-md animate-fade-in-up">
          <h2 className="font-display text-lg text-ink font-semibold border-b border-border pb-2.5 mb-2">
            Create Assignment
          </h2>
          
          <div>
            <label className="block text-[11px] font-bold text-ink-light uppercase tracking-wider mb-2 font-sans">
              Title
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-border rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm font-sans"
              placeholder="Homework title"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-ink-light uppercase tracking-wider mb-2 font-sans">
              Description (optional)
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 bg-white border border-border rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors resize-none text-sm font-sans"
              placeholder="Details, prompts, or guidelines..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-ink-light uppercase tracking-wider mb-2 font-sans">
                Due Date (optional)
              </label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm font-sans"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-ink-light uppercase tracking-wider mb-2 font-sans">
                Visible From
              </label>
              <input
                type="datetime-local"
                value={form.visible_from}
                onChange={(e) => setForm({ ...form, visible_from: e.target.value })}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors text-sm font-sans"
              />
              <p className="text-[10px] text-ink-light/50 mt-1">When students will be able to see this on their dashboard.</p>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-ink-light uppercase tracking-wider mb-2 font-sans">
              Attachment (PDF, DOC, etc.)
            </label>
            <input
              type="file"
              onChange={(e) => setAttachment(e.target.files?.[0] || null)}
              className="block w-full text-xs text-ink-light file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/5 file:text-primary hover:file:bg-primary/10 file:transition-colors cursor-pointer"
            />
            {attachment && <p className="text-xs text-primary font-mono mt-1.5">📎 {attachment.name}</p>}
          </div>

          {error && (
            <p className="text-primary text-xs font-semibold bg-primary/5 border border-primary/10 px-4 py-3 rounded-xl">
              ⚠️ {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 text-sm font-sans uppercase tracking-wider btn-press"
          >
            {submitting ? "Publishing..." : "Publish Homework"}
          </button>
        </form>
      )}

      {/* Homework List */}
      {homeworkList.length === 0 ? (
        <div className="text-center py-20 bg-paper-light border border-border rounded-2xl shadow-sm">
          <p className="text-ink-light/40 text-sm font-serif-body italic">No homework assigned yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {homeworkList.map((hw) => (
            <div key={hw.id} className="bg-paper-light border border-border rounded-2xl p-5 hover:border-primary/20 transition-all duration-300 card-hover flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-base font-semibold text-ink">{hw.title}</h3>
                {hw.description && (
                  <p className="text-xs text-ink-light font-serif-body mt-1 leading-relaxed max-w-2xl line-clamp-2">
                    {hw.description}
                  </p>
                )}
                {hw.attachment_url && (
                  <a
                    href={hw.attachment_url}
                    target="_blank"
                    className="text-xs font-semibold text-primary hover:underline mt-2 flex items-center gap-1"
                  >
                    <span>📎 Download Attachment</span>
                  </a>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-3.5 text-[10px] text-ink-light/50 font-mono">
                  {hw.due_date && (
                    <span className="bg-paper border border-border px-2 py-0.5 rounded text-primary font-bold">
                      DUE: {new Date(hw.due_date).toLocaleDateString()}
                    </span>
                  )}
                  <span className="bg-paper border border-border px-2 py-0.5 rounded">
                    {formatVisible(hw.visible_from)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
                <Link
                  href={`/teacher/submissions/${hw.id}`}
                  className="px-4 py-2 border border-primary text-primary text-xs font-bold rounded-full hover:bg-primary/5 transition-colors uppercase tracking-wider"
                >
                  Review
                </Link>
                <button
                  onClick={() => handleDelete(hw.id)}
                  className="px-4 py-2 text-ink-light/40 hover:text-primary text-xs font-bold rounded-full hover:bg-primary/5 transition-colors uppercase tracking-wider"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}