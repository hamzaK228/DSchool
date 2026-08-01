"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Check role from profile
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      const target = profile?.role === "teacher" ? "/teacher" : "/student";

      // Small delay for cookie, then redirect
      setTimeout(() => {
        window.location.href = target;
      }, 300);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="inline-block text-warm-400 font-mono text-xs tracking-[0.3em] uppercase mb-12 hover:text-warm-600 transition-colors"
        >
          &larr; Back
        </Link>

        <h1 className="text-3xl font-display text-ink mb-8">Sign In</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-ink/70 mb-1.5"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-border rounded-xl text-ink placeholder:text-ink/30 focus:border-warm-400 focus:ring-1 focus:ring-warm-400 transition-colors outline-none"
              placeholder="••••••••"
              required
            />
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
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-ink/50">
          Don't have an account?{" "}
          <Link
            href="/signup"
            className="text-warm-600 hover:text-warm-700 font-medium transition-colors"
          >
            Join a Class
          </Link>
        </p>
      </div>
    </main>
  );
}