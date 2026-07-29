import { motion, useReducedMotion } from 'framer-motion';
import { getChapterMenuBackgroundUrl } from '../../collection/config/chapterBackgrounds';
import type { ChapterId } from '../../collection/types';

interface Props {
  chapterId: ChapterId;
}

/** Fond plein écran du menu — illustration du chapitre en cours. */
export function MainMenuBackground({ chapterId }: Props) {
  const src = getChapterMenuBackgroundUrl(chapterId);
  const reduceMotion = useReducedMotion();

  return (
    <div className="main-menu-bg fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {src ? (
        <motion.div
          key={chapterId}
          className="main-menu-bg__pan absolute -inset-[12%]"
          initial={
            reduceMotion
              ? { opacity: 0 }
              : { opacity: 0, x: '-2.5%', y: '-1%' }
          }
          animate={
            reduceMotion
              ? { opacity: 1 }
              : { opacity: 1, x: '2.5%', y: '1%' }
          }
          transition={
            reduceMotion
              ? { duration: 0.35, ease: 'easeOut' }
              : {
                  opacity: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
                  x: { duration: 14, ease: 'linear' },
                  y: { duration: 14, ease: 'linear' },
                }
          }
        >
          <img
            src={src}
            alt=""
            className="main-menu-bg__image absolute inset-0 w-full h-full object-cover object-center"
          />
        </motion.div>
      ) : (
        <div className="main-menu-bg__fallback absolute inset-0" />
      )}
      <div className="main-menu-bg__overlay absolute inset-0" />
    </div>
  );
}
