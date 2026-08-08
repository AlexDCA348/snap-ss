import { useEffect, useRef, useState } from 'react';
import { Board } from '../components/Board';
import { CardDetail } from '../components/CardDetail';
import { LocationDetail } from '../components/LocationDetail';
import { EndScreen } from '../components/EndScreen';
import { VictoryRewardModal } from '../components/collection/VictoryRewardModal';
import { Hand } from '../components/Hand';
import { Hud } from '../components/Hud';
import { DeathmaskSoulsOverlay } from '../components/DeathmaskSoulsOverlay';
import { SagaDuplicateOverlay } from '../components/SagaDuplicateOverlay';
import { AndromedaRelocateOverlay } from '../components/AndromedaRelocateOverlay';
import { DanteChainOverlay } from '../components/DanteChainOverlay';
import { ShiryuDragonCometOverlay } from '../components/ShiryuDragonCometOverlay';
import { IkkiPhoenixOverlay } from '../components/IkkiPhoenixOverlay';
import { JamianCrowOverlay } from '../components/JamianCrowOverlay';
import { BlackPegasusCostOverlay } from '../components/BlackPegasusCostOverlay';
import type { LocationIndex } from '../game/types';
import { useMiniPhone } from '../hooks/useMiniPhone';
import { useLockPageScroll } from '../hooks/useLockPageScroll';
import { canPlay } from '../game/engine';
import { getEffectiveCost } from '../game/abilities';
import { useAppStore } from '../store/appStore';
import { useCollectionStore } from '../store/collectionStore';
import { useGame } from '../store/gameStore';
import { useCompactUi } from '../hooks/useCompactUi';
import { useTouchPlayMode } from '../hooks/useTouchPlayMode';
import { useTouchCardDrag } from '../hooks/useTouchCardDrag';
import { TouchDragGhost } from '../components/TouchDragGhost';

export function GameScreen() {
  const state = useGame((s) => s.state);
  const resolving = useGame((s) => s.resolving);
  const playCard = useGame((s) => s.playCard);
  const unplayCard = useGame((s) => s.unplayCard);
  const endTurn = useGame((s) => s.endTurn);
  const newGame = useGame((s) => s.newGame);
  const ikkiPhoenixBursts = useGame((s) => s.ikkiPhoenixBursts);
  const jamianCrowBursts = useGame((s) => s.jamianCrowBursts);
  const deathmaskSoulBursts = useGame((s) => s.deathmaskSoulBursts);
  const blackPegasusCostBursts = useGame((s) => s.blackPegasusCostBursts);
  const sagaDuplicateBursts = useGame((s) => s.sagaDuplicateBursts);
  const andromedaRelocateBursts = useGame((s) => s.andromedaRelocateBursts);
  const danteChainBursts = useGame((s) => s.danteChainBursts);
  const shiryuDragonBursts = useGame((s) => s.shiryuDragonBursts);
  const matchSerial = useGame((s) => s.matchSerial);
  const goToMenu = useAppStore((s) => s.goToMenu);
  const pendingReward = useCollectionStore((s) => s.pendingReward);
  const grantVictoryRewardForMatch = useCollectionStore((s) => s.grantVictoryRewardForMatch);
  const dismissPendingReward = useCollectionStore((s) => s.dismissPendingReward);

  useEffect(() => {
    if (state.phase === 'ended' && state.winner === 'player') {
      grantVictoryRewardForMatch(matchSerial);
    }
  }, [state.phase, state.winner, matchSerial, grantVictoryRewardForMatch]);

  const compact = useCompactUi();
  const mini = useMiniPhone();
  const touchPlay = useTouchPlayMode();
  useLockPageScroll(compact);
  const [selectedCard, setSelectedCard] = useState<{
    uid: string;
    cost: number;
  } | null>(null);
  const selectedCardRef = useRef(selectedCard);
  selectedCardRef.current = selectedCard;

  const player = state.players.player;

  const handleMenu = () => {
    goToMenu();
  };

  const handleReplay = () => {
    newGame();
  };

  const playAtLane = (uid: string, lane: LocationIndex) => {
    const check = canPlay(state, 'player', uid, lane);
    if (!check.ok) return;
    playCard('player', uid, lane);
    setSelectedCard(null);
  };

  const pickCard = (uid: string) => {
    const card = player.hand.find((c) => c.uid === uid);
    if (!card) return;
    setSelectedCard({
      uid,
      cost: getEffectiveCost(card, state, 'player'),
    });
  };

  const touchDrag = useTouchCardDrag({
    enabled: touchPlay && state.phase === 'play' && !resolving,
    onDragStart: pickCard,
    onDragEnd: () => setSelectedCard(null),
    onDrop: playAtLane,
    onTap: (uid) => {
      if (selectedCardRef.current?.uid === uid) {
        setSelectedCard(null);
        return;
      }
      pickCard(uid);
    },
  });

  const dragGhostCard = touchDrag.drag
    ? player.hand.find((c) => c.uid === touchDrag.drag?.uid)
    : null;

  const shellClass = compact
    ? 'game-screen--compact h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col gap-1 px-2 pt-[max(0.25rem,env(safe-area-inset-top))] pb-0'
    : 'min-h-screen w-full px-4 py-6 max-w-[1280px] mx-auto flex flex-col gap-4';

  return (
    <div className={shellClass}>
      <main
        className={[
          'flex-1 min-h-0 w-full',
          compact ? 'overflow-hidden flex flex-col justify-start' : 'pb-52 max-sm:pb-56',
        ].join(' ')}
      >
        <Board
          state={state}
          compact={compact}
          mini={mini}
          touchPlay={touchPlay}
          draggingCard={selectedCard}
          hoverLane={touchDrag.hoverLane}
          onDropCard={playAtLane}
          onUnplay={(uid) => unplayCard('player', uid)}
        />
      </main>

      <div
        className={[
          'shrink-0 z-40',
          compact
            ? 'pointer-events-auto shrink-0 pb-[max(0.35rem,env(safe-area-inset-bottom))]'
            : 'fixed bottom-0 inset-x-0 pointer-events-none pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2',
        ].join(' ')}
      >
        <div
          className={[
            compact
              ? 'flex flex-col gap-2 w-full'
              : 'max-w-[1280px] mx-auto px-4 flex items-end justify-end gap-4 md:gap-6',
          ].join(' ')}
        >
          <div
            className={[
              compact
                ? 'w-full flex flex-col gap-1'
                : 'flex-1 flex justify-center min-w-0 pointer-events-auto pr-2 md:pr-4',
            ].join(' ')}
          >
            <div
              className={[
                compact ? 'flex items-end gap-1.5 w-full game-hand' : 'w-full',
              ].join(' ')}
            >
              <Hand
                hand={player.hand}
                cosmos={player.cosmos}
                maxCosmos={player.maxCosmos}
                disabled={state.phase !== 'play' || resolving}
                holoDisabled={selectedCard !== null}
                hideCost={selectedCard !== null}
                touchPlay={touchPlay}
                compact={compact}
                mini={mini}
                selectedUid={selectedCard?.uid ?? null}
                onDragStart={(uid) => pickCard(uid)}
                onDragEnd={() => setSelectedCard(null)}
                onPointerDownCard={
                  touchPlay ? touchDrag.onPointerDown : undefined
                }
              />
            </div>
          </div>

          <div className={compact ? 'w-full' : 'shrink-0 pointer-events-auto'}>
            {state.phase === 'ended' ? (
              <EndScreen
                state={state}
                onNewGame={handleReplay}
                onMenu={handleMenu}
                docked
              />
            ) : (
              <Hud
                state={state}
                compact={compact}
                mini={mini}
                onNewGame={handleReplay}
                onMenu={handleMenu}
                cosmos={player.cosmos}
                maxCosmos={player.maxCosmos}
                onEndTurn={endTurn}
                endTurnDisabled={state.phase !== 'play' || resolving}
                endTurnLabel={resolving ? 'Cosmoénergie...' : 'Fin du tour'}
              />
            )}
          </div>
        </div>
      </div>
      <CardDetail />
      <LocationDetail />
      <IkkiPhoenixOverlay bursts={ikkiPhoenixBursts} compact={compact} />
      <JamianCrowOverlay bursts={jamianCrowBursts} compact={compact} />
      <DeathmaskSoulsOverlay bursts={deathmaskSoulBursts} compact={compact} />
      <BlackPegasusCostOverlay bursts={blackPegasusCostBursts} />
      <SagaDuplicateOverlay
        bursts={sagaDuplicateBursts.filter((b) => b.side === 'player')}
        compact={compact}
      />
      <AndromedaRelocateOverlay
        bursts={andromedaRelocateBursts}
        compact={compact}
      />
      <DanteChainOverlay bursts={danteChainBursts} compact={compact} />
      <ShiryuDragonCometOverlay bursts={shiryuDragonBursts} compact={compact} />
      <VictoryRewardModal reward={pendingReward} onDismiss={dismissPendingReward} />
      {touchDrag.drag && dragGhostCard ? (
        <TouchDragGhost
          defId={dragGhostCard.defId}
          x={touchDrag.drag.x}
          y={touchDrag.drag.y}
          compact={compact}
          mini={mini}
        />
      ) : null}
    </div>
  );
}
