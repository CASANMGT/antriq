import Link from "next/link";

export function Logo({
  href = "/",
  tone = "dark",
  compact = false,
}: {
  href?: string;
  tone?: "dark" | "light";
  compact?: boolean;
}) {
  const ink = tone === "light" ? "#FFF1CA" : "#262321";
  const paper = tone === "light" ? "#262321" : "#FFF1CA";
  const accent = tone === "light" ? "#FFF1CA" : "#F24B3F";

  if (compact) {
    return (
      <Link href={href} className="inline-flex items-center" aria-label="AntriQ">
        <svg width="40" height="40" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <rect x="1.5" y="1.5" width="45" height="45" rx="14" fill={paper} stroke={ink} strokeWidth="2.5" />
          <circle cx="22" cy="21" r="9.5" stroke={accent} strokeWidth="5.5" />
          <path d="M29 28L35 35" stroke={accent} strokeWidth="5.5" strokeLinecap="round" />
          <rect x="28" y="28" width="14" height="9" rx="2.5" transform="rotate(-12 28 28)" fill={accent} stroke={ink} strokeWidth="2.2" />
          <path d="M31 31.5H38" stroke={paper} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </Link>
    );
  }

  return (
    <Link href={href} className="group inline-flex items-end gap-1.5" aria-label="AntriQ">
      <span
        className="font-display text-[1.6rem] font-semibold leading-[0.8] tracking-[-0.07em] sm:text-[1.75rem]"
        style={{ color: ink }}
      >
        Antri
      </span>
      <span className="relative inline-flex pb-0.5">
        <span
          className="font-display text-[1.75rem] font-semibold leading-[0.8] tracking-[-0.07em] sm:text-[1.9rem]"
          style={{ color: accent }}
        >
          Q
        </span>
        <svg
          width="19"
          height="15"
          viewBox="0 0 24 18"
          fill="none"
          className="absolute -right-2.5 -bottom-1 rotate-[-10deg] transition-transform group-hover:rotate-0"
          aria-hidden="true"
        >
          <rect x="1" y="2.5" width="22" height="14" rx="3" fill={accent} stroke={ink} strokeWidth="2" />
          <path d="M5 7.5H14M5 11.5H11" stroke={paper} strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="19" cy="7.5" r="1.2" fill={paper} />
        </svg>
      </span>
    </Link>
  );
}
