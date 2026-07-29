import { canPlay } from '../game/engine';
import type { GameState, LocationIndex } from '../game/types';

interface Props {
  state: GameState;
  cardUid: string;
  onPlay: (lane: LocationIndex) => void;
  onCancel: () => void;
  mini?: boolean;
}

/** Choix explicite du lieu (mobile / simulateur). */
export function LanePlayBar({ state, cardUid, onPlay, onCancel, mini = false }: Props) {
  return (
    <div
      className={[
        'w-full rounded-lg bg-black/75 border border-cosmos-400/40 px-1.5 backdrop-blur-md',
        mini ? 'py-1' : 'py-1.5',
      ].join(' ')}
    >
      <p className="text-[9px] text-center text-ui-muted mb-1 uppercase tracking-wider">
        Choisir un lieu
      </p>
      <div className="flex gap-1">
        {([0, 1, 2] as LocationIndex[]).map((lane) => {
          const check = canPlay(state, 'player', cardUid, lane);
          const name = state.locations[lane].name;
          return (
            <button
              key={lane}
              type="button"
              disabled={!check.ok}
              title={check.ok ? undefined : check.reason}
              onClick={() => onPlay(lane)}
              className={[
                'flex-1 min-h-9 px-0.5 py-1 rounded-md text-[9px] leading-tight font-semibold touch-manipulation transition',
                check.ok
                  ? 'bg-cosmos-600/90 text-white ring-1 ring-cosmos-300/60 active:scale-95'
                  : 'bg-white/5 text-white/35 cursor-not-allowed',
              ].join(' ')}
            >
              {name}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        onClick={onCancel}
        className="mt-1 w-full text-[10px] text-ui-muted py-0.5 touch-manipulation underline"
      >
        Annuler la sélection
      </button>
    </div>
  );
}
