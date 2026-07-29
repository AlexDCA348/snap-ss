import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import type { Faction } from '../game/types';
import type { HoloMode } from '../hooks/useCardPointerVars';

const GALAXY_URL = `url(${import.meta.env.BASE_URL}textures/galaxy.png)`;

const holoRootStyle = {
  ['--holo-galaxy-url' as string]: GALAXY_URL,
} satisfies CSSProperties;

interface OverlayProps {
  faction: Faction;
  mode: HoloMode;
  faceDown?: boolean;
  interacting?: boolean;
}

/** Galaxy cosmos holofoil overlays (shine + glare). */
export function CardHoloOverlays({
  faction,
  mode,
  faceDown = false,
  interacting = false,
}: OverlayProps) {
  const effectiveMode: HoloMode = faceDown ? 'static' : mode;

  return (
    <div
      className={[
        'card-holo absolute inset-0 rounded-xl pointer-events-none',
        interacting ? 'card-holo--active' : '',
      ].join(' ')}
      style={holoRootStyle}
      data-faction={faction}
      data-holo-mode={effectiveMode}
      data-face-down={faceDown ? 'true' : undefined}
    >
      <div className="card-holo__galaxy" aria-hidden />
      <div className="card-holo__shine" aria-hidden />
      <div className="card-holo__glare" aria-hidden />
    </div>
  );
}

/** Full-card rotator wrapper (tilt + children). */
export const CardHoloRotator = forwardRef<
  HTMLDivElement,
  {
    style?: CSSProperties;
    interacting?: boolean;
    className?: string;
    children: ReactNode;
  } & HTMLAttributes<HTMLDivElement>
>(function CardHoloRotator(
  { style, interacting = false, className = '', children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={[
        'card-holo__rotator absolute inset-0 rounded-xl',
        interacting ? 'card-holo--active' : '',
        className,
      ].join(' ')}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
});
