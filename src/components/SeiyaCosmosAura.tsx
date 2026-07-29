import type { CSSProperties } from 'react';
import { seiyaCosmosAnimSpeed, seiyaCosmosIntensity } from '../game/seiyaCosmos';
import type { CardSize } from '../game/cardSizes';

interface Props {
  power: number;
  size?: CardSize;
  /** inner = fond carte ; front = lueur devant le perso ; outer = halo autour de la carte */
  placement?: 'inner' | 'front' | 'outer';
}

const PLUME_SLOTS = [
  { x: 18, y: 48, s: 0.85, delay: 0 },
  { x: 72, y: 42, s: 0.75, delay: 0.4 },
  { x: 34, y: 28, s: 0.65, delay: 0.8 },
  { x: 62, y: 22, s: 0.7, delay: 1.1 },
] as const;

const FLAME_SLOTS = [
  { x: 38, h: 48, delay: 0 },
  { x: 50, h: 58, delay: 0.25 },
  { x: 62, h: 44, delay: 0.5 },
] as const;

function auraStyle(power: number): CSSProperties {
  const intensity = seiyaCosmosIntensity(power);
  const speed = seiyaCosmosAnimSpeed(power);
  return {
    '--seiya-i': intensity,
    '--seiya-power': power,
    '--seiya-speed': speed,
  } as CSSProperties;
}

/** Cosmos bleu — brume floue corrélée à la puissance. */
export function SeiyaCosmosAura({
  power,
  size = 'md',
  placement = 'inner',
}: Props) {
  const plumeCount = size === 'xs' ? 2 : size === 'sm' ? 3 : 4;

  if (placement === 'outer') {
    return (
      <div
        aria-hidden
        className="seiya-cosmos seiya-cosmos--outer absolute z-0 pointer-events-none overflow-visible"
        style={auraStyle(power)}
      >
        <div className="seiya-cosmos__halo" />
        <div className="seiya-cosmos__mist seiya-cosmos__mist--deep" />
        <div className="seiya-cosmos__glow-col" />
      </div>
    );
  }

  if (placement === 'front') {
    return (
      <div
        aria-hidden
        className="seiya-cosmos seiya-cosmos--front absolute inset-0 z-[5] pointer-events-none overflow-hidden rounded-xl"
        style={auraStyle(power)}
      >
        {PLUME_SLOTS.slice(0, plumeCount).map((slot, i) => (
          <span
            key={i}
            className="seiya-cosmos__plume"
            style={
              {
                '--plume-x': `${slot.x}%`,
                '--plume-y': `${slot.y}%`,
                '--plume-s': slot.s,
                '--plume-delay': `${slot.delay}s`,
              } as CSSProperties
            }
          />
        ))}
        <div className="seiya-cosmos__core seiya-cosmos__core--front" />
        <div className="seiya-cosmos__rim" />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className="seiya-cosmos seiya-cosmos--inner absolute inset-0 z-[1] pointer-events-none overflow-hidden rounded-xl"
      style={auraStyle(power)}
    >
      <div className="seiya-cosmos__void" />
      <div className="seiya-cosmos__mist seiya-cosmos__mist--deep" />
      <div className="seiya-cosmos__mist seiya-cosmos__mist--bright" />
      {FLAME_SLOTS.map((slot, i) => (
        <span
          key={i}
          className="seiya-cosmos__flame"
          style={
            {
              '--flame-x': slot.x,
              '--flame-h': slot.h,
              '--flame-delay': `${slot.delay}s`,
            } as CSSProperties
          }
        />
      ))}
      <div className="seiya-cosmos__glow-col" />
      <div className="seiya-cosmos__glow-base" />
      <div className="seiya-cosmos__core" />
    </div>
  );
}
