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
    <main className="min-h-screen bg-[#f5f0eb]">
      <header className="bg-[#1e1e1e] text-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <svg viewBox="0 0 40 40" className="w-10 h-10 logo-mark">
              <circle cx="20" cy="20" r="18" fill="none" stroke="#A51C30" strokeWidth="1.5" />
              <circle cx="20" cy="20" r="12" fill="none" stroke="#A51C30" strokeWidth="1" />
              <line x1="20" y1="2" x2="20" y2="10" stroke="#A51C30" strokeWidth="1.5" />
              <line x1="20" y1="30" x2="20" y2="38" stroke="#A51C30" strokeWidth="1.5" />
              <line x1="2" y1="20" x2="10" y2="20" stroke="#A51C30" strokeWidth="1.5" />
              <line x1="30" y1="20" x2="38" y2="20" stroke="#A51C30" strokeWidth="1.5" />
            </svg>
            <div>
              <p className="text-sm font-semibold tracking-wide text-[#A51C30]">Mister Deniz</p>
              <p className="text-[10px] text-gray-400 tracking-widest uppercase">edu-portal</p>
            </div>
          </Link>
          <nav className="flex items-center gap-6 text-sm tracking-wide">
            <Link href="/" className="text-gray-300 hover:text-white transition-colors">Main Page</Link>
            <Link href="/login" className="text-gray-300 hover:text-white transition-colors">SIGN IN</Link>
          </nav>
        </div>
      </header>

      <section className="flex items-center justify-center py-16 px-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#e0d8cf] p-10 animate-scale-in">
          <h1 className="text-2xl font-display font-bold text-[#1e1e1e] mb-1">JOIN A CLASS</h1>
          <p className="text-sm text-gray-500 mb-8">Enter your details and the Class Join Code from Mr. Deniz.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1e1e1e]/70 mb-1.5">Full Name</label>
              <input name="full_name" type="text" value={form.full_name} onChange={handleChange}
                className="w-full px-4 py-3 bg-[#f5f0eb] border border-[#e0d8cf] rounded-xl text-[#1e1e1e] placeholder:text-gray-400 focus:border-[#A51C30] focus:ring-2 focus:ring-[#A51C30]/20 outline-none transition-all" placeholder="Your full name" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1e1e1e]/70 mb-1.5">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                className="w-full px-4 py-3 bg-[#f5f0eb] border border-[#e0d8cf] rounded-xl text-[#1e1e1e] placeholder:text-gray-400 focus:border-[#A51C30] focus:ring-2 focus:ring-[#A51C30]/20 outline-none transition-all" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1e1e1e]/70 mb-1.5">Password</label>
              <input name="password" type="password" value={form.password} onChange={handleChange}
                className="w-full px-4 py-3 bg-[#f5f0eb] border border-[#e0d8cf] rounded-xl text-[#1e1e1e] placeholder:text-gray-400 focus:border-[#A51C30] focus:ring-2 focus:ring-[#A51C30]/20 outline-none transition-all" placeholder="Min 6 characters" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1e1e1e]/70 mb-1.5">Class Join Code</label>
              <input name="join_code" type="text" value={form.join_code} onChange={handleChange}
                className="w-full px-4 py-3 bg-[#f5f0eb] border border-[#e0d8cf] rounded-xl text-[#1e1e1e] placeholder:text-gray-400 focus:border-[#A51C30] focus:ring-2 focus:ring-[#A51C30]/20 outline-none transition-all font-mono" placeholder="e.g. ABC123" required />
              <p className="text-xs text-gray-400 mt-1.5">Ask your teacher for this code.</p>
            </div>
            {error && <p className="text-[#c44536] text-sm bg-[#c44536]/5 px-4 py-2.5 rounded-lg">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-[#1e1e1e] text-white font-semibold rounded-xl hover:bg-[#2d2d2d] transition-colors disabled:opacity-50 btn-press">
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-[#A51C30] font-semibold hover:text-[#C8102E] transition-colors">SIGN IN</Link>
          </p>
        </div>
      </section>
    </main>
  );
}