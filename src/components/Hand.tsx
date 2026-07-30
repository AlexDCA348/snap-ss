import { AnimatePresence, motion } from 'framer-motion';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { getCardDef } from '../game/cards';
import { handCardSize } from '../game/cardSizes';
import type { CardInstance } from '../game/types';
import { useGame } from '../store/gameStore';
import { getEffectiveHandCost, computeOngoing, effectivePower } from '../game/abilities';
import { aresDisplayPower, isAresCard } from '../game/aresInferno';
import { CardView } from './CardView';

interface Props {
  hand: CardInstance[];
  cosmos: number;
  maxCosmos: number;
  onDragStart: (uid: string) => void;
  onDragEnd: () => void;
  disabled?: boolean;
  holoDisabled?: boolean;
  hideCost?: boolean;
  touchPlay?: boolean;
  compact?: boolean;
  mini?: boolean;
  selectedUid?: string | null;
  onPointerDownCard?: (
    uid: string,
    e: ReactPointerEvent<HTMLElement>,
  ) => void;
}

export function Hand({
  hand,
  cosmos,
  maxCosmos,
  onDragStart,
  onDragEnd,
  disabled,
  holoDisabled = false,
  hideCost = false,
  touchPlay = false,
  compact = false,
  mini = false,
  selectedUid = null,
  onPointerDownCard,
}: Props) {
  const inspectCard = useGame((s) => s.inspectCard);
  const cardSize = handCardSize(compact, mini);

  const scrollable = compact || hand.length > 5;

  return (
    <div
      className={[
        'relative w-full game-hand',
        scrollable
          ? [
              'flex gap-1 overflow-x-auto overflow-y-hidden snap-x snap-mandatory px-0.5 py-0.5 scrollbar-thin',
              mini ? 'min-h-[76px] max-h-[80px]' : compact ? 'min-h-[100px] max-h-[104px]' : 'min-h-[140px] max-h-[148px]',
            ].join(' ')
          : 'flex justify-center items-end gap-2 min-h-[200px] py-2 flex-wrap max-w-full',
      ].join(' ')}
    >
      {!compact && !scrollable ? (
        <CosmosOrb cosmos={cosmos} maxCosmos={maxCosmos} compact={false} />
      ) : null}
      <AnimatePresence>
        {hand.map((card) => (
          <HandCard
            key={card.uid}
            card={card}
            cardSize={cardSize}
            cosmos={cosmos}
            disabled={disabled}
            holoDisabled={holoDisabled}
            hideCost={hideCost}
            touchPlay={touchPlay}
            compact={compact}
            scrollable={scrollable}
            selected={selectedUid === card.uid}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onInspect={() => inspectCard(card.uid)}
            onPointerDownCard={onPointerDownCard}
          />
        ))}
      </AnimatePresence>
      {hand.length === 0 ? (
        <div className="text-ui-muted italic text-xs self-center px-2">
          Main vide
        </div>
      ) : null}
    </div>
  );
}

function HandCard({
  card,
  cardSize,
  cosmos,
  disabled,
  holoDisabled,
  hideCost,
  touchPlay,
  compact,
  scrollable,
  selected,
  onDragStart,
  onDragEnd,
  onInspect,
  onPointerDownCard,
}: {
  card: CardInstance;
  cardSize: ReturnType<typeof handCardSize>;
  cosmos: number;
  disabled?: boolean;
  holoDisabled?: boolean;
  hideCost?: boolean;
  touchPlay: boolean;
  compact: boolean;
  scrollable: boolean;
  selected: boolean;
  onDragStart: (uid: string) => void;
  onDragEnd: () => void;
  onInspect: () => void;
  onPointerDownCard?: (
    uid: string,
    e: ReactPointerEvent<HTMLElement>,
  ) => void;
}) {
  const def = getCardDef(card.defId);
  const state = useGame((s) => s.state);
  const ongoing = computeOngoing(state);
  const displayPower = isAresCard(card.defId)
    ? aresDisplayPower(card, state)
    : effectivePower(card, ongoing);
  const effectiveCost = getEffectiveHandCost(state, 'player', def.cost);
  const affordable = !disabled && effectiveCost <= cosmos;
  const useDrag = !touchPlay && affordable;

  return (
    <motion.div
      layout
      initial={{ y: compact || scrollable ? 20 : 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: compact || scrollable ? 24 : 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className={scrollable ? 'shrink-0 snap-center' : undefined}
    >
      <div
        draggable={useDrag}
        data-hand-card={card.uid}
        className="relative select-none"
        style={{ touchAction: touchPlay && affordable ? 'none' : undefined }}
        onDragStart={(e) => {
          if (!useDrag) {
            e.preventDefault();
            return;
          }
          e.dataTransfer.setData('text/uid', card.uid);
          e.dataTransfer.effectAllowed = 'move';
          onDragStart(card.uid);
        }}
        onDragEnd={() => onDragEnd()}
        onPointerDownCapture={
          touchPlay && affordable && onPointerDownCard
            ? (e) => onPointerDownCard(card.uid, e)
            : undefined
        }
      >
        <CardView
          card={card}
          size={cardSize}
          displayPower={displayPower}
          inHand
          draggable={useDrag}
          affordable={affordable}
          displayCost={effectiveCost}
          hideCost={hideCost}
          holoMode={compact ? 'static' : 'interactive'}
          holoDisabled={holoDisabled}
          hideIdentity={compact}
          animateCardEffects={selected ? true : undefined}
          selected={selected}
          onClick={() => {
            if (touchPlay) return;
            onInspect();
          }}
        />
        {touchPlay && selected ? (
          <button
            type="button"
            aria-label={`Détail : ${def.name}`}
            onClick={(e) => {
              e.stopPropagation();
              onInspect();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute -top-1 -right-1 z-30 w-5 h-5 rounded-full bg-black/80 border border-gold-400/60 text-[10px] text-gold-200 touch-manipulation"
          >
            ⓘ
          </button>
        ) : null}
      </div>
    </motion.div>
  );
}

function CosmosOrb({
  cosmos,
  maxCosmos,
  compact,
}: {
  cosmos: number;
  maxCosmos: number;
  compact: boolean;
}) {
  const size = compact ? 'w-10 h-10' : 'w-14 h-14';
  return (
    <motion.div
      aria-label={`Cosmos disponible : ${cosmos}/${maxCosmos}`}
      className={[
        'select-none pointer-events-none',
        compact ? 'shrink-0 self-end' : 'absolute left-2 bottom-3 z-20',
      ].join(' ')}
      initial={{ y: 6, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
    >
      <motion.div
        className={[
          'relative rounded-full',
          size,
          'bg-[radial-gradient(circle_at_30%_25%,rgba(56,189,248,0.95),rgba(14,165,233,0.55)_38%,rgba(59,130,246,0.18)_70%,rgba(0,0,0,0)_100%)]',
          'ring-1 ring-cosmos-200/50 shadow-cosmos',
        ].join(' ')}
        animate={{ y: [0, -1.5, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center leading-none">
            <div
              className={[
                'display-font text-white drop-shadow',
                compact ? 'text-[10px]' : 'text-sm',
              ].join(' ')}
            >
              {cosmos}/{maxCosmos}
            </div>
            {!compact ? (
              <div className="text-[9px] uppercase tracking-widest text-cosmos-100/80 mt-0.5">
                Cosmos
              </div>
            ) : null}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
