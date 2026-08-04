"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Logo from "./Logo";

interface PortalHeaderProps {
  roleOverride?: "teacher" | "student" | null;
  joinCodeOverride?: string;
}

export default function PortalHeader({ roleOverride, joinCodeOverride }: PortalHeaderProps) {
  const supabase = createClient();
  const pathname = usePathname();
  
  const [user, setUser] = useState<{ id: string; role: string; full_name?: string } | null>(null);
  const [classCode, setClassCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (roleOverride !== undefined) {
      if (roleOverride) {
        setUser({ id: "dummy", role: roleOverride, full_name: "User" });
        setClassCode(joinCodeOverride || null);
      } else {
        setUser(null);
      }
      setLoading(false);
      return;
    }

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, full_name, class_id")
            .eq("id", session.user.id)
            .single();

          let code = null;
          if (profile?.class_id) {
            const { data: classData } = await supabase
              .from("classes")
              .select("join_code")
              .eq("id", profile.class_id)
              .single();
            code = classData?.join_code || null;
          } else if (profile?.role === "teacher") {
            const { data: classData } = await supabase
              .from("classes")
              .select("join_code")
              .eq("teacher_id", session.user.id)
              .single();
            code = classData?.join_code || null;
          }

          setUser({
            id: session.user.id,
            role: profile?.role || "student",
            full_name: profile?.full_name || "User"
          });
          setClassCode(code);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      }
      setLoading(false);
    };

    checkSession();
  }, [roleOverride, joinCodeOverride]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // Define links based on user state
  const isTeacher = user?.role === "teacher";
  const isStudent = user?.role === "student";

  const publicLinks = [
    { label: "Main Page", href: "/" },
    { label: "Academics", href: "/login" },
    { label: "News", href: "/login" },
    { label: "About", href: "#" },
  ];

  const teacherLinks = [
    { label: "Dashboard", href: "/teacher" },
    { label: "Homework", href: "/teacher/homework" },
    { label: "Announcements", href: "/teacher/announcements" },
    { label: "Surveys", href: "/teacher/surveys" },
    { label: "Messages", href: "/teacher/messages" },
    { label: "Exams", href: "/teacher/exams" },
    { label: "Attendance", href: "/teacher/attendance" },
  ];

  const studentLinks = [
    { label: "Dashboard", href: "/student" },
    { label: "Homework", href: "/student/homework" },
    { label: "Announcements", href: "/student/announcements" },
    { label: "Surveys", href: "/student/surveys" },
    { label: "Messages", href: "/student/messages" },
    { label: "Grades", href: "/student/grades" },
    { label: "Exams", href: "/student/exams" },
    { label: "Attendance", href: "/student/attendance" },
  ];

  const links = isTeacher ? teacherLinks : isStudent ? studentLinks : publicLinks;

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="bg-primary border-b border-primary-dark/40 py-3.5 px-6 md:px-8 relative z-50 shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* Logo brand left */}
        <Logo light={true} href={isTeacher ? "/teacher" : isStudent ? "/student" : "/"} />

        {/* Center class code notice for dashboard users */}
        {classCode && !loading && (
          <div className="hidden lg:flex items-center gap-2 bg-primary-dark/50 border border-primary-light/25 px-3 py-1.5 rounded-full text-[11px] text-paper/85 font-medium tracking-wide">
            <span className="opacity-75">Class Code:</span>
            <code className="font-mono bg-paper/10 text-white px-1.5 py-0.5 rounded font-bold">{classCode}</code>
          </div>
        )}

        {/* Navigation right */}
        <nav className="hidden xl:flex items-center gap-4 text-xs font-semibold">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`px-4 py-2 rounded-full border transition-all duration-200 ${
                isActive(link.href)
                  ? "bg-white/10 border-white text-white shadow-sm"
                  : "border-white/20 text-paper/80 hover:text-white hover:border-white/55 hover:bg-white/5"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {/* Action button */}
          {!loading && (
            user ? (
              <button
                onClick={handleLogout}
                className="px-5 py-2 bg-black text-white text-xs font-bold rounded-full hover:bg-neutral-900 transition-colors uppercase border border-neutral-800 shadow-lg ml-2"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2 bg-black text-white text-xs font-bold rounded-full hover:bg-neutral-900 transition-colors uppercase border border-neutral-800 shadow-lg ml-2"
              >
                SIGN IN
              </Link>
            )
          )}
        </nav>

        {/* Hamburger Mobile Menu Toggle */}
        <div className="xl:hidden flex items-center gap-4">
          {classCode && !loading && (
            <div className="bg-primary-dark/50 border border-primary-light/20 px-2.5 py-1 rounded-full text-[10px] text-paper font-medium font-mono">
              {classCode}
            </div>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1 text-white hover:text-paper focus:outline-none transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden absolute top-full left-0 right-0 bg-primary-dark border-b border-primary-light/10 p-6 flex flex-col gap-3.5 shadow-xl animate-slide-down">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`w-full text-center py-2.5 rounded-full border transition-all text-xs font-bold ${
                isActive(link.href)
                  ? "bg-white/10 border-white text-white"
                  : "border-white/10 text-paper/70 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}

          {!loading && (
            user ? (
              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="w-full py-2.5 bg-black text-white text-xs font-bold rounded-full hover:bg-neutral-900 border border-neutral-800 transition-colors uppercase mt-2"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 bg-black text-white text-xs font-bold rounded-full hover:bg-neutral-900 border border-neutral-800 transition-colors uppercase mt-2"
              >
                SIGN IN
              </Link>
            )
          )}
        </div>
      )}
    </header>
  );
}
