"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import type { ExamQuestion, ExamSubmissionAnswer } from "@/lib/types";

export default function StudentExams() {
  const [exams, setExams] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, ExamSubmissionAnswer>>({});
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [warnings, setWarnings] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [confirmStart, setConfirmStart] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const answersRef = useRef(answers);
  const activeExamRef = useRef(activeExam);

  // Keep refs in sync
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { activeExamRef.current = activeExam; }, [activeExam]);

  useEffect(() => {
    const load = async () => {
      const r = await fetch("/api/exams");
      if (r.ok) {
        const data = await r.json();
        setExams(data || []);
      }

      const sr = await fetch("/api/exam-submissions");
      if (sr.ok) {
        const sdata = await sr.json();
        const map: Record<string, any> = {};
        (sdata || []).forEach((s: any) => {
          map[s.exam_id] = s;
        });
        setSubmissions(map);
      }
      setLoading(false);
    };
    load();
  }, []);

  // Timer countdown
  useEffect(() => {
    if (timeLeft !== null && timeLeft > 0 && examStarted) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft, examStarted]);

  // Auto-submit when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && activeExamRef.current) {
      const exam = exams.find((e) => e.id === activeExamRef.current);
      if (exam) {
        const questions: ExamQuestion[] = Array.isArray(exam.questions)
          ? exam.questions
          : [];
        doSubmit(activeExamRef.current!, questions);
      }
    }
  }, [timeLeft]);

  // Tab switch detection
  useEffect(() => {
    if (!examStarted) return;

    const handleVisibilityChange = () => {
      if (document.hidden && examStarted) {
        setWarnings((w) => {
          const newW = w + 1;
          // If we hit max warnings, auto-submit
          if (newW >= 3) {
            const exam = exams.find((e) => e.id === activeExamRef.current);
            if (exam) {
              const questions = Array.isArray(exam.questions)
                ? exam.questions
                : [];
              setTimeout(() => doSubmit(exam.id, questions), 50);
            }
          }
          return newW;
        });
        // Exit fullscreen if they switch tabs
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
    };

    const handleBlur = () => {
      if (examStarted) {
        setWarnings((w) => {
          const newW = w + 1;
          if (newW >= 3) {
            const exam = exams.find((e) => e.id === activeExamRef.current);
            if (exam) {
              const questions = Array.isArray(exam.questions)
                ? exam.questions
                : [];
              setTimeout(() => doSubmit(exam.id, questions), 50);
            }
          }
          return newW;
        });
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
    };

    // Block right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Block copy
    const handleCopy = (e: ClipboardEvent) => {
      if (examStarted) {
        e.preventDefault();
        return false;
      }
    };

    // Block paste
    const handlePaste = (e: ClipboardEvent) => {
      if (examStarted) {
        e.preventDefault();
        return false;
      }
    };

    // Block keyboard shortcuts for dev tools
    const handleKeyDown = (e: KeyboardEvent) => {
      if (examStarted) {
        // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        if (
          e.key === "F12" ||
          (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) ||
          (e.ctrlKey && e.key === "U")
        ) {
          e.preventDefault();
          return false;
        }
      }
    };

    // Warn on beforeunload
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (examStarted) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [examStarted]);

  const requestFullscreen = async () => {
    try {
      if (fullscreenRef.current) {
        await fullscreenRef.current.requestFullscreen();
      }
    } catch {
      // Fullscreen not supported, still allow exam
    }
  };

  const startExam = async (examId: string) => {
    const exam = exams.find((e) => e.id === examId);
    if (!exam) return;

    setActiveExam(examId);
    setAnswers({});
    setWarnings(0);
    setExamStarted(true);
    setConfirmStart(false);

    await requestFullscreen();

    if (exam.time_limit_minutes) {
      setTimeLeft(exam.time_limit_minutes * 60);
    } else {
      setTimeLeft(null);
    }
  };

  const exitExam = () => {
    setActiveExam(null);
    setExamStarted(false);
    setAnswers({});
    setTimeLeft(null);
    setWarnings(0);
    setConfirmStart(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const doSubmit = useCallback(async (examId: string, questions: ExamQuestion[]) => {
    const currentAnswers = { ...answersRef.current };
    const formatted = questions.map((q, i) => {
      const ans = currentAnswers[i];
      return {
        question_index: i,
        selected: q.type === "multiple_choice" ? (ans?.selected ?? null) : null,
        text: q.type === "essay" ? (ans?.text ?? null) : null,
      };
    });

    // Auto-grade multiple choice
    let score = 0;
    let total = 0;
    questions.forEach((q, i) => {
      total += q.points || 1;
      if (q.type === "multiple_choice") {
        const ans = currentAnswers[i];
        if (ans?.selected === q.correct) {
          score += q.points || 1;
        }
      }
      // Essay questions: score stays 0 until teacher manually grades
    });

    const r = await fetch("/api/exam-submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exam_id: examId,
        answers: formatted,
        score,
        total,
      }),
    });

    if (r.ok) {
      setSubmissions(prev => ({
        ...prev,
        [examId]: { score, total, submitted_at: new Date().toISOString() },
      }));
      exitExam();
    } else {
      const err = await r.json();
      setError(err.error || "Failed to submit");
    }
  }, [exams]);

  const handleSubmit = (examId: string, questions: ExamQuestion[]) => {
    doSubmit(examId, questions);
  };

  const handleAnswerChange = (qIndex: number, value: any) => {
    setAnswers((prev) => {
      const current = prev[qIndex] || { question_index: qIndex, selected: null, text: null };
      if (typeof value === "number") {
        return { ...prev, [qIndex]: { ...current, selected: value } };
      }
      return { ...prev, [qIndex]: { ...current, text: value } };
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-warm-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  // Full-screen exam mode
  if (activeExam && examStarted) {
    const exam = exams.find((e) => e.id === activeExam);
    if (!exam) return null;
    const questions: ExamQuestion[] = Array.isArray(exam.questions)
      ? exam.questions
      : [];
    const MAX_WARNINGS = 3;

    return (
      <div
        ref={fullscreenRef}
        className="fixed inset-0 z-[100] bg-black flex flex-col"
        style={{ userSelect: "none" }}
      >
        {/* Exam header bar */}
        <div className="bg-ink text-paper px-6 py-3 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-medium text-sm">{exam.title}</h2>
            <p className="text-xs text-paper/60">
              {questions.length} questions
              {exam.time_limit_minutes && ` · ${exam.time_limit_minutes} min limit`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Warning counter */}
            {warnings > 0 && (
              <span className="text-xs bg-accent-red/20 text-accent-red-light px-2 py-0.5 rounded font-medium">
                {warnings}/{MAX_WARNINGS} warnings
              </span>
            )}
            {/* Timer */}
            {timeLeft !== null && (
              <span
                className={`text-sm font-mono font-bold tabular-nums ${
                  timeLeft < 60 ? "text-accent-red animate-pulse" : "text-paper"
                }`}
              >
                {formatTime(timeLeft)}
              </span>
            )}
            <button
              onClick={() => handleSubmit(activeExam, questions)}
              className="px-4 py-1.5 bg-accent-green text-white text-sm font-medium rounded-lg hover:bg-accent-green/90 transition-colors"
            >
              Submit
            </button>
          </div>
        </div>

        {/* Warning banner */}
        {warnings >= MAX_WARNINGS ? (
          <div className="flex-1 flex items-center justify-center bg-ink">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">🚫</div>
              <h2 className="text-2xl font-bold text-accent-red mb-2">
                Exam Terminated
              </h2>
              <p className="text-paper/60 mb-6 max-w-md">
                You have left the exam page {MAX_WARNINGS} times. Your exam has
                been automatically submitted.
              </p>
              <button
                onClick={exitExam}
                className="px-6 py-3 bg-paper text-ink font-medium rounded-xl"
              >
                Back to Exams
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Warning flash */}
            {warnings > 0 && (
              <div className="bg-accent-red text-white text-center text-xs py-2 px-4 animate-pulse font-medium">
                ⚠️ Warning {warnings}/{MAX_WARNINGS}: Do not leave the exam
                page. Switching tabs or windows will count as a violation.
              </div>
            )}

            {/* Question area */}
            <div className="flex-1 overflow-y-auto bg-paper p-4 md:p-8">
              <div className="max-w-3xl mx-auto space-y-8">
                {questions.map((q, i) => (
                  <div
                    key={q.id || `q-${i}`}
                    className="bg-white border border-border rounded-2xl p-5"
                  >
                    <div className="flex items-start gap-2 mb-3">
                      <span className="text-xs font-bold text-ink/40 bg-paper px-2 py-0.5 rounded shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-ink">
                          {q.text}
                        </p>
                        {q.points > 0 && (
                          <span className="text-[10px] text-ink/30">
                            {q.points} pt{q.points !== 1 ? "s" : ""}
                            {q.type === "essay" ? " (teacher graded)" : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    {q.image_url && (
                      <img
                        src={q.image_url}
                        alt="Question"
                        className="max-h-48 rounded-lg border border-border mb-3 ml-1"
                      />
                    )}

                    {q.type === "multiple_choice" ? (
                      <div className="space-y-1.5 ml-1">
                        {q.options.map((opt, j) => (
                          <label
                            key={j}
                            className={`flex items-center gap-3 px-4 py-3 border rounded-xl cursor-pointer transition-colors ${
                              answers[i]?.selected === j
                                ? "border-warm-400 bg-warm-50"
                                : "border-border hover:bg-warm-50/50"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q-${i}`}
                              checked={answers[i]?.selected === j}
                              onChange={() => handleAnswerChange(i, j)}
                              className="accent-warm-500"
                            />
                            <span className="text-sm text-ink/70">{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="ml-1">
                        <textarea
                          value={answers[i]?.text || ""}
                          onChange={(e) =>
                            handleAnswerChange(i, e.target.value)
                          }
                          rows={4}
                          placeholder="Write your answer here..."
                          className="w-full px-4 py-3 border border-border rounded-xl bg-white outline-none focus:border-warm-400 text-sm resize-none"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer bar */}
            <div className="bg-white border-t border-border px-6 py-3 flex items-center justify-between shrink-0">
              <div>
                {Object.keys(answers).length} / {questions.length} answered
              </div>
              <button
                onClick={() => handleSubmit(activeExam, questions)}
                className="px-6 py-2.5 bg-ink text-paper font-medium rounded-xl hover:bg-ink/90 transition-colors"
              >
                Submit Exam
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Exam list view
  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link
            href="/student"
            className="text-sm text-warm-400 hover:text-warm-600 transition-colors"
          >
            &larr; Dashboard
          </Link>
          <h1 className="font-display text-2xl text-ink mt-1">Exams</h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-4">
        {error && (
          <p className="text-accent-red text-sm bg-accent-red/5 px-4 py-2.5 rounded-lg">
            {error}
          </p>
        )}

        {/* Start confirmation modal */}
        {confirmStart && activeExam && (
          <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full animate-scale-in shadow-2xl">
              <h3 className="text-xl font-display text-ink mb-2">
                Start Exam?
              </h3>
              <p className="text-sm text-ink/60 mb-6">
                Once you start, you must stay on this page until you submit.
                Leaving the page, switching tabs, or trying to copy/paste will
                count as warnings. After 3 warnings, your exam auto-submits.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setConfirmStart(false);
                    setActiveExam(null);
                  }}
                  className="flex-1 py-2.5 border border-border text-ink/60 rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => startExam(activeExam)}
                  className="flex-1 py-2.5 bg-ink text-paper font-medium rounded-xl text-sm"
                >
                  I understand, start
                </button>
              </div>
            </div>
          </div>
        )}

        {exams.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-ink/30 text-lg">No exams available.</p>
          </div>
        ) : (
          exams.map((ex: any) => {
            const sub = submissions[ex.id];
            const questions: ExamQuestion[] = Array.isArray(ex.questions)
              ? ex.questions
              : [];
            const mcCount = questions.filter(
              (q) => q.type === "multiple_choice"
            ).length;
            const essayCount = questions.filter(
              (q) => q.type === "essay"
            ).length;
            let typeLabel = "";
            if (mcCount > 0 && essayCount > 0)
              typeLabel = `${mcCount} MC + ${essayCount} essay`;
            else if (mcCount > 0) typeLabel = `${mcCount} MC`;
            else typeLabel = `${essayCount} essay`;

            return (
              <div
                key={ex.id}
                className="bg-white border border-border rounded-2xl overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-ink">{ex.title}</h3>
                      <p className="text-xs text-ink/30 mt-1">
                        {questions.length} questions ({typeLabel})
                        {ex.time_limit_minutes
                          ? ` · ${ex.time_limit_minutes} min`
                          : ""}
                      </p>
                    </div>
                    {sub ? (
                      <div className="text-right">
                        <span className="text-sm text-accent-green font-medium">
                          Score: {sub.score}/{sub.total}
                        </span>
                        <p className="text-[10px] text-ink/30">
                          {new Date(
                            sub.submitted_at || Date.now()
                          ).toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveExam(ex.id);
                          setConfirmStart(true);
                        }}
                        className="px-4 py-2 bg-ink text-paper text-sm rounded-xl hover:bg-ink/90 transition-colors"
                      >
                        Start
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}