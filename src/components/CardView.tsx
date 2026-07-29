import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { getCardDef } from '../game/cards';
import type { CardInstance, Faction, LocationIndex } from '../game/types';
import {
  canUseInteractiveHolo,
  useCardPointerVars,
  type HoloMode,
} from '../hooks/useCardPointerVars';
import { CARD_DIMENSIONS, type CardSize } from '../game/cardSizes';
import { CardFaceArtStack } from './CardFaceArtStack';
import { CardHoloOverlays, CardHoloRotator } from './CardHoloLayers';
import { HyogaIcePrisonAura } from './HyogaIcePrisonAura';
import { SeiyaCosmosAura } from './SeiyaCosmosAura';
import { AresDemonAura } from './AresDemonAura';
import { isContinuousVfxActive } from '../game/continuousVfx';
import { aresAuraClass, aresInfernoIntensity, isAresCard } from '../game/aresInferno';
import { isSeiyaCard, seiyaAuraClass, seiyaCosmosIntensity } from '../game/seiyaCosmos';
import { isSagaGalaxyActive } from '../game/sagaGalaxy';
import { isShakaMandalaActive } from '../game/shakaMandala';
import { SagaGalaxyAura } from './SagaGalaxyAura';
import { ShakaMandalaAura } from './ShakaMandalaAura';
import { useGame } from '../store/gameStore';

interface Props {
  card: CardInstance;
  faceDown?: boolean;
  /** Cost to display. If undefined, uses definition cost. */
  displayCost?: number;
  /** Masque le badge de coût (ex. pendant un drag). */
  hideCost?: boolean;
  /** Power to display. If undefined, falls back to card.basePower. */
  displayPower?: number;
  /** Mark base power changes (e.g. ongoing buff). +1 -> green, -1 -> red. */
  powerDelta?: number;
  /** Visual flag: shows grab cursor & adds hover lift. */
  draggable?: boolean;
  onClick?: () => void;
  /** Whether this card is currently affordable. */
  affordable?: boolean;
  size?: CardSize;
  selected?: boolean;
  /** Holo tilt + shine: interactive (desktop hand) or static shimmer. */
  holoMode?: HoloMode;
  /** Disable pointer-driven holo (e.g. during drag). */
  holoDisabled?: boolean;
  /**
   * Animations des effets de fond (holo, auras perso).
   * false = statique (plateau) ; true = forcé (carte sélectionnée) ; undefined = au survol.
   */
  animateCardEffects?: boolean;
  /** Lane gelée par Camus — coupe les effets continus sur les cartes du lieu. */
  laneSilenced?: boolean;
  /** Lieu du plateau — requis pour le mandala de Shaka (absent en main). */
  laneIndex?: LocationIndex;
  /** Carte dans la main du joueur (VFX Arès visible). */
  inHand?: boolean;
  /** Autorise les VFX (dragon, halos…) à dépasser le cadre de la carte. */
  effectOverflow?: boolean;
  /** Remplace l’identité visuelle (ex. illusion Saga déguisée). */
  displayDefId?: string;
  /** Badge « Illusion » pour le propriétaire de l’illusion. */
  showIllusionBadge?: boolean;
  /** Masque nom, faction et texte de capacité (main mobile). */
  hideIdentity?: boolean;
  /** VFX galaxie Saga (bluff synchronisé pour l’adversaire). */
  showGalaxyVfx?: boolean;
}

const FACTION_STYLE: Record<
  Faction,
  { ring: string; chip: string; tag: string }
> = {
  bronze: {
    ring: 'ring-bronze-400/70',
    chip: 'bg-bronze-500/30 text-bronze-400 border border-bronze-400/50',
    tag: 'Bronze',
  },
  black: {
    ring: 'ring-sky-300/50',
    chip: 'bg-sky-500/10 text-sky-200 border border-sky-300/40',
    tag: 'Noir',
  },
  silver: {
    ring: 'ring-steel-400/70',
    chip: 'bg-steel-500/30 text-steel-400 border border-steel-400/60',
    tag: 'Argent',
  },
  gold: {
    ring: 'ring-gold-400/80',
    chip: 'bg-gold-500/30 text-gold-400 border border-gold-400/60',
    tag: 'Or',
  },
  specter: {
    ring: 'ring-fuchsia-400/70',
    chip: 'bg-shadow-500/40 text-fuchsia-300 border border-fuchsia-400/50',
    tag: 'Spectre',
  },
  marina: {
    ring: 'ring-cyan-400/70',
    chip: 'bg-cyan-500/30 text-cyan-300 border border-cyan-400/50',
    tag: 'Marina',
  },
  asgard: {
    ring: 'ring-sky-300/70',
    chip: 'bg-sky-500/30 text-sky-200 border border-sky-300/50',
    tag: 'Asgard',
  },
  god: {
    ring: 'ring-rose-400/80',
    chip: 'bg-rose-500/30 text-rose-200 border border-rose-300/60',
    tag: 'Divin',
  },
  neutral: {
    ring: 'ring-white/20',
    chip: 'bg-white/5 text-white/70 border border-white/15',
    tag: 'Neutre',
  },
};

const BADGE: Record<
  CardSize,
  { cost: string; power: string; once: string; delta: string; deltaTop: string }
> = {
  xxs: {
    cost: 'w-4 h-4 text-[8px] top-0.5 left-0.5',
    power: 'w-4 h-4 text-[8px] top-0.5 right-0.5',
    once: 'w-3.5 h-3.5 text-[6px] top-5 left-0.5',
    delta: 'text-[6px] leading-[9px] px-0.5',
    deltaTop: '22px',
  },
  xs: {
    cost: 'w-5 h-5 text-[9px] top-0.5 left-0.5',
    power: 'w-5 h-5 text-[9px] top-0.5 right-0.5',
    once: 'w-4 h-4 text-[7px] top-6 left-0.5',
    delta: 'text-[7px] leading-[10px] px-1',
    deltaTop: '26px',
  },
  sm: {
    cost: 'w-6 h-6 text-[10px] top-1 left-1',
    power: 'w-6 h-6 text-[10px] top-1 right-1',
    once: 'w-5 h-5 text-[8px] top-8 left-1',
    delta: 'text-[9px] leading-[12px] px-1',
    deltaTop: '30px',
  },
  md: {
    cost: 'w-7 h-7 text-sm top-1 left-1',
    power: 'w-7 h-7 text-sm top-1 right-1',
    once: 'w-5 h-5 text-[9px] top-9 left-1',
    delta: 'text-[10px] leading-[14px] px-1.5',
    deltaTop: '34px',
  },
};

export function CardView({
  card,
  faceDown = false,
  displayCost,
  hideCost = false,
  displayPower,
  powerDelta = 0,
  draggable = false,
  onClick,
  affordable = true,
  size = 'md',
  selected = false,
  holoMode = 'static',
  holoDisabled = false,
  animateCardEffects,
  laneSilenced = false,
  laneIndex,
  effectOverflow = false,
  displayDefId,
  showIllusionBadge = false,
  showGalaxyVfx,
  hideIdentity = false,
  inHand = false,
}: Props) {
  const def = getCardDef(displayDefId ?? card.defId);
  const gameState = useGame((s) => s.state);
  const faction = FACTION_STYLE[def.faction];
  const cost = displayCost ?? def.cost;
  const power = displayPower ?? card.basePower;
  const effectiveDelta = power - def.power;
  const dims = CARD_DIMENSIONS[size];
  const badge = BADGE[size];

  const holoOff = holoDisabled || faceDown;
  const effectiveHoloMode: HoloMode =
    holoMode === 'interactive' && canUseInteractiveHolo('interactive') && !holoOff
      ? 'interactive'
      : 'static';

  const { rootRef, vars, interacting, pointerHandlers } = useCardPointerVars({
    mode: holoMode,
    disabled: holoOff,
  });

  const shouldAnimateEffects =
    animateCardEffects === false
      ? false
      : animateCardEffects === true
        ? true
        : interacting;

  const effectsClass = shouldAnimateEffects ? 'card-effects-animated' : '';

  if (faceDown) {
    return (
      <motion.div
        layout
        style={dims}
        className={[
          'card-view-root card-frame neon-border relative overflow-hidden',
          effectsClass,
        ].join(' ')}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cosmos-700 via-cosmos-800 to-shadow-700" />
        <CardHoloOverlays faction={def.faction} mode="static" faceDown interacting={interacting} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="display-font text-gold-400 text-2xl rotate-[-8deg] opacity-90">
            ★
          </div>
        </div>
        <div className="absolute inset-0 ring-1 ring-inset ring-gold-400/30 rounded-xl pointer-events-none" />
      </motion.div>
    );
  }

  const isBuffed = effectiveDelta > 0;
  const isDebuffed = effectiveDelta < 0;
  void powerDelta;

  const prevPowerRef = useRef(power);
  const [flash, setFlash] = useState<{
    kind: 'buff' | 'debuff';
    diff: number;
  } | null>(null);
  useEffect(() => {
    const prev = prevPowerRef.current;
    if (prev === power) return;
    const diff = power - prev;
    prevPowerRef.current = power;
    if (diff === 0) return;
    setFlash({ kind: diff > 0 ? 'buff' : 'debuff', diff });
    const aresBuff =
      diff > 0 && isAresCard(card.defId) && card.ownerId === 'player';
    const id = setTimeout(() => setFlash(null), aresBuff ? 1300 : 1000);
    return () => clearTimeout(id);
  }, [power, card.defId, card.ownerId]);

  const isSeiya = isSeiyaCard(card.defId);
  const isAres = isAresCard(card.defId);
  const isAlliedAres = isAres && card.ownerId === 'player';
  const continuousVfx = isContinuousVfxActive(card, laneSilenced);
  const aresSurge = flash?.kind === 'buff';
  const canAresVfx = isAlliedAres && (inHand || continuousVfx);
  const showAresEyes = canAresVfx && aresSurge;
  const isAresInferno = canAresVfx && power > 0;
  const seiyaIntensity =
    isSeiya && continuousVfx ? seiyaCosmosIntensity(power) : 0;
  const isSeiyaVfx = seiyaIntensity > 0;
  const aresIntensity =
    isAresInferno ? aresInfernoIntensity(power) : 0;
  const isAresVfx = isAresInferno || showAresEyes;
  const isShakaVfx =
    isShakaMandalaActive(gameState, card, laneIndex) && !faceDown;
  const isGalaxyLightVfx =
    (showGalaxyVfx ?? isSagaGalaxyActive(gameState, card, laneIndex)) && !faceDown;
  const allowEffectOverflow =
    effectOverflow || isSeiyaVfx || isAresVfx || isShakaVfx || isGalaxyLightVfx;

  const powerBallGradient = isAresVfx && (isBuffed || power > def.power)
    ? 'from-red-300 to-red-700 ring-red-200/80'
    : isSeiyaVfx && (isBuffed || power > def.power)
    ? 'from-sky-300 to-blue-600 ring-sky-200/80'
    : isBuffed
    ? 'from-emerald-300 to-emerald-600 ring-emerald-200/80'
    : isDebuffed
    ? 'from-rose-300 to-rose-600 ring-rose-200/80'
    : 'from-gold-400 to-gold-600 ring-gold-300/70';

  const powerBallShadow = isAresVfx
    ? `shadow-[0_0_${Math.round(28 + aresIntensity * 48)}px_rgba(239,68,68,${0.2 + aresIntensity * 0.28})]`
    : isSeiyaVfx
    ? `shadow-[0_0_${Math.round(28 + seiyaIntensity * 44)}px_rgba(56,189,248,${0.18 + seiyaIntensity * 0.22})]`
    : isBuffed
    ? 'shadow-[0_0_18px_rgba(16,185,129,0.85)]'
    : isDebuffed
    ? 'shadow-[0_0_18px_rgba(244,63,94,0.85)]'
    : 'shadow-gold';

  const cardAura = isAresVfx
    ? aresAuraClass(aresSurge)
    : isSeiyaVfx
    ? flash
      ? seiyaAuraClass(flash.kind)
      : seiyaAuraClass(isDebuffed ? 'debuff' : undefined)
    : flash
    ? flash.kind === 'buff'
      ? 'shadow-[0_0_36px_rgba(16,185,129,0.85)]'
      : 'shadow-[0_0_36px_rgba(244,63,94,0.85)]'
    : isBuffed
    ? 'shadow-[0_0_22px_rgba(16,185,129,0.45)]'
    : isDebuffed
    ? 'shadow-[0_0_22px_rgba(244,63,94,0.45)]'
    : '';

  const badgeZ = card.silenced ? 'z-30' : 'z-10';

  return (
    <motion.div
      layout
      style={dims}
      className={['card-view-root relative shrink-0 overflow-visible select-none', effectsClass].join(
        ' ',
      )}
    >
      {isSeiyaVfx ? <SeiyaCosmosAura power={power} size={size} placement="outer" /> : null}
      {isAresInferno ? (
        <AresDemonAura power={power} size={size} placement="outer" surge={aresSurge} />
      ) : null}
      {showAresEyes ? (
        <AresDemonAura
          power={power}
          size={size}
          placement="front"
          surge={aresSurge}
          showEyes
        />
      ) : null}
      {isShakaVfx ? <ShakaMandalaAura size={size} placement="outer" /> : null}
      {isGalaxyLightVfx ? <SagaGalaxyAura size={size} placement="outer" /> : null}
      <motion.button
      whileHover={{ y: draggable ? -6 : 0, scale: draggable ? 1.03 : 1 }}
      onClick={onClick}
      style={
        isAresVfx
          ? ({ '--ares-i': aresIntensity } as CSSProperties)
          : isSeiyaVfx
          ? ({ '--seiya-i': seiyaIntensity } as CSSProperties)
          : undefined
      }
      className={[
        'card-frame card-frame--holo neon-border text-left bg-gradient-to-br relative z-[1] w-full h-full ring-2',
        isAresVfx
          ? 'overflow-visible card-frame--ares-inferno'
          : isSeiyaVfx
          ? 'overflow-visible card-frame--seiya-cosmos'
          : isShakaVfx
            ? 'overflow-visible card-frame--shaka-mandala'
            : isGalaxyLightVfx
              ? 'overflow-visible card-frame--saga-galaxy'
              : allowEffectOverflow
            ? 'overflow-visible'
            : 'overflow-hidden',
        faction.ring,
        cardAura,
        affordable
          ? isAresVfx
            ? 'from-red-950/95 via-rose-950/92 to-black/95'
            : isSeiyaVfx
            ? 'from-slate-950/95 via-blue-950/92 to-indigo-950/95'
            : 'from-cosmos-800/95 via-cosmos-700/90 to-shadow-700/95'
          : 'from-cosmos-900/80 via-cosmos-900/80 to-shadow-700/80 grayscale opacity-70',
        selected ? 'outline outline-2 outline-cosmos-300' : '',
        draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-default',
      ].join(' ')}
      type="button"
    >
      <CardHoloRotator
        ref={rootRef}
        style={vars}
        interacting={interacting}
        {...pointerHandlers}
      >
        <CardFaceArtStack
          defId={def.id}
          faction={def.faction}
          nameInitial={def.name.charAt(0)}
          holoMode={effectiveHoloMode}
          interacting={interacting}
          displayPower={power}
          cardSize={size}
          continuousVfxActive={continuousVfx}
          shakaMandalaActive={isShakaVfx}
          aresInfernoActive={isAresInferno}
          aresSurge={aresSurge}
          showAresEyes={showAresEyes}
          effectOverflow={allowEffectOverflow}
        />
        {/* Cosmos cost (top-left) */}
      {!hideCost ? (
        <div
          className={[
            'absolute rounded-full bg-cosmos-500 ring-1 ring-cosmos-300 flex items-center justify-center font-bold shadow-cosmos',
            badgeZ,
            badge.cost,
          ].join(' ')}
        >
          {cost}
        </div>
      ) : null}
      {def.ability?.params?.oncePerGame ? (
        <div
          aria-label={
            card.abilityUsed
              ? 'Capacité épuisée'
              : 'Capacité utilisable une fois par partie'
          }
          className={[
            'absolute rounded-full flex items-center justify-center font-bold ring-1 transition',
            badgeZ,
            badge.once,
            card.abilityUsed
              ? 'bg-shadow-700/80 text-white/40 ring-white/20 line-through'
              : 'bg-gradient-to-br from-gold-300 to-gold-500 text-black ring-gold-200/80 shadow-gold',
          ].join(' ')}
        >
          1×
        </div>
      ) : null}
      <div
        className={[
          'absolute rounded-full bg-gradient-to-br ring-2 flex items-center justify-center font-bold text-white overflow-hidden transition-shadow duration-300',
          badgeZ,
          badge.power,
          powerBallGradient,
          powerBallShadow,
          effectiveDelta !== 0 ? 'animate-pulseGlow' : '',
        ].join(' ')}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={power}
            initial={{ y: -14, opacity: 0, scale: 1.6 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 14, opacity: 0, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 420, damping: 22 }}
            className="block"
          >
            {power}
          </motion.span>
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {effectiveDelta !== 0 ? (
          <motion.div
            key={`delta-${effectiveDelta}`}
            initial={{ y: -6, opacity: 0, scale: 0.6 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 6, opacity: 0, scale: 0.6 }}
            transition={{ type: 'spring', stiffness: 320, damping: 20 }}
            className={[
              'absolute right-0.5 rounded-full font-bold ring-1',
              badgeZ,
              badge.delta,
              isBuffed
                ? 'bg-emerald-500 text-white ring-emerald-200/90'
                : 'bg-rose-500 text-white ring-rose-200/90',
            ].join(' ')}
            style={{ top: badge.deltaTop }}
          >
            {isBuffed ? `+${effectiveDelta}` : effectiveDelta}
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AnimatePresence>
        {flash ? (
          <motion.div
            key={`flash-${flash.kind}-${flash.diff}-${power}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className={[
              'absolute inset-0 z-20 flex items-center justify-center pointer-events-none',
              flash.kind === 'buff'
                ? 'bg-emerald-500/25'
                : 'bg-rose-500/25',
            ].join(' ')}
          >
            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.55 }}
              animate={{ y: -10, opacity: 1, scale: 1 }}
              exit={{ y: -28, opacity: 0, scale: 1.4 }}
              transition={{
                type: 'spring',
                stiffness: 220,
                damping: 18,
              }}
              className={[
                'display-font font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]',
                size === 'md' ? 'text-4xl' : 'text-3xl',
                flash.kind === 'buff' ? 'text-emerald-200' : 'text-rose-200',
              ].join(' ')}
            >
              {flash.diff > 0 ? `+${flash.diff}` : flash.diff}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {card.silenced ? <HyogaIcePrisonAura size={size} /> : null}
      {!hideIdentity ? (
      <div
        className={[
          'absolute bottom-0 left-0 right-0 px-1.5 py-1 bg-gradient-to-t from-black/80 to-transparent',
          badgeZ,
        ].join(' ')}
      >
        <div className="display-font text-[11px] leading-tight text-white truncate flex items-center gap-1">
          <span className="truncate">{def.name}</span>
          {showIllusionBadge ? (
            <span className="shrink-0 text-[8px] px-1 py-0.5 rounded bg-violet-500/80 text-violet-100 uppercase tracking-wide">
              Illusion
            </span>
          ) : null}
        </div>
        {def.ability && size === 'md' && !showIllusionBadge ? (
          <div
            className={[
              'text-[9px] leading-tight mt-0.5 line-clamp-3',
              card.silenced
                ? 'text-ui-muted line-through decoration-cyan-300/70'
                : 'text-ui-muted',
            ].join(' ')}
          >
            {def.ability.text}
          </div>
        ) : null}
        <div
          className={`mt-0.5 inline-block text-[8px] px-1 rounded ${faction.chip} uppercase tracking-wider`}
        >
          {faction.tag}
        </div>
      </div>
      ) : null}
      </CardHoloRotator>
    </motion.button>
    </motion.div>
  );
}
