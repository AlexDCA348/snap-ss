export type CardSize = 'xxs' | 'xs' | 'sm' | 'md';

export const CARD_DIMENSIONS: Record<CardSize, { width: number; height: number }> = {
  xxs: { width: 44, height: 60 },
  xs: { width: 52, height: 72 },
  sm: { width: 72, height: 99 },
  md: { width: 128, height: 176 },
};

export function boardCardSize(compact: boolean, mini = false): CardSize {
  if (mini) return 'xxs';
  return compact ? 'xs' : 'sm';
}

export function handCardSize(compact: boolean, mini = false): CardSize {
  if (mini) return 'xs';
  return compact ? 'sm' : 'md';
}
