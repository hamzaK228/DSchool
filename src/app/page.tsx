"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import PortalHeader from "@/components/PortalHeader";
import Marquee from "@/components/Marquee";
import PortalFooter from "@/components/PortalFooter";

interface SlideData {
  title: string;
  subtitle: string;
  description: string;
  image: string;
  badge: string;
}

export default function LandingPage() {
  const [user, setUser] = useState<{ role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(1); // 1-indexed to match PDF (green on 2nd dot)
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase.from("profiles").select("role").eq("id", data.user.id).single()
          .then(({ data: profile }) => {
            setUser(profile);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });
  }, []);

  const dashboardLink = user?.role === "teacher" ? "/teacher" : "/student";

  // Carousel slide data
  const slides: SlideData[] = [
    {
      title: "Active Learning & Critical Discourse",
      subtitle: "Interactive Student Sessions",
      description: "Our seminar classroom focuses on student participation, Socratic debate, and structured logic in literature.",
      image: "/classroom_hero.png",
      badge: "SEMINARS"
    },
    {
      title: "World History & Ancient Civilizations",
      subtitle: "Currently studying @ Intellect Pro",
      description: "We are currently diving deep into the Roman Empire, the Silk Road exchanges, and classical Ancient Greece.",
      image: "/classroom_hero.png",
      badge: "HISTORY CABINET"
    },
    {
      title: "Analytical Writing & AI Verification",
      subtitle: "Honest Scholarship Standards",
      description: "Writing cabinet integrates structured critique and AI authorship reviews to guide authentic student scholarship.",
      image: "/classroom_hero.png",
      badge: "WRITING STUDIO"
    },
    {
      title: "Realtime Surveys & Dynamic Roster",
      subtitle: "Instant Student Engagement",
      description: "Teacher announcements, direct messaging channels, and daily attendance records consolidated in one elegant hub.",
      image: "/classroom_hero.png",
      badge: "PORTAL CAPABILITIES"
    },
    {
      title: "Comprehensive Exams & Grading",
      subtitle: "Rigorous Assessment System",
      description: "Detailed progress tracking and direct feedback loops help students identify and strengthen their study habits.",
      image: "/classroom_hero.png",
      badge: "ACADEMICS"
    }
  ];

  // Auto-scroll slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length ? 1 : prev + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen bg-paper flex flex-col justify-between">
      {/* PDF Styling Header */}
      <PortalHeader />

      {/* Marquee Ticker */}
      <Marquee text="Currently @ Intellect Pro School" />

      {/* Hero Carousel Section */}
      <section className="relative w-full border-b border-border bg-paper-dark/30 py-8 px-6 md:px-12 flex flex-col items-center">
        <div className="max-w-5xl w-full relative overflow-hidden rounded-2xl border border-border shadow-xl bg-black aspect-[21/9] group">
          {/* Slides */}
          {slides.map((slide, idx) => {
            const slideIdx = idx + 1;
            return (
              <div
                key={idx}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  currentSlide === slideIdx ? "opacity-90" : "opacity-0 pointer-events-none"
                }`}
              >
                {/* Background image illustration */}
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover object-center scale-105 group-hover:scale-100 transition-transform duration-7000"
                />
                
                {/* Overlay Text card in elegant styling */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-10 text-white">
                  <div className="max-w-xl animate-fade-in-up stagger-1">
                    <span className="px-2.5 py-1 bg-primary text-paper text-[10px] tracking-widest font-semibold rounded mb-3 inline-block uppercase">
                      {slide.badge}
                    </span>
                    <h2 className="text-2xl md:text-4xl font-display font-medium mb-2 leading-tight tracking-wide">
                      {slide.title}
                    </h2>
                    <p className="text-xs md:text-sm text-paper/70 font-serif-body italic mb-1">
                      {slide.subtitle}
                    </p>
                    <p className="text-xs md:text-sm text-paper/80 font-sans font-light hidden md:block max-w-lg mt-2 leading-relaxed">
                      {slide.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {/* PDF style Square indicators */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3.5 z-20">
            {slides.map((_, idx) => {
              const slideIdx = idx + 1;
              const isCurrent = currentSlide === slideIdx;
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(slideIdx)}
                  className={`w-3.5 h-3.5 transition-all duration-300 border ${
                    isCurrent 
                      ? "bg-accent-green border-accent-green scale-110 shadow-sm" 
                      : "bg-white/80 border-border hover:bg-white"
                  }`}
                  aria-label={`Go to slide ${slideIdx}`}
                />
              );
            })}
          </div>
        </div>
      </section>

      {/* Editorial Content Grid - Custom & Not AI-slop */}
      <section className="max-w-6xl mx-auto px-6 py-16 grid gap-12 md:grid-cols-12 relative">
        {/* Welcome Block (Asymmetric & overlapping layout) */}
        <div className="md:col-span-8 space-y-6">
          <p className="text-primary font-semibold tracking-[0.25em] text-xs uppercase">Welcome to the Academy</p>
          <h1 className="text-3xl md:text-5xl font-display text-ink leading-tight">
            Academic rigor built with elegant, distraction-free software.
          </h1>
          <p className="font-serif-body text-base text-ink-light leading-relaxed max-w-2xl italic">
            "Mr. Deniz's edu-portal replaces the crowded and distractive layouts of Edupage. This cabinet has been customized to provide students and teachers direct communication, absolute transparency on grading, and a quiet, clean space for assignment tracking."
          </p>
          <div className="flex flex-wrap gap-4 pt-4">
            {!loading && (
              user ? (
                <Link href={dashboardLink} className="px-8 py-3.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-all duration-200 shadow-lg btn-press">
                  Enter Your Cabinet
                </Link>
              ) : (
                <>
                  <Link href="/signup" className="px-8 py-3.5 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary-dark transition-all duration-200 shadow-md btn-press">
                    JOIN A CLASS
                  </Link>
                  <Link href="/login" className="px-8 py-3.5 border-2 border-primary/20 text-primary text-sm font-bold rounded-xl hover:border-primary/50 transition-colors">
                    Sign In
                  </Link>
                </>
              )
            )}
          </div>
        </div>

        {/* Info Column (Breakout look) */}
        <div className="md:col-span-4 bg-paper-light border border-border rounded-2xl p-6 shadow-sm self-start space-y-6">
          <h3 className="font-display text-lg text-primary border-b border-border pb-2.5">Schedule & Office</h3>
          
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-semibold text-ink">Teacher In Charge</p>
              <p className="text-xs text-ink-light">Mr. Deniz (Intellect Pro School)</p>
            </div>
            <div>
              <p className="font-semibold text-ink">Active Cabinet Courses</p>
              <p className="text-xs text-ink-light">World History, Language Arts, Rhetoric</p>
            </div>
            <div>
              <p className="font-semibold text-ink">Student Roster</p>
              <p className="text-xs text-ink-light">150 students actively registered</p>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-xs leading-relaxed text-primary-dark">
            <strong>Notice to Students:</strong> Please verify your assignment deadlines inside your cabinet. All typed assignments undergo immediate AI-authorship checks.
          </div>
        </div>
      </section>

      {/* Grid Features */}
      <section className="bg-paper-light border-y border-border py-16 px-6 relative">
        <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-3">
          
          {/* Card 1 */}
          <div className="p-6 border border-border/80 rounded-2xl bg-paper hover:border-primary/20 transition-all duration-300 card-hover">
            <span className="text-3xl mb-4 block">📝</span>
            <h3 className="font-display text-lg text-ink mb-2">Assignment Cabinets</h3>
            <p className="text-xs text-ink-light leading-relaxed font-sans">
              No paper mess. Upload photos of your handwritten assignments, or write text directly in the editor. Fast, secure, and private.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 border border-border/80 rounded-2xl bg-paper hover:border-primary/20 transition-all duration-300 card-hover">
            <span className="text-3xl mb-4 block">🤖</span>
            <h3 className="font-display text-lg text-ink mb-2">Honest Scholarship</h3>
            <p className="text-xs text-ink-light leading-relaxed font-sans">
              All text entries receive an automated AI-likelihood indicator (low, medium, high) shown to teachers, encouraging original writing.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 border border-border/80 rounded-2xl bg-paper hover:border-primary/20 transition-all duration-300 card-hover">
            <span className="text-3xl mb-4 block">💬</span>
            <h3 className="font-display text-lg text-ink mb-2">Direct Message Lines</h3>
            <p className="text-xs text-ink-light leading-relaxed font-sans">
              Need feedback? Get in touch with Mr. Deniz directly via the secure portal chat messenger. No external emails required.
            </p>
          </div>

        </div>
      </section>

      {/* Editorial Footer */}
      <PortalFooter />
    </main>
  );
}