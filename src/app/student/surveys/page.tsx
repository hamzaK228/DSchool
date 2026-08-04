"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Survey } from "@/lib/types";

export default function StudentSurveys() {
  const supabase = createClient();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const load = async () => {
      // Load surveys from API
      const surveysRes = await fetch("/api/surveys");
      if (surveysRes.ok) {
        const data = await surveysRes.json();
        setSurveys(data || []);
      }

      // Load own responses (student can read their own)
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        const { data: resp } = await supabase
          .from("survey_responses")
          .select("*")
          .eq("student_id", sessionData.session.user.id);
        if (resp) {
          const map: Record<string, string> = {};
          resp.forEach((r: { survey_id: string; answer: string }) => {
            map[r.survey_id] = r.answer;
          });
          setResponses(map);
        }
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleVote = async (surveyId: string, answer: string) => {
    setError(""); setSuccess("");
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return;

    const { error: insertError } = await supabase.from("survey_responses").upsert({
      survey_id: surveyId,
      student_id: sessionData.session.user.id,
      answer,
    });

    if (insertError) {
      setError(insertError.message);
      return;
    }
    setResponses({ ...responses, [surveyId]: answer });
    setSuccess("Response recorded.");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-warm-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <Link href="/student" className="text-sm text-warm-400 hover:text-warm-600 transition-colors">&larr; Dashboard</Link>
          <h1 className="font-display text-2xl text-ink mt-1">Surveys</h1>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        {error && <p className="text-accent-red text-sm bg-accent-red/5 px-4 py-2.5 rounded-lg">{error}</p>}
        {success && <p className="text-accent-green text-sm bg-accent-green/5 px-4 py-2.5 rounded-lg">{success}</p>}
        {surveys.length === 0 ? (
          <div className="text-center py-20"><p className="text-ink/30 text-lg">No surveys yet.</p></div>
        ) : (
          surveys.map((survey) => {
            const myAnswer = responses[survey.id];
            const options = Array.isArray(survey.options) ? survey.options : [];
            return (
              <div key={survey.id} className="bg-white border border-border rounded-2xl p-6">
                <h3 className="font-medium text-ink text-lg mb-1">{survey.question}</h3>
                {survey.closes_at && <p className="text-xs text-ink/30 mb-4">Closes {new Date(survey.closes_at).toLocaleString()}</p>}
                {myAnswer ? (
                  <div className="p-3 bg-accent-green/5 border border-accent-green/20 rounded-xl text-sm text-accent-green">You voted: <span className="font-medium">{myAnswer}</span></div>
                ) : (
                  <div className="space-y-1.5">
                    {options.map((opt, i) => (
                      <button key={i} onClick={() => handleVote(survey.id, opt)} className="w-full text-left px-4 py-2.5 border border-border rounded-xl text-sm text-ink/70 hover:border-warm-400 hover:bg-warm-50 transition-all">{opt}</button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}