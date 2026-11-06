export function Sparks({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 90 60" fill="none" aria-hidden="true" className={className}>
      <path d="M8 34L22 22M20 46L30 33M40 16L42 4" stroke="#F24B3F" strokeWidth="4" strokeLinecap="round" />
      <path d="M56 12L64 2M72 22L84 16" stroke="#E3A02D" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

export function Scribble({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 24" fill="none" aria-hidden="true" className={className}>
      <path d="M3 14C28 4 45 20 70 10C94 1 112 19 136 9C145 6 151 6 157 8" stroke="#F24B3F" strokeWidth="5" strokeLinecap="round" />
    </svg>
  );
}

export function ArrowDoodle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 70" fill="none" aria-hidden="true" className={className}>
      <path d="M8 8C38 12 58 28 66 56" stroke="#262321" strokeWidth="4" strokeLinecap="round" />
      <path d="M48 48L68 60L78 38" stroke="#262321" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function TicketDoodle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 70" fill="none" aria-hidden="true" className={className}>
      <path d="M4 24H20C24 24 26 20 26 14C26 8 30 4 36 4H84C90 4 94 8 94 14V56C94 62 90 66 84 66H36C30 66 26 62 26 56C26 50 24 46 20 46H4V24Z" fill="#FFF1CA" stroke="#262321" strokeWidth="4" />
      <path d="M44 18H76M44 30H68M44 42H58" stroke="#262321" strokeWidth="4" strokeLinecap="round" />
      <circle cx="86" cy="22" r="6" fill="#F24B3F" />
    </svg>
  );
}
