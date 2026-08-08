interface Props {
  amount: number;
  compact?: boolean;
  className?: string;
}

/** Compteur de Poussière d'Étoiles — lecture seule. */
export function StarDustBadge({ amount, compact = false, className = '' }: Props) {
  return (
    <div
      className={[
        'inline-flex items-center gap-1.5 rounded-full ring-1 ring-amber-300/30 bg-amber-500/10 text-amber-100',
        compact ? 'px-2 py-0.5' : 'px-2.5 py-1',
        className,
      ].join(' ')}
      title="Poussière d'Étoiles"
    >
      <span
        aria-hidden
        className={[
          'rounded-full bg-gradient-to-br from-amber-200 to-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.45)]',
          compact ? 'w-1.5 h-1.5' : 'w-2 h-2',
        ].join(' ')}
      />
      <span
        className={[
          'tabular-nums font-medium tracking-wide',
          compact ? 'text-[10px]' : 'text-xs',
        ].join(' ')}
      >
        {amount}
      </span>
      {!compact ? (
        <span className="text-[10px] uppercase tracking-wider text-amber-200/70">
          Poussière
        </span>
      ) : null}
    </div>
  );
}
