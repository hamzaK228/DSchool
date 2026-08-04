"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";
import type { Homework, Submission } from "@/lib/types";

export default function StudentHomework() {
  const supabase = createClient();
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [loading, setLoading] = useState(true);
  const [selectedHw, setSelectedHw] = useState<Homework | null>(null);
  const [textContent, setTextContent] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    // Load homework from API
    const res = await fetch("/api/homework");
    if (res.ok) {
      const data = await res.json();
      setHomeworkList(data);
    }

    // Load own submissions
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      const { data: subs } = await supabase
        .from("submissions")
        .select("*")
        .eq("student_id", sessionData.session.user.id);
      if (subs) {
        const map: Record<string, Submission> = {};
        subs.forEach((s) => { map[s.homework_id] = s; });
        setSubmissions(map);
      }
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handlePhotoUpload = async (files: FileList) => {
    const compressed: File[] = [];
    for (const file of Array.from(files)) {
      try {
        const c = await imageCompression(file, { maxSizeMB: 0.8, maxWidthOrHeight: 1600, useWebWorker: true, initialQuality: 0.7 });
        compressed.push(c);
      } catch { compressed.push(file); }
    }
    setPhotos((prev) => [...prev, ...compressed]);
  };

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    if (!selectedHw) return;
    if (photos.length === 0 && !textContent.trim()) {
      setError("Please provide photos or text content.");
      return;
    }

    setSubmitting(true);
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return;

    const fileUrls: string[] = [];
    for (const photo of photos) {
      const fileName = `${sessionData.session.user.id}/${selectedHw.id}/${Date.now()}-${photo.name}`;
      const { error: uploadError } = await supabase.storage.from("School").upload(fileName, photo);
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from("School").getPublicUrl(fileName);
        fileUrls.push(publicUrl);
      }
    }

    const submissionType = photos.length > 0 ? "photo" : "text";
    const { error: insertError } = await supabase.from("submissions").upsert({
      homework_id: selectedHw.id,
      student_id: sessionData.session.user.id,
      submission_type: submissionType,
      file_urls: fileUrls.length > 0 ? fileUrls : null,
      text_content: textContent.trim() || null,
    });

    if (insertError) { setError(insertError.message); setSubmitting(false); return; }

    if (submissionType === "text" && textContent.trim()) {
      fetch("/api/ai-check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ homework_id: selectedHw.id, text_content: textContent.trim() }) }).catch(() => {});
    }

    setSuccess("Submitted successfully!");
    setTextContent(""); setPhotos([]); setSelectedHw(null);
    setSubmitting(false);
    loadData();
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-warm-400 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-border bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <Link href="/student" className="text-sm text-warm-400 hover:text-warm-600 transition-colors">&larr; Dashboard</Link>
          <h1 className="font-display text-2xl text-ink mt-1">Homework</h1>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {homeworkList.length === 0 ? (<div className="text-center py-20"><p className="text-ink/30 text-lg">No homework assigned yet.</p></div>) : (
          <div className="space-y-3">
            {homeworkList.map((hw) => {
              const sub = submissions[hw.id];
              const isExpanded = selectedHw?.id === hw.id;
              return (
                <div key={hw.id} className={`bg-white border border-border rounded-2xl overflow-hidden card-hover animate-fade-in-up`}>
                  <div className="p-5">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-ink">{hw.title}</h3>
                        {hw.description && <p className="text-sm text-ink/50 mt-1 whitespace-pre-wrap">{hw.description}</p>}
                        <div className="flex items-center gap-4 mt-3 text-xs">
                          {hw.due_date && (() => {
                            const daysLeft = Math.ceil((new Date(hw.due_date).getTime() - Date.now()) / 86400000);
                            const badge = daysLeft < 0 ? "badge-due" : daysLeft <= 2 ? "badge-upcoming" : "badge-safe";
                            const text = daysLeft < 0 ? `Overdue by ${Math.abs(daysLeft)}d` : daysLeft === 0 ? "Due today!" : `Due in ${daysLeft}d`;
                            return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge}`}>{text}</span>;
                          })()}
                          {sub && <span className="text-accent-green font-medium">✓ Submitted{sub.grade && ` · Grade: ${sub.grade}`}</span>}
                        </div>
                      </div>
                      <button onClick={() => setSelectedHw(isExpanded ? null : hw)} className="flex-shrink-0 px-4 py-2 bg-ink text-paper text-sm font-medium rounded-xl hover:bg-ink/90 transition-colors">{sub ? "Resubmit" : "Submit"}</button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-border p-5 space-y-4 animate-fade-in">
                      <div>
                        <label className="block text-sm font-medium text-ink/70 mb-1.5">Upload Photos</label>
                        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => e.target.files && handlePhotoUpload(e.target.files)} className="block text-sm text-ink/50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-warm-50 file:text-warm-700 hover:file:bg-warm-100 transition-colors" />
                        {photos.length > 0 && (<div className="flex flex-wrap gap-2 mt-3">{photos.map((p,i)=>(<div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border"><img src={URL.createObjectURL(p)} alt="" className="w-full h-full object-cover"/><button onClick={()=>setPhotos(photos.filter((_,j)=>j!==i))} className="absolute top-0.5 right-0.5 bg-ink/70 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">×</button></div>))}</div>)}
                      </div>
                      <div><label className="block text-sm font-medium text-ink/70 mb-1.5">Or Type Your Answer</label><textarea value={textContent} onChange={(e)=>setTextContent(e.target.value)} rows={6} className="w-full px-4 py-2.5 bg-paper border border-border rounded-xl outline-none focus:border-warm-400 transition-colors resize-none text-sm" placeholder="Write your answer here..."/></div>
                      {error && <p className="text-accent-red text-sm bg-accent-red/5 px-4 py-2.5 rounded-lg">{error}</p>}
                      {success && <p className="text-accent-green text-sm bg-accent-green/5 px-4 py-2.5 rounded-lg">{success}</p>}
                      <button onClick={handleSubmit} disabled={submitting} className="w-full py-2.5 bg-ink text-paper font-medium rounded-xl hover:bg-ink/90 transition-colors disabled:opacity-50">{submitting?"Submitting...":"Submit Homework"}</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}