import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import {
  computeOngoing,
  effectivePower,
  isLaneSilenced,
  isOnRevealDisabled,
  isIndestructible,
  isProtected,
} from '../game/abilities';
import {
  getLocationArtUrl,
  getLocationFallbackTheme,
} from '../game/locationArt';
import { boardCardSize, CARD_DIMENSIONS, type CardSize } from '../game/cardSizes';
import { scoreSnapshot } from '../game/engine';
import { getLaneMaxCost, getLaneMinCost } from '../game/locationEffects';
import type {
  CardInstance,
  GameState,
  LocationDefinition,
  LocationIndex,
  PlayerId,
} from '../game/types';
import { LANE_CAPACITY } from '../game/types';
import { isAphroditeRosesActive } from '../game/aphroditeRoses';
import { resolveSagaCardPresentation } from '../game/sagaIllusion';
import { getCardDef } from '../game/cards';
import { isAthenaWaveActive } from '../game/athenaWave';
import { isCamusSnowLaneActive } from '../game/camusSnow';
import { isMuShieldLaneActive } from '../game/muShield';
import { isShunAuraActive } from '../game/shunAura';
import { useGame } from '../store/gameStore';
import { AiolosArrowOverlay } from './AiolosArrowOverlay';
import { AioliaPlasmaOverlay } from './AioliaPlasmaOverlay';
import { AldebaranImpactOverlay } from './AldebaranImpactOverlay';
import { AphroditeRoseAura } from './AphroditeRoseAura';
import { BabelFireballOverlay } from './BabelFireballOverlay';
import { CamusSnowAura } from './CamusSnowAura';
import { CardView } from './CardView';
import { MiloImpactOverlay } from './MiloImpactOverlay';
import { MuCrystalShieldAura } from './MuCrystalShieldAura';
import { PtolemyArrowOverlay } from './PtolemyArrowOverlay';
import { IchiClawOverlay } from './IchiClawOverlay';
import { CapellaDisksOverlay } from './CapellaDisksOverlay';
import { GuiltySacrificeOverlay } from './GuiltySacrificeOverlay';
import { HyogaFrostOverlay } from './HyogaFrostOverlay';
import { ShuraBladeOverlay } from './ShuraBladeOverlay';
import { ShunCosmosAura } from './ShunCosmosAura';

interface Props {
  state: GameState;
  laneIndex: LocationIndex;
  onDropCard: (uid: string, lane: LocationIndex) => void;
  onUnplay: (uid: string) => void;
  canDropPreview?: { uid: string; cost: number } | null;
  hoverLane?: LocationIndex | null;
  touchPlay?: boolean;
  compact?: boolean;
  mini?: boolean;
}

export function LocationView({
  state,
  laneIndex,
  onDropCard,
  onUnplay,
  canDropPreview,
  hoverLane = null,
  touchPlay = false,
  compact = false,
  mini = false,
}: Props) {
  const inspectCard = useGame((s) => s.inspectCard);
  const inspectLocation = useGame((s) => s.inspectLocation);
  const [hover, setHover] = useState(false);
  const def = state.locations[laneIndex];
  const lane = state.lanes[laneIndex];
  const snap = scoreSnapshot(state);
  const ongoing = computeOngoing(state);
  const playerPending = state.players.player.pending[laneIndex];
  const aiPending = state.players.ai.pending[laneIndex];

  const playerPower = snap.lanePower[laneIndex].player;
  const aiPower = snap.lanePower[laneIndex].ai;
  const playerWinning = playerPower > aiPower;
  const aiWinning = aiPower > playerPower;
  const laneTied = playerPower === aiPower;
  const laneSilenced = isLaneSilenced(state, laneIndex);
  const onRevealDisabled = isOnRevealDisabled(state, laneIndex);
  const laneMaxCost = getLaneMaxCost(state, laneIndex);
  const laneMinCost = getLaneMinCost(state, laneIndex);
  const hasLaneModifier =
    laneSilenced ||
    onRevealDisabled ||
    laneMaxCost !== null ||
    laneMinCost !== null;
  const dropHighlight =
    Boolean(canDropPreview) &&
    (hover || touchPlay || hoverLane === laneIndex);
  const laneCardSize = boardCardSize(compact, mini);
  const playerShunAura = isShunAuraActive(state, laneIndex, 'player');
  const aiShunAura = isShunAuraActive(state, laneIndex, 'ai');
  const muShieldLane = isMuShieldLaneActive(state, laneIndex);
  const aphroditeRoses = isAphroditeRosesActive(state, laneIndex);
  const camusSnow = isCamusSnowLaneActive(state, laneIndex);
  const athenaWave = isAthenaWaveActive(state);
  const laneRef = useRef<HTMLDivElement>(null);
  const ptolemyArrowBursts = useGame((s) => s.ptolemyArrowBursts);
  const miloImpactBursts = useGame((s) => s.miloImpactBursts);
  const aioliaPlasmaBursts = useGame((s) => s.aioliaPlasmaBursts);
  const babelFireballBursts = useGame((s) => s.babelFireballBursts);
  const aiolosArrowBursts = useGame((s) => s.aiolosArrowBursts);
  const shuraBladeBursts = useGame((s) => s.shuraBladeBursts);
  const aldebaranImpactBursts = useGame((s) => s.aldebaranImpactBursts);
  const ichiClawBursts = useGame((s) => s.ichiClawBursts);
  const capellaDiskBursts = useGame((s) => s.capellaDiskBursts);
  const guiltySacrificeBursts = useGame((s) => s.guiltySacrificeBursts);
  const hyogaFrostBursts = useGame((s) => s.hyogaFrostBursts);

  return (
    <div
      ref={laneRef}
      data-lane-index={laneIndex}
      onDragOver={(e) => {
        if (canDropPreview) e.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        const uid = e.dataTransfer.getData('text/uid');
        if (uid) onDropCard(uid, laneIndex);
      }}
      className={[
        'relative flex-1 rounded-lg sm:rounded-2xl border border-white/10 overflow-hidden flex flex-col min-w-0 min-h-0 select-none',
        compact ? 'h-auto self-stretch justify-between' : 'h-full',
        dropHighlight
          ? 'ring-2 ring-cosmos-400 shadow-cosmos cursor-pointer'
          : 'shadow-lg',
      ].join(' ')}
    >
      {canDropPreview && touchPlay ? (
        <button
          type="button"
          aria-label={`Jouer sur ${def.name}`}
          className="absolute inset-0 z-[15] rounded-lg sm:rounded-2xl touch-manipulation"
          onClick={() => onDropCard(canDropPreview.uid, laneIndex)}
        />
      ) : null}
      <LaneBackground
        location={def}
        petrified={onRevealDisabled}
        frozen={camusSnow}
        divine={athenaWave}
      />
      <AphroditeRoseAura active={aphroditeRoses} compact={compact} />
      <MuCrystalShieldAura active={muShieldLane} />
      <CamusSnowAura active={camusSnow} compact={compact} />

      {/* Zone cartes IA */}
      <div
        className={[
          compact
            ? 'relative z-10 shrink-0 flex flex-col overflow-hidden p-0.5'
            : 'relative z-10 flex-1 flex flex-col min-h-0 overflow-hidden p-2',
        ].join(' ')}
        data-stop-lane-play
      >
        <ShunCosmosAura active={aiShunAura} compact={compact} />
        <div
          className={
            compact
              ? 'relative z-10 shrink-0 flex flex-col overflow-hidden'
              : 'relative z-10 flex-1 flex flex-col min-h-0 overflow-hidden justify-center'
          }
        >
          <LaneCardZone
          side="ai"
          winning={aiWinning}
          compact={compact}
          cardSize={laneCardSize}
          revealed={lane.cards.ai}
          pending={aiPending}
          pendingFaceDown
          state={state}
          laneIndex={laneIndex}
          ongoing={ongoing}
          onInspect={inspectCard}
        />
        </div>
      </div>

      {/* Centre — scores, titre cliquable (effet en détail) */}
      <div
        data-stop-lane-play
        className={[
          'relative z-10 shrink-0',
          compact ? 'px-0.5 py-0.5' : 'px-2 py-2',
          onRevealDisabled ? 'ring-1 ring-stone-300/25' : '',
        ].join(' ')}
      >
        <div
          className={[
            'flex flex-col items-center min-w-0 relative',
            compact ? 'gap-0.5' : 'gap-1.5',
          ].join(' ')}
        >
          <PowerPill
            value={aiPower}
            winning={aiWinning}
            losing={!laneTied && playerWinning}
            owner="ai"
            compact={compact}
            aria="Puissance adverse"
          />
          <button
            type="button"
            onClick={() => inspectLocation(laneIndex)}
            className={[
              'group w-full text-center rounded-md transition-colors touch-manipulation',
              compact ? 'px-0.5 py-0.5 min-h-[26px]' : 'px-2 py-2 min-h-[44px] rounded-lg',
              'hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400/70',
            ].join(' ')}
            aria-label={`${def.name} — voir l'effet du lieu`}
          >
            <div
              className={[
                'display-font text-gold-300 truncate drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)] group-hover:text-gold-200',
                compact ? 'text-[8px] leading-tight' : 'text-sm md:text-base',
              ].join(' ')}
            >
              {def.name}
            </div>
            {hasLaneModifier ? (
              <div className="mt-0.5 flex justify-center gap-1">
                {laneSilenced ? (
                  <span
                    className="text-[9px] text-cyan-200/90"
                    title="Lieu muet"
                    aria-hidden
                  >
                    ❄
                  </span>
                ) : null}
                {onRevealDisabled ? (
                  <span
                    className="text-[9px] text-stone-200/90"
                    title="Au révélé bloqué"
                    aria-hidden
                  >
                    🛡
                  </span>
                ) : null}
                {laneMaxCost !== null ? (
                  <span
                    className="text-[9px] font-bold text-sky-100 bg-sky-500/30 ring-1 ring-sky-400/50 rounded px-1 leading-tight"
                    title={`Seules les cartes de coût ${laneMaxCost} ou moins peuvent être jouées ici`}
                  >
                    ≤{laneMaxCost}
                  </span>
                ) : null}
                {laneMinCost !== null ? (
                  <span
                    className="text-[9px] font-bold text-violet-100 bg-violet-500/30 ring-1 ring-violet-400/50 rounded px-1 leading-tight"
                    title={`Seules les cartes de coût ${laneMinCost} ou plus peuvent être jouées ici`}
                  >
                    ≥{laneMinCost}
                  </span>
                ) : null}
              </div>
            ) : null}
          </button>
          <PowerPill
            value={playerPower}
            winning={playerWinning}
            losing={!laneTied && aiWinning}
            owner="player"
            compact={compact}
            aria="Puissance alliée"
          />
        </div>
      </div>

      {/* Zone cartes joueur */}
      <div
        className={[
          compact
            ? 'relative z-10 shrink-0 flex flex-col overflow-hidden p-0.5'
            : 'relative z-10 flex-1 flex flex-col min-h-0 overflow-hidden p-2',
        ].join(' ')}
        data-stop-lane-play
      >
        <ShunCosmosAura active={playerShunAura} compact={compact} />
        <div
          className={
            compact
              ? 'relative z-10 shrink-0 flex flex-col overflow-hidden'
              : 'relative z-10 flex-1 flex flex-col min-h-0 overflow-hidden justify-center'
          }
        >
          <LaneCardZone
          side="player"
          winning={playerWinning}
          compact={compact}
          cardSize={laneCardSize}
          revealed={lane.cards.player}
          pending={playerPending}
          pendingFaceDown={state.phase === 'reveal'}
          state={state}
          laneIndex={laneIndex}
          ongoing={ongoing}
          onInspect={inspectCard}
          onUnplay={onUnplay}
        />
        </div>
      </div>

      <div className="lane-vfx-root" aria-hidden>
        <PtolemyArrowOverlay
          laneIndex={laneIndex}
          bursts={ptolemyArrowBursts}
          containerRef={laneRef}
        />
        <MiloImpactOverlay
          laneIndex={laneIndex}
          bursts={miloImpactBursts}
          containerRef={laneRef}
        />
        <AioliaPlasmaOverlay
          laneIndex={laneIndex}
          bursts={aioliaPlasmaBursts}
          containerRef={laneRef}
          compact={compact}
        />
        <BabelFireballOverlay
          laneIndex={laneIndex}
          bursts={babelFireballBursts}
          containerRef={laneRef}
          compact={compact}
        />
        <AiolosArrowOverlay
          laneIndex={laneIndex}
          bursts={aiolosArrowBursts}
          containerRef={laneRef}
          compact={compact}
        />
        <ShuraBladeOverlay
          laneIndex={laneIndex}
          bursts={shuraBladeBursts}
          containerRef={laneRef}
          compact={compact}
        />
        <AldebaranImpactOverlay
          laneIndex={laneIndex}
          bursts={aldebaranImpactBursts}
          containerRef={laneRef}
          compact={compact}
        />
        <IchiClawOverlay
          laneIndex={laneIndex}
          bursts={ichiClawBursts}
          containerRef={laneRef}
          compact={compact}
        />
        <CapellaDisksOverlay
          laneIndex={laneIndex}
          bursts={capellaDiskBursts}
          containerRef={laneRef}
          compact={compact}
        />
        <GuiltySacrificeOverlay
          laneIndex={laneIndex}
          bursts={guiltySacrificeBursts}
          containerRef={laneRef}
          compact={compact}
        />
        <HyogaFrostOverlay
          laneIndex={laneIndex}
          bursts={hyogaFrostBursts}
          containerRef={laneRef}
        />
      </div>
    </div>
  );
}

function LaneCardZone({
  side,
  winning,
  compact,
  cardSize,
  revealed,
  pending,
  pendingFaceDown = false,
  state,
  laneIndex,
  ongoing,
  onInspect,
  onUnplay,
}: {
  side: PlayerId;
  winning: boolean;
  compact: boolean;
  cardSize: ReturnType<typeof boardCardSize>;
  revealed: CardInstance[];
  pending: CardInstance[];
  pendingFaceDown?: boolean;
  state: GameState;
  laneIndex: LocationIndex;
  ongoing: ReturnType<typeof computeOngoing>;
  onInspect: (uid: string) => void;
  onUnplay?: (uid: string) => void;
}) {
  const andromedaBursts = useGame((s) => s.andromedaRelocateBursts);
  const shuraSummonBursts = useGame((s) => s.shuraSummonBursts);
  const dims = CARD_DIMENSIONS[cardSize];
  const occupied = [...revealed, ...pending];
  const slots = Array.from({ length: LANE_CAPACITY }, (_, i) => occupied[i] ?? null);

  const laneSilenced = isLaneSilenced(state, laneIndex);

  const slotBorder = winning
    ? side === 'player'
      ? 'border-cosmos-400/35'
      : 'border-rose-400/35'
    : 'border-black/40';

  return (
    <div
      data-lane-zone={side}
      className={[
        'flex flex-wrap justify-center content-center gap-1',
        compact ? 'p-0.5' : 'p-1',
      ].join(' ')}
    >
      {slots.map((card, index) => {
        const isPending = card !== null && pending.some((p) => p.uid === card.uid);
        const isRevealed = card !== null && revealed.some((r) => r.uid === card.uid);
        const isRelocating =
          card !== null &&
          isRevealed &&
          andromedaBursts.some(
            (b) => b.sourceUid === card.uid && b.sourceLane === laneIndex,
          );
        const isShuraSummoning =
          card !== null &&
          isRevealed &&
          shuraSummonBursts.some(
            (b) =>
              b.targetUid === card.uid &&
              b.lane === laneIndex &&
              b.targetSide === side,
          );

        return (
          <div
            key={card?.uid ?? `slot-${side}-${index}`}
            className="relative shrink-0 overflow-visible"
            style={{ width: dims.width, height: dims.height }}
            data-lane-card={isRevealed && card ? card.uid : undefined}
            data-lane-slot={`${side}-${index}`}
          >
            <div
              aria-hidden
              className={[
                'absolute inset-0 rounded-lg border border-dashed pointer-events-none',
                slotBorder,
                card ? 'opacity-0' : 'opacity-70',
              ].join(' ')}
            />
            <AnimatePresence mode="popLayout">
              {card && isRevealed ? (
                <div
                  className={[
                    'transition-opacity duration-150',
                    isRelocating || isShuraSummoning
                      ? 'opacity-0 pointer-events-none'
                      : 'opacity-100',
                  ].join(' ')}
                >
                  <CardSlot
                    key={card.uid}
                    card={card}
                    state={state}
                    ongoing={ongoing}
                    size={cardSize}
                    compact={compact}
                    laneIndex={laneIndex}
                    laneSilenced={laneSilenced}
                    effectOverflow
                    protectedByLane={isProtected(state, card, laneIndex)}
                    winningHere={winning}
                    onClick={() => onInspect(card.uid)}
                  />
                </div>
              ) : null}
              {card && isPending && pendingFaceDown ? (
                <CardSlot
                  key={`${card.uid}-facedown`}
                  card={card}
                  state={state}
                  ongoing={ongoing}
                  faceDown
                  size={cardSize}
                  compact={compact}
                  laneIndex={laneIndex}
                  laneSilenced={laneSilenced}
                />
              ) : null}
              {card && isPending && !pendingFaceDown ? (
                <motion.div
                  key={card.uid}
                  layout
                  className="absolute inset-0"
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <CardView
                    card={card}
                    size={cardSize}
                    hideCost
                    hideIdentity={compact}
                    laneIndex={laneIndex}
                    laneSilenced={laneSilenced}
                    animateCardEffects={false}
                    onClick={
                      onUnplay && !isIndestructible(state, card, laneIndex)
                        ? () => onUnplay(card.uid)
                        : undefined
                    }
                    selected={
                      Boolean(
                        onUnplay && !isIndestructible(state, card, laneIndex),
                      )
                    }
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

function LaneBackground({
  location,
  petrified = false,
  frozen = false,
  divine = false,
}: {
  location: LocationDefinition;
  petrified?: boolean;
  frozen?: boolean;
  divine?: boolean;
}) {
  const artUrl = getLocationArtUrl(location.id);
  const [imgFailed, setImgFailed] = useState(false);
  useEffect(() => {
    setImgFailed(false);
  }, [location.id, artUrl]);
  const theme = getLocationFallbackTheme(location.id);
  const showImage = Boolean(artUrl) && !imgFailed;

  const fallbackClass =
    theme === 'beach'
      ? 'bg-gradient-to-b from-cyan-900/90 via-teal-900/80 to-slate-900/95'
      : theme === 'dimension'
        ? 'bg-gradient-to-b from-violet-950/95 via-indigo-950/90 to-black/95'
        : theme === 'stone'
          ? 'bg-gradient-to-b from-stone-500/85 via-stone-700/85 to-stone-900/95'
          : theme === 'frozen'
            ? 'bg-gradient-to-b from-sky-300/70 via-blue-400/60 to-indigo-900/95'
            : theme === 'night'
              ? 'bg-gradient-to-b from-indigo-950/95 via-slate-900/90 to-black/95'
              : theme === 'chasm'
                ? 'bg-gradient-to-b from-teal-900/90 via-cyan-950/85 to-black/95'
                : 'bg-gradient-to-b from-cosmos-900/90 via-shadow-800/85 to-black/95';

  const artFilter = frozen
    ? 'grayscale(1) sepia(0.38) hue-rotate(188deg) saturate(2.6) contrast(1.18) brightness(0.78)'
    : petrified
      ? 'url(#algol-petrify-threshold) contrast(1.35) brightness(0.92)'
      : 'none';

  return (
    <div
      className={[
        'absolute inset-0 pointer-events-none overflow-hidden rounded-xl sm:rounded-2xl',
        petrified && !frozen ? 'lane-bg--petrified' : '',
      ].join(' ')}
      aria-hidden
    >
      <div
        className="lane-bg__art absolute inset-0 transition-[filter] duration-500 ease-out"
        style={{ filter: artFilter }}
      >
        {showImage && artUrl ? (
          <img
            src={artUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover scale-105"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className={`absolute inset-0 ${fallbackClass}`} />
        )}
      </div>
      {frozen ? (
        <div
          className="absolute inset-0 mix-blend-color opacity-[0.42] transition-opacity duration-500"
          style={{
            background:
              'linear-gradient(180deg, #0c4a6e 0%, #1d4ed8 42%, #082f49 100%)',
          }}
        />
      ) : null}
      {petrified && !frozen ? (
        <>
          <div className="lane-bg__petrify-veil" />
          <div className="lane-bg__petrify-grain" />
        </>
      ) : null}
      {divine && !frozen ? (
        <div
          className="absolute inset-0 mix-blend-soft-light opacity-[0.28] transition-opacity duration-500"
          style={{
            background:
              'linear-gradient(180deg, rgba(120, 53, 15, 0.35) 0%, rgba(251, 191, 36, 0.18) 45%, rgba(69, 26, 3, 0.3) 100%)',
          }}
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/75" />
      {!frozen && !divine && !petrified ? (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 100% 80% at 50% 0%, rgba(190, 24, 93, 0.16) 0%, transparent 68%), radial-gradient(ellipse 100% 80% at 50% 100%, rgba(30, 58, 138, 0.2) 0%, transparent 68%)',
          }}
        />
      ) : null}
    </div>
  );
}

function CardSlot({
  card,
  state,
  ongoing,
  faceDown = false,
  size = 'sm',
  compact = false,
  laneIndex,
  laneSilenced = false,
  effectOverflow = false,
  protectedByLane = false,
  winningHere = false,
  onClick,
}: {
  card: CardInstance;
  state: GameState;
  ongoing: ReturnType<typeof computeOngoing>;
  faceDown?: boolean;
  size?: CardSize;
  compact?: boolean;
  laneIndex: LocationIndex;
  laneSilenced?: boolean;
  effectOverflow?: boolean;
  protectedByLane?: boolean;
  winningHere?: boolean;
  onClick?: () => void;
}) {
  const viewerId: PlayerId = 'player';
  const presentation = resolveSagaCardPresentation(
    card,
    viewerId,
    state,
    ongoing,
    laneIndex,
  );
  const displayDefId = presentation?.defId;
  const displayPower =
    presentation?.displayPower ?? effectivePower(card, ongoing);
  const displayDef = getCardDef(displayDefId ?? card.defId);
  const powerDelta = displayPower - displayDef.power;
  const nachiClaws =
    !faceDown &&
    !laneSilenced &&
    !card.silenced &&
    card.defId === 'nachi' &&
    winningHere;

  return (
    <motion.div
      layout
      className="absolute inset-0 overflow-visible"
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      exit={{
        opacity: 0,
        scale: 0.55,
        rotate: -10,
        filter: 'blur(6px) brightness(1.6)',
      }}
      transition={{ duration: 0.45 }}
    >
      <CardView
        card={card}
        faceDown={faceDown}
        displayDefId={displayDefId}
        displayPower={displayPower}
        powerDelta={powerDelta}
        showIllusionBadge={presentation?.showIllusionBadge}
        showGalaxyVfx={presentation?.showGalaxyVfx}
        hideCost
        hideIdentity={compact}
        size={size}
        laneIndex={laneIndex}
        laneSilenced={laneSilenced}
        effectOverflow={effectOverflow}
        holoMode="static"
        animateCardEffects={false}
        onClick={onClick}
      />
      {nachiClaws ? (
        <div className="nachi-claws" aria-hidden>
          <span className="nachi-claws__slash nachi-claws__slash--a" />
          <span className="nachi-claws__slash nachi-claws__slash--b" />
          <span className="nachi-claws__slash nachi-claws__slash--c" />
        </div>
      ) : null}
      {protectedByLane && !faceDown ? (
        <div
          aria-label="Protégé"
          title="Protégé"
          className="absolute -bottom-1 -left-1 w-5 h-5 rounded-full bg-cosmos-500 ring-2 ring-cosmos-300 flex items-center justify-center text-[10px] shadow-cosmos pointer-events-none"
        >
          ⛨
        </div>
      ) : null}
    </motion.div>
  );
}

function PowerPill({
  value,
  winning,
  losing,
  owner,
  compact,
  aria,
}: {
  value: number;
  winning: boolean;
  losing: boolean;
  owner: PlayerId;
  compact?: boolean;
  aria: string;
}) {
  return (
    <div
      aria-label={aria}
      aria-current={winning ? 'true' : undefined}
      className={[
        'rounded-full flex items-center justify-center font-bold tabular-nums border shrink-0 transition-all duration-300',
        compact
          ? 'min-w-[28px] h-6 px-1.5 text-xs'
          : 'min-w-[44px] h-8 px-2.5 text-base',
        owner === 'player'
          ? 'bg-cosmos-600/85 border-cosmos-300/70 text-white'
          : 'bg-rose-600/75 border-rose-300/70 text-white',
        winning
          ? [
              'ring-2 ring-gold-400 border-gold-300/90 shadow-gold animate-pulseGlow z-10',
              compact ? 'scale-110 text-sm' : 'scale-125 text-lg shadow-lg',
            ].join(' ')
          : losing
            ? 'opacity-45 scale-90 shadow-none border-white/15'
            : 'shadow-md',
      ].join(' ')}
    >
      {value}
    </div>
  );
}
