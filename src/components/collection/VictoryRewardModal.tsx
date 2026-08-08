import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { CHAPTER_BY_ID } from '../../collection/config/chapters';
import { ARMOR_CATALOG } from '../../collection/data/armorCatalog';
import { getFragmentLabel } from '../../collection/config/fragmentTypes';
import { getCardDef } from '../../game/cards';
import { useCollectionStore } from '../../store/collectionStore';
import type { Reward } from '../../collection/types';
import { ArmorIllustration } from './ArmorIllustration';

interface Props {
  reward: Reward | null;
  onDismiss: () => void;
}

type Step = 'fragment' | 'complete';

export function VictoryRewardModal({ reward, onDismiss }: Props) {
  const [step, setStep] = useState<Step>('fragment');
  const getArmorDetail = useCollectionStore((s) => s.getArmorDetail);

  useEffect(() => {
    if (reward) setStep('fragment');
  }, [reward]);

  const armorDetail = useMemo(
    () => (reward ? getArmorDetail(reward.fragment.armorId) : null),
    [reward, getArmorDetail],
  );

  if (!reward) return null;

  const armor = ARMOR_CATALOG.byArmorId.get(reward.fragment.armorId);
  const armorName = armor?.name ?? 'Armure inconnue';
  const fragmentLabel = getFragmentLabel(reward.fragment.fragmentType);
  const unlockedCardName = reward.unlockedCardId
    ? getCardDef(reward.unlockedCardId).name
    : null;

  const showCompleteStep = Boolean(reward.completedArmor && reward.unlockedCardId);

  const newChapterLabels = reward.newlyUnlockedChapters
    .map((id) => CHAPTER_BY_ID.get(id)?.label)
    .filter(Boolean);

  const handleContinue = () => {
    if (step === 'fragment' && showCompleteStep) {
      setStep('complete');
      return;
    }
    onDismiss();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[95] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-none" />
        <motion.div
          role="dialog"
          aria-modal
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 16, opacity: 0 }}
          className="relative w-full max-w-sm rounded-2xl bg-cosmos-950 p-6 text-center shadow-2xl"
        >
          {armorDetail ? (
            <div className="mx-auto w-full max-w-[12rem] mb-4">
              <ArmorIllustration
                cardId={armorDetail.unlockedCardId}
                unlocked={step === 'complete' || armorDetail.status === 'unlocked'}
                name={armorDetail.name}
                fragments={armorDetail.fragments}
              />
            </div>
          ) : null}

          {step === 'fragment' ? (
            <>
              <p className="display-font text-2xl text-gold-300">Victoire !</p>
              <p className="text-sm text-ui-muted mt-2">Vous obtenez</p>
              <p className="display-font text-xl text-cosmos-100 mt-3">{fragmentLabel}</p>
              <p className="text-sm text-gold-200/90 mt-1">{armorName}</p>
              <p className="text-xs text-ui-muted mt-2 tabular-nums">
                {armorDetail
                  ? `${armorDetail.progressOwned} / ${armorDetail.progressTotal}`
                  : null}
              </p>
              {reward.isNew ? (
                <p className="text-xs text-emerald-300/90 mt-2">Nouveau fragment</p>
              ) : (
                <p className="text-xs text-amber-200/90 mt-2">
                  Doublon → +{reward.starDustGained || 1} Poussière d&apos;Étoiles
                </p>
              )}
            </>
          ) : (
            <>
              <p className="display-font text-xl text-gold-300">Armure complétée</p>
              <p className="text-sm text-cosmos-200 mt-2">{armorName}</p>
              <p className="display-font text-lg text-emerald-300 mt-3">
                {unlockedCardName} rejoint votre collection !
              </p>
              {newChapterLabels.length > 0 ? (
                <p className="text-sm text-gold-200/90 mt-4 leading-snug">
                  Nouveau chapitre de récompenses :{' '}
                  <span className="text-gold-300">{newChapterLabels.join(', ')}</span>
                </p>
              ) : null}
            </>
          )}

          <button
            type="button"
            onClick={handleContinue}
            className="mt-6 w-full py-2.5 rounded-full display-font text-sm tracking-wider bg-gradient-to-r from-gold-400 to-gold-600 text-black hover:from-gold-300 hover:to-gold-500 transition"
          >
            {step === 'fragment' && showCompleteStep ? 'Continuer' : 'OK'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
