import Link from "next/link";
import Logo from "./Logo";

export default function PortalFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-paper/85 py-12 px-6 md:px-8 border-t border-primary-dark/30 shadow-inner relative z-10">
      <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-4">
        
        {/* Brand details */}
        <div className="md:col-span-2 space-y-4">
          <Logo light={true} />
          <p className="font-serif-body text-sm text-paper/60 max-w-sm leading-relaxed mt-4 italic">
            "An environment built for focus, classical structure, and modern excellence."
          </p>
        </div>

        {/* Quick Links */}
        <div className="space-y-3">
          <h4 className="font-display text-sm text-white font-semibold tracking-wider uppercase">Academics</h4>
          <ul className="space-y-2 text-xs text-paper/50">
            <li><Link href="/login" className="hover:text-white transition-colors">Homework Cabinet</Link></li>
            <li><Link href="/login" className="hover:text-white transition-colors">Class Surveys</Link></li>
            <li><Link href="/login" className="hover:text-white transition-colors">Exams Schedule</Link></li>
            <li><Link href="/login" className="hover:text-white transition-colors">Attendance Records</Link></li>
          </ul>
        </div>

        {/* Resources */}
        <div className="space-y-3">
          <h4 className="font-display text-sm text-white font-semibold tracking-wider uppercase">Contact</h4>
          <ul className="space-y-2 text-xs text-paper/50">
            <li>Intellect Pro School</li>
            <li>Teacher Cabinet: Mr. Deniz</li>
            <li>Email: support@misterdeniz.edu</li>
            <li>Office Hours: Mon-Fri 14:00 - 17:00</li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-paper/40">
        <p>© {currentYear} Mister Deniz edu-portal. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
}
