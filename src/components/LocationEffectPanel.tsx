import type { LocationEffect, LocationEffectKind } from '../game/types';

const KIND_META: Record<
  LocationEffectKind,
  { label: string; short: string; chip: string; icon: string }
> = {
  ongoing: {
    label: 'Continu',
    short: 'C',
    chip: 'bg-emerald-500/25 ring-emerald-400/50 text-emerald-100',
    icon: '∞',
  },
  'on-reveal': {
    label: 'Au révélé',
    short: 'R',
    chip: 'bg-amber-500/25 ring-amber-400/50 text-amber-100',
    icon: '✦',
  },
  'end-reveal': {
    label: 'Fin de tour',
    short: 'F',
    chip: 'bg-rose-500/25 ring-rose-400/50 text-rose-100',
    icon: '☠',
  },
  restriction: {
    label: 'Restriction',
    short: 'X',
    chip: 'bg-sky-500/25 ring-sky-400/50 text-sky-100',
    icon: '⛔',
  },
  cosmos: {
    label: 'Cosmos',
    short: 'K',
    chip: 'bg-indigo-500/25 ring-indigo-400/50 text-indigo-100',
    icon: '⚡',
  },
  setup: {
    label: 'Début de partie',
    short: 'D',
    chip: 'bg-fuchsia-500/25 ring-fuchsia-400/50 text-fuchsia-100',
    icon: '▶',
  },
};

interface Props {
  effect: LocationEffect;
  muted?: boolean;
  /** Texte complet (modal détail) vs aperçu tronqué. */
  expanded?: boolean;
}

export function LocationEffectPanel({
  effect,
  muted = false,
  expanded = false,
}: Props) {
  const meta = KIND_META[effect.kind];
  return (
    <div
      className={[
        'mt-1.5 rounded-lg px-2 py-1.5 text-left ring-1',
        muted
          ? 'bg-black/40 ring-white/10 opacity-60'
          : 'bg-black/55 ring-white/15 backdrop-blur-sm',
      ].join(' ')}
      title={`${meta.label} : ${effect.text}`}
    >
      <div className="flex items-start gap-2">
        <span
          className={[
            'shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ring-1',
            meta.chip,
          ].join(' ')}
          aria-hidden
        >
          {meta.icon}
        </span>
        <div className="min-w-0 flex-1">
          <span
            className={[
              'inline-block text-[9px] uppercase tracking-widest font-semibold px-1.5 py-0.5 rounded',
              meta.chip,
            ].join(' ')}
          >
            {meta.label}
          </span>
          <p
            className={[
              'mt-1 text-xs md:text-sm leading-snug text-white/95',
              expanded ? '' : 'line-clamp-2',
            ].join(' ')}
          >
            {effect.text}
          </p>
        </div>
      </div>
    </div>
  );
}
