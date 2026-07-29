import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react';

export type HoloMode = 'interactive' | 'static';

const DEFAULT_VARS: CSSProperties = {
  ['--posx' as string]: '50%',
  ['--posy' as string]: '50%',
  ['--rx' as string]: '0deg',
  ['--ry' as string]: '0deg',
};

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

import { matchesCoarsePointer } from './useCoarsePointer';
import { matchesCompactUi } from './useCompactUi';

/** True when pointer-driven tilt should be active. */
export function canUseInteractiveHolo(mode: HoloMode): boolean {
  if (mode !== 'interactive') return false;
  if (prefersReducedMotion()) return false;
  if (matchesCoarsePointer()) return false;
  if (matchesCompactUi()) return false;
  return true;
}

interface Options {
  mode: HoloMode;
  disabled?: boolean;
}

export function useCardPointerVars({ mode, disabled = false }: Options) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [vars, setVars] = useState<CSSProperties>(DEFAULT_VARS);
  const [interacting, setInteracting] = useState(false);

  const interactive = canUseInteractiveHolo(mode) && !disabled;

  const reset = useCallback(() => {
    setVars(DEFAULT_VARS);
    setInteracting(false);
  }, []);

  const updateFromEvent = useCallback(
    (clientX: number, clientY: number) => {
      const el = rootRef.current;
      if (!el || !interactive) return;
      const rect = el.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      const clampedX = Math.min(100, Math.max(0, x));
      const clampedY = Math.min(100, Math.max(0, y));
      const rx = ((clampedX - 50) / 50) * 12;
      const ry = ((50 - clampedY) / 50) * 12;
      setVars({
        ['--posx' as string]: `${clampedX}%`,
        ['--posy' as string]: `${clampedY}%`,
        ['--rx' as string]: `${rx.toFixed(2)}deg`,
        ['--ry' as string]: `${ry.toFixed(2)}deg`,
      });
      setInteracting(true);
    },
    [interactive],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent) => {
      if (!interactive) return;
      updateFromEvent(e.clientX, e.clientY);
    },
    [interactive, updateFromEvent],
  );

  const onPointerEnter = useCallback(
    (e: ReactPointerEvent) => {
      if (!interactive) return;
      updateFromEvent(e.clientX, e.clientY);
    },
    [interactive, updateFromEvent],
  );

  const onPointerLeave = useCallback(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    if (!interactive) reset();
  }, [interactive, reset]);

  return {
    rootRef,
    vars: interactive ? vars : DEFAULT_VARS,
    interacting: interactive && interacting,
    interactive,
    pointerHandlers: interactive
      ? {
          onPointerMove,
          onPointerEnter,
          onPointerLeave,
        }
      : {},
  };
}
