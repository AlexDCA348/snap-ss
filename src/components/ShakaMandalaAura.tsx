import type { CSSProperties } from 'react';
import type { CardSize } from '../game/cardSizes';
import { auraUrl } from '../game/auraAssets';

const MANDALA_RING = auraUrl('shaka/mandala-ring.svg');
const OUTER_NODES = 8;
const INNER_NODES = 6;

interface Props {
  size?: CardSize;
  /** outer = halo autour de la carte ; inner = mandala sur le portrait */
  placement?: 'outer' | 'inner';
  active?: boolean;
}

function scaleForSize(size: CardSize): number {
  if (size === 'xs') return 0.7;
  if (size === 'sm') return 0.84;
  return 1;
}

/** Mandala cosmique de Shaka — anneaux flous en rotation autour de la carte. */
export function ShakaMandalaAura({
  size = 'md',
  placement = 'outer',
  active = true,
}: Props) {
  if (!active) return null;

  const scale = scaleForSize(size);
  const style = { '--shaka-s': scale } as CSSProperties;

  if (placement === 'inner') {
    return (
      <div
        aria-hidden
        className="shaka-mandala shaka-mandala--inner absolute inset-0 z-[1] pointer-events-none overflow-visible rounded-xl"
        style={style}
      >
        <div className="shaka-mandala__inner-veil" />
        <div className="shaka-mandala__orbit shaka-mandala__orbit--inner-fast">
          <div className="shaka-mandala__ring-sprite shaka-mandala__ring-sprite--inner" />
        </div>
        <div className="shaka-mandala__core" />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className="shaka-mandala shaka-mandala--outer absolute z-0 pointer-events-none overflow-visible"
      style={style}
    >
      <div className="shaka-mandala__haze" />
      <div className="shaka-mandala__orbit shaka-mandala__orbit--outer">
        <div className="shaka-mandala__ring-sprite" />
        <div className="shaka-mandala__ring-track">
          {Array.from({ length: OUTER_NODES }, (_, i) => (
            <span
              key={i}
              className="shaka-mandala__seal shaka-mandala__seal--outer"
              style={{ '--node-i': i } as CSSProperties}
            />
          ))}
        </div>
      </div>
      <div className="shaka-mandala__orbit shaka-mandala__orbit--mid">
        <div className="shaka-mandala__ring-track shaka-mandala__ring-track--mid">
          {Array.from({ length: INNER_NODES }, (_, i) => (
            <span
              key={i}
              className="shaka-mandala__seal shaka-mandala__seal--mid"
              style={{ '--node-i': i, '--node-total': INNER_NODES } as CSSProperties}
            />
          ))}
        </div>
      </div>
      <div className="shaka-mandala__halo" />
    </div>
  );
}

export { MANDALA_RING };
