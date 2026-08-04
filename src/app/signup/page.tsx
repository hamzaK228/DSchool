"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { signupSchema } from "@/lib/validations";
import PortalHeader from "@/components/PortalHeader";
import Marquee from "@/components/Marquee";
import PortalFooter from "@/components/PortalFooter";

export default function SignupPage() {
  const supabase = createClient();
  const [form, setForm] = useState({ email: "", password: "", full_name: "", join_code: "" });
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

    const res = await fetch("/api/student-signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Signup failed");
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password
    });
    if (signInError) {
      setError("Account created! Please sign in at /login.");
      setLoading(false);
      return;
    }
    window.location.href = "/student";
  };

  return (
    <main className="min-h-screen bg-paper flex flex-col justify-between">
      {/* Brand Header */}
      <PortalHeader />

      {/* Marquee Ticker */}
      <Marquee text="Currently @ Intellect Pro School" />

      {/* Signup Form Container - styled exactly to PDF Page 3 */}
      <section className="flex-1 flex items-center justify-center py-16 px-6">
        <div className="w-full max-w-[440px] bg-paper-light border border-border/80 p-8 md:p-10 rounded-2xl shadow-lg relative overflow-hidden animate-scale-in">
          
          {/* Subtle gold line on top of card */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />
          
          <h1 className="text-3xl font-display text-ink font-semibold tracking-wide text-center mb-1">
            JOIN A CLASS
          </h1>
          <p className="text-xs font-serif-body italic text-ink-light text-center mb-8">
            Enter your details and the Class Join Code from Mr. Deniz.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-ink-light uppercase tracking-wider mb-1.5 font-sans">
                Full Name
              </label>
              <input
                name="full_name"
                type="text"
                value={form.full_name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-ink placeholder:text-ink-light/35 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-sans text-sm shadow-inner"
                placeholder="Your full name"
                required
              />
            </div>
            
            <div>
              <label className="block text-[11px] font-bold text-ink-light uppercase tracking-wider mb-1.5 font-sans">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-ink placeholder:text-ink-light/35 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-sans text-sm shadow-inner"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-ink-light uppercase tracking-wider mb-1.5 font-sans">
                Password
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-ink placeholder:text-ink-light/35 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-sans text-sm shadow-inner"
                placeholder="Min 6 characters"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-ink-light uppercase tracking-wider mb-1.5 font-sans">
                Class Join Code
              </label>
              <input
                name="join_code"
                type="text"
                value={form.join_code}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-ink placeholder:text-ink-light/35 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors font-mono text-sm shadow-inner uppercase font-semibold"
                placeholder="e.g. ABC123"
                required
              />
              <p className="text-[10px] text-ink-light/60 mt-1 font-sans">
                Ask your teacher for this code.
              </p>
            </div>

            {error && (
              <p className="text-primary text-xs font-semibold bg-primary/5 border border-primary/10 px-4 py-3 rounded-xl animate-fade-in">
                ⚠️ {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 text-sm font-sans uppercase tracking-wider btn-press mt-4"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-light font-sans">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-bold hover:underline tracking-wide">
              SIGN IN
            </Link>
          </p>
        </div>
      </section>

      {/* Brand Footer */}
      <PortalFooter />
    </main>
  );
}