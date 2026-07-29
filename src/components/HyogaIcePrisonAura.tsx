import { AnimatePresence, motion } from 'framer-motion';
import type { CardSize } from '../game/cardSizes';
import { auraUrl } from '../game/auraAssets';

const ICE_ASSETS = {
  frost: auraUrl('hyoga/frost-texture.svg'),
  block: auraUrl('hyoga/ice-block.svg'),
  icicles: auraUrl('hyoga/icicles.svg'),
  icicleRow: auraUrl('hyoga/icicle-row.svg'),
  glacier: auraUrl('hyoga/glacier-base.svg'),
  crystal: auraUrl('hyoga/ice-crystal.svg'),
} as const;

interface Props {
  size?: CardSize;
}

/** Cercueil de glace d’Hyoga — la carte ennemie est emprisonnée dans un glaçon. */
export function HyogaIcePrisonAura({ size = 'md' }: Props) {
  const crystalCount = size === 'xs' ? 2 : size === 'sm' ? 3 : 4;

  return (
    <AnimatePresence>
      <motion.div
        key="hyoga-ice"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        aria-label="Figé dans un cercueil de glace"
        title="Figé dans un cercueil de glace"
        className="hyoga-ice-prison absolute inset-0 z-20 overflow-hidden rounded-xl pointer-events-none"
      >
        <div
          className="hyoga-ice-prison__frost"
          style={{ backgroundImage: `url(${ICE_ASSETS.frost})` }}
        />
        <div className="hyoga-ice-prison__mist" />
        <img
          src={ICE_ASSETS.block}
          alt=""
          draggable={false}
          className="hyoga-ice-prison__block"
        />
        <img
          src={ICE_ASSETS.icicleRow}
          alt=""
          draggable={false}
          className="hyoga-ice-prison__icicle-row"
        />
        <img
          src={ICE_ASSETS.icicles}
          alt=""
          draggable={false}
          className="hyoga-ice-prison__icicles hyoga-ice-prison__icicles--left"
        />
        <img
          src={ICE_ASSETS.icicles}
          alt=""
          draggable={false}
          className="hyoga-ice-prison__icicles hyoga-ice-prison__icicles--right"
        />
        <img
          src={ICE_ASSETS.glacier}
          alt=""
          draggable={false}
          className="hyoga-ice-prison__glacier"
        />
        {Array.from({ length: crystalCount }, (_, i) => (
          <img
            key={i}
            src={ICE_ASSETS.crystal}
            alt=""
            draggable={false}
            className={[
              'hyoga-ice-prison__crystal',
              `hyoga-ice-prison__crystal--${i}`,
            ].join(' ')}
          />
        ))}
        <div className="hyoga-ice-prison__rim" />
        <div className="hyoga-ice-prison__sparkles" />
      </motion.div>
    </AnimatePresence>
  );
}
