import type { RefObject } from 'react';
import { boardCardSize, CARD_DIMENSIONS } from './cardSizes';
import type { PlayerId } from './types';

const SLOT_GAP_PX = 4;

export function measureCardCenter(
  container: HTMLElement,
  uid: string,
): { x: number; y: number } | null {
  const el = container.querySelector(
    `[data-lane-card="${uid}"]`,
  ) as HTMLElement | null;
  if (!el) return null;
  const root = container.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return {
    x: r.left + r.width / 2 - root.left,
    y: r.top + r.height / 2 - root.top,
  };
}

export function measureViewportCenter(
  el: HTMLElement | null,
): { x: number; y: number } | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    x: r.left + r.width / 2,
    y: r.top + r.height / 2,
  };
}

export function measureLaneSlotViewport(
  laneIndex: number,
  side: PlayerId,
  slotIndex: number,
  compact: boolean,
): { x: number; y: number } | null {
  const lane = document.querySelector(
    `[data-lane-index="${laneIndex}"]`,
  ) as HTMLElement | null;
  if (!lane) return null;

  const rel = measureSlotCenter(lane, side, slotIndex, compact);
  if (rel) {
    const root = lane.getBoundingClientRect();
    return { x: root.left + rel.x, y: root.top + rel.y };
  }

  const slot = lane.querySelector(
    `[data-lane-slot="${side}-${slotIndex}"]`,
  ) as HTMLElement | null;
  if (slot) return measureViewportCenter(slot);

  const zone = lane.querySelector(
    `[data-lane-zone="${side}"]`,
  ) as HTMLElement | null;
  if (!zone) return null;

  const cardSize = boardCardSize(compact);
  const dims = CARD_DIMENSIONS[cardSize];
  const zoneRect = zone.getBoundingClientRect();
  const rowWidth = 4 * dims.width + 3 * SLOT_GAP_PX;
  const startX = zoneRect.left + (zoneRect.width - rowWidth) / 2;
  return {
    x: startX + slotIndex * (dims.width + SLOT_GAP_PX) + dims.width / 2,
    y: zoneRect.top + zoneRect.height / 2,
  };
}

export function measureSlotCenter(
  container: HTMLElement,
  side: PlayerId,
  slotIndex: number,
  compact: boolean,
): { x: number; y: number } | null {
  const slot = container.querySelector(
    `[data-lane-slot="${side}-${slotIndex}"]`,
  ) as HTMLElement | null;
  if (slot) {
    const root = container.getBoundingClientRect();
    const r = slot.getBoundingClientRect();
    return {
      x: r.left + r.width / 2 - root.left,
      y: r.top + r.height / 2 - root.top,
    };
  }

  const zone = container.querySelector(
    `[data-lane-zone="${side}"]`,
  ) as HTMLElement | null;
  if (!zone) return null;

  const cardSize = boardCardSize(compact);
  const dims = CARD_DIMENSIONS[cardSize];
  const zoneRect = zone.getBoundingClientRect();
  const root = container.getBoundingClientRect();
  const rowWidth = 4 * dims.width + 3 * SLOT_GAP_PX;
  const startX = zoneRect.left + (zoneRect.width - rowWidth) / 2;
  const x =
    startX + slotIndex * (dims.width + SLOT_GAP_PX) + dims.width / 2 - root.left;
  const y = zoneRect.top + zoneRect.height / 2 - root.top;
  return { x, y };
}

export function scheduleVfxMeasure(
  containerRef: RefObject<HTMLElement | null>,
  measure: (container: HTMLElement) => void,
): () => void {
  const container = containerRef.current;
  if (!container) return () => {};

  let cancelled = false;
  const run = () => {
    if (cancelled || !containerRef.current) return;
    measure(containerRef.current);
  };

  run();
  const raf1 = requestAnimationFrame(() => {
    run();
    requestAnimationFrame(run);
  });
  const timer = window.setTimeout(run, 48);
  const ro = new ResizeObserver(run);
  ro.observe(container);
  window.addEventListener('resize', run);

  return () => {
    cancelled = true;
    cancelAnimationFrame(raf1);
    window.clearTimeout(timer);
    ro.disconnect();
    window.removeEventListener('resize', run);
  };
}
