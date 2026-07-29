interface NavButtonProps {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  primary?: boolean;
  disabled?: boolean;
}

export function NavButton({
  label,
  onClick,
  icon,
  primary = false,
  disabled = false,
}: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'main-menu-nav__btn flex flex-col items-center gap-1.5 transition',
        primary ? 'main-menu-nav__btn--primary -mt-3' : 'main-menu-nav__btn--secondary',
        disabled ? 'opacity-40 pointer-events-none' : '',
      ].join(' ')}
    >
      <span
        className={[
          'flex items-center justify-center rounded-2xl ring-1 transition',
          primary
            ? 'w-16 h-16 bg-gradient-to-br from-gold-400 to-gold-600 text-black ring-gold-200/50 shadow-[0_0_24px_rgba(212,175,55,0.35)]'
            : 'w-12 h-12 bg-white/5 text-cosmos-100 ring-white/15 hover:bg-white/10',
        ].join(' ')}
      >
        {icon}
      </span>
      <span
        className={[
          'text-[10px] uppercase tracking-wider',
          primary ? 'text-gold-300 font-medium' : 'text-ui-muted',
        ].join(' ')}
      >
        {label}
      </span>
    </button>
  );
}
