"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  body: string;
  created_at: string;
  sender_name: string;
  receiver_name: string;
}

export default function StudentMessages() {
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [myUserId, setMyUserId] = useState<string>("");
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState<string>("Teacher");
  const [file, setFile] = useState<File | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const init = async () => {
      // Get my user ID
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setMyUserId(session.user.id);
      }

      // Fetch teacher info
      const res = await fetch("/api/student-data");
      if (res.ok) {
        const data = await res.json();
        if (data.classData?.teacher_id) {
          setTeacherId(data.classData.teacher_id);
        }
        if (data.classData?.profiles?.full_name) {
          setTeacherName(data.classData.profiles.full_name);
        }
      }

      setLoading(false);
    };
    init();
  }, []);

  const loadMessages = async () => {
    const res = await fetch("/api/messages");
    if (res.ok) {
      const data: ChatMessage[] = await res.json();
      setMessages(data || []);
      setTimeout(scrollToBottom, 100);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!body.trim() && !file) || !teacherId || sending) return;

    setSending(true);

    if (file) {
      const fd = new FormData();
      fd.append("receiver_id", teacherId);
      fd.append("body", body.trim());
      fd.append("file", file);
      await fetch("/api/messages", { method: "POST", body: fd });
      setFile(null);
    } else {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiver_id: teacherId, body: body.trim() }),
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
              href="/student"
              className="text-sm text-warm-400 hover:text-warm-600 transition-colors"
            >
              &larr; Dashboard
            </Link>
            <h1 className="font-display text-2xl text-ink mt-1">
              Message Teacher
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-ink/60">
            <div className="w-7 h-7 rounded-full bg-ink/10 flex items-center justify-center text-xs font-medium text-ink">
              {teacherName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <span className="font-medium text-ink">{teacherName}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-5xl mx-auto w-full px-4 min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-ink/30 text-sm">
              No messages yet. Send your teacher a message!
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.sender_id === myUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div className="flex items-end gap-2 max-w-[75%]">
                    {!isMine && (
                      <div className="w-6 h-6 rounded-full bg-ink/10 flex items-center justify-center text-[10px] font-medium text-ink shrink-0 mb-1">
                        {(msg.sender_name || "T")
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
                          isMine
                            ? "text-right text-ink/20"
                            : "text-ink/30"
                        }`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
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
          className="py-4 border-t border-border flex flex-col gap-2 sticky bottom-0 bg-paper shrink-0"
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
              placeholder={`Message ${teacherName}...`}
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
      </main>
    </div>
  );
}