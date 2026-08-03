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
    e.preventDefault(); setError("");
    if (!email || !password) { setError("Email and password are required"); return; }
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }

    if (data.user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
      const target = profile?.role === "teacher" ? "/teacher" : "/student";
      setTimeout(() => { window.location.href = target; }, 300);
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f0eb]">
      {/* Header */}
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
            <Link href="/signup" className="text-gray-300 hover:text-white transition-colors">SIGN UP</Link>
          </nav>
        </div>
      </header>

      {/* Login Form */}
      <section className="flex items-center justify-center py-20 px-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-[#e0d8cf] p-10 animate-scale-in">
          <h1 className="text-2xl font-display font-bold text-[#1e1e1e] mb-2">Sign In</h1>
          <p className="text-sm text-gray-500 mb-8">Continue your Mr. Deniz experience!</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#1e1e1e]/70 mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#f5f0eb] border border-[#e0d8cf] rounded-xl text-[#1e1e1e] placeholder:text-gray-400 focus:border-[#A51C30] focus:ring-2 focus:ring-[#A51C30]/20 outline-none transition-all"
                placeholder="you@example.com" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1e1e1e]/70 mb-1.5">Password</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#f5f0eb] border border-[#e0d8cf] rounded-xl text-[#1e1e1e] placeholder:text-gray-400 focus:border-[#A51C30] focus:ring-2 focus:ring-[#A51C30]/20 outline-none transition-all"
                placeholder="••••••••" required
              />
            </div>
            {error && <p className="text-[#c44536] text-sm bg-[#c44536]/5 px-4 py-2.5 rounded-lg">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 bg-[#1e1e1e] text-white font-semibold rounded-xl hover:bg-[#2d2d2d] transition-colors disabled:opacity-50 btn-press"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link href="/signup" className="text-[#A51C30] font-semibold hover:text-[#C8102E] transition-colors">
              SIGN UP
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}