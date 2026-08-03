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
    <main className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex flex-col leading-none">
            <span className="text-xl font-bold text-black tracking-tight">Mister Deniz</span>
            <span className="text-sm text-gray-400 tracking-[0.3em] uppercase">edu-portal</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/" className="hover:text-black">Main Page</Link>
            <Link href="/signup" className="hover:text-black">SIGN UP</Link>
          </nav>
        </div>
      </header>

      <section className="flex-1 flex items-center justify-center py-16 px-6">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-bold text-black mb-1">JOIN A CLASS</h1>
          <p className="text-sm text-gray-500 mb-8">Continue your Mr. Deniz experience!</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black outline-none" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-black placeholder:text-gray-400 focus:border-black focus:ring-1 focus:ring-black outline-none" placeholder="••••••••" required />
            </div>
            {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2.5 rounded-lg">{error}</p>}
            <button type="submit" disabled={loading} className="w-full py-3.5 bg-black text-white font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-50">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link href="/signup" className="text-black font-semibold hover:underline">SIGN UP</Link>
          </p>
        </div>
      </section>
    </main>
  );
}