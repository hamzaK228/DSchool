"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function StudentExams() {
  const [exams, setExams] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const r = await fetch("/api/exams");
      if (r.ok) {
        const data = await r.json();
        setExams(data || []);
      }

      // Load own submissions
      const sr = await fetch("/api/exam-submissions");
      if (sr.ok) {
        const sdata = await sr.json();
        const map: Record<string, any> = {};
        (sdata || []).forEach((s: any) => { map[s.exam_id] = s; });
        setSubmissions(map);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleSubmit = async (examId: string, questions: any[]) => {
    const formatted = questions.map((_: any, i: number) => ({
      question_index: i,
      answer: answers[i] ?? null,
    }));

    const score = questions.reduce((acc: number, q: any, i: number) => {
      return acc + (answers[i] === q.correct ? 1 : 0);
    }, 0);

    const r = await fetch("/api/exam-submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exam_id: examId, answers: formatted, score, total: questions.length }),
    });

    if (r.ok) {
      setSubmissions({ ...submissions, [examId]: { score, total: questions.length } });
      setActiveExam(null);
      setAnswers({});
    } else {
      const err = await r.json();
      setError(err.error || "Failed");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-warm-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link href="/student" className="text-sm text-warm-400 hover:text-warm-600 transition-colors">&larr; Dashboard</Link>
          <h1 className="font-display text-2xl text-ink mt-1">Exams</h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-4">
        {error && <p className="text-accent-red text-sm bg-accent-red/5 px-4 py-2.5 rounded-lg">{error}</p>}
        {exams.length === 0 ? (
          <div className="text-center py-20"><p className="text-ink/30 text-lg">No exams available.</p></div>
        ) : exams.map((ex: any) => {
          const sub = submissions[ex.id];
          const isActive = activeExam === ex.id;
          const questions = Array.isArray(ex.questions) ? ex.questions : [];

          return (
            <div key={ex.id} className="bg-white border border-border rounded-2xl overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div><h3 className="font-medium text-ink">{ex.title}</h3><p className="text-xs text-ink/30 mt-1">{questions.length} questions{ex.time_limit_minutes ? ` · ${ex.time_limit_minutes} min` : ""}</p></div>
                  {sub ? (
                    <span className="text-sm text-accent-green font-medium">Score: {sub.score}/{sub.total}</span>
                  ) : !isActive ? (
                    <button onClick={() => setActiveExam(ex.id)} className="px-4 py-2 bg-ink text-paper text-sm rounded-xl">Start</button>
                  ) : null}
                </div>
              </div>
              {isActive && (
                <div className="border-t border-border p-5 space-y-6">
                  {questions.map((q: any, i: number) => (
                    <div key={i}>
                      <p className="text-sm font-medium text-ink mb-2">{i + 1}. {q.question}</p>
                      <div className="space-y-1.5">
                        {(Array.isArray(q.options) ? q.options : []).map((opt: string, j: number) => (
                          <label key={j} className="flex items-center gap-2 px-3 py-2 border border-border rounded-xl cursor-pointer hover:bg-warm-50 transition-colors">
                            <input type="radio" name={`q-${i}`} checked={answers[i] === j} onChange={() => setAnswers({ ...answers, [i]: j })} className="accent-warm-500" />
                            <span className="text-sm text-ink/70">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <button onClick={() => { setActiveExam(null); setAnswers({}); }} className="flex-1 py-2.5 border border-border text-ink/60 rounded-xl">Cancel</button>
                    <button onClick={() => handleSubmit(ex.id, questions)} className="flex-1 py-2.5 bg-ink text-paper rounded-xl">Submit</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </main>
    </div>
  );
}