import { useEffect, useMemo, useState } from 'react';
import type { CardArtFormat } from '../game/cardArt';
import { getCardArtCandidates, getCardArtObjectPosition } from '../game/cardArt';
import { isSeiyaCard } from '../game/seiyaCosmos';
import type { Faction } from '../game/types';
import { CardSigil } from './CardSigil';

interface Props {
  defId: string;
  faction: Faction;
  nameInitial: string;
  className?: string;
  onFormatChange?: (format: CardArtFormat | null) => void;
  continuousVfxActive?: boolean;
  seiyaAuraActive?: boolean;
}

function formatFromSrc(src: string): CardArtFormat {
  return src.toLowerCase().endsWith('.png') ? 'png' : 'photo';
}

function isDuplicateArt(defId: string): boolean {
  return defId.endsWith('-double');
}

/**
 * Portrait personnage (public/cards) avec repli sur le sigil SVG.
 * PNG prioritaire sur JPG ; format notifié au parent pour l'empilement holo.
 */
export function CardArt({
  defId,
  faction,
  nameInitial,
  className = '',
  onFormatChange,
  continuousVfxActive = true,
  seiyaAuraActive = false,
}: Props) {
  const candidates = useMemo(() => getCardArtCandidates(defId), [defId]);
  const [candidateIndex, setCandidateIndex] = useState(0);

  useEffect(() => {
    setCandidateIndex(0);
  }, [defId, candidates]);

  const src = candidates[candidateIndex];
  const exhausted = candidateIndex >= candidates.length;
  const isPng = Boolean(src?.toLowerCase().endsWith('.png'));
  const artInvert = isDuplicateArt(defId);
  const objectPosition = getCardArtObjectPosition(defId);
  const isSeiyaCosmos = isSeiyaCard(defId) && continuousVfxActive && seiyaAuraActive;

  useEffect(() => {
    if (!onFormatChange) return;
    if (!candidates.length || exhausted || !src) {
      onFormatChange(null);
      return;
    }
    onFormatChange(formatFromSrc(src));
  }, [candidates.length, exhausted, src, onFormatChange]);

  if (!candidates.length || exhausted || !src) {
    return (
      <div className={['absolute inset-0', className].join(' ')}>
        <CardSigil faction={faction} initial={nameInitial} />
      </div>
    );
  }

  return (
    <div
      className={[
        'card-art absolute inset-0 overflow-hidden rounded-xl',
        isPng ? 'card-art--png' : 'card-art--photo',
        isSeiyaCosmos ? 'card-art--seiya-cosmos z-[2]' : 'z-0',
        artInvert ? 'card-art--invert' : '',
        className,
      ].join(' ')}
    >
      <img
        key={src}
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={() => setCandidateIndex((i) => i + 1)}
        className="absolute inset-0 w-full h-full object-cover scale-105"
        style={{
          objectPosition,
          ...(artInvert ? { filter: 'invert(1)' } : {}),
        }}
      />
      {!isPng && !artInvert ? (
        <div
          className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/70 via-transparent to-transparent"
          aria-hidden
        />
      ) : null}
    </div>
  );
}
