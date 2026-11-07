export type MascotMood = "happy" | "calm" | "celebrate" | "sleep" | "ticket";

export function Mascot({
  mood = "happy",
  className = "",
  title,
}: {
  mood?: MascotMood;
  className?: string;
  title?: string;
}) {
  const celebrate = mood === "celebrate";
  const sleep = mood === "sleep";
  const calm = mood === "calm";
  const ticket = mood === "ticket";

  return (
    <svg
      viewBox="0 0 240 250"
      fill="none"
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={className}
    >
      {celebrate && (
        <g className="spark">
          <path d="M28 62L38 48L42 66L56 62" stroke="#F24B3F" strokeWidth="4" strokeLinecap="round" />
          <path d="M204 44L194 28L188 48L172 44" stroke="#E3A02D" strokeWidth="4" strokeLinecap="round" />
          <path d="M212 100L226 94M214 116L230 118" stroke="#F24B3F" strokeWidth="3.5" strokeLinecap="round" />
        </g>
      )}

      {/* shadow */}
      <ellipse cx="120" cy="226" rx="62" ry="10" fill="#262321" opacity="0.12" />

      {/* bread body */}
      <path
        d="M56 86C56 55 73 37 101 35C111 24 129 23 140 35C170 36 188 55 188 86V186C188 199 178 209 165 209H78C65 209 56 199 56 186V86Z"
        fill="#FFF1CA"
        stroke="#262321"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <path
        d="M74 87C74 64 85 51 105 49C113 41 127 41 136 49C157 50 169 64 169 87"
        stroke="#F6DFAE"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* face */}
      {sleep ? (
        <>
          <path d="M87 111C92 106 98 106 103 111" stroke="#262321" strokeWidth="5.5" strokeLinecap="round" />
          <path d="M137 111C142 106 148 106 153 111" stroke="#262321" strokeWidth="5.5" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="95" cy="109" r="6.5" fill="#262321" />
          <circle cx="145" cy="109" r="6.5" fill="#262321" />
          <circle cx="97" cy="106.5" r="2" fill="#FFFDF7" />
          <circle cx="147" cy="106.5" r="2" fill="#FFFDF7" />
        </>
      )}
      <circle cx="77" cy="128" r="8" fill="#FFD6DF" opacity="0.9" />
      <circle cx="163" cy="128" r="8" fill="#FFD6DF" opacity="0.9" />
      {sleep ? (
        <ellipse cx="120" cy="132" rx="5" ry="3.5" fill="#262321" />
      ) : (
        <path
          d={calm ? "M110 132C114 136 126 136 130 132" : "M107 128C113 140 127 140 133 128"}
          stroke="#262321"
          strokeWidth="5"
          strokeLinecap="round"
        />
      )}

      {/* arms */}
      {ticket ? (
        <>
          <path d="M57 132C38 124 28 104 34 92" stroke="#262321" strokeWidth="7" strokeLinecap="round" />
          <circle cx="34" cy="89" r="9" fill="#FFF1CA" stroke="#262321" strokeWidth="6" />
          <path d="M78 150C62 154 48 164 44 176" stroke="#262321" strokeWidth="7" strokeLinecap="round" />
          <circle cx="42" cy="178" r="9" fill="#FFF1CA" stroke="#262321" strokeWidth="6" />
          <g transform="rotate(-10 52 192)">
            <path
              d="M18 172h58v34l-5 4-5-4-5 4-5-4-5 4-5-4-5 4-5-4-5 4-5-4-5 4-5-4Z"
              fill="#F24B3F"
              stroke="#262321"
              strokeWidth="5"
              strokeLinejoin="round"
            />
            <path d="M28 184h36M28 194h26" stroke="#FFF1CA" strokeWidth="4" strokeLinecap="round" />
            <circle cx="68" cy="181" r="3" fill="#FFF1CA" />
          </g>
        </>
      ) : calm ? (
        <>
          <path d="M57 138C42 146 42 162 52 168" stroke="#262321" strokeWidth="7" strokeLinecap="round" />
          <path d="M187 138C202 146 202 162 192 168" stroke="#262321" strokeWidth="7" strokeLinecap="round" />
          <circle cx="52" cy="169" r="9" fill="#FFF1CA" stroke="#262321" strokeWidth="6" />
          <circle cx="192" cy="169" r="9" fill="#FFF1CA" stroke="#262321" strokeWidth="6" />
        </>
      ) : (
        <>
          <path d="M57 132C38 124 28 104 34 92" stroke="#262321" strokeWidth="7" strokeLinecap="round" />
          <path d="M187 132C206 124 216 104 210 92" stroke="#262321" strokeWidth="7" strokeLinecap="round" />
          <circle cx="34" cy="89" r="9" fill="#FFF1CA" stroke="#262321" strokeWidth="6" />
          <circle cx="210" cy="89" r="9" fill="#FFF1CA" stroke="#262321" strokeWidth="6" />
        </>
      )}

      {/* legs + shoes */}
      <path d="M92 207V221" stroke="#262321" strokeWidth="7" strokeLinecap="round" />
      <path d="M148 207V221" stroke="#262321" strokeWidth="7" strokeLinecap="round" />
      <path d="M78 222C78 215 84 211 92 211H102C106 211 108 214 108 218V226H86C81 226 78 225 78 222Z" fill="#F24B3F" stroke="#262321" strokeWidth="5" />
      <path d="M132 222C132 215 138 211 146 211H156C161 211 163 214 163 218V226H140C135 226 132 225 132 222Z" fill="#F24B3F" stroke="#262321" strokeWidth="5" />

      {celebrate && (
        <g className="spark delay-1">
          <path d="M198 172L210 160M210 172L198 160" stroke="#F24B3F" strokeWidth="4" strokeLinecap="round" />
          <path d="M30 166L18 154M18 166L30 154" stroke="#E3A02D" strokeWidth="3.5" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
