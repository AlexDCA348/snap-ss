import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { getFeaturedCampaignChapterId } from '../collection/campaignProgress';
import { ARMORY_HIDDEN_CHAPTER_IDS } from '../collection/config/chapters';
import type { ChapterId } from '../collection/types';
import { ArmorDetailModal } from '../components/collection/ArmorDetailModal';
import { ChapterStepTabs } from '../components/collection/ChapterStepTabs';
import { CollectionArmorRow } from '../components/collection/CollectionArmorRow';
import { MainMenuBackground } from '../components/menu/MainMenuBackground';
import { useAppStore } from '../store/appStore';
import { useCollectionStore } from '../store/collectionStore';

export function ArmoryScreen() {
  const goToMenu = useAppStore((s) => s.goToMenu);
  const collection = useCollectionStore((s) => s.collection);
  const getArmorViewModels = useCollectionStore((s) => s.getArmorViewModels);
  const getArmorDetail = useCollectionStore((s) => s.getArmorDetail);
  const [activeChapterId, setActiveChapterId] = useState<ChapterId>(() =>
    getFeaturedCampaignChapterId(collection),
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

  const detail = selectedArmorId ? getArmorDetail(selectedArmorId) : null;

  return (
    <div className="collection-screen relative min-h-screen pt-6 pb-24 overflow-hidden">
      <MainMenuBackground chapterId={activeChapterId} />

      <div className="relative z-10">
      <ChapterStepTabs
        activeChapterId={activeChapterId}
        onChange={setActiveChapterId}
      />

      <div className="max-w-lg mx-auto px-4 md:px-8 mt-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="flex flex-col gap-4"
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

      <ArmorDetailModal detail={detail} onClose={() => setSelectedArmorId(null)} />

      <div className="collection-screen__dock fixed bottom-0 inset-x-0 z-20 safe-area-pb pointer-events-none">
        <div className="flex justify-center px-6 pt-3 pb-4 pointer-events-auto">
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
