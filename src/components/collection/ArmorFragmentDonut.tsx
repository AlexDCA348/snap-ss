import type { Faction } from '../../game/types';
import type { FragmentSlotViewModel } from '../../collection/viewModels';

const SEGMENTS = 6;
const GAP_DEG = 2.5;
const SEGMENT_DEG = (360 - SEGMENTS * GAP_DEG) / SEGMENTS;
const START_OFFSET = -90;

const FACTION_FRAGMENT_COLORS: Record<
  Faction,
  { owned: string; track: string; glow: string }
> = {
  bronze: { owned: '#d4af37', track: 'rgba(212, 175, 55, 0.14)', glow: 'rgba(212, 175, 55, 0.45)' },
  black: { owned: '#475569', track: 'rgba(71, 85, 105, 0.2)', glow: 'rgba(100, 116, 139, 0.35)' },
  silver: { owned: '#94a3b8', track: 'rgba(148, 163, 184, 0.14)', glow: 'rgba(148, 163, 184, 0.4)' },
  gold: { owned: '#fbbf24', track: 'rgba(251, 191, 36, 0.14)', glow: 'rgba(251, 191, 36, 0.45)' },
  specter: { owned: '#c084fc', track: 'rgba(192, 132, 252, 0.14)', glow: 'rgba(192, 132, 252, 0.4)' },
  marina: { owned: '#22d3ee', track: 'rgba(34, 211, 238, 0.14)', glow: 'rgba(34, 211, 238, 0.4)' },
  asgard: { owned: '#7dd3fc', track: 'rgba(125, 211, 252, 0.14)', glow: 'rgba(125, 211, 252, 0.4)' },
  god: { owned: '#fb7185', track: 'rgba(251, 113, 133, 0.14)', glow: 'rgba(251, 113, 133, 0.4)' },
  neutral: { owned: '#cbd5e1', track: 'rgba(203, 213, 225, 0.12)', glow: 'rgba(203, 213, 225, 0.3)' },
};

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutSegmentPath(
  cx: number,
  cy: number,
  rOut: number,
  rIn: number,
  startDeg: number,
  endDeg: number,
) {
  const large = endDeg - startDeg > 180 ? 1 : 0;
  const o1 = polar(cx, cy, rOut, startDeg);
  const o2 = polar(cx, cy, rOut, endDeg);
  const i2 = polar(cx, cy, rIn, endDeg);
  const i1 = polar(cx, cy, rIn, startDeg);
  return [
    `M ${o1.x.toFixed(3)} ${o1.y.toFixed(3)}`,
    `A ${rOut} ${rOut} 0 ${large} 1 ${o2.x.toFixed(3)} ${o2.y.toFixed(3)}`,
    `L ${i2.x.toFixed(3)} ${i2.y.toFixed(3)}`,
    `A ${rIn} ${rIn} 0 ${large} 0 ${i1.x.toFixed(3)} ${i1.y.toFixed(3)}`,
    'Z',
  ].join(' ');
}

interface Props {
  fragments: FragmentSlotViewModel[];
  faction: Faction;
  className?: string;
}

/** Anneau de progression — 6 fragments autour du portrait armure. */
export function ArmorFragmentDonut({ fragments, faction, className = '' }: Props) {
  const palette = FACTION_FRAGMENT_COLORS[faction];
  const cx = 50;
  const cy = 50;
  const rOut = 48;
  const rIn = 39;

  return (
    <svg
      viewBox="0 0 100 100"
      className={['armor-fragment-donut absolute inset-0 w-full h-full pointer-events-none', className].join(' ')}
      aria-hidden
    >
      {fragments.map((slot, index) => {
        const start = START_OFFSET + index * (SEGMENT_DEG + GAP_DEG);
        const end = start + SEGMENT_DEG;
        const owned = slot.owned;
        return (
          <path
            key={slot.type}
            d={donutSegmentPath(cx, cy, rOut, rIn, start, end)}
            fill={owned ? palette.owned : palette.track}
            stroke={owned ? palette.glow : 'rgba(255,255,255,0.06)'}
            strokeWidth={owned ? 0.6 : 0.35}
            className={owned ? 'armor-fragment-donut__seg--owned' : 'armor-fragment-donut__seg--missing'}
          />
        );
      })}
    </svg>
  );
}
