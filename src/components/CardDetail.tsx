import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { getCardDef } from '../game/cards';
import {
  computeOngoing,
  effectivePower,
} from '../game/abilities';
import { resolveSagaCardPresentation } from '../game/sagaIllusion';
import type { CardInstance, Faction, LocationIndex } from '../game/types';
import { useGame } from '../store/gameStore';
import { CardFaceArtStack } from './CardFaceArtStack';
import { canUseInteractiveHolo } from '../hooks/useCardPointerVars';

const FACTION_LABEL: Record<Faction, { label: string; tint: string; panel: string }> = {
  bronze: { label: 'Bronze', tint: 'text-bronze-400 border-bronze-400/60', panel: 'from-bronze-500/30 via-cosmos-800/95 to-shadow-700/95' },
  black: { label: 'Noir', tint: 'text-sky-200 border-sky-300/50', panel: 'from-slate-600/30 via-cosmos-800/95 to-shadow-700/95' },
  silver: { label: 'Argent', tint: 'text-steel-400 border-steel-400/60', panel: 'from-steel-500/30 via-cosmos-800/95 to-shadow-700/95' },
  gold: { label: 'Or', tint: 'text-gold-400 border-gold-400/60', panel: 'from-gold-500/30 via-cosmos-800/95 to-shadow-700/95' },
  specter: { label: 'Spectre', tint: 'text-fuchsia-300 border-fuchsia-400/60', panel: 'from-fuchsia-500/30 via-cosmos-800/95 to-shadow-700/95' },
  marina: { label: 'Marina', tint: 'text-cyan-300 border-cyan-400/60', panel: 'from-cyan-500/30 via-cosmos-800/95 to-shadow-700/95' },
  asgard: { label: 'Asgard', tint: 'text-sky-200 border-sky-300/60', panel: 'from-sky-500/30 via-cosmos-800/95 to-shadow-700/95' },
  god: { label: 'Divin', tint: 'text-rose-200 border-rose-300/60', panel: 'from-rose-500/30 via-cosmos-800/95 to-shadow-700/95' },
  neutral: { label: 'Neutre', tint: 'text-white/70 border-white/20', panel: 'from-slate-400/20 via-cosmos-800/95 to-shadow-700/95' },
};

export function CardDetail() {
  const inspectedUid = useGame((s) => s.inspectedUid);
  const close = useGame((s) => s.inspectCard);

  useEffect(() => {
    if (!inspectedUid) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inspectedUid, close]);

  return (
    <AnimatePresence>
      {inspectedUid ? <Modal key={inspectedUid} uid={inspectedUid} /> : null}
    </AnimatePresence>
  );
}

function Modal({ uid }: { uid: string }) {
  const close = useGame((s) => s.inspectCard);
  const state = useGame((s) => s.state);
  const found = findCardByUid(state, uid);
  if (!found) return null;
  const { card, lane } = found;
  const ongoing = computeOngoing(state);
  const viewerId = 'player' as const;
  const presentation = resolveSagaCardPresentation(
    card,
    viewerId,
    state,
    ongoing,
    lane ?? undefined,
  );
  const displayDefId = presentation?.defId;
  const def = getCardDef(displayDefId ?? card.defId);
  const faction = FACTION_LABEL[def.faction];
  const currentPower =
    presentation?.displayPower ?? effectivePower(card, ongoing);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={() => close(null)}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-label={`D\u00e9tail : ${def.name}`}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.85, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 10, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        className={[
          'relative w-[min(92vw,420px)] rounded-2xl border border-white/10 bg-gradient-to-br shadow-cosmos overflow-hidden',
          faction.panel,
        ].join(' ')}
      >
        {/* Big art with cost / power overlay */}
        <div className="relative aspect-[3/4] w-full overflow-hidden card-frame--holo">
          <CardFaceArtStack
            defId={def.id}
            faction={def.faction}
            nameInitial={def.name.charAt(0)}
            holoMode={
              canUseInteractiveHolo('interactive') ? 'interactive' : 'static'
            }
          />
          <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
            <div className="display-font text-2xl text-white tracking-wider">
              {def.name}
            </div>
            <div className="mt-1">
              <span
                className={`inline-block text-[10px] px-2 py-0.5 rounded border uppercase tracking-widest ${faction.tint}`}
              >
                {faction.label}
              </span>
              {presentation?.showIllusionBadge ? (
                <span className="ml-2 inline-block text-[10px] px-2 py-0.5 rounded border uppercase tracking-widest text-violet-200 border-violet-300/60 bg-violet-500/10">
                  Illusion
                </span>
              ) : null}
              {card.silenced ? (
                <span className="ml-2 inline-block text-[10px] px-2 py-0.5 rounded border uppercase tracking-widest text-cyan-200 border-cyan-300/60 bg-cyan-500/10">
                  Silencié
                </span>
              ) : null}
              {def.ability?.params?.oncePerGame ? (
                <span
                  className={[
                    'ml-2 inline-block text-[10px] px-2 py-0.5 rounded border uppercase tracking-widest',
                    card.abilityUsed
                      ? 'text-white/50 border-white/20 bg-white/5 line-through'
                      : 'text-gold-200 border-gold-300/60 bg-gold-500/10',
                  ].join(' ')}
                >
                  1×
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 bg-black/15 backdrop-blur-md">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Stat label="Coût" value={def.cost} accent="cosmos" />
            <Stat label="Puissance" value={currentPower} accent="gold" />
          </div>

          {presentation?.showIllusionBadge ? (
            <p className="text-xs text-violet-200/90">
              Jeton d’illusion — 0 puissance réelle. L’adversaire voit un second
              Saga des Gémeaux.
            </p>
          ) : null}

          {def.ability ? (
            <div className="rounded-lg border border-cosmos-400/30 bg-cosmos-500/10 p-3">
              <div className="text-[10px] uppercase tracking-widest text-ui-muted">
                {def.ability.kind === 'on-reveal'
                  ? 'Au révélé'
                  : def.ability.kind === 'end-reveal'
                    ? 'Fin de révélation'
                    : def.ability.kind === 'on-destroy'
                      ? 'À la destruction'
                      : 'Continu'}
              </div>
              <div
                className={[
                  'mt-1 text-sm leading-snug',
                  card.silenced ? 'text-white/50 line-through decoration-cyan-300/70' : 'text-white',
                ].join(' ')}
              >
                {def.ability.text}
              </div>
            </div>
          ) : (
            <div className="text-ui-muted italic text-sm">
              Aucune capacité.
            </div>
          )}

        </div>

        <button
          type="button"
          onClick={() => close(null)}
          aria-label="Fermer"
          className="mx-4 mb-4 mt-1 h-12 w-[calc(100%-2rem)] rounded-full bg-black/55 hover:bg-black/75 text-white/80 hover:text-white ring-1 ring-white/15 transition flex items-center justify-center text-3xl"
        >
          ×
        </button>
      </motion.div>
    </motion.div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: 'cosmos' | 'gold';
}) {
  return (
    <div
      className={[
        'rounded-lg border px-3 py-2',
        accent === 'cosmos'
          ? 'border-cosmos-400/40 bg-cosmos-500/10'
          : 'border-gold-400/40 bg-gold-500/10',
      ].join(' ')}
    >
      <div className="text-[10px] uppercase tracking-widest text-white/60">
        {label}
      </div>
      <div className="display-font text-2xl text-white">{value}</div>
    </div>
  );
}

function findCardByUid(
  state: any,
  uid: string,
): { card: CardInstance; lane: LocationIndex | null } | null {
  // lanes
  for (const l of [0, 1, 2] as LocationIndex[]) {
    for (const c of state.lanes[l].cards.player) if (c.uid === uid) return { card: c, lane: l };
    for (const c of state.lanes[l].cards.ai) if (c.uid === uid) return { card: c, lane: l };
  }
  // pending + hand
  for (const l of [0, 1, 2] as LocationIndex[]) {
    for (const c of state.players.player.pending[l]) if (c.uid === uid) return { card: c, lane: l };
    for (const c of state.players.ai.pending[l]) if (c.uid === uid) return { card: c, lane: l };
  }
  for (const c of state.players.player.hand) if (c.uid === uid) return { card: c, lane: null };
  for (const c of state.players.ai.hand) if (c.uid === uid) return { card: c, lane: null };
  // deck (rare to inspect)
  for (const c of state.players.player.deck) if (c.uid === uid) return { card: c, lane: null };
  for (const c of state.players.ai.deck) if (c.uid === uid) return { card: c, lane: null };
  return null;
}
