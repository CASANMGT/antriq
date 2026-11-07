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
        <svg width="44" height="44" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <rect width="48" height="48" rx="13" fill="#FFF1CA" />
          <circle cx="21" cy="20" r="9" fill="none" stroke="#F24B3F" strokeWidth="6.5" />
          <path d="M28 26.5 34.5 33" stroke="#F24B3F" strokeWidth="6.5" strokeLinecap="round" />
          <g transform="rotate(-14 31 31)">
            <path
              d="M24 27h15v9.5l-2.5 2-2.5-2-2.5 2-2.5-2-2.5 2-2.5-2Z"
              fill="#F24B3F"
              stroke="#262321"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M27 30.5h8M27 34h6" stroke="#FFF1CA" strokeWidth="1.6" strokeLinecap="round" />
          </g>
          <path d="M35 11l4-3M37 16l5-1" stroke="#F24B3F" strokeWidth="2.4" strokeLinecap="round" />
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
          width="21"
          height="17"
          viewBox="0 0 24 20"
          fill="none"
          className="absolute -right-2.5 -bottom-1 rotate-[-12deg] transition-transform group-hover:rotate-0"
          aria-hidden="true"
        >
          <path
            d="M2 3h20v11l-2.5 2-2.5-2-2.5 2-2.5-2-2.5 2-2.5-2-2.5 2-2.5-2Z"
            fill={accent}
            stroke={ink}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M5.5 7.5h10M5.5 11.5h7" stroke={paper} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
    </Link>
  );
}
