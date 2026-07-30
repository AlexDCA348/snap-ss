import type { GameState } from '../game/types';

interface Props {
  state: GameState;
  onNewGame: () => void;
  onMenu?: () => void;
  onEndTurn: () => void;
  cosmos?: number;
  maxCosmos?: number;
  endTurnDisabled?: boolean;
  endTurnLabel?: string;
  compact?: boolean;
  mini?: boolean;
}

export function Hud({
  state,
  onNewGame,
  onMenu,
  onEndTurn,
  cosmos,
  maxCosmos,
  endTurnDisabled = false,
  endTurnLabel = 'Fin du tour',
  compact = false,
  mini = false,
}: Props) {
  if (compact) {
    return (
      <div
        className={[
          'flex items-center gap-1.5 w-full rounded-lg bg-black/55 border border-white/10 backdrop-blur-md px-1.5',
          mini ? 'py-1' : 'py-1.5',
        ].join(' ')}
      >
        <div className="flex flex-1 items-center gap-1.5">
          {onMenu ? (
            <button
              type="button"
              onClick={onMenu}
              aria-label="Menu"
              className={[
                'shrink-0 inline-flex items-center justify-center gap-1 rounded-full text-ui-muted ring-1 ring-white/15 bg-white/5 hover:bg-white/10 touch-manipulation transition',
                mini
                  ? 'min-h-9 px-2 display-font text-[10px] tracking-wider'
                  : 'min-h-10 px-3 display-font text-[10px] tracking-wider',
              ].join(' ')}
            >
              <span className="text-lg leading-none" aria-hidden>←</span>
              <span>Fuir</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={onEndTurn}
            disabled={endTurnDisabled}
            className={[
              'flex-1 rounded-full display-font text-[10px] tracking-wider touch-manipulation',
              mini ? 'min-h-9' : 'min-h-10',
              'bg-gradient-to-r from-gold-400 to-gold-600 text-black shadow-gold',
              'disabled:opacity-50 disabled:cursor-not-allowed ring-1 ring-gold-200/40',
            ].join(' ')}
          >
            {endTurnLabel}
          </button>
        </div>
        {cosmos !== undefined && maxCosmos !== undefined ? (
          <div
            aria-label={`Cosmos ${cosmos}/${maxCosmos}`}
            className={[
              'shrink-0 rounded-full bg-cosmos-600/80 ring-1 ring-cosmos-300/50 flex flex-col items-center justify-center font-bold text-white',
              mini ? 'w-9 h-9 text-[9px]' : 'w-10 h-10 text-[10px]',
              state.mode === 'infinity' ? 'ring-cyan-300/60 bg-cyan-700/80' : '',
            ].join(' ')}
          >
            <span>{state.mode === 'infinity' ? '∞' : cosmos}</span>
          </div>
        ) : null}
        <div
          aria-label={`Tour ${state.turn} sur ${state.maxTurns}`}
          className={[
            'relative shrink-0 rounded-full bg-black/30 ring-1 ring-white/10',
            mini ? 'w-9 h-9' : 'w-10 h-10',
          ].join(' ')}
        >
          <svg
            viewBox="0 0 40 40"
            className="absolute inset-0 w-full h-full -rotate-90"
            aria-hidden
          >
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="3"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(state.turn / state.maxTurns) * 100.53} 100.53`}
              className="drop-shadow-[0_0_3px_rgba(34,211,238,0.7)]"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center display-font text-cyan-200 text-[10px]">
            {state.turn}/{state.maxTurns}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-black/50 border border-white/10 backdrop-blur-md px-4 py-3 shadow-lg min-w-[160px]">
      <div className="display-font text-gold-400 tracking-widest text-base md:text-lg">
        Tour {state.turn} / {state.maxTurns}
      </div>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: state.maxTurns }).map((_, i) => (
          <div
            key={i}
            className={[
              'w-2.5 h-2.5 rounded-full border',
              i + 1 < state.turn
                ? 'bg-gold-500 border-gold-400'
                : i + 1 === state.turn
                ? 'bg-cosmos-400 border-cosmos-300 animate-pulseGlow'
                : 'bg-transparent border-white/30',
            ].join(' ')}
          />
        ))}
      </div>
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={onNewGame}
          className="text-xs text-ui-muted underline hover:text-cosmos-100 min-h-11 px-2 touch-manipulation"
        >
          Rejouer
        </button>
        {onMenu ? (
          <button
            type="button"
            onClick={onMenu}
            className="text-xs text-ui-muted underline hover:text-cosmos-100 min-h-11 px-2 touch-manipulation"
          >
            Menu
          </button>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onEndTurn}
        disabled={endTurnDisabled}
        className={[
          'w-full px-5 py-3 min-h-[44px] rounded-full display-font text-sm tracking-wider touch-manipulation',
          'bg-gradient-to-r from-gold-400 to-gold-600 text-black',
          'shadow-gold disabled:opacity-50 disabled:cursor-not-allowed',
          'hover:from-gold-300 hover:to-gold-500 transition',
          'ring-1 ring-gold-200/40',
        ].join(' ')}
      >
        {endTurnLabel}
      </button>
    </div>
  );
}
