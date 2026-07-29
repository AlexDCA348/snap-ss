import { motion } from 'framer-motion';
import type { CardSize } from '../game/cardSizes';

import { auraUrl } from '../game/auraAssets';

const DRAGON_SPRITE = auraUrl('shiryu/dragon-sprite.svg');

interface Props {
  size?: CardSize;
}

/** Tête de dragon — tick de fin de tour (+1 cosmos). */
export function ShiryuDragonSprite({ size = 'md' }: Props) {
  const spriteW = size === 'xs' ? 64 : size === 'sm' ? 80 : 96;
  const spriteH = size === 'xs' ? 88 : size === 'sm' ? 110 : 132;

  return (
    <motion.div
      aria-hidden
      className="shiryu-dragon absolute left-1/2 z-[18] pointer-events-none overflow-visible"
      style={{ width: spriteW, height: spriteH, marginLeft: -(spriteW / 2), top: '8%' }}
      initial={{ opacity: 0, scale: 0.35, y: 32, rotate: -4 }}
      animate={{
        opacity: [0, 0.95, 1, 0.9, 0],
        scale: [0.35, 0.82, 0.96, 1.08, 1.18],
        y: [32, 4, -22, -48, -78],
        rotate: [-4, 0, 1, 2, 3],
      }}
      exit={{ opacity: 0, scale: 1.22, y: -86 }}
      transition={{ duration: 1.45, ease: [0.22, 0.68, 0.24, 1] }}
    >
      <img
        src={DRAGON_SPRITE}
        alt=""
        draggable={false}
        className="shiryu-dragon__sprite w-full h-full object-contain"
      />
      <span className="shiryu-dragon__trail" />
      <span className="shiryu-dragon__halo" />
    </motion.div>
  );
}
