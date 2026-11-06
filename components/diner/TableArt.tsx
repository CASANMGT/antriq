export function TableArt() {
  return (
    <svg
      viewBox="0 0 560 280"
      fill="none"
      aria-hidden="true"
      className="h-auto w-full max-w-xl select-none"
    >
      <defs>
        <linearGradient id="plate" x1="180" y1="40" x2="420" y2="260" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFDF8" />
          <stop offset="1" stopColor="#F1E4D1" />
        </linearGradient>
        <linearGradient id="sun" x1="60" y1="0" x2="460" y2="300" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F7E2D9" />
          <stop offset="1" stopColor="#FBF6ED" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d="M26 246C26 136 134 46 268 46s242 90 242 200" stroke="#E8DAC6" strokeWidth="1.5" />
      <path d="M62 246C62 154 154 78 268 78s206 76 206 168" stroke="#EFE4D3" strokeWidth="1.5" />
      <circle cx="268" cy="160" r="112" fill="url(#sun)" />

      <ellipse cx="268" cy="232" rx="150" ry="13" fill="#E9DCC9" opacity="0.55" />
      <circle cx="268" cy="154" r="86" fill="url(#plate)" stroke="#E4D4BE" strokeWidth="1.7" />
      <circle cx="268" cy="154" r="66" stroke="#EADBC6" strokeWidth="1.2" />
      <circle cx="268" cy="154" r="54" fill="#FCF7EE" stroke="#EFE2D0" strokeWidth="1" />
      <path
        d="M240 156c8-15 18-22 31-22 14 0 24 8 28 20 4 13-3 25-15 30-12 5-27 1-35-9-4-5-7-12-9-19Z"
        fill="#DFECE4"
        stroke="#2F6B4F"
        strokeOpacity="0.35"
      />
      <path d="M256 148c8 3 13 9 15 17" stroke="#2F6B4F" strokeOpacity="0.35" strokeLinecap="round" />
      <circle cx="296" cy="170" r="4" fill="#C8452B" opacity="0.55" />
      <circle cx="281" cy="160" r="2.4" fill="#B88230" opacity="0.65" />

      <g stroke="#8A7A68" strokeWidth="2.4" strokeLinecap="round">
        <path d="M136 92v56" />
        <path d="M128 92v22c0 9 4 14 8 14s8-5 8-14V92" />
        <path d="M144 92v22c0 9-4 14-8 14" />
      </g>

      <g stroke="#8A7A68" strokeWidth="2.4" strokeLinecap="round">
        <path d="M408 92v58" />
        <path d="M399 92c0 26 2 38 9 38s9-12 9-38" />
      </g>

      <g stroke="#8A7A68" strokeWidth="2" strokeLinecap="round" opacity="0.9">
        <path d="M352 84v22l-12 12v32" />
        <path d="M352 84v22l12 12v32" />
        <path d="M340 118h22" />
      </g>

      <path
        d="M186 204c0-9 7-16 16-16s16 7 16 16v5h-32v-5Z"
        fill="#F6E9CD"
        stroke="#B88230"
        strokeOpacity="0.3"
      />
      <path d="M194 188c3-9 9-14 18-16" stroke="#2F6B4F" strokeOpacity="0.45" strokeLinecap="round" />

      <g opacity="0.7">
        <circle cx="76" cy="66" r="2" fill="#C8452B" />
        <circle cx="466" cy="60" r="1.5" fill="#B88230" />
        <circle cx="486" cy="88" r="1" fill="#2F6B4F" />
        <circle cx="54" cy="100" r="1.2" fill="#8A7A68" />
      </g>
    </svg>
  );
}
