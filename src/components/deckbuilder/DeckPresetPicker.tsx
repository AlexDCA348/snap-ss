import { useState } from 'react';
import {
  DECK_PRESETS,
  type DeckPreset,
} from '../../game/deckPresets';

interface Props {
  onApply: (preset: DeckPreset) => void;
}

export function DeckPresetPicker({ onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const handlePick = (preset: DeckPreset) => {
    if (confirmId !== preset.id) {
      setConfirmId(preset.id);
      return;
    }
    onApply(preset);
    setConfirmId(null);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setConfirmId(null);
        }}
        className="text-xs px-3 py-2 rounded-full ring-1 ring-gold-400/45 bg-gold-500/15 text-gold-100 hover:bg-gold-500/25 transition"
      >
        Synergies ▾
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Fermer"
            className="fixed inset-0 z-40 cursor-default bg-black/80"
            onClick={() => {
              setOpen(false);
              setConfirmId(null);
            }}
          />
          <div className="deck-modal-panel absolute left-0 top-full mt-2 z-50 w-[min(100vw-2rem,420px)] max-h-[min(70vh,520px)] overflow-y-auto rounded-xl border border-white/15 shadow-2xl p-2 space-y-1.5">
            <p className="text-[10px] uppercase tracking-widest text-ui-muted px-2 py-1">
              Presets de synergie
            </p>
            <p className="text-[10px] text-ui-muted px-2 pb-1">
              Remplit le deck avec un cœur thématique + complément intelligent
              (courbe & faction). Cliquez deux fois pour confirmer.
            </p>
            {DECK_PRESETS.map((preset) => {
              const pending = confirmId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePick(preset)}
                  className={[
                    'w-full text-left rounded-lg px-3 py-2.5 transition ring-1',
                    pending
                      ? 'bg-gold-500/20 ring-gold-400/50'
                      : 'bg-white/[0.03] ring-white/5 hover:bg-white/[0.07] hover:ring-white/10',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-cosmos-100">
                      {preset.name}
                    </span>
                    {pending ? (
                      <span className="text-[10px] text-gold-200 shrink-0">
                        Confirmer →
                      </span>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-ui-muted mt-0.5 leading-snug">
                    {preset.description}
                  </p>
                  <p className="text-[9px] text-ui-muted mt-1">
                    Cœur :{' '}
                    {preset.core
                      .slice(0, 4)
                      .map((id) => id.replace(/-/g, ' '))
                      .join(', ')}
                    {preset.core.length > 4 ? '…' : ''}
                  </p>
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
