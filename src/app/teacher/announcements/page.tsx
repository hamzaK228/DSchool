"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { announcementSchema } from "@/lib/validations";
import type { Announcement } from "@/lib/types";

export default function TeacherAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "" });
  const [image, setImage] = useState<File | null>(null);
  const [views, setViews] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    const res = await fetch("/api/announcements");
    if (res.ok) {
      const data = await res.json();
      setAnnouncements(data);
      // Load view counts for read receipts
      const vRes = await fetch("/api/announcement-views");
      if (vRes.ok) {
        const vData = await vRes.json();
        const counts: Record<string, number> = {};
        (vData || []).forEach((v: any) => {
          counts[v.announcement_id] = (counts[v.announcement_id] || 0) + 1;
        });
        setViews(counts);
      }
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const result = announcementSchema.safeParse(form);
    if (!result.success) { setError(result.error.issues[0].message); return; }

    setSubmitting(true);

    if (image) {
      // Use FormData when there's an image
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("body", form.body);
      fd.append("image", image);

      const res = await fetch("/api/announcements", { method: "POST", body: fd });
      if (!res.ok) { const err = await res.json(); setError(err.error || "Failed"); setSubmitting(false); return; }
    } else {
      // JSON for text-only
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const err = await res.json(); setError(err.error || "Failed"); setSubmitting(false); return; }
    }

    setForm({ title: "", body: "" });
    setImage(null);
    setShowForm(false);
    setSubmitting(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/announcements?id=${id}`, { method: "DELETE" });
    loadData();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-warm-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <Link href="/teacher" className="text-sm text-warm-400 hover:text-warm-600 transition-colors">&larr; Dashboard</Link>
            <h1 className="font-display text-2xl text-ink mt-1">Announcements</h1>
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
              <label className="block text-sm font-medium text-ink/70 mb-1.5">Title</label>
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl outline-none focus:border-warm-400 transition-colors" placeholder="Announcement title" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1.5">Body</label>
              <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={4} className="w-full px-4 py-2.5 bg-white border border-border rounded-xl outline-none focus:border-warm-400 transition-colors resize-none" placeholder="Write the announcement..." required />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1.5">Image (optional)</label>
              <input ref={fileRef} type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] || null)} className="block text-sm text-ink/50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-warm-50 file:text-warm-700 hover:file:bg-warm-100 transition-colors" />
              {image && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={URL.createObjectURL(image)} alt="preview" className="w-24 h-24 object-cover rounded-xl border border-border" />
                  <button type="button" onClick={() => setImage(null)} className="text-xs text-accent-red">Remove</button>
                </div>
              )}
            </div>
            {error && <p className="text-accent-red text-sm bg-accent-red/5 px-4 py-2.5 rounded-lg">{error}</p>}
            <button type="submit" disabled={submitting} className="w-full py-2.5 bg-ink text-paper font-medium rounded-xl hover:bg-ink/90 transition-colors disabled:opacity-50">
              {submitting ? "Posting..." : "Post Announcement"}
            </button>
          </form>
        )}

        {announcements.length === 0 ? (
          <div className="text-center py-20"><p className="text-ink/30 text-lg">No announcements yet.</p></div>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann: any) => (
              <div key={ann.id} className="bg-white border border-border rounded-2xl p-5 overflow-hidden">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-ink">{ann.title}</h3>
                    <p className="text-sm text-ink/60 mt-1 whitespace-pre-wrap">{ann.body}</p>
                    {ann.image_url && (
                      <img src={ann.image_url} alt={ann.title} className="mt-3 rounded-xl max-h-64 object-cover border border-border" />
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      <p className="text-xs text-ink/30">{new Date(ann.created_at).toLocaleString()}</p>
                      {(views[ann.id] || 0) > 0 && (
                        <span className="text-xs text-accent-blue-light font-medium">👁 {views[ann.id]} viewed</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(ann.id)} className="text-xs text-ink/20 hover:text-accent-red transition-colors flex-shrink-0">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}