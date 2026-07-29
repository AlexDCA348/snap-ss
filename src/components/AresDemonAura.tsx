import type { CSSProperties } from 'react';
import { auraUrl } from '../game/auraAssets';
import { aresInfernoAnimSpeed, aresInfernoIntensity } from '../game/aresInferno';
import type { CardSize } from '../game/cardSizes';

const DEMON_EYES = auraUrl('ares/demon-eyes.svg');

interface Props {
  power: number;
  size?: CardSize;
  placement?: 'inner' | 'front' | 'outer';
  surge?: boolean;
  showEyes?: boolean;
}

function auraStyle(power: number): CSSProperties {
  const intensity = aresInfernoIntensity(power);
  const speed = aresInfernoAnimSpeed(power);
  return {
    '--ares-i': intensity,
    '--ares-power': power,
    '--ares-speed': speed,
  } as CSSProperties;
}

/** Yeux démoniaques — flash bref au +1 (réf. portrait Arès). */
export function AresDemonEyes({
  size = 'md',
  power = 0,
}: {
  size?: CardSize;
  power?: number;
}) {
  const eyeScale = size === 'xs' ? 0.82 : size === 'sm' ? 0.94 : 1.08;

  return (
    <div
      aria-hidden
      className="ares-demon-eyes-layer ares-demon-eyes-layer--surge absolute inset-0 z-[22] pointer-events-none overflow-visible rounded-xl"
      style={
        {
          '--ares-eye-scale': eyeScale,
          '--ares-i': aresInfernoIntensity(power),
        } as CSSProperties
      }
    >
      <div className="ares-demon__eyes">
        <img
          src={DEMON_EYES}
          alt=""
          draggable={false}
          className="ares-demon__eyes-sprite"
        />
        <span className="ares-demon__glare" />
      </div>
    </div>
  );
}

/** Inferno rouge autour de la carte. */
export function AresDemonAura({
  power,
  size = 'md',
  placement = 'inner',
  surge = false,
  showEyes = false,
}: Props) {
  if (placement === 'front' && showEyes) {
    return <AresDemonEyes size={size} power={power} />;
  }

  if (placement === 'front') {
    return null;
  }

  if (placement === 'outer') {
    return (
      <div
        aria-hidden
        className="ares-inferno ares-inferno--outer absolute z-0 pointer-events-none overflow-visible"
        style={auraStyle(power)}
      >
        <div className="ares-inferno__halo" />
        <div className="ares-inferno__mist ares-inferno__mist--deep" />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className={[
        'ares-inferno ares-inferno--inner absolute inset-0 z-[1] pointer-events-none overflow-hidden rounded-xl',
        surge ? 'ares-inferno--surge' : '',
      ].join(' ')}
      style={auraStyle(power)}
    >
      <div className="ares-inferno__void" />
      <div className="ares-inferno__mist ares-inferno__mist--bright" />
      <div className="ares-inferno__lava" />
      <div className="ares-inferno__core" />
    </div>
  );
}
