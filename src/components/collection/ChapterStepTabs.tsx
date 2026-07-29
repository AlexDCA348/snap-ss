import { getCampaignChapterSteps } from '../../collection/campaignProgress';
import type { ChapterId } from '../../collection/types';
import { useCollectionStore } from '../../store/collectionStore';

interface Props {
  activeChapterId: ChapterId;
  onChange: (chapterId: ChapterId) => void;
}

/** Onglets des étapes de l'histoire (chapitres campagne). */
export function ChapterStepTabs({ activeChapterId, onChange }: Props) {
  const collection = useCollectionStore((s) => s.collection);
  const steps = getCampaignChapterSteps(collection);

  return (
    <div className="collection-tabs w-full overflow-x-auto scroll-smooth px-4 md:px-8">
      <div className="collection-tabs__track flex gap-2 min-w-min pb-1 pr-2">
        {steps.map((step, index) => {
          const active = step.chapterId === activeChapterId;
          return (
            <button
              key={step.chapterId}
              type="button"
              onClick={() => onChange(step.chapterId)}
              className={[
                'collection-tabs__tab shrink-0 px-4 py-2.5 rounded-xl text-left ring-1 transition min-w-[132px]',
                active
                  ? 'bg-gold-500/22 ring-gold-400/55 shadow-[0_0_16px_rgba(212,175,55,0.12)]'
                  : 'bg-black/35 ring-white/10 hover:bg-white/5',
                step.status === 'locked' ? 'opacity-60' : '',
              ].join(' ')}
              aria-current={active ? 'step' : undefined}
            >
              <div className="text-[9px] uppercase tracking-wider text-ui-muted">
                Étape {index + 1}
              </div>
              <div className="display-font text-sm text-cosmos-100 truncate mt-0.5">
                {step.label}
              </div>
              <div className="flex items-center justify-between gap-2 mt-1.5">
                <span
                  className={[
                    'text-[9px] uppercase tracking-wider',
                    step.status === 'complete'
                      ? 'text-emerald-300'
                      : step.status === 'current'
                        ? 'text-gold-300'
                        : 'text-ui-muted',
                  ].join(' ')}
                >
                  {step.status === 'complete'
                    ? 'Terminé'
                    : step.status === 'current'
                      ? 'En cours'
                      : 'Verrouillé'}
                </span>
                {step.status !== 'locked' ? (
                  <span className="text-[10px] tabular-nums text-ui-muted">
                    {step.progress.owned}/{step.progress.total}
                  </span>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
