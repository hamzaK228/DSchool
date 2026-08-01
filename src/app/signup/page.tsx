"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { signupSchema } from "@/lib/validations";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    join_code: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = signupSchema.safeParse(form);
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);

    // Use server-side API to bypass RLS
    const res = await fetch("/api/student-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Signup failed");
      setLoading(false);
      return;
    }

    // Sign in the newly created user
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (signInError) {
      setError("Account created! Please sign in at /login.");
      setLoading(false);
      return;
    }

    // Redirect to student dashboard
    window.location.href = "/student";
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="inline-block text-warm-400 font-mono text-xs tracking-[0.3em] uppercase mb-12 hover:text-warm-600 transition-colors"
        >
          &larr; Back
        </Link>

        <h1 className="text-3xl font-display text-ink mb-2">Join a Class</h1>
        <p className="text-ink/50 text-sm mb-8">
          Enter your details and the join code from your teacher.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="full_name"
              className="block text-sm font-medium text-ink/70 mb-1.5"
            >
              Full Name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={form.full_name}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-border rounded-xl text-ink placeholder:text-ink/30 focus:border-warm-400 focus:ring-1 focus:ring-warm-400 transition-colors outline-none"
              placeholder="Your full name"
              required
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-ink/70 mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-border rounded-xl text-ink placeholder:text-ink/30 focus:border-warm-400 focus:ring-1 focus:ring-warm-400 transition-colors outline-none"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-ink/70 mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-border rounded-xl text-ink placeholder:text-ink/30 focus:border-warm-400 focus:ring-1 focus:ring-warm-400 transition-colors outline-none"
              placeholder="Min 6 characters"
              required
            />
          </div>

          <div>
            <label
              htmlFor="join_code"
              className="block text-sm font-medium text-ink/70 mb-1.5"
            >
              Class Join Code
            </label>
            <input
              id="join_code"
              name="join_code"
              type="text"
              value={form.join_code}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-border rounded-xl text-ink placeholder:text-ink/30 focus:border-warm-400 focus:ring-1 focus:ring-warm-400 transition-colors outline-none font-mono"
              placeholder="e.g. ABC123"
              required
            />
            <p className="text-xs text-ink/30 mt-1.5">
              Ask your teacher for this code.
            </p>
          </div>

          {error && (
            <p className="text-accent-red text-sm bg-accent-red/5 px-4 py-2.5 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-ink text-paper font-medium rounded-xl hover:bg-ink/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Join Class"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-ink/50">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-warm-600 hover:text-warm-700 font-medium transition-colors"
          >
            Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}