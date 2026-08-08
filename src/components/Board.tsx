import { useMemo, useEffect, useState } from 'react';
import { canPlay } from '../game/engine';
import { listAthenaRippleSources } from '../game/athenaWave';
import type { GameState, LocationIndex } from '../game/types';
import { useGame } from '../store/gameStore';
import { AthenaRippleOverlay } from './AthenaRippleOverlay';
import { LocationView } from './LocationView';

interface Props {
  state: GameState;
  onDropCard: (uid: string, lane: LocationIndex) => void;
  onUnplay: (uid: string) => void;
  draggingCard: { uid: string; cost: number } | null;
  hoverLane?: LocationIndex | null;
  touchPlay?: boolean;
  compact?: boolean;
  mini?: boolean;
}

export function Board({
  state,
  onDropCard,
  onUnplay,
  draggingCard,
  hoverLane = null,
  touchPlay,
  compact = false,
  mini = false,
}: Props) {
  const athenaSources = useMemo(
    () => listAthenaRippleSources(state),
    [state],
  );
  const aldebaranBursts = useGame((s) => s.aldebaranImpactBursts);
  const quakeKey = aldebaranBursts.map((b) => b.sourceUid).join('|');
  const [quaking, setQuaking] = useState(false);

  useEffect(() => {
    if (!quakeKey) return;
    setQuaking(true);
    const id = window.setTimeout(() => setQuaking(false), 720);
    return () => window.clearTimeout(id);
  }, [quakeKey]);

  return (
    <>
      <div
        className={[
          'grid grid-cols-3 w-full min-w-0 board-grid h-full min-h-0 flex-1',
          quaking ? 'board-grid--quake' : '',
          compact ? 'gap-0.5' : 'gap-1.5 sm:gap-3',
        ].join(' ')}
      >
      {([0, 1, 2] as LocationIndex[]).map((i) => {
        const canDrop =
          draggingCard &&
          canPlay(state, 'player', draggingCard.uid, i).ok
            ? draggingCard
            : null;
        return (
          <LocationView
            key={i}
            state={state}
            laneIndex={i}
            onDropCard={onDropCard}
            onUnplay={onUnplay}
            canDropPreview={canDrop}
            hoverLane={hoverLane}
            touchPlay={touchPlay}
            compact={compact}
            mini={mini}
          />
        );
      })}
      </div>
      <AthenaRippleOverlay sources={athenaSources} compact={compact} />
    </>
  );
}
