"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Announcement } from "@/lib/types";

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data || []);
        // Auto-track views for read receipts
        (data || []).forEach((a: any) => {
          fetch("/api/announcement-views", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ announcement_id: a.id }) }).catch(() => {});
        });
      }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-warm-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <Link href="/student" className="text-sm text-warm-400 hover:text-warm-600 transition-colors">&larr; Dashboard</Link>
          <h1 className="font-display text-2xl text-ink mt-1">Announcements</h1>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {announcements.length === 0 ? (
          <div className="text-center py-20"><p className="text-ink/30 text-lg">No announcements yet.</p></div>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => (
              <div key={ann.id} className="bg-white border border-border rounded-2xl p-5 overflow-hidden card-hover animate-fade-in-up">
                <h3 className="font-medium text-ink">{ann.title}</h3>
                <p className="text-sm text-ink/60 mt-1 whitespace-pre-wrap">{ann.body}</p>
                {ann.image_url && (
                  <img src={ann.image_url} alt={ann.title} className="mt-3 rounded-xl max-h-80 object-cover border border-border w-full" />
                )}
                <p className="text-xs text-ink/30 mt-3">{new Date(ann.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}