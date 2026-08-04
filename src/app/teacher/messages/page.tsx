"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  created_at: string;
  sender_name: string;
  receiver_name: string;
}

export default function TeacherMessages() {
  const supabase = createClient();
  const [roster, setRoster] = useState<Profile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [myUserId, setMyUserId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) setMyUserId(session.user.id);

      const res = await fetch("/api/teacher-data");
      if (res.ok) {
        const data = await res.json();
        setRoster(data.roster || []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const loadMessages = useCallback(async () => {
    if (!selectedStudent) return;
    const res = await fetch("/api/messages");
    if (res.ok) {
      const all: ChatMessage[] = await res.json();
      const filtered = all.filter(
        (m) =>
          m.sender_id === selectedStudent.id ||
          m.receiver_id === selectedStudent.id
      );
      setMessages(filtered);
      setTimeout(scrollToBottom, 100);
    }
  }, [selectedStudent]);

  useEffect(() => {
    if (!selectedStudent) return;
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedStudent, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!body.trim() && !file) || !selectedStudent || sending) return;

    setSending(true);

    if (file) {
      const fd = new FormData();
      fd.append("receiver_id", selectedStudent.id);
      fd.append("body", body.trim());
      fd.append("file", file);
      await fetch("/api/messages", { method: "POST", body: fd });
      setFile(null);
    } else {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiver_id: selectedStudent.id, body: body.trim() }),
      });
    }
    setBody("");
    setSending(false);
    loadMessages();
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-warm-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <header className="border-b border-border bg-white/50 backdrop-blur-sm sticky top-0 z-50 shrink-0">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <Link
              href="/teacher"
              className="text-sm text-warm-400 hover:text-warm-600 transition-colors"
            >
              &larr; Dashboard
            </Link>
            <h1 className="font-display text-2xl text-ink mt-1">Messages</h1>
          </div>
          {selectedStudent && (
            <div className="flex items-center gap-2 text-sm text-ink/60">
              <div className="w-7 h-7 rounded-full bg-warm-100 flex items-center justify-center text-xs font-medium text-warm-700">
                {selectedStudent.full_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <span className="font-medium text-ink">
                {selectedStudent.full_name}
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 flex max-w-5xl mx-auto w-full min-h-0">
        {/* Student list sidebar */}
        <aside className="w-72 border-r border-border bg-white/30 p-3 hidden md:flex flex-col shrink-0">
          <p className="text-xs text-ink/30 font-medium uppercase tracking-wider px-2 py-1 mb-2">
            Students
          </p>
          <div className="flex-1 overflow-y-auto space-y-0.5">
            {roster.map((student) => (
              <button
                key={student.id}
                onClick={() => setSelectedStudent(student)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  selectedStudent?.id === student.id
                    ? "bg-warm-100 text-warm-700 font-medium"
                    : "text-ink/60 hover:bg-warm-50"
                }`}
              >
                {student.full_name}
              </button>
            ))}
          </div>
        </aside>

        {/* Chat area */}
        <main className="flex-1 flex flex-col min-h-0">
          {!selectedStudent ? (
            <div className="flex-1 flex items-center justify-center text-ink/30 px-4 text-center">
              Select a student from the sidebar to start messaging
            </div>
          ) : (
            <>
              {/* Mobile student selector */}
              <div className="md:hidden p-3 border-b border-border bg-white/50">
                <select
                  value={selectedStudent.id}
                  onChange={(e) => {
                    const s = roster.find((r) => r.id === e.target.value);
                    if (s) setSelectedStudent(s);
                  }}
                  className="w-full px-3 py-2 bg-white border border-border rounded-xl text-sm outline-none"
                >
                  {roster.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-ink/30 text-sm">
                    No messages yet. Say hello!
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.sender_id === myUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${
                          isMine ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div className="flex items-end gap-2 max-w-[75%]">
                          {!isMine && (
                            <div className="w-6 h-6 rounded-full bg-warm-100 flex items-center justify-center text-[10px] font-medium text-warm-700 shrink-0 mb-1">
                              {(msg.sender_name || "S")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                          )}
                          <div>
                            {!isMine && (
                              <p className="text-[10px] text-ink/30 mb-0.5 ml-1">
                                {msg.sender_name}
                              </p>
                            )}
                            <div
                              className={`px-4 py-2.5 rounded-2xl text-sm ${
                                isMine
                                  ? "bg-ink text-paper rounded-br-md"
                                  : "bg-white border border-border rounded-bl-md"
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">
                                {msg.body}
                              </p>
                            </div>
                            <p
                              className={`text-[10px] mt-1 px-1 ${
                                isMine ? "text-right text-ink/20" : "text-ink/30"
                              }`}
                            >
                              {new Date(msg.created_at).toLocaleTimeString(
                                [],
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={sendMessage}
                className="p-4 border-t border-border flex flex-col gap-2 shrink-0 bg-paper"
              >
                {file && (
                  <div className="flex items-center gap-2 text-xs text-warm-600">
                    <span>📎 {file.name}</span>
                    <button type="button" onClick={() => setFile(null)} className="text-accent-red">&times;</button>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={`Message ${selectedStudent.full_name}...`}
                    className="flex-1 px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:border-warm-400 transition-colors"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2.5 border border-border rounded-xl text-sm hover:bg-warm-50 transition-colors"
                    title="Attach file"
                  >
                    📎
                  </button>
                  <button
                    type="submit"
                    disabled={(!body.trim() && !file) || sending}
                    className="px-5 py-2.5 bg-ink text-paper text-sm font-medium rounded-xl hover:bg-ink/90 transition-colors disabled:opacity-50"
                  >
                    {sending ? "..." : "Send"}
                  </button>
                </div>
              </form>
            </>
          )}
        </main>
      </div>
    </div>
  );
}