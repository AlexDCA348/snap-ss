import { useEffect, useMemo, useRef } from 'react';
import {
  getCampaignChapterSteps,
} from '../../collection/campaignProgress';
import { useAppStore } from '../../store/appStore';
import { useCollectionStore } from '../../store/collectionStore';

/** Slider horizontal manuel — étapes de progression campagne. */
export function CampaignProgressSlider() {
  const collection = useCollectionStore((s) => s.collection);
  const goToArmory = useAppStore((s) => s.goToArmory);
  const scrollRef = useRef<HTMLDivElement>(null);

  const steps = useMemo(
    () => getCampaignChapterSteps(collection),
    [collection],
  );

  const currentIndex = useMemo(() => {
    const idx = steps.findIndex((s) => s.status === 'current');
    if (idx >= 0) return idx;
    const lastComplete = [...steps].reverse().findIndex((s) => s.status === 'complete');
    if (lastComplete >= 0) return steps.length - 1 - lastComplete;
    return 0;
  }, [steps]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const slide = el.children[currentIndex] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [currentIndex]);

  return (
    <div className="campaign-slider w-full">
      <p className="campaign-slider__label mb-2 mx-4">
        Progression
      </p>
      <div
        ref={scrollRef}
        className="campaign-slider__track flex gap-2 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-1 px-4"
      >
        {steps.map((step, index) => (
          <button
            key={step.chapterId}
            type="button"
            onClick={() => goToArmory(step.chapterId)}
            className={[
              'campaign-slider__slide snap-center shrink-0 w-[min(72vw,240px)] rounded-xl border px-3 py-2.5 transition text-left',
              step.status === 'current'
                ? 'border-gold-400/55 bg-gold-500/12 shadow-[0_0_20px_rgba(212,175,55,0.12)]'
                : step.status === 'complete'
                  ? 'border-emerald-400/35 bg-emerald-500/8'
                  : 'border-white/10 opacity-55',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black/30',
            ].join(' ')}
            aria-current={step.status === 'current' ? 'step' : undefined}
            aria-label={`Ouvrir les armures de ${step.label}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[9px] uppercase tracking-wider text-ui-muted">
                  Étape {index + 1}
                </div>
                <div className="display-font text-sm text-cosmos-100 truncate mt-0.5">
                  {step.label}
                </div>
              </div>
              <span
                className={[
                  'shrink-0 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-full ring-1',
                  step.status === 'complete'
                    ? 'text-emerald-200 ring-emerald-400/40 bg-emerald-500/15'
                    : step.status === 'current'
                      ? 'text-gold-200 ring-gold-400/40 bg-gold-500/15'
                      : 'text-ui-muted ring-white/10 bg-white/5',
                ].join(' ')}
              >
                {step.status === 'complete'
                  ? 'Terminé'
                  : step.status === 'current'
                    ? 'En cours'
                    : 'Verrouillé'}
              </span>
            </div>

            {step.status !== 'locked' ? (
              <div className="mt-2">
                <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={[
                      'h-full rounded-full transition-all',
                      step.status === 'complete' ? 'bg-emerald-400' : 'bg-gold-400',
                    ].join(' ')}
                    style={{
                      width: `${
                        step.progress.total > 0
                          ? Math.round((step.progress.owned / step.progress.total) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <p className="text-[10px] text-ui-muted mt-1 tabular-nums">
                  {step.progress.owned}/{step.progress.total} armures
                </p>
              </div>
            ) : (
              <p className="text-[10px] text-ui-muted mt-2">
                Terminez l&apos;étape précédente
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
