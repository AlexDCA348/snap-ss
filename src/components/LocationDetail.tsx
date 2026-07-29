import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { isLaneSilenced, isOnRevealDisabled } from '../game/abilities';
import {
  getLocationArtUrl,
  getLocationFallbackTheme,
} from '../game/locationArt';
import { isSiberiaLocation } from '../game/locationEffects';
import type { LocationIndex } from '../game/types';
import { useGame } from '../store/gameStore';
import { LocationEffectPanel } from './LocationEffectPanel';

export function LocationDetail() {
  const inspectedLane = useGame((s) => s.inspectedLane);
  const close = useGame((s) => s.inspectLocation);

  useEffect(() => {
    if (inspectedLane === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inspectedLane, close]);

  return (
    <AnimatePresence>
      {inspectedLane !== null ? (
        <Modal key={inspectedLane} laneIndex={inspectedLane} />
      ) : null}
    </AnimatePresence>
  );
}

function Modal({ laneIndex }: { laneIndex: LocationIndex }) {
  const close = useGame((s) => s.inspectLocation);
  const state = useGame((s) => s.state);
  const def = state.locations[laneIndex];
  const laneSilenced = isLaneSilenced(state, laneIndex);
  const onRevealDisabled = isOnRevealDisabled(state, laneIndex);
  const artUrl = getLocationArtUrl(def.id);
  const theme = getLocationFallbackTheme(def.id);
  const fallbackClass =
    theme === 'beach'
      ? 'bg-gradient-to-br from-cyan-900 via-teal-900 to-slate-900'
      : theme === 'dimension'
        ? 'bg-gradient-to-br from-violet-950 via-indigo-950 to-black'
        : theme === 'stone'
          ? 'bg-gradient-to-br from-stone-500 via-stone-700 to-stone-900'
          : theme === 'frozen'
            ? 'bg-gradient-to-br from-sky-300 via-blue-500 to-indigo-900'
            : theme === 'night'
              ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-black'
              : theme === 'chasm'
                ? 'bg-gradient-to-br from-teal-800 via-cyan-950 to-black'
                : 'bg-gradient-to-br from-cosmos-900 via-shadow-800 to-black';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => close(null)}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-label={`Lieu : ${def.name}`}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.85, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 10, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        className="relative w-[min(92vw,400px)] rounded-2xl border border-white/10 bg-gradient-to-br from-cosmos-800 via-cosmos-700/90 to-shadow-700 shadow-cosmos overflow-hidden"
      >
        <div className={`relative aspect-[16/9] w-full overflow-hidden ${fallbackClass}`}>
          {artUrl ? (
            <img
              src={artUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
          <div className="absolute bottom-0 left-0 right-0 px-4 py-3">
            <div className="display-font text-2xl text-gold-300 tracking-wider drop-shadow-lg">
              {def.name}
            </div>
          </div>
        </div>

        <div className="px-4 py-4 space-y-3">
          {laneSilenced ? (
            <p className="text-xs text-cyan-200/90 flex items-center gap-1.5">
              <span aria-hidden>❄</span>
              Effets continus muets dans ce lieu pour le moment.
            </p>
          ) : null}
          {onRevealDisabled ? (
            <p className="text-xs text-stone-200/90 flex items-center gap-1.5">
              <span aria-hidden>🛡</span>
              Les effets au révélé sont bloqués ici ce tour.
            </p>
          ) : null}
          {def.effect ? (
            <LocationEffectPanel
              effect={def.effect}
              muted={
                laneSilenced &&
                def.effect.kind === 'ongoing' &&
                !isSiberiaLocation(state, laneIndex)
              }
              expanded
            />
          ) : def.id === 'other-dimension' ? (
            <p className="text-sm text-white/70 leading-snug">
              Le pouvoir du lieu d&apos;origine a été scellé par le Grand Pope.
              Aucun effet de lieu ne s&apos;applique ici.
            </p>
          ) : def.id === 'no-effect-zone' ? (
            <p className="text-sm text-white/70 leading-snug">
              La Marine de l&apos;Aigle a neutralisé ce lieu. Aucun effet de lieu
              ne s&apos;applique ici.
            </p>
          ) : (
            <p className="text-sm text-white/60">Aucun effet spécial sur ce lieu.</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
