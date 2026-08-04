interface MarqueeProps {
  text?: string;
  speed?: "slow" | "medium" | "fast";
}

export default function Marquee({ text = "Currently @ Intellect Pro School", speed = "medium" }: MarqueeProps) {
  // Repeat the text several times to fill the track width
  const repeatedItems = Array(15).fill(text);

  return (
    <div className="bg-accent-green text-white py-1.5 border-y border-accent-green/20 shadow-inner select-none overflow-hidden relative z-10">
      <div className="marquee-container flex items-center">
        <div className="marquee-track flex gap-12 text-xs md:text-sm font-semibold tracking-wider uppercase">
          {repeatedItems.map((item, idx) => (
            <span key={idx} className="flex items-center gap-2 flex-shrink-0">
              <span>{item}</span>
              <span className="text-white/40 font-normal">✦</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
