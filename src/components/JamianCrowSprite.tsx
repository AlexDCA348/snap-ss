interface Props {
  /** Préfixe unique pour éviter les collisions de gradients SVG. */
  uid: string;
  className?: string;
}

/** Corbeau noir de Jamian — SVG inline (pas de requête réseau). */
export function JamianCrowSprite({ uid, className }: Props) {
  const wingL = `${uid}-wing-l`;
  const wingR = `${uid}-wing-r`;
  const body = `${uid}-body`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 48"
      fill="none"
      aria-hidden
      className={className}
      shapeRendering="geometricPrecision"
    >
      <defs>
        <linearGradient id={wingL} x1="100%" y1="50%" x2="0%" y2="50%">
          <stop offset="0%" stopColor="#020617" />
          <stop offset="45%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id={wingR} x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#020617" />
          <stop offset="45%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        <radialGradient id={body} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
      </defs>
      <path
        d="M30 24 C22 22 12 18 4 12 C8 16 14 20 20 22 C18 24 24 26 30 24 Z"
        fill={`url(#${wingL})`}
        stroke="#94a3b8"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
      <path
        d="M34 24 C42 22 52 18 60 12 C56 16 50 20 44 22 C46 24 40 26 34 24 Z"
        fill={`url(#${wingR})`}
        stroke="#94a3b8"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
      <ellipse
        cx="32"
        cy="26"
        rx="5"
        ry="7"
        fill={`url(#${body})`}
        stroke="#cbd5e1"
        strokeWidth="0.5"
      />
      <circle cx="32" cy="18" r="4.5" fill="#0f172a" stroke="#cbd5e1" strokeWidth="0.55" />
      <path d="M36 17 L42 15 L36 19 Z" fill="#475569" stroke="#e2e8f0" strokeWidth="0.35" />
      <circle cx="33.5" cy="17" r="1" fill="#e2e8f0" />
      <path
        d="M28 32 L24 40 L32 36 L40 40 L36 32 Z"
        fill="#1e293b"
        stroke="#64748b"
        strokeWidth="0.45"
        strokeLinejoin="round"
      />
    </svg>
  );
}
