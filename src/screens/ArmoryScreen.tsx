import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getFeaturedCampaignChapterId } from '../collection/campaignProgress';
import { ARMORY_HIDDEN_CHAPTER_IDS } from '../collection/config/chapters';
import type { ChapterId } from '../collection/types';
import { ArmorDetailModal } from '../components/collection/ArmorDetailModal';
import { ChapterStepTabs } from '../components/collection/ChapterStepTabs';
import { CollectionArmorRow } from '../components/collection/CollectionArmorRow';
import { StarDustBadge } from '../components/collection/StarDustBadge';
import { MainMenuBackground } from '../components/menu/MainMenuBackground';
import { useMiniPhone } from '../hooks/useMiniPhone';
import { useAppStore } from '../store/appStore';
import { useCollectionStore } from '../store/collectionStore';

export function ArmoryScreen() {
  const armoryChapterId = useAppStore((s) => s.armoryChapterId);
  const goToMenu = useAppStore((s) => s.goToMenu);
  const collection = useCollectionStore((s) => s.collection);
  const getArmorViewModels = useCollectionStore((s) => s.getArmorViewModels);
  const mini = useMiniPhone();
  const starDust = collection.starDust ?? 0;
  const featuredChapterId = useMemo(
    () => getFeaturedCampaignChapterId(collection),
    [collection],
  );
  const [activeChapterId, setActiveChapterId] = useState<ChapterId>(
    () => armoryChapterId ?? featuredChapterId,
  );
  const [selectedArmorId, setSelectedArmorId] = useState<string | null>(null);

  const armors = useMemo(() => getArmorViewModels(), [getArmorViewModels, collection]);

  const filtered = useMemo(
    () =>
      armors.filter(
        (a) =>
          a.chapterId === activeChapterId &&
          !ARMORY_HIDDEN_CHAPTER_IDS.includes(a.chapterId as ChapterId),
      ),
    [armors, activeChapterId],
  );

  useEffect(() => {
    setActiveChapterId(armoryChapterId ?? featuredChapterId);
    setSelectedArmorId(null);
  }, [armoryChapterId, featuredChapterId]);

  return (
    <div
      className={[
        'collection-screen relative min-h-screen overflow-hidden',
        mini
          ? 'pt-[max(0.75rem,env(safe-area-inset-top))] pb-20'
          : 'pt-[max(1.5rem,env(safe-area-inset-top))] pb-24',
      ].join(' ')}
    >
      <MainMenuBackground chapterId={activeChapterId} />

      <div className="relative z-10">
      <ChapterStepTabs
        activeChapterId={activeChapterId}
        onChange={setActiveChapterId}
      />

      <div className={['max-w-lg mx-auto px-4 md:px-8', mini ? 'mt-3' : 'mt-5'].join(' ')}>
        <div className="flex items-center justify-between gap-3 mb-3 px-1">
          <p className="text-[11px] text-ui-muted leading-snug">
            Les doublons deviennent de la{' '}
            <span className="text-amber-200/90">Poussière d&apos;Étoiles</span>
            {' '}— forgez les pièces manquantes.
          </p>
          <StarDustBadge amount={starDust} />
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          className={['flex flex-col', mini ? 'gap-3' : 'gap-4'].join(' ')}
        >
          {filtered.map((armor, index) => (
            <CollectionArmorRow
              key={armor.armorId}
              armor={armor}
              index={index}
              onClick={() => setSelectedArmorId(armor.armorId)}
            />
          ))}
        </motion.div>

        {filtered.length === 0 ? (
          <p className="text-center text-ui-muted mt-12">
            Aucune armure dans ce chapitre.
          </p>
        ) : null}
      </div>
      </div>

      <ArmorDetailModal
        armorId={selectedArmorId}
        onClose={() => setSelectedArmorId(null)}
      />

      <div className="collection-screen__dock fixed bottom-0 inset-x-0 z-20 safe-area-pb pointer-events-none">
        <div
          className={[
            'flex justify-center px-6 pointer-events-auto',
            mini ? 'pt-2 pb-3' : 'pt-3 pb-4',
          ].join(' ')}
        >
          <button
            type="button"
            onClick={goToMenu}
            aria-label="Fermer"
            className="collection-screen__close-btn flex flex-col items-center gap-1.5 transition"
          >
            <span className="flex items-center justify-center w-12 h-12 rounded-2xl ring-1 bg-white/5 text-cosmos-100 ring-white/15 hover:bg-white/10 transition text-2xl leading-none font-light">
              ×
            </span>
            <span className="text-[10px] uppercase tracking-wider text-ui-muted">
              Close
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
