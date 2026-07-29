import { useEffect, useState, type CSSProperties } from 'react';
import {
  getPreferredCardArtFormat,
  hasCardArt,
  type CardArtFormat,
} from '../game/cardArt';
import type { Faction } from '../game/types';
import type { HoloMode } from '../hooks/useCardPointerVars';
import type { CardSize } from '../game/cardSizes';
import { isSeiyaCard, seiyaCosmosAnimSpeed, seiyaCosmosIntensity } from '../game/seiyaCosmos';
import { aresInfernoAnimSpeed, aresInfernoIntensity, isAresCard } from '../game/aresInferno';
import { ShakaMandalaAura } from './ShakaMandalaAura';
import { AresDemonAura } from './AresDemonAura';
import { CardArt } from './CardArt';
import { CardHoloOverlays } from './CardHoloLayers';
import { SeiyaCosmosAura } from './SeiyaCosmosAura';

interface Props {
  defId: string;
  faction: Faction;
  nameInitial: string;
  holoMode: HoloMode;
  faceDown?: boolean;
  interacting?: boolean;
  className?: string;
  /** Puissance affichée — intensité de l'aura cosmos (Seiya). */
  displayPower?: number;
  cardSize?: CardSize;
  /** Faux quand la carte est gelée (Hyoga / Camus). */
  continuousVfxActive?: boolean;
  /** Mandala Shaka — uniquement sur le plateau, effet actif. */
  shakaMandalaActive?: boolean;
  /** Inferno Arès — puissance liée aux destructions. */
  aresInfernoActive?: boolean;
  aresSurge?: boolean;
  showAresEyes?: boolean;
  /** VFX autorisés à dépasser le cadre (plateau). */
  effectOverflow?: boolean;
}

/**
 * Portrait + holo : JPG = holo par-dessus (blend) ; PNG = holo derrière, personnage devant.
 */
export function CardFaceArtStack({
  defId,
  faction,
  nameInitial,
  holoMode,
  faceDown = false,
  interacting = false,
  className = '',
  displayPower = 2,
  cardSize = 'md',
  continuousVfxActive = true,
  shakaMandalaActive = false,
  aresInfernoActive = false,
  aresSurge = false,
  showAresEyes = false,
  effectOverflow = false,
}: Props) {
  const withArt = hasCardArt(defId);
  const isSeiya = isSeiyaCard(defId);
  const isAres = isAresCard(defId);
  const seiyaIntensity =
    isSeiya && continuousVfxActive ? seiyaCosmosIntensity(displayPower) : 0;
  const isSeiyaVfx = seiyaIntensity > 0;
  const aresIntensity =
    isAres && aresInfernoActive ? aresInfernoIntensity(displayPower) : 0;
  const isAresInferno = isAres && aresInfernoActive;
  const isShakaVfx = shakaMandalaActive;
  const faceOverflow =
    isSeiyaVfx || isAresInferno || showAresEyes || isShakaVfx || effectOverflow;
  const seiyaSpeed = isSeiyaVfx ? seiyaCosmosAnimSpeed(displayPower) : 1;
  const aresSpeed = isAresInferno ? aresInfernoAnimSpeed(displayPower) : 1;
  const [artFormat, setArtFormat] = useState<CardArtFormat>(() =>
    withArt ? getPreferredCardArtFormat(defId) : 'photo',
  );

  useEffect(() => {
    setArtFormat(withArt ? getPreferredCardArtFormat(defId) : 'photo');
  }, [defId, withArt]);

  const art = (
    <CardArt
      defId={defId}
      faction={faction}
      nameInitial={nameInitial}
      continuousVfxActive={continuousVfxActive}
      seiyaAuraActive={isSeiyaVfx}
      onFormatChange={(f) => {
        setArtFormat(f ?? (withArt ? getPreferredCardArtFormat(defId) : 'photo'));
      }}
    />
  );
  const holo = (
    <CardHoloOverlays
      faction={faction}
      mode={holoMode}
      faceDown={faceDown}
      interacting={interacting}
    />
  );

  return (
    <div
      className={[
        'card-face absolute inset-0 rounded-xl',
        withArt ? 'card-face--with-art' : '',
        artFormat === 'png' ? 'card-face--png-art' : '',
        isSeiyaVfx ? 'card-face--seiya-cosmos overflow-visible' : isAresInferno || showAresEyes ? 'card-face--ares-inferno overflow-visible' : isShakaVfx ? 'card-face--shaka-mandala overflow-visible' : faceOverflow ? 'overflow-visible' : 'overflow-hidden',
        className,
      ].join(' ')}
      style={
        isAresInferno
          ? ({
              '--ares-i': aresIntensity,
              '--ares-speed': aresSpeed,
            } as CSSProperties)
          : isSeiyaVfx
          ? ({
              '--seiya-i': seiyaIntensity,
              '--seiya-speed': seiyaSpeed,
            } as CSSProperties)
          : undefined
      }
    >
      {isAresInferno ? (
        <AresDemonAura
          power={displayPower}
          size={cardSize}
          placement="inner"
          surge={aresSurge}
        />
      ) : null}
      {isSeiyaVfx ? <SeiyaCosmosAura power={displayPower} size={cardSize} placement="inner" /> : null}
      {isShakaVfx ? <ShakaMandalaAura size={cardSize} placement="inner" /> : null}
      {artFormat === 'png' ? (
        <>
          {!isSeiyaVfx && !isAresInferno ? holo : null}
          {art}
          {isSeiyaVfx ? (
            <SeiyaCosmosAura power={displayPower} size={cardSize} placement="front" />
          ) : null}
        </>
      ) : (
        <>
          {art}
          {!isSeiyaVfx && !isAresInferno ? holo : null}
        </>
      )}
    </div>
  );
}
