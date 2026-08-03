"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { signupSchema } from "@/lib/validations";

export default function SignupPage() {
  const supabase = createClient();
  const [form, setForm] = useState({ email: "", password: "", full_name: "", join_code: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    const result = signupSchema.safeParse(form);
    if (!result.success) { setError(result.error.issues[0].message); return; }
    setLoading(true);

    const res = await fetch("/api/student-signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Signup failed"); setLoading(false); return; }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
    if (signInError) { setError("Account created! Please sign in at /login."); setLoading(false); return; }
    window.location.href = "/student";
  };

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex flex-col leading-none">
            <span className="text-xl font-bold text-black tracking-tight">Mister Deniz</span>
            <span className="text-sm text-gray-400 tracking-[0.3em] uppercase">edu-portal</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/" className="hover:text-black">Main Page</Link>
            <Link href="/login" className="hover:text-black">SIGN IN</Link>
          </nav>
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center py-12 px-6">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-black mb-1">JOIN A CLASS</h1>
          <p className="text-sm text-gray-500 mb-8">Enter your details and the Class Join Code from Mr. Deniz.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Full Name</label>
              <input name="full_name" type="text" value={form.full_name} onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black outline-none" placeholder="Your full name" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black outline-none" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black outline-none" placeholder="Min 6 characters" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Class Join Code</label>
              <input name="join_code" type="text" value={form.join_code} onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black outline-none font-mono" placeholder="e.g. ABC123" required />
              <p className="text-xs text-gray-400 mt-1.5">Ask your teacher for this code.</p>
            </div>
            {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2.5 rounded-lg">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50">
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-black font-semibold hover:underline">SIGN IN</Link>
          </p>
        </div>
      </section>
    </main>
  );
}