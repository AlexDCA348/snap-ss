import type { CSSProperties } from 'react';
import type { CardSize } from '../game/cardSizes';

import { auraUrl } from '../game/auraAssets';

const GALAXY_BURST = auraUrl('saga/galaxy-burst.svg');

const BEAM_RAYS = Array.from({ length: 16 }, (_, i) => ({
  angle: (360 / 16) * i + (i % 2 ? 5 : -5),
  length: 52 + (i % 4) * 8,
  width: 7 + (i % 3) * 3,
  delay: (i % 5) * 0.09,
}));

const MIST_RAYS = Array.from({ length: 12 }, (_, i) => ({
  angle: (360 / 12) * i + 15,
  length: 62 + (i % 3) * 10,
  width: 14 + (i % 4) * 6,
  delay: (i % 4) * 0.12,
}));

interface Props {
  size?: CardSize;
  /** outer = halo autour de la carte */
  placement?: 'outer';
  active?: boolean;
}

function scaleForSize(size: CardSize): number {
  if (size === 'xs') return 0.7;
  if (size === 'sm') return 0.84;
  return 1;
}

function renderRays(
  rays: typeof BEAM_RAYS,
  className: string,
) {
  return (
    <div className={className}>
      {rays.map((ray, i) => (
        <span
          key={i}
          className="saga-galaxy-aura__needle"
          style={
            {
              '--needle-a': `${ray.angle}deg`,
              '--needle-len': `${ray.length}%`,
              '--needle-w': `${ray.width}px`,
              '--needle-delay': `${ray.delay}s`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** Saga — rayons de lumière dorés, flous autour de la carte. */
export function SagaGalaxyAura({
  size = 'md',
  placement = 'outer',
  active = true,
}: Props) {
  if (!active || placement !== 'outer') return null;

  const scale = scaleForSize(size);
  const style = { '--saga-s': scale } as CSSProperties;

  return (
    <div
      aria-hidden
      className="saga-galaxy-aura saga-galaxy-aura--outer absolute z-0 pointer-events-none overflow-visible"
      style={style}
    >
      <div className="saga-galaxy-aura__cosmos" />

      <div className="saga-galaxy-aura__burst-wrap">
        <img
          src={GALAXY_BURST}
          alt=""
          draggable={false}
          className="saga-galaxy-aura__burst-img saga-galaxy-aura__burst-img--mist"
        />
        <img
          src={GALAXY_BURST}
          alt=""
          draggable={false}
          className="saga-galaxy-aura__burst-img saga-galaxy-aura__burst-img--ghost"
        />
        <img
          src={GALAXY_BURST}
          alt=""
          draggable={false}
          className="saga-galaxy-aura__burst-img"
        />
      </div>

      {renderRays(MIST_RAYS, 'saga-galaxy-aura__needles saga-galaxy-aura__needles--mist')}
      {renderRays(BEAM_RAYS, 'saga-galaxy-aura__needles saga-galaxy-aura__needles--beam')}

      <span className="saga-galaxy-aura__nova" />
      <span className="saga-galaxy-aura__core-glow" />
    </div>
  );
}

export { GALAXY_BURST };
