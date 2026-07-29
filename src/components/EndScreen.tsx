import { motion } from 'framer-motion';
import type { GameState } from '../game/types';

interface Props {
  state: GameState;
  onNewGame: () => void;
  onMenu?: () => void;
  /** Ancré dans la barre du bas (à côté de la main) au lieu d’un toast flottant. */
  docked?: boolean;
}

export function EndScreen({ state, onNewGame, onMenu, docked = false }: Props) {
  if (state.phase !== 'ended' || !state.winner) return null;

  const lanesWon = state.lanesWon ?? { player: 0, ai: 0 };

  const isWin = state.winner === 'player';
  const isDraw = state.winner === 'draw';
  const isLoss = state.winner === 'ai';

  const title = isDraw
    ? 'Égalité cosmique'
    : isWin
      ? 'Victoire de la Déesse !'
      : 'Le mal triomphe...';
  const sub = isDraw
    ? 'Les cosmos s\u2019équilibrent.'
    : isWin
      ? 'Athéna est sauvée.'
      : 'Le sanctuaire vacille...';

  const accent = isWin
    ? {
        ring: 'ring-gold-400/60',
        glow: 'shadow-[0_0_20px_rgba(234,179,8,0.35)]',
        title: 'text-gold-300',
        chip: 'from-gold-400 to-gold-600 text-black',
        icon: '★',
      }
    : isLoss
      ? {
          ring: 'ring-rose-400/60',
          glow: 'shadow-[0_0_20px_rgba(244,63,94,0.35)]',
          title: 'text-rose-200',
          chip: 'from-rose-400 to-rose-600 text-white',
          icon: '☠',
        }
      : {
          ring: 'ring-cosmos-300/60',
          glow: 'shadow-[0_0_20px_rgba(167,139,250,0.35)]',
          title: 'text-cosmos-200',
          chip: 'from-cosmos-400 to-cosmos-600 text-white',
          icon: '∞',
        };

  return (
    <motion.div
      initial={{ y: 12, opacity: 0, scale: 0.96 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      role="status"
      aria-live="polite"
      className={[
        docked
          ? 'relative w-full pointer-events-auto'
          : 'fixed z-50 bottom-4 left-4 right-4 mx-auto max-w-md pointer-events-auto',
        'flex items-center gap-2.5 px-3 py-2.5 rounded-2xl border border-white/10',
        'bg-gradient-to-br from-cosmos-800/95 to-shadow-700/95 backdrop-blur-md ring-1',
        accent.ring,
        accent.glow,
      ].join(' ')}
    >
      <div
        className={[
          'flex shrink-0 items-center justify-center w-9 h-9 rounded-full bg-black/40 ring-1',
          accent.ring,
          'display-font',
          accent.title,
        ].join(' ')}
        aria-hidden
      >
        <span className="text-base leading-none">{accent.icon}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className={['display-font text-sm leading-tight truncate', accent.title].join(' ')}>
          {title}
        </div>
        <div className="text-[11px] text-ui-muted truncate">
          {sub} · {lanesWon.player}–{lanesWon.ai}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {onMenu ? (
          <button
            type="button"
            onClick={onMenu}
            className="px-2.5 py-1.5 rounded-full text-[10px] uppercase tracking-wider ring-1 ring-white/15 bg-white/5 text-cosmos-200 hover:bg-white/10 transition"
          >
            Menu
          </button>
        ) : null}
        <button
          type="button"
          onClick={onNewGame}
          className={[
            'px-3.5 py-1.5 rounded-full display-font tracking-wider text-xs whitespace-nowrap',
            'bg-gradient-to-r shadow-md transition hover:brightness-110',
            accent.chip,
          ].join(' ')}
        >
          Rejouer
        </button>
      </div>
    </motion.div>
  );
}
