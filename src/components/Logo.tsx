import Link from "next/link";

interface LogoProps {
  light?: boolean;
  className?: string;
  href?: string;
}

export default function Logo({ light = true, className = "", href = "/" }: LogoProps) {
  const textColor = light ? "#ffffff" : "var(--color-primary)";
  const subColor = light ? "rgba(255,255,255,0.75)" : "var(--color-ink-light)";

  return (
    <Link
      href={href}
      className={`flex items-center gap-3.5 select-none leading-none group ${className}`}
    >
      {/* Nautilus Shell Icon */}
      <div className="relative flex-shrink-0">
        <svg
          viewBox="0 0 100 100"
          className="w-9 h-9"
          fill="none"
          stroke={textColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transition: "transform 0.5s ease" }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "rotate(12deg)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "rotate(0deg)")}
        >
          {/* Outer circle (C-shape: bottom-right quarter removed, 270° arc) */}
          <path d="M 50 86 A 36 36 0 1 1 86 50" />

          {/* Horizontal line extending from the opening to the right */}
          <line x1="86" y1="50" x2="98" y2="50" />

          {/* Concentric rings */}
          <circle cx="50" cy="50" r="30" />
          <circle cx="50" cy="50" r="24" />
          <circle cx="50" cy="50" r="18" />
          <circle cx="50" cy="50" r="12" />
          <circle cx="50" cy="50" r="6" />

          {/* Radial divisions – 12 lines every 30° from center to outer ring (r=36) */}
          <line x1="50" y1="50" x2="86" y2="50" />
          <line x1="50" y1="50" x2="81.18" y2="68" />
          <line x1="50" y1="50" x2="68" y2="81.18" />
          <line x1="50" y1="50" x2="50" y2="86" />
          <line x1="50" y1="50" x2="32" y2="81.18" />
          <line x1="50" y1="50" x2="18.82" y2="68" />
          <line x1="50" y1="50" x2="14" y2="50" />
          <line x1="50" y1="50" x2="18.82" y2="32" />
          <line x1="50" y1="50" x2="32" y2="18.82" />
          <line x1="50" y1="50" x2="50" y2="14" />
          <line x1="50" y1="50" x2="68" y2="18.82" />
          <line x1="50" y1="50" x2="81.18" y2="32" />

          {/* Spiral beginning at exact center, radiating outward */}
          <path d="M 50 50 C 51 49.5 51.5 49.5 51.5 50 C 51.5 50.8 50.8 51.5 50 51.5 C 48.5 51.5 47.5 50.5 47.5 49 C 47.5 47 49 45.5 51 45.5 C 53.5 45.5 55.5 47.5 55.5 50 C 55.5 53 53 55.5 50 55.5 C 46.5 55.5 43.5 52.5 43.5 49 C 43.5 44.5 47 41 51.5 41" />
        </svg>
      </div>

      {/* Brand Typography */}
      <div className="flex flex-col">
        <span
          className="text-lg md:text-xl font-semibold tracking-wide leading-[1.1]"
          style={{
            fontFamily: '"Poppins", system-ui, -apple-system, sans-serif',
            color: textColor,
          }}
        >
          Mister Deniz
        </span>
        <span
          className="text-xs md:text-sm tracking-[0.15em] font-light leading-[1.1]"
          style={{
            fontFamily: '"Poppins", system-ui, -apple-system, sans-serif',
            color: subColor,
          }}
        >
          edu‑portal
        </span>
      </div>
    </Link>
  );
}