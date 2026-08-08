import { AnimatePresence, motion } from 'framer-motion';
import { useLayoutEffect, useMemo, useState } from 'react';
import type { DeathmaskSoulBurst } from '../game/deathmaskSouls';
import { auraUrl } from '../game/auraAssets';
import {
  measureCardCenter,
  measureLaneSlotViewport,
  measureViewportCenter,
} from '../game/vfxMeasure';
import type { LocationIndex } from '../game/types';

const SOUL_WISP = auraUrl('deathmask/soul-wisp.svg');
const ORBIT_GHOSTS_DESKTOP = 5;
const ORBIT_GHOSTS_COMPACT = 2;
const SPAWN_GHOSTS_DESKTOP = 3;
const SPAWN_GHOSTS_COMPACT = 1;

interface Props {
  bursts: DeathmaskSoulBurst[];
  compact?: boolean;
}

interface OrbitGhost {
  key: string;
  x: number;
  y: number;
  baseAngle: number;
  radius: number;
  delay: number;
}

interface FlyGhost {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  midX: number;
  midY: number;
  angle: number;
  delay: number;
}

interface SpawnGlow {
  key: string;
  x: number;
  y: number;
  delay: number;
}

interface BurstGeom {
  key: string;
  sourceX: number;
  sourceY: number;
  vortexLanes: LocationIndex[];
  orbits: OrbitGhost[];
  flyers: FlyGhost[];
  glows: SpawnGlow[];
}

function laneCardViewport(
  lane: LocationIndex,
  uid: string,
): { x: number; y: number } | null {
  const laneEl = document.querySelector(
    `[data-lane-index="${lane}"]`,
  ) as HTMLElement | null;
  if (!laneEl) return null;

  const rel = measureCardCenter(laneEl, uid);
  if (!rel) return null;

  const root = laneEl.getBoundingClientRect();
  return { x: root.left + rel.x, y: root.top + rel.y };
}

function laneZoneViewport(
  lane: LocationIndex,
  side: 'player' | 'ai',
): { x: number; y: number } | null {
  const laneEl = document.querySelector(
    `[data-lane-index="${lane}"]`,
  ) as HTMLElement | null;
  if (!laneEl) return null;

  const zone = laneEl.querySelector(
    `[data-lane-zone="${side}"]`,
  ) as HTMLElement | null;
  return measureViewportCenter(zone);
}

function measureBurst(burst: DeathmaskSoulBurst, compact: boolean): BurstGeom | null {
  const source =
    laneCardViewport(burst.sourceLane, burst.sourceUid) ??
    measureLaneSlotViewport(
      burst.sourceLane,
      burst.sourceSide,
      burst.sourceSlotIndex,
      compact,
    );
  if (!source) return null;

  const orbitCount = compact ? ORBIT_GHOSTS_COMPACT : ORBIT_GHOSTS_DESKTOP;
  const spawnGhosts = compact ? SPAWN_GHOSTS_COMPACT : SPAWN_GHOSTS_DESKTOP;

  const orbits: OrbitGhost[] = Array.from({ length: orbitCount }, (_, i) => ({
    key: `orbit-${i}`,
    x: source.x,
    y: source.y,
    baseAngle: (360 / orbitCount) * i - 90,
    radius: compact ? 42 + (i % 2) * 14 : 56 + (i % 2) * 18,
    delay: i * 0.08,
  }));

  const flyers: FlyGhost[] = [];
  const glows: SpawnGlow[] = [];
  const vortexLanes = new Set<LocationIndex>();

  burst.spawns.forEach((spawn, spawnIndex) => {
    const target =
      laneCardViewport(spawn.lane, spawn.soulUid) ??
      measureLaneSlotViewport(spawn.lane, spawn.side, spawn.slotIndex, compact);
    if (!target) return;

    vortexLanes.add(spawn.lane);

    glows.push({
      key: `glow-${spawn.soulUid}`,
      x: target.x,
      y: target.y,
      delay: 0.35 + spawnIndex * 0.1,
    });

    for (let g = 0; g < spawnGhosts; g += 1) {
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.hypot(dx, dy) || 1;
      const nx = -dy / dist;
      const ny = dx / dist;
      const spread = (g - (spawnGhosts - 1) / 2) * (compact ? 18 : 32);
      const midX = source.x + dx * 0.42 + nx * spread;
      const midY = source.y + dy * 0.32 + ny * spread - (compact ? 36 : 52);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;

      flyers.push({
        key: `${spawn.soulUid}-${g}`,
        x1: source.x + nx * spread * 0.35,
        y1: source.y + ny * spread * 0.35,
        x2: target.x,
        y2: target.y,
        midX,
        midY,
        angle,
        delay: 0.12 + spawnIndex * 0.11 + g * 0.07,
      });
    }
  });

  return {
    key: burst.sourceUid,
    sourceX: source.x,
    sourceY: source.y,
    vortexLanes: [...vortexLanes],
    orbits,
    flyers,
    glows,
  };
}

/** Cercles d'esprit — fantômes spirale + invocation d'âmes perdues. */
export function DeathmaskSoulsOverlay({ bursts, compact = false }: Props) {
  const [shots, setShots] = useState<BurstGeom[]>([]);

  const burstKey = useMemo(
    () => bursts.map((b) => b.sourceUid).join('|'),
    [bursts],
  );

  useLayoutEffect(() => {
    if (bursts.length === 0) {
      setShots([]);
      return;
    }

    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      const next = bursts
        .map((burst) => measureBurst(burst, compact))
        .filter((g): g is BurstGeom => g !== null);
      if (next.length > 0) setShots(next);
    };

    run();
    const raf = requestAnimationFrame(() => {
      run();
      requestAnimationFrame(run);
    });
    const timers = [48, 120, 240, 420].map((ms) => window.setTimeout(run, ms));
    window.addEventListener('resize', run);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      for (const timer of timers) window.clearTimeout(timer);
      window.removeEventListener('resize', run);
    };
  }, [burstKey, bursts, compact]);

  if (shots.length === 0) return null;

  return (
    <AnimatePresence>
      {shots.map((shot) => (
        <motion.div
          key={shot.key}
          aria-hidden
          className="deathmask-souls-overlay fixed inset-0 z-[100] pointer-events-none overflow-visible"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.span
            className="deathmask-souls__source-vortex"
            style={{ left: shot.sourceX, top: shot.sourceY }}
            initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
            animate={{ opacity: [0, 0.85, 0.55, 0], scale: [0.5, 1.15, 1.35, 1.5], rotate: 180 }}
            transition={{ duration: 2.1, ease: 'easeOut' }}
          />

          <motion.span
            className="deathmask-souls__source-core"
            style={{ left: shot.sourceX, top: shot.sourceY }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 0.95, 0.7, 0], scale: [0.6, 1.2, 1.45, 1.7] }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
          />

          {shot.orbits.map((ghost) => (
            <motion.img
              key={ghost.key}
              src={SOUL_WISP}
              alt=""
              draggable={false}
              className="deathmask-souls__wisp deathmask-souls__wisp--orbit"
              style={{ left: ghost.x, top: ghost.y, rotate: ghost.baseAngle }}
              initial={{ opacity: 0, scale: 0.35, x: ghost.radius, y: 0 }}
              animate={{
                opacity: [0, 0.92, 0.85, 0.45, 0],
                scale: [0.35, 0.95, 1.05, 0.9, 0.65],
                x: [
                  ghost.radius,
                  ghost.radius * 0.55,
                  -ghost.radius * 0.35,
                  -ghost.radius * 0.75,
                  0,
                ],
                y: [0, -ghost.radius * 0.35, -ghost.radius * 0.75, -ghost.radius * 1.05, -ghost.radius * 1.25],
                rotate: [
                  ghost.baseAngle,
                  ghost.baseAngle + 90,
                  ghost.baseAngle + 180,
                  ghost.baseAngle + 270,
                  ghost.baseAngle + 360,
                ],
              }}
              transition={{
                duration: 1.85,
                delay: ghost.delay,
                ease: [0.35, 0.05, 0.25, 1],
              }}
            />
          ))}

          {shot.flyers.map((fly) => (
            <motion.img
              key={fly.key}
              src={SOUL_WISP}
              alt=""
              draggable={false}
              className="deathmask-souls__wisp deathmask-souls__wisp--fly"
              style={{ left: fly.x1, top: fly.y1, rotate: fly.angle }}
              initial={{ opacity: 0, scale: 0.4, x: 0, y: 0 }}
              animate={{
                opacity: [0, 0.95, 0.88, 0.55, 0],
                scale: [0.4, 1, 0.95, 0.82, 0.55],
                x: [0, fly.midX - fly.x1, fly.x2 - fly.x1],
                y: [0, fly.midY - fly.y1, fly.y2 - fly.y1],
                rotate: [fly.angle, fly.angle + 40, fly.angle + 95],
              }}
              transition={{
                duration: 1.35,
                delay: fly.delay,
                ease: [0.42, 0, 0.2, 1],
              }}
            />
          ))}

          {shot.glows.map((glow) => (
            <motion.span
              key={glow.key}
              className="deathmask-souls__spawn-glow"
              style={{ left: glow.x, top: glow.y }}
              initial={{ opacity: 0, scale: 0.45 }}
              animate={{ opacity: [0, 0.95, 0.65, 0], scale: [0.45, 1.15, 1.35, 1.65] }}
              transition={{ duration: 0.75, delay: glow.delay, ease: 'easeOut' }}
            />
          ))}

          {shot.vortexLanes.map((lane) => {
            const veil =
              laneZoneViewport(lane, 'player') ?? laneZoneViewport(lane, 'ai');
            if (!veil) return null;
            return (
              <motion.span
                key={`veil-${lane}`}
                className="deathmask-souls__lane-veil"
                style={{ left: veil.x, top: veil.y }}
                initial={{ opacity: 0, scale: 0.7, rotate: 0 }}
                animate={{ opacity: [0, 0.55, 0.35, 0], scale: [0.7, 1.15, 1.25, 1.4], rotate: 120 }}
                transition={{ duration: 1.8, delay: 0.2, ease: 'easeOut' }}
              />
            );
          })}
        </motion.div>
      ))}
    </AnimatePresence>
  );
}
