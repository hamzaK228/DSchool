"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import type { Submission, Homework, Profile } from "@/lib/types";

interface SubmissionWithStudent extends Submission {
  student?: Profile;
}

export default function TeacherSubmissions() {
  const params = useParams();
  const homeworkId = params.homeworkId as string;
  const supabase = createClient();
  const [homework, setHomework] = useState<Homework | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeInputs, setGradeInputs] = useState<Record<string, string>>({});

  const loadData = async () => {
    const { data: hw } = await supabase
      .from("homework")
      .select("*")
      .eq("id", homeworkId)
      .single();

    if (hw) setHomework(hw);

    const { data: subs } = await supabase
      .from("submissions")
      .select("*")
      .eq("homework_id", homeworkId)
      .order("submitted_at", { ascending: false });

    if (subs && subs.length > 0) {
      const studentIds = [...new Set(subs.map((s) => s.student_id))];
      const { data: students } = await supabase
        .from("profiles")
        .select("*")
        .in("id", studentIds);

      const studentMap = new Map(
        students?.map((s) => [s.id, s]) ?? []
      );

      const merged = subs.map((sub) => ({
        ...sub,
        student: studentMap.get(sub.student_id),
      }));

      setSubmissions(merged);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [homeworkId]);

  const handleGrade = async (submissionId: string) => {
    const grade = gradeInputs[submissionId];
    if (!grade) return;

    await supabase
      .from("submissions")
      .update({ grade, teacher_reviewed: true })
      .eq("id", submissionId);

    loadData();
  };

  const aiBadge = (label: string | null) => {
    if (!label) return null;
    const colors: Record<string, string> = {
      low: "bg-accent-green/10 text-accent-green",
      medium: "bg-warm-100 text-warm-700",
      high: "bg-accent-red/10 text-accent-red",
    };
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded font-medium ${
          colors[label] || colors.low
        }`}
      >
        AI-likely: {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-warm-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link
            href="/teacher/homework"
            className="text-sm text-warm-400 hover:text-warm-600 transition-colors"
          >
            &larr; Back to Homework
          </Link>
          <h1 className="font-display text-2xl text-ink mt-1">
            {homework?.title}
          </h1>
          <p className="text-sm text-ink/30 mt-0.5">
            {submissions.length} submission
            {submissions.length !== 1 ? "s" : ""}
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {submissions.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-ink/30 text-lg">No submissions yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="bg-white border border-border rounded-2xl p-6"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-warm-100 flex items-center justify-center text-xs font-medium text-warm-700">
                      {sub.student?.full_name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2) ?? "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {sub.student?.full_name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-ink/30">
                        {new Date(sub.submitted_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {aiBadge(sub.ai_check_label)}
                    {sub.teacher_reviewed && (
                      <span className="text-xs bg-accent-green/10 text-accent-green px-2 py-0.5 rounded font-medium">
                        Reviewed
                      </span>
                    )}
                  </div>
                </div>

                {sub.ai_check_notes && (
                  <div className="mb-3 p-3 bg-warm-50 border border-warm-200 rounded-xl text-xs text-ink/60">
                    <span className="font-medium text-warm-700">
                      AI Analysis:{" "}
                    </span>
                    <span className="text-ink/50 italic">
                      This is a flag, not proof — please review.{" "}
                    </span>
                    {sub.ai_check_notes}
                  </div>
                )}

                {sub.submission_type === "text" ? (
                  <div className="bg-paper border border-border rounded-xl p-4 text-sm text-ink/70 whitespace-pre-wrap">
                    {sub.text_content}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sub.file_urls?.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-warm-600 hover:text-warm-700 underline"
                      >
                        View Photo {i + 1} &rarr;
                      </a>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-border flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Grade (e.g. A, 85/100, Pass)"
                    value={gradeInputs[sub.id] ?? ""}
                    onChange={(e) =>
                      setGradeInputs({
                        ...gradeInputs,
                        [sub.id]: e.target.value,
                      })
                    }
                    className="flex-1 px-3 py-2 bg-paper border border-border rounded-xl text-sm outline-none focus:border-warm-400 transition-colors"
                  />
                  <button
                    onClick={() => handleGrade(sub.id)}
                    className="px-4 py-2 bg-ink text-paper text-sm font-medium rounded-xl hover:bg-ink/90 transition-colors"
                  >
                    {sub.teacher_reviewed ? "Update" : "Grade"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}