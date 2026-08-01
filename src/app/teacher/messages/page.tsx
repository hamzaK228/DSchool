"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Message, Profile } from "@/lib/types";

interface MessageWithSender extends Message {
  sender_name?: string;
  receiver_name?: string;
}

export default function TeacherMessages() {
  const [roster, setRoster] = useState<Profile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      // Load roster from teacher-data API
      const res = await fetch("/api/teacher-data");
      if (res.ok) {
        const data = await res.json();
        setRoster(data.roster || []);
      }
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedStudent) return;
    const loadMessages = async () => {
      setDataLoading(true);
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        // Fetch profile names
        const userIds = [...new Set(data.flatMap((m: Message) => [m.sender_id, m.receiver_id]))];
        const profileRes = await fetch(`/api/teacher-data`);
        const profileData = await profileRes.json();

        const profileMap = new Map<string, string>();
        if (profileData.roster) {
          profileData.roster.forEach((p: Profile) => profileMap.set(p.id, p.full_name));
        }
        if (profileData.profile) {
          profileMap.set(profileData.profile.id, profileData.profile.full_name);
        }

        const filtered = data.filter(
          (m: Message) =>
            (m.sender_id === selectedStudent.id || m.receiver_id === selectedStudent.id)
        );

        setMessages(
          filtered.map((m: Message) => ({
            ...m,
            sender_name: profileMap.get(m.sender_id),
            receiver_name: profileMap.get(m.receiver_id),
          }))
        );
      }
      setDataLoading(false);
    };

    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedStudent]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || !selectedStudent) return;

    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiver_id: selectedStudent.id, body: body.trim() }),
    });
    setBody("");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-warm-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <header className="border-b border-border bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <Link href="/teacher" className="text-sm text-warm-400 hover:text-warm-600 transition-colors">&larr; Dashboard</Link>
          <h1 className="font-display text-2xl text-ink mt-1">Messages</h1>
        </div>
      </header>

      <div className="flex-1 flex max-w-5xl mx-auto w-full">
        <aside className="w-72 border-r border-border bg-white/30 p-4 hidden md:block">
          <p className="text-xs text-ink/30 font-medium uppercase tracking-wider mb-3">Students</p>
          <div className="space-y-0.5">
            {roster.map((student) => (
              <button
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  selectedStudent?.id === student.id ? "bg-warm-100 text-warm-700 font-medium" : "text-ink/60 hover:bg-warm-50"
                }`}
              >
                {student.full_name}
              </button>
            ))}
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-h-0">
          {!selectedStudent ? (
            <div className="flex-1 flex items-center justify-center text-ink/30">Select a student to start messaging</div>
          ) : (
            <>
              <div className="md:hidden p-3 border-b border-border">
                <select value={selectedStudent.id} onChange={(e) => { const s = roster.find((r) => r.id === e.target.value); if (s) setSelectedStudent(s); }} className="w-full px-3 py-2 bg-white border border-border rounded-xl text-sm">
                  {roster.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {dataLoading && <p className="text-center text-ink/30 text-sm">Loading...</p>}
                {messages.map((msg) => {
                  const isMine = msg.sender_id !== selectedStudent.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${isMine ? "bg-ink text-paper rounded-br-md" : "bg-white border border-border rounded-bl-md"}`}>
                        <p>{msg.body}</p>
                        <p className={`text-[10px] mt-1 ${isMine ? "text-paper/50" : "text-ink/30"}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t border-border flex gap-2">
                <input type="text" value={body} onChange={(e) => setBody(e.target.value)} placeholder={`Message ${selectedStudent.full_name}...`} className="flex-1 px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:border-warm-400 transition-colors" />
                <button type="submit" disabled={!body.trim()} className="px-4 py-2.5 bg-ink text-paper text-sm font-medium rounded-xl hover:bg-ink/90 transition-colors disabled:opacity-50">Send</button>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  );
}