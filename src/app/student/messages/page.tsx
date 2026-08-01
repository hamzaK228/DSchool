"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Message } from "@/lib/types";

export default function StudentMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);

  const loadMessages = async () => {
    const res = await fetch("/api/messages");
    if (res.ok) {
      const data = await res.json();
      setMessages(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;

    // Get teacher ID from messages or from student-data
    const res = await fetch("/api/student-data");
    if (res.ok) {
      const data = await res.json();
      const teacherId = data.classData?.teacher_id;
      if (teacherId) {
        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ receiver_id: teacherId, body: body.trim() }),
        });
        setBody("");
        loadMessages();
      }
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-warm-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <header className="border-b border-border bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link href="/student" className="text-sm text-warm-400 hover:text-warm-600 transition-colors">&larr; Dashboard</Link>
          <h1 className="font-display text-2xl text-ink mt-1">Message Teacher</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 min-h-0">
        <div className="flex-1 overflow-y-auto space-y-3 py-4">
          {messages.length === 0 ? (
            <p className="text-center text-ink/30 py-20">No messages yet. Send your teacher a message.</p>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id !== (messages.length > 0 ? "" : "");
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
            })
          )}
        </div>

        <form onSubmit={sendMessage} className="py-4 border-t border-border flex gap-2 sticky bottom-0 bg-paper">
          <input type="text" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message your teacher..." className="flex-1 px-4 py-2.5 bg-white border border-border rounded-xl text-sm outline-none focus:border-warm-400 transition-colors" />
          <button type="submit" disabled={!body.trim()} className="px-4 py-2.5 bg-ink text-paper text-sm font-medium rounded-xl hover:bg-ink/90 transition-colors disabled:opacity-50">Send</button>
        </form>
      </main>
    </div>
  );
}