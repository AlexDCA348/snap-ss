import { useCallback, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';

interface Options {
  onLongPress: () => void;
  onPress?: () => void;
  delayMs?: number;
  disabled?: boolean;
}

/**
 * Appui court → onPress ; maintien → onLongPress (inspecter une carte en main).
 */
export function useLongPress({
  onLongPress,
  onPress,
  delayMs = 480,
  disabled = false,
}: Options) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longFiredRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (disabled) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      longFiredRef.current = false;
      clearTimer();
      timerRef.current = setTimeout(() => {
        longFiredRef.current = true;
        onLongPress();
      }, delayMs);
    },
    [clearTimer, delayMs, disabled, onLongPress],
  );

  const cancel = useCallback(() => {
    clearTimer();
  }, [clearTimer]);

  const onClick = useCallback(() => {
    if (disabled) return;
    if (longFiredRef.current) {
      longFiredRef.current = false;
      return;
    }
    onPress?.();
  }, [disabled, onPress]);

  return {
    onPointerDown,
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onClick,
  };
}
