"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PortalHeader from "@/components/PortalHeader";
import Marquee from "@/components/Marquee";
import PortalFooter from "@/components/PortalFooter";

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

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
      const target = profile?.role === "teacher" ? "/teacher" : "/student";
      setTimeout(() => {
        window.location.href = target;
      }, 300);
    }
  };

  return (
    <main className="min-h-screen bg-paper flex flex-col justify-between">
      {/* Brand Header */}
      <PortalHeader />

      {/* Marquee Ticker */}
      <Marquee text="Currently @ Intellect Pro School" />

      {/* Login Form Container - styled exactly to PDF Page 2 */}
      <section className="flex-1 flex items-center justify-center py-20 px-6">
        <div className="w-full max-w-[440px] bg-paper-light border border-border/80 p-8 md:p-10 rounded-2xl shadow-lg relative overflow-hidden animate-scale-in">
          
          {/* Subtle gold line on top of card */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />
          
          <h1 className="text-3xl font-display text-ink font-semibold tracking-wide text-center mb-1">
            JOIN A CLASS
          </h1>
          <p className="text-xs font-serif-body italic text-ink-light text-center mb-8">
            Continue your Mr. Deniz experience!
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[11px] font-bold text-ink-light uppercase tracking-wider mb-2 font-sans">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border border-border rounded-xl text-ink placeholder:text-ink-light/35 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-sans text-sm shadow-inner"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-ink-light uppercase tracking-wider mb-2 font-sans">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 bg-white border border-border rounded-xl text-ink placeholder:text-ink-light/35 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-sans text-sm shadow-inner"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-primary text-xs font-semibold bg-primary/5 border border-primary/10 px-4 py-3 rounded-xl animate-fade-in">
                ⚠️ {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 text-sm font-sans uppercase tracking-wider btn-press mt-2"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-ink-light font-sans">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary font-bold hover:underline tracking-wide">
              SIGN UP
            </Link>
          </p>
        </div>
      </section>

      {/* Brand Footer */}
      <PortalFooter />
    </main>
  );
}