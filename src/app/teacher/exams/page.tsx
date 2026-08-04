"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { ExamQuestion, QuestionType } from "@/lib/types";

let idCounter = 1;
const nextId = () => `q_${Date.now()}_${idCounter++}`;

function emptyQuestion(): ExamQuestion {
  return {
    id: nextId(),
    type: "multiple_choice",
    text: "",
    image_url: null,
    options: ["", "", "", ""],
    correct: 0,
    points: 1,
  };
}

function emptyEssay(): ExamQuestion {
  return {
    id: nextId(),
    type: "essay",
    text: "",
    image_url: null,
    options: [],
    correct: 0,
    points: 5,
  };
}

export default function TeacherExams() {
  const supabase = createClient();
  const [exams, setExams] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewingResults, setViewingResults] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    time_limit_minutes: "",
    visible_from: "",
    closes_at: "",
  });
  const [questions, setQuestions] = useState<ExamQuestion[]>([emptyQuestion()]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingUploadQuestionId, setPendingUploadQuestionId] = useState<string | null>(null);
  const [gradingSubId, setGradingSubId] = useState<string | null>(null);
  const [gradedSubmissions, setGradedSubmissions] = useState<Record<string, any>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAi, setShowAi] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const load = async () => {
    const [eRes, sRes] = await Promise.all([
      fetch("/api/exams"),
      fetch("/api/exam-submissions"),
    ]);
    if (eRes.ok) setExams(await eRes.json());
    if (sRes.ok) setSubmissions(await sRes.json());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleQuestionChange = (id: string, field: keyof ExamQuestion, value: any) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  };

  const handleOptionChange = (qId: string, optIndex: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const newOpts = [...q.options];
        newOpts[optIndex] = value;
        return { ...q, options: newOpts };
      })
    );
  };

  const addOption = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === qId ? { ...q, options: [...q.options, ""] } : q
      )
    );
  };

  const removeOption = (qId: string, optIndex: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        if (q.options.length <= 2) return q; // min 2
        const newOpts = q.options.filter((_, i) => i !== optIndex);
        const newCorrect =
          q.correct >= newOpts.length ? newOpts.length - 1 : q.correct;
        return { ...q, options: newOpts, correct: newCorrect };
      })
    );
  };

  const addQuestion = (type: QuestionType) => {
    setQuestions((prev) => [
      ...prev,
      type === "essay" ? emptyEssay() : emptyQuestion(),
    ]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const handleImageUpload = async (qId: string) => {
    setPendingUploadQuestionId(qId);
    fileInputRef.current?.click();
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pendingUploadQuestionId) return;
    const qId = pendingUploadQuestionId;
    setPendingUploadQuestionId(null);
    setUploadingIndex(
      questions.findIndex((q) => q.id === qId)
    );

    try {
      const ext = file.name.split(".").pop();
      const path = `exam-images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error: upErr } = await supabase.storage
        .from("exam-images")
        .upload(path, file, { upsert: true });

      if (upErr) throw upErr;

      const urlRes = supabase.storage.from("exam-images").getPublicUrl(path);
      setQuestions((prev) =>
        prev.map((q) => (q.id === qId ? { ...q, image_url: urlRes.data.publicUrl } : q))
      );
    } catch (err: any) {
      setError("Image upload failed: " + err.message);
    }
    setUploadingIndex(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const valid = questions.every((q) => {
      if (!q.text.trim()) return false;
      if (q.type === "multiple_choice") {
        if (q.options.some((o) => !o.trim())) return false;
        if (q.options.length < 2) return false;
      }
      return true;
    });

    if (!valid) {
      setError("All questions and options must be filled out.");
      return;
    }

    setSubmitting(true);
    const method = editingId ? "PUT" : "POST";
    const body: any = {
      title: form.title,
      questions,
      time_limit_minutes: form.time_limit_minutes ? parseInt(form.time_limit_minutes) : null,
      visible_from: form.visible_from || new Date().toISOString(),
      closes_at: form.closes_at || null,
    };
    if (editingId) body.id = editingId;

    const r = await fetch("/api/exams", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      setError((await r.json()).error || "Failed");
      setSubmitting(false);
      return;
    }
    idCounter = 1;
    resetForm();
    setSubmitting(false);
    load();
  };

  const resetForm = () => {
    setForm({ title: "", time_limit_minutes: "", visible_from: "", closes_at: "" });
    setQuestions([emptyQuestion()]);
    setShowForm(false);
    setEditingId(null);
    setShowAi(false);
    setAiPrompt("");
  };

  const handleEdit = async (examId: string) => {
    const exam = exams.find((e) => e.id === examId);
    if (!exam) return;
    setForm({
      title: exam.title || "",
      time_limit_minutes: exam.time_limit_minutes?.toString() || "",
      visible_from: exam.visible_from ? exam.visible_from.slice(0, 16) : "",
      closes_at: exam.closes_at ? exam.closes_at.slice(0, 16) : "",
    });
    const qs = Array.isArray(exam.questions) ? exam.questions : [];
    if (qs.length > 0) {
      setQuestions(qs.map((q: any) => ({ ...q, id: q.id || nextId() })));
    } else {
      setQuestions([emptyQuestion()]);
    }
    setEditingId(exam.id);
    setShowForm(true);
    setShowAi(false);
  };

  const handleAiAssist = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai-assist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "exam", prompt: aiPrompt }) });
      if (res.ok) {
        const data = await res.json();
        setForm((prev) => ({
          ...prev,
          title: data.title || prev.title,
          time_limit_minutes: data.time_limit_minutes?.toString() || "",
        }));
        if (data.questions && Array.isArray(data.questions)) {
          setQuestions(data.questions.map((q: any) => ({ ...q, id: (q.id || nextId()) })));
        }
      }
    } catch {}
    setAiLoading(false);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/exams?id=${id}`, { method: "DELETE" });
    load();
  };

  const getExamSubmissions = (examId: string) =>
    submissions.filter((s: any) => s.exam_id === examId);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-warm-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <Link
              href="/teacher"
              className="text-sm text-warm-400 hover:text-warm-600 transition-colors"
            >
              &larr; Dashboard
            </Link>
            <h1 className="font-display text-2xl text-ink mt-1">Exams</h1>
          </div>
          <div className="flex gap-2 flex-wrap">
            {viewingResults && (
              <button
                onClick={() => setViewingResults(null)}
                className="px-4 py-2 text-sm font-medium bg-white border border-border rounded-xl hover:bg-warm-50 transition-colors"
              >
                All Exams
              </button>
            )}
            <button onClick={() => { setShowAi(!showAi); if (!showAi) { setShowForm(false); resetForm(); } }} className="px-3 py-2 text-xs font-medium border border-warm-400 text-warm-600 rounded-xl hover:bg-warm-50 transition-colors">{showAi ? "Cancel AI" : "🤖 AI"}</button>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setViewingResults(null);
              }}
              className="px-4 py-2 bg-ink text-paper text-sm font-medium rounded-xl hover:bg-ink/90 transition-colors"
            >
              {showForm ? "Cancel" : "+ New Exam"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {showAi && (
          <div className="bg-white border border-warm-200 rounded-2xl p-5 space-y-3 animate-fade-in-up">
            <h3 className="text-sm font-semibold text-warm-700">🤖 AI Exam Generator</h3>
            <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} rows={2} className="w-full px-3 py-2 border border-border rounded-xl text-sm outline-none focus:border-warm-400 resize-none" placeholder="e.g. Create a 5-question quiz about World War II for 10th grade history" />
            <button onClick={handleAiAssist} disabled={aiLoading || !aiPrompt.trim()} className="px-4 py-2 bg-warm-500 text-white text-xs font-medium rounded-xl hover:bg-warm-600 transition-colors disabled:opacity-50">{aiLoading ? "Generating..." : "Generate Exam"}</button>
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-border rounded-2xl p-6 space-y-6 animate-fade-in-up"
          >
            {/* Hidden file input for image uploads */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileSelected}
            />

            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1.5">
                Title
              </label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2.5 border border-border rounded-xl bg-white outline-none focus:border-warm-400"
                placeholder="e.g. Math Quiz 1"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-ink/70 mb-1.5">
                  Time (min)
                </label>
                <input
                  type="number"
                  value={form.time_limit_minutes}
                  onChange={(e) =>
                    setForm({ ...form, time_limit_minutes: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-border rounded-xl bg-white outline-none focus:border-warm-400"
                  placeholder="No limit"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink/70 mb-1.5">
                  Visible From
                </label>
                <input
                  type="datetime-local"
                  value={form.visible_from}
                  onChange={(e) =>
                    setForm({ ...form, visible_from: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-border rounded-xl bg-white outline-none focus:border-warm-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink/70 mb-1.5">
                  Closes At
                </label>
                <input
                  type="datetime-local"
                  value={form.closes_at}
                  onChange={(e) =>
                    setForm({ ...form, closes_at: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-border rounded-xl bg-white outline-none focus:border-warm-400"
                />
              </div>
            </div>

            {/* Questions */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-ink/60 uppercase tracking-wider">
                  Questions ({questions.length})
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => addQuestion("multiple_choice")}
                    className="text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-warm-50 transition-colors"
                  >
                    + Multiple Choice
                  </button>
                  <button
                    type="button"
                    onClick={() => addQuestion("essay")}
                    className="text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-warm-50 transition-colors"
                  >
                    + Essay
                  </button>
                </div>
              </div>

              {questions.map((q, qi) => (
                <div
                  key={q.id}
                  className="border border-border rounded-xl p-4 space-y-3 bg-paper/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-ink/40">
                      Question {qi + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <select
                        value={q.type}
                        onChange={(e) =>
                          handleQuestionChange(q.id, "type", e.target.value)
                        }
                        className="text-xs border border-border rounded-lg px-2 py-1 bg-white"
                      >
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="essay">Essay</option>
                      </select>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-ink/40">Points:</span>
                        <input
                          type="number"
                          value={q.points}
                          min={1}
                          onChange={(e) =>
                            handleQuestionChange(
                              q.id,
                              "points",
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-14 text-xs border border-border rounded-lg px-2 py-1 bg-white"
                        />
                      </div>
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(q.id)}
                          className="text-xs text-accent-red hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Question text */}
                  <div>
                    <label className="block text-xs font-medium text-ink/50 mb-1">
                      Question text
                    </label>
                    <input
                      value={q.text}
                      onChange={(e) =>
                        handleQuestionChange(q.id, "text", e.target.value)
                      }
                      placeholder="Enter your question..."
                      className="w-full px-3 py-2 border border-border rounded-lg bg-white outline-none focus:border-warm-400 text-sm"
                    />
                  </div>

                  {/* Image upload */}
                  <div>
                    {q.image_url ? (
                      <div className="relative inline-block">
                        <img
                          src={q.image_url}
                          alt="Question"
                          className="max-h-32 rounded-lg border border-border"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleQuestionChange(q.id, "image_url", null)
                          }
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-accent-red text-white rounded-full text-xs flex items-center justify-center"
                        >
                          &times;
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleImageUpload(q.id)}
                        disabled={uploadingIndex === qi}
                        className="text-xs text-warm-500 hover:text-warm-700 border border-dashed border-warm-300 rounded-lg px-3 py-2 hover:bg-warm-50 transition-colors"
                      >
                        {uploadingIndex === qi
                          ? "Uploading..."
                          : "+ Add image"}
                      </button>
                    )}
                  </div>

                  {/* Multiple choice options */}
                  {q.type === "multiple_choice" && (
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-ink/50">
                        Options
                      </label>
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={q.correct === oi}
                            onChange={() =>
                              handleQuestionChange(q.id, "correct", oi)
                            }
                            className="accent-warm-500"
                            title="Mark as correct answer"
                          />
                          <input
                            value={opt}
                            onChange={(e) =>
                              handleOptionChange(q.id, oi, e.target.value)
                            }
                            placeholder={`Option ${oi + 1}`}
                            className="flex-1 px-3 py-1.5 border border-border rounded-lg bg-white outline-none focus:border-warm-400 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(q.id, oi)}
                            className="text-xs text-ink/20 hover:text-accent-red transition-colors"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addOption(q.id)}
                        className="text-xs text-warm-500 hover:text-warm-700 mt-1"
                      >
                        + Add option
                      </button>
                      <p className="text-[10px] text-ink/30 mt-1">
                        Select radio button for the correct answer.
                      </p>
                    </div>
                  )}

                  {q.type === "essay" && (
                    <p className="text-xs text-ink/30 italic">
                      Student will write a free-text essay response.
                    </p>
                  )}
                </div>
              ))}
            </div>

            {error && (
              <p className="text-accent-red text-sm bg-accent-red/5 px-4 py-2.5 rounded-lg">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-ink text-paper font-medium rounded-xl hover:bg-ink/90 transition-colors disabled:opacity-50">{submitting ? "Saving..." : editingId ? "Update Exam" : "Create Exam"}</button>
              {editingId && <button type="button" onClick={resetForm} className="px-4 py-2.5 border border-border text-ink/60 rounded-xl text-sm">Cancel</button>}
            </div>
          </form>
        )}

        {viewingResults ? (
          <div className="space-y-4 animate-fade-in-up">
            {(() => {
              const examSubs = getExamSubmissions(viewingResults);
              const exam = exams.find((e) => e.id === viewingResults);
              if (!exam)
                return (
                  <div className="text-center py-20">
                    <p className="text-ink/30">Exam not found.</p>
                  </div>
                );
              const questions: ExamQuestion[] = Array.isArray(exam.questions)
                ? exam.questions
                : [];

              return (
                <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
                  <h2 className="font-display text-xl text-ink mb-1">
                    {exam.title} — Results
                  </h2>
                  <p className="text-xs text-ink/30 mb-4">
                    {examSubs.length} student
                    {examSubs.length !== 1 ? "s" : ""} submitted
                  </p>
                  {examSubs.length === 0 ? (
                    <p className="text-ink/30 text-sm">No submissions yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {examSubs.map((sub: any, i: number) => {
                        const studentAnswers = Array.isArray(sub.answers)
                          ? sub.answers
                          : [];
                        const aiGrades = gradedSubmissions[sub.id] || sub.ai_grades;
                        const aiGradesArr = Array.isArray(aiGrades) ? aiGrades : [];
                        const hasEssays = questions.some((q) => q.type === "essay");

                        return (
                          <details
                            key={sub.id}
                            className="border border-border rounded-xl overflow-hidden"
                          >
                            <summary className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-warm-50/50 transition-colors">
                              <span className="text-sm font-medium text-ink/80">
                                {sub.profiles?.full_name || "Unknown Student"}
                              </span>
                              <span className="text-sm font-medium text-accent-green">
                                {sub.total === 100 ? `${sub.score}%` : `${sub.score}/${sub.total} (${sub.total > 0 ? Math.round((sub.score / sub.total) * 100) : 0}%)`}
                              </span>
                            </summary>
                            <div className="border-t border-border p-4 space-y-4 bg-paper/40">
                              {/* AI Grade Essay button */}
                              {hasEssays && (
                                <button
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    setGradingSubId(sub.id);
                                    try {
                                      const res = await fetch("/api/ai-grade-essay", {
                                        method: "POST",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                          exam_id: viewingResults,
                                          submission_id: sub.id,
                                        }),
                                      });
                                      if (res.ok) {
                                        const data = await res.json();
                                        setGradedSubmissions((prev) => ({
                                          ...prev,
                                          [sub.id]: data.grades,
                                        }));
                                        // Update score in submissions list (now percentage-based)
                                        setSubmissions((prev: any[]) =>
                                          prev.map((s) =>
                                            s.id === sub.id
                                              ? { ...s, score: data.overall_percent, total: 100, ai_grades: data.grades }
                                              : s
                                          )
                                        );
                                      }
                                    } finally {
                                      setGradingSubId(null);
                                    }
                                  }}
                                  disabled={gradingSubId === sub.id}
                                  className="w-full py-2 border border-warm-400 text-warm-600 text-xs font-medium rounded-lg hover:bg-warm-50 transition-colors disabled:opacity-50"
                                >
                                  {gradingSubId === sub.id
                                    ? "AI is grading..."
                                    : aiGradesArr.length > 0
                                    ? "🤖 Re-grade Essays with AI"
                                    : "🤖 Grade Essays with AI"}
                                </button>
                              )}

                              {questions.map((q, qi) => {
                                const answer = studentAnswers.find(
                                  (a: any) => a.question_index === qi
                                );
                                const aiGrade = aiGradesArr.find(
                                  (g: any) => g.question_index === qi
                                );

                                return (
                                  <div key={qi}>
                                    <p className="text-sm font-medium text-ink/80">
                                      {qi + 1}. {q.text}
                                    </p>
                                    {q.type === "multiple_choice" ? (
                                      <div>
                                        <p className="text-xs text-ink/40">
                                          Answer:{" "}
                                          {answer?.selected != null
                                            ? q.options[answer.selected] ??
                                              "N/A"
                                            : "No answer"}
                                        </p>
                                        <p className="text-xs text-ink/40">
                                          Correct: {q.options[q.correct]}
                                        </p>
                                      </div>
                                    ) : (
                                      <div className="mt-1 space-y-2">
                                        <div className="p-2 bg-white border border-border rounded-lg">
                                          <p className="text-xs text-ink/60 italic whitespace-pre-wrap">
                                            {answer?.text || "No answer"}
                                          </p>
                                        </div>
                                        {aiGrade && (
                                          <div className="p-3 bg-accent-green/5 border border-accent-green/20 rounded-lg space-y-1">
                                            <div className="flex items-center justify-between">
                                              <span className="text-xs font-medium text-accent-green">
                                                AI Grade
                                              </span>
                                              <span className="text-sm font-bold text-accent-green">
                                                {aiGrade.percent}%
                                              </span>
                                            </div>
                                            <p className="text-xs text-ink/60">
                                              <span className="font-medium">Assessment:</span> {aiGrade.assessment}
                                            </p>
                                            <p className="text-xs text-ink/50 italic">
                                              <span className="font-medium">Feedback:</span> {aiGrade.feedback}
                                            </p>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </details>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        ) : exams.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-ink/30 text-lg">
              No exams yet. Create your first exam!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {exams.map((ex: any) => {
              const subs = getExamSubmissions(ex.id);
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
              else if (mcCount > 0) typeLabel = `${mcCount} multiple choice`;
              else typeLabel = `${essayCount} essay`;

              return (
                <div
                  key={ex.id}
                  className="bg-white border border-border rounded-2xl p-5 card-hover animate-fade-in-up"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-ink">{ex.title}</h3>
                      <p className="text-xs text-ink/30 mt-1">
                        {questions.length} questions ({typeLabel})
                        {ex.time_limit_minutes
                          ? ` · ${ex.time_limit_minutes} min`
                          : ""}
                        {subs.length > 0 && ` · ${subs.length} submitted`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewingResults(ex.id)}
                        className="px-3 py-1.5 text-xs font-medium text-warm-600 hover:bg-warm-50 rounded-lg transition-colors"
                      >
                        {subs.length > 0
                          ? `View Results (${subs.length})`
                          : "No results yet"}
                      </button>
                      <button onClick={() => handleEdit(ex.id)} className="text-xs text-warm-600 hover:underline pr-2">Edit</button>
                      <button
                        onClick={() => handleDelete(ex.id)}
                        className="text-xs text-ink/20 hover:text-accent-red transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}