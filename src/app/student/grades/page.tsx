"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function StudentGrades() {
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/grades")
      .then((r) => r.json())
      .then((d) => setGrades(d || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-warm-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <Link href="/student" className="text-sm text-warm-400 hover:text-warm-600 transition-colors">&larr; Dashboard</Link>
          <h1 className="font-display text-2xl text-ink mt-1">My Grades</h1>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {grades.length === 0 ? (
          <div className="text-center py-20"><p className="text-ink/30 text-lg">No graded submissions yet.</p></div>
        ) : (
          <div className="space-y-3">
            {grades.map((g: any) => (
              <div key={g.id} className="bg-white border border-border rounded-2xl p-5">
                <h3 className="font-medium text-ink">{g.homework?.title || "Untitled"}</h3>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="text-ink/50">{new Date(g.submitted_at).toLocaleDateString()}</span>
                  {g.grade && <span className="text-accent-green font-medium">Grade: {g.grade}</span>}
                  {g.teacher_reviewed && !g.grade && <span className="text-warm-500">Reviewed</span>}
                  {!g.teacher_reviewed && <span className="text-ink/30">Pending review</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}