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
  const ink = tone === "light" ? "#FBF6ED" : "#1A1512";
  const paper = tone === "light" ? "#1A1512" : "#FBF6ED";

  return (
    <Link href={href} className="inline-flex items-center gap-2.5" aria-label="AntriQ home">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill={ink} />
        <circle cx="10.5" cy="11.5" r="1.9" fill={paper} />
        <circle cx="16" cy="11.5" r="1.9" fill={paper} />
        <circle cx="21.5" cy="11.5" r="1.9" fill={paper} />
        <path d="M10.5 17.2H20.2" stroke={paper} strokeWidth="2.1" strokeLinecap="round" />
        <path d="M14 21.2H21.6" stroke={paper} strokeWidth="2.1" strokeLinecap="round" opacity="0.55" />
        <path d="M21.8 21.4L26.2 26.2" stroke="#C8452B" strokeWidth="2.8" strokeLinecap="round" />
      </svg>
      {!compact && (
        <span className="text-[1.05rem] font-extrabold tracking-[-0.04em]" style={{ color: ink }}>
          Antri<span style={{ color: "#C8452B" }}>Q</span>
        </span>
      )}
    </Link>
  );
}
