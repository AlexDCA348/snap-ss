import type { Faction } from '../game/types';

/**
 * Procedural placeholder art per faction. Pure SVG, theme-friendly.
 * The sigil is a stylized constellation / mark that fits the cosmos vibe.
 */
export function CardSigil({
  faction,
  initial,
}: {
  faction: Faction;
  initial: string;
}) {
  const palette: Record<Faction, { bg1: string; bg2: string; mark: string }> = {
    bronze: { bg1: '#5b3a1f', bg2: '#a4612f', mark: '#f0c290' },
    black: { bg1: '#0b1020', bg2: '#1f2937', mark: '#93c5fd' },
    silver: { bg1: '#3a4458', bg2: '#7d8aa0', mark: '#e0e6f3' },
    gold: { bg1: '#5a3f0f', bg2: '#e6a82f', mark: '#fff4cc' },
    specter: { bg1: '#3a1240', bg2: '#7a2f7e', mark: '#f4baf6' },
    marina: { bg1: '#0e3a4a', bg2: '#2a8aab', mark: '#cdf3ff' },
    asgard: { bg1: '#163b58', bg2: '#5e9bd1', mark: '#e6f1ff' },
    god: { bg1: '#5a0d2a', bg2: '#cc3a64', mark: '#ffd6e0' },
    neutral: { bg1: '#2b2e3a', bg2: '#4b5563', mark: '#e5e7eb' },
  };
  const c = palette[faction];

  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full"
    >
      <defs>
        <radialGradient id={`sg-${faction}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={c.bg2} stopOpacity="0.95" />
          <stop offset="100%" stopColor={c.bg1} stopOpacity="0.95" />
        </radialGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#sg-${faction})`} />
      {/* Stars */}
      {STARS.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill={c.mark}
          opacity={s.o}
        />
      ))}
      {/* Constellation lines */}
      <polyline
        points="20,30 40,22 55,38 72,28 78,52"
        fill="none"
        stroke={c.mark}
        strokeOpacity="0.45"
        strokeWidth="0.7"
      />
      {/* Big initial */}
      <text
        x="50"
        y="64"
        textAnchor="middle"
        fontFamily="Cinzel, serif"
        fontSize="42"
        fontWeight="700"
        fill={c.mark}
        opacity="0.85"
      >
        {initial}
      </text>
      {/* Vignette */}
      <rect width="100" height="100" fill="url(#vignette)" opacity="0.55" />
      <defs>
        <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
          <stop offset="60%" stopColor="black" stopOpacity="0" />
          <stop offset="100%" stopColor="black" stopOpacity="0.7" />
        </radialGradient>
      </defs>
    </svg>
  );
}

const STARS = [
  { x: 12, y: 14, r: 0.9, o: 0.9 },
  { x: 28, y: 8, r: 0.6, o: 0.7 },
  { x: 45, y: 18, r: 0.7, o: 0.85 },
  { x: 62, y: 10, r: 0.9, o: 0.95 },
  { x: 80, y: 22, r: 0.7, o: 0.8 },
  { x: 92, y: 36, r: 0.6, o: 0.7 },
  { x: 18, y: 36, r: 0.5, o: 0.6 },
  { x: 36, y: 48, r: 0.6, o: 0.7 },
  { x: 70, y: 60, r: 0.5, o: 0.6 },
  { x: 88, y: 70, r: 0.7, o: 0.8 },
  { x: 14, y: 80, r: 0.9, o: 0.9 },
  { x: 50, y: 88, r: 0.6, o: 0.7 },
];
