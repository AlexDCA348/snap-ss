import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { getFeaturedCampaignChapterId } from '../collection/campaignProgress';
import { DECK_SIZE, validateDeck } from '../game/deckPool';
import { useAppStore } from '../store/appStore';
import { useCollectionStore } from '../store/collectionStore';
import { useDeckStore } from '../store/deckStore';
import { useGame } from '../store/gameStore';
import { CampaignProgressSlider } from '../components/menu/CampaignProgressSlider';
import { MainMenuBackground } from '../components/menu/MainMenuBackground';
import { NavButton } from '../components/menu/NavButton';
import { ProgressBackupControls } from '../components/menu/ProgressBackupControls';

const MENU_LOGO_URL = `${import.meta.env.BASE_URL}menu/logo-home.png?v=${encodeURIComponent(__BUILD_STAMP__)}`;
const MENU_VERSION_LABEL = `v${__APP_VERSION__} · build ${__BUILD_STAMP__}`;

function DecksIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" aria-hidden>
      <rect x="4" y="6" width="13" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="7" y="3" width="13" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="rgba(0,0,0,0.35)" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor" aria-hidden>
      <path d="M8 5.5v13l11-6.5-11-6.5z" />
    </svg>
  );
}

function InfinityIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" aria-hidden>
      <path
        d="M7.5 12c0 1.8 1.4 3.3 3.2 3.3 1.5 0 2.5-.9 3.3-2.1.8 1.2 1.8 2.1 3.3 2.1 1.8 0 3.2-1.5 3.2-3.3S19.1 8.7 17.3 8.7c-1.5 0-2.5.9-3.3 2.1-.8-1.2-1.8-2.1-3.3-2.1C8.9 8.7 7.5 10.2 7.5 12z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 12h1.2M18.8 12H20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MainMenuScreen() {
  const goToDeckBuilder = useAppStore((s) => s.goToDeckBuilder);
  const goToInfinity = useAppStore((s) => s.goToInfinity);
  const goToGame = useAppStore((s) => s.goToGame);
  const newGame = useGame((s) => s.newGame);
  const activeDeck = useDeckStore((s) => s.getActiveDeck());
  const collection = useCollectionStore((s) => s.collection);
  const featuredChapterId = useMemo(
    () => getFeaturedCampaignChapterId(collection),
    [collection],
  );
  const validation = validateDeck(activeDeck.cardIds);
  const canPlay = validation.ok;

  return (
    <div className="main-menu relative min-h-screen flex flex-col pb-[11.5rem] overflow-hidden">
      <MainMenuBackground chapterId={featuredChapterId} />

      <h1 className="main-menu__logo relative z-10 mx-auto pt-12 px-4 w-full max-w-md text-center shrink-0">
        <img
          src={MENU_LOGO_URL}
          alt="Saint Seiya · Snap"
          className="main-menu__logo-img w-full max-w-[min(100%,22rem)] h-auto mx-auto"
          width={1717}
          height={608}
          decoding="async"
        />
        <p className="mt-2 text-[9px] uppercase tracking-[0.22em] text-white/55">
          {MENU_VERSION_LABEL}
        </p>
      </h1>
      <div className="relative z-10 mx-auto px-4 w-full max-w-md">
        <ProgressBackupControls />
      </div>

      <div className="relative z-10 flex flex-col flex-1 min-h-0">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 flex flex-col justify-center w-full mt-8 min-h-0"
      >
        <CampaignProgressSlider />
      </motion.div>

      <div className="main-menu__dock fixed bottom-0 left-0 right-0 z-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-4 pb-2 max-w-md mx-auto w-full"
        >
          <div className="w-full rounded-xl bg-black/45 border border-white/10 px-4 py-3 text-center backdrop-blur-sm">
            <div className="text-[10px] uppercase tracking-widest text-ui-muted">
              Deck actif
            </div>
            <div className="display-font text-lg text-cosmos-100 mt-1">
              {activeDeck.name}
            </div>
            <div
              className={[
                'text-sm tabular-nums mt-1',
                canPlay ? 'text-emerald-300' : 'text-amber-300',
              ].join(' ')}
            >
              {activeDeck.cardIds.length}/{DECK_SIZE} cartes
            </div>
            {!canPlay && validation.reason ? (
              <p className="text-xs text-amber-300/80 mt-2 leading-snug">
                {validation.reason}
              </p>
            ) : null}
          </div>
        </motion.div>

        <motion.nav
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="main-menu-nav safe-area-pb"
          aria-label="Navigation principale"
        >
          <div className="flex items-end justify-center gap-6 sm:gap-10 px-6 pt-3 pb-4 max-w-md mx-auto">
            <NavButton
              label="Decks"
              icon={<DecksIcon />}
              onClick={goToDeckBuilder}
            />
            <NavButton
              label="Jouer"
              icon={<PlayIcon />}
              primary
              disabled={!canPlay}
              onClick={() => {
                newGame();
                goToGame();
              }}
            />
            <NavButton
              label="Infinity"
              icon={<InfinityIcon />}
              onClick={goToInfinity}
            />
          </div>
        </motion.nav>
      </div>
      </div>
    </div>
  );
}
