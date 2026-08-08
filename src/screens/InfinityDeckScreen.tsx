import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getBuildableCardDefs } from '../game/buildableCards';
import { defToPreviewInstance } from '../game/cardPreview';
import { DECK_SIZE } from '../game/deckPool';
import {
  buildPresetDeck,
  DECK_PRESETS,
  type DeckPreset,
} from '../game/deckPresets';
import type { Faction } from '../game/types';
import { useMiniPhone } from '../hooks/useMiniPhone';
import { useAppStore } from '../store/appStore';
import { useGame } from '../store/gameStore';
import { CardView } from '../components/CardView';
import { CardPickDetailModal } from '../components/deckbuilder/CardPickDetailModal';
import { DeckList } from '../components/deckbuilder/DeckList';
import { CardDetailByDefId } from '../components/deckbuilder/CardDetailByDefId';
import { NavButton } from '../components/menu/NavButton';

const QUICK_FACTIONS: { id: Faction | 'all'; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'bronze', label: 'Bronze' },
  { id: 'gold', label: 'Or' },
  { id: 'black', label: 'Noir' },
  { id: 'silver', label: 'Argent' },
];

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" aria-hidden>
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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

/** Builder éphémère du mode Infinity — toutes les cartes, aucune persistance. */
export function InfinityDeckScreen() {
  const goToMenu = useAppStore((s) => s.goToMenu);
  const goToGame = useAppStore((s) => s.goToGame);
  const showToast = useAppStore((s) => s.showToast);
  const newInfinityGame = useGame((s) => s.newInfinityGame);
  const mini = useMiniPhone();

  const [cardIds, setCardIds] = useState<string[]>([]);
  const [realConditions, setRealConditions] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [confirmPresetId, setConfirmPresetId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [faction, setFaction] = useState<Faction | 'all'>('all');
  const [pickedDefId, setPickedDefId] = useState<string | null>(null);
  const [inspectedDefId, setInspectedDefId] = useState<string | null>(null);

  const deckSet = useMemo(() => new Set(cardIds), [cardIds]);
  const full = cardIds.length >= DECK_SIZE;
  const canPlay = cardIds.length === DECK_SIZE;

  const filtered = useMemo(() => {
    let list = getBuildableCardDefs();
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q),
      );
    }
    if (faction !== 'all') {
      list = list.filter((c) => c.faction === faction);
    }
    return [...list].sort(
      (a, b) => a.cost - b.cost || a.power - b.power || a.name.localeCompare(b.name, 'fr'),
    );
  }, [search, faction]);

  const addCard = (defId: string) => {
    if (full || deckSet.has(defId)) {
      showToast('Deck plein ou carte déjà présente.');
      return;
    }
    setCardIds((ids) => [...ids, defId]);
    setPickedDefId(null);
    if (cardIds.length + 1 >= DECK_SIZE) setLibraryOpen(false);
  };

  const removeCard = (defId: string) => {
    setCardIds((ids) => ids.filter((id) => id !== defId));
  };

  const fillRandom = () => {
    // Infinity a accès à tout le pool buildable (pas de filtre collection).
    const pool = getBuildableCardDefs().map((c) => c.id);
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    setCardIds(shuffled.slice(0, DECK_SIZE));
    showToast('Deck Infinity aléatoire généré.');
  };

  const clearDeck = () => {
    setCardIds([]);
    showToast('Deck vidé.');
  };

  const applyPreset = (preset: DeckPreset) => {
    if (confirmPresetId !== preset.id) {
      setConfirmPresetId(preset.id);
      return;
    }
    const ids = buildPresetDeck(preset.id);
    if (ids.length !== DECK_SIZE) {
      showToast('Impossible de générer ce preset.');
      setConfirmPresetId(null);
      return;
    }
    setCardIds(ids);
    setConfirmPresetId(null);
    setPresetsOpen(false);
    showToast(`Deck « ${preset.name} » généré.`);
  };

  const launch = () => {
    if (!canPlay) {
      showToast(`Choisissez exactement ${DECK_SIZE} cartes.`);
      return;
    }
    newInfinityGame(cardIds, realConditions);
    goToGame();
  };

  const btnBase =
    'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg ring-1 text-[9px] uppercase tracking-wide transition shrink-0';

  return (
    <div className="infinity-deck fixed inset-0 flex flex-col bg-gradient-to-b from-shadow-900 via-[#0b1a2e] to-shadow-950">
      <header
        className={[
          'shrink-0 px-4',
          mini
            ? 'pt-[max(0.75rem,env(safe-area-inset-top))] pb-1'
            : 'pt-[max(1rem,env(safe-area-inset-top))] pb-2',
        ].join(' ')}
      >
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="display-font text-base sm:text-lg text-cyan-300 tracking-[0.18em] uppercase">
              Infinity
            </h1>
            <p className="text-[10px] text-ui-muted mt-0.5">
              {realConditions
                ? 'Deck éphémère · conditions réelles · sans récompense'
                : 'Deck éphémère · cosmos ∞ · main complète · sans récompense'}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-white/[0.04] ring-1 ring-white/10 px-3 py-2">
          <div className="min-w-0">
            <p className="text-[11px] font-medium text-cosmos-100">
              Conditions réelles
            </p>
            <p className="text-[9px] text-ui-muted mt-0.5 leading-snug">
              Cosmos et pioche comme une partie normale (deck + main).
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={realConditions}
            aria-label="Conditions réelles"
            onClick={() => setRealConditions((v) => !v)}
            className={[
              'relative shrink-0 w-11 h-6 rounded-full transition ring-1',
              realConditions
                ? 'bg-cyan-500/80 ring-cyan-300/50'
                : 'bg-white/10 ring-white/15',
            ].join(' ')}
          >
            <span
              className={[
                'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                realConditions ? 'translate-x-5' : 'translate-x-0',
              ].join(' ')}
            />
          </button>
        </div>

        <div className="relative mt-3 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => {
              setPresetsOpen((v) => !v);
              setConfirmPresetId(null);
            }}
            className={[
              btnBase,
              presetsOpen
                ? 'bg-cyan-500/25 ring-cyan-400/50 text-cyan-100'
                : 'bg-white/5 ring-white/12 text-cosmos-200 hover:bg-white/10',
            ].join(' ')}
            aria-label="Synergies"
            title="Presets de synergie"
          >
            <span className="text-[11px] leading-none" aria-hidden>
              ▲
            </span>
            <span>Synergies</span>
          </button>

          <button
            type="button"
            onClick={fillRandom}
            className={`${btnBase} bg-white/5 ring-white/12 text-cosmos-200 hover:bg-white/10`}
            aria-label="Remplir au hasard"
            title="Remplir au hasard"
          >
            <span className="text-[11px] leading-none font-bold" aria-hidden>
              ■
            </span>
            <span>Aléatoire</span>
          </button>

          <button
            type="button"
            onClick={clearDeck}
            className={`${btnBase} bg-rose-500/10 ring-rose-400/25 text-rose-200/90 hover:bg-rose-500/15`}
            aria-label="Vider le deck"
            title="Vider le deck"
          >
            <span className="text-[11px] leading-none" aria-hidden>
              ×
            </span>
            <span>Vider</span>
          </button>

          {presetsOpen ? (
            <>
              <button
                type="button"
                aria-label="Fermer synergies"
                className="fixed inset-0 z-40 cursor-default bg-black/80"
                onClick={() => {
                  setPresetsOpen(false);
                  setConfirmPresetId(null);
                }}
              />
              <div className="absolute left-0 right-0 top-full mt-1 z-50 max-h-[min(50vh,360px)] overflow-y-auto rounded-xl border border-white/15 bg-[#071018] shadow-2xl p-2.5 space-y-1">
                <p className="text-[9px] uppercase tracking-widest text-ui-muted px-1">
                  Presets de synergie
                </p>
                <p className="text-[9px] text-ui-muted px-1 pb-0.5">
                  Touchez deux fois pour confirmer.
                </p>
                {DECK_PRESETS.map((preset) => {
                  const pending = confirmPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset)}
                      className={[
                        'w-full text-left rounded-lg px-2.5 py-2 transition ring-1',
                        pending
                          ? 'bg-cyan-500/20 ring-cyan-400/50'
                          : 'bg-white/[0.03] ring-white/5 hover:bg-white/[0.07]',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-medium text-cosmos-100">
                          {preset.name}
                        </span>
                        {pending ? (
                          <span className="text-[9px] text-cyan-200 shrink-0">
                            Confirmer →
                          </span>
                        ) : null}
                      </div>
                      <p className="text-[10px] text-ui-muted mt-0.5 leading-snug">
                        {preset.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      </header>

      <main
        className={[
          'flex-1 min-h-0 flex flex-col px-4 safe-area-pb',
          mini ? 'pb-2' : 'pb-3',
        ].join(' ')}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-[10px] uppercase tracking-widest text-ui-muted">
            Deck test · {cardIds.length}/{DECK_SIZE}
          </p>
          {canPlay ? (
            <p className="text-[10px] text-cyan-300/90">Prêt</p>
          ) : (
            <p className="text-[10px] text-amber-300/90">
              {DECK_SIZE - cardIds.length} carte(s) manquante(s)
            </p>
          )}
        </div>

        <div className="flex-1 min-h-0 flex flex-col py-1 overflow-hidden">
          <DeckList
            cardIds={cardIds}
            onRemove={removeCard}
            onInspect={setInspectedDefId}
            onAddCard={() => {
              if (full) {
                showToast('Deck complet (12 cartes).');
                return;
              }
              setLibraryOpen(true);
            }}
          />

          {cardIds.length < DECK_SIZE ? (
            <button
              type="button"
              onClick={() => setLibraryOpen(true)}
              className="mt-3 mx-auto flex items-center gap-2 px-5 py-2 rounded-full text-xs ring-1 ring-cyan-400/45 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25 transition shrink-0"
            >
              <span className="text-base leading-none">+</span>
              Ajouter une carte
            </button>
          ) : null}
        </div>

        <div
          className={[
            'shrink-0 flex items-end justify-center gap-10 sm:gap-16',
            mini
              ? 'pt-2 pb-[max(0.25rem,env(safe-area-inset-bottom))]'
              : 'pt-4 pb-[max(0.25rem,env(safe-area-inset-bottom))]',
          ].join(' ')}
        >
          <NavButton label="Retour" icon={<BackIcon />} onClick={goToMenu} />
          <NavButton
            label="Lancer"
            icon={<PlayIcon />}
            primary
            disabled={!canPlay}
            onClick={launch}
          />
        </div>
      </main>

      <AnimatePresence>
        {libraryOpen ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed inset-0 z-[60] flex flex-col bg-[#060912]"
            role="dialog"
            aria-label="Bibliothèque Infinity"
          >
            <header className="shrink-0 px-4 pt-4 pb-3 border-b border-white/10 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="display-font text-sm tracking-[0.18em] text-cyan-300 uppercase">
                  Toutes les cartes
                </h2>
                <span className="text-[10px] tabular-nums text-ui-muted">
                  {filtered.length}
                </span>
              </div>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher…"
                className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-ui-muted focus:outline-none focus:ring-1 focus:ring-cyan-400/45"
              />
              <div className="grid grid-cols-5 gap-1.5">
                {QUICK_FACTIONS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFaction(f.id)}
                    className={[
                      'py-2 rounded-lg text-[10px] uppercase tracking-wider ring-1 transition',
                      faction === f.id
                        ? 'bg-cyan-500/25 ring-cyan-400/55 text-cyan-100'
                        : 'bg-white/5 ring-white/10 text-ui-muted hover:bg-white/10',
                    ].join(' ')}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </header>

            <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                {filtered.map((def) => {
                  const inDeck = deckSet.has(def.id);
                  const disabled = inDeck || full;
                  return (
                    <button
                      key={def.id}
                      type="button"
                      onClick={() => setPickedDefId(def.id)}
                      className={[
                        'relative flex justify-center rounded-xl transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60',
                        disabled
                          ? 'opacity-40 saturate-[0.35]'
                          : 'hover:scale-[1.04] active:scale-[0.98]',
                      ].join(' ')}
                      aria-label={def.name}
                    >
                      <CardView
                        card={defToPreviewInstance(def.id)}
                        size="sm"
                        holoMode="static"
                      />
                      {inDeck ? (
                        <span className="absolute inset-x-1 bottom-1 text-[8px] uppercase tracking-wider text-center rounded bg-black/70 text-cosmos-200 py-0.5">
                          Deck
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <footer className="shrink-0 p-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setLibraryOpen(false)}
                className="w-full py-3 rounded-xl text-sm ring-1 ring-white/15 bg-white/5 hover:bg-white/10 text-cosmos-200"
              >
                Fermer
              </button>
            </footer>

            <CardPickDetailModal
              defId={pickedDefId}
              canAdd={
                pickedDefId !== null &&
                !deckSet.has(pickedDefId) &&
                !full
              }
              addDisabledReason={
                pickedDefId === null
                  ? null
                  : deckSet.has(pickedDefId)
                    ? 'Carte déjà présente dans le deck.'
                    : full
                      ? 'Deck complet (12 cartes).'
                      : null
              }
              onClose={() => setPickedDefId(null)}
              onAdd={addCard}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>

      <CardDetailByDefId
        defId={inspectedDefId}
        onClose={() => setInspectedDefId(null)}
      />
    </div>
  );
}
