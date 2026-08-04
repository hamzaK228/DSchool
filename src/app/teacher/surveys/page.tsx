"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { surveySchema } from "@/lib/validations";

export default function TeacherSurveys() {
  const [surveys, setSurveys] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [form, setForm] = useState({ question: "", closes_at: "" });
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    const [sRes, rRes] = await Promise.all([
      fetch("/api/surveys"),
      fetch("/api/survey-results"),
    ]);
    if (sRes.ok) setSurveys(await sRes.json());
    if (rRes.ok) setResults(await rRes.json());
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOptionChange = (index: number, value: string) => {
    const newOpts = [...options];
    newOpts[index] = value;
    setOptions(newOpts);
  };

  const addOption = () => setOptions([...options, ""]);

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const filteredOptions = options.filter((o) => o.trim().length > 0);
    if (filteredOptions.length < 2) {
      setError("At least 2 non-empty options are required");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/surveys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: form.question,
        options: filteredOptions,
        closes_at: form.closes_at || null,
      }),
    });
    if (!res.ok) {
      const err = await res.json();
      setError(err.error || "Failed");
      setSubmitting(false);
      return;
    }
    setForm({ question: "", closes_at: "" });
    setOptions(["", ""]);
    setShowForm(false);
    setSubmitting(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/surveys?id=${id}`, { method: "DELETE" });
    loadData();
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-warm-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <Link
              href="/teacher"
              className="text-sm text-warm-400 hover:text-warm-600 transition-colors"
            >
              &larr; Dashboard
            </Link>
            <h1 className="font-display text-2xl text-ink mt-1">Surveys</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowResults(!showResults);
                setShowForm(false);
              }}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                showResults
                  ? "bg-warm-200 text-warm-800"
                  : "bg-white border border-border text-ink/60 hover:bg-warm-50"
              }`}
            >
              {showResults ? "All surveys" : "Results"}
            </button>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setShowResults(false);
              }}
              className="px-4 py-2 bg-ink text-paper text-sm font-medium rounded-xl hover:bg-ink/90 transition-colors"
            >
              {showForm ? "Cancel" : "+ New"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-border rounded-2xl p-6 space-y-5 animate-fade-in-up"
          >
            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1.5">
                Question
              </label>
              <input
                type="text"
                value={form.question}
                onChange={(e) =>
                  setForm({ ...form, question: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl outline-none focus:border-warm-400 transition-colors"
                placeholder="Survey question"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-ink/70">
                  Options ({options.length})
                </label>
                <button
                  type="button"
                  onClick={addOption}
                  className="text-xs text-warm-500 hover:text-warm-700"
                >
                  + Add option
                </button>
              </div>
              {options.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-ink/30 w-4 text-right">
                    {i + 1}.
                  </span>
                  <input
                    value={opt}
                    onChange={(e) => handleOptionChange(i, e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-border rounded-lg outline-none focus:border-warm-400 transition-colors text-sm"
                    placeholder={`Option ${i + 1}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => removeOption(i)}
                    className="text-xs text-ink/20 hover:text-accent-red transition-colors px-1"
                    title="Remove option"
                  >
                    &times;
                  </button>
                </div>
              ))}
              <p className="text-[10px] text-ink/30">
                Minimum 2 options. Each option must have text.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink/70 mb-1.5">
                Closes At (optional)
              </label>
              <input
                type="datetime-local"
                value={form.closes_at}
                onChange={(e) =>
                  setForm({ ...form, closes_at: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-white border border-border rounded-xl outline-none focus:border-warm-400 transition-colors"
              />
            </div>

            {error && (
              <p className="text-accent-red text-sm bg-accent-red/5 px-4 py-2.5 rounded-lg">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-ink text-paper font-medium rounded-xl hover:bg-ink/90 transition-colors disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Survey"}
            </button>
          </form>
        )}

        {showResults ? (
          results.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-ink/30 text-lg">No survey data yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {results.map((r: any) => (
                <div
                  key={r.id}
                  className="bg-white border border-border rounded-2xl p-6"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h3 className="font-medium text-ink">{r.question}</h3>
                      <p className="text-xs text-ink/30 mt-1">
                        {r.total_responses} response
                        {r.total_responses !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="text-xs text-ink/20 hover:text-accent-red transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(r.results || []).map((opt: any, i: number) => {
                      const colors = [
                        "bg-warm-400",
                        "bg-accent-blue",
                        "bg-accent-green-light",
                        "bg-warm-500",
                        "bg-accent-red-light",
                      ];
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-xs text-ink/60 mb-0.5">
                            <span>{opt.option}</span>
                            <span>
                              {opt.count} ({opt.percent}%)
                            </span>
                          </div>
                          <div className="w-full bg-warm-50 rounded-full h-5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                colors[i % colors.length]
                              }`}
                              style={{
                                width: `${opt.percent}%`,
                                minWidth: opt.count > 0 ? "20px" : "0",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : surveys.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-ink/30 text-lg">No surveys created yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {surveys.map((survey: any) => (
              <div
                key={survey.id}
                className="bg-white border border-border rounded-2xl p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-ink">
                      {survey.question}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(Array.isArray(survey.options)
                        ? survey.options
                        : []
                      ).map((opt: string, i: number) => (
                        <span
                          key={i}
                          className="text-xs bg-warm-50 text-warm-700 px-2 py-0.5 rounded"
                        >
                          {opt}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-ink/30 mt-3">
                      Created{" "}
                      {new Date(survey.created_at).toLocaleDateString()}
                      {survey.closes_at &&
                        ` · Closes ${new Date(survey.closes_at).toLocaleString()}`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(survey.id)}
                    className="text-xs text-ink/20 hover:text-accent-red transition-colors flex-shrink-0"
                  >
                    Delete
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