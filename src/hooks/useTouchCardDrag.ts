import { useCallback, useEffect, useRef, useState } from 'react';
import type { LocationIndex } from '../game/types';

const DRAG_THRESHOLD_PX = 8;

export interface TouchDragState {
  uid: string;
  x: number;
  y: number;
}

function laneAtPoint(x: number, y: number): LocationIndex | null {
  const stack = document.elementsFromPoint(x, y);
  for (const el of stack) {
    const lane = el.closest('[data-lane-index]');
    if (!lane) continue;
    const idx = Number(lane.getAttribute('data-lane-index'));
    if (idx === 0 || idx === 1 || idx === 2) return idx;
  }
  return null;
}

interface Session {
  uid: string;
  startX: number;
  startY: number;
  dragging: boolean;
  pointerId: number;
  cleanup: () => void;
}

interface Options {
  enabled: boolean;
  onDragStart: (uid: string) => void;
  onDragEnd: () => void;
  onDrop: (uid: string, lane: LocationIndex) => void;
  onTap: (uid: string) => void;
}

export function useTouchCardDrag({
  enabled,
  onDragStart,
  onDragEnd,
  onDrop,
  onTap,
}: Options) {
  const [drag, setDrag] = useState<TouchDragState | null>(null);
  const [hoverLane, setHoverLane] = useState<LocationIndex | null>(null);
  const session = useRef<Session | null>(null);

  const endSession = useCallback(() => {
    session.current?.cleanup();
    session.current = null;
    setDrag(null);
    setHoverLane(null);
    document.body.classList.remove('touch-card-dragging');
  }, []);

  useEffect(() => {
    if (!enabled) endSession();
  }, [enabled, endSession]);

  useEffect(() => () => endSession(), [endSession]);

  const onPointerDown = useCallback(
    (uid: string, e: React.PointerEvent<HTMLElement>) => {
      if (!enabled || e.button !== 0) return;

      e.preventDefault();
      e.stopPropagation();

      endSession();

      const onMove = (ev: PointerEvent) => {
        const s = session.current;
        if (!s || ev.pointerId !== s.pointerId) return;

        const dist = Math.hypot(ev.clientX - s.startX, ev.clientY - s.startY);
        if (!s.dragging && dist >= DRAG_THRESHOLD_PX) {
          s.dragging = true;
          document.body.classList.add('touch-card-dragging');
          onDragStart(s.uid);
        }

        if (!s.dragging) return;

        ev.preventDefault();
        setDrag({ uid: s.uid, x: ev.clientX, y: ev.clientY });
        setHoverLane(laneAtPoint(ev.clientX, ev.clientY));
      };

      const onUp = (ev: PointerEvent) => {
        const s = session.current;
        if (!s || ev.pointerId !== s.pointerId) return;

        if (s.dragging) {
          const lane = laneAtPoint(ev.clientX, ev.clientY);
          if (lane !== null) onDrop(s.uid, lane);
          onDragEnd();
        } else {
          onTap(s.uid);
        }

        endSession();
      };

      const cleanup = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.removeEventListener('pointercancel', onUp);
      };

      document.addEventListener('pointermove', onMove, { passive: false });
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onUp);

      session.current = {
        uid,
        startX: e.clientX,
        startY: e.clientY,
        dragging: false,
        pointerId: e.pointerId,
        cleanup,
      };
    },
    [enabled, onDragStart, onDragEnd, onDrop, onTap, endSession],
  );

  return {
    drag,
    hoverLane,
    onPointerDown,
  };
}
