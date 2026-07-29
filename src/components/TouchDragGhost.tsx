import { getCardDef } from '../game/cards';
import { handCardSize, CARD_DIMENSIONS } from '../game/cardSizes';
import { CardFaceArtStack } from './CardFaceArtStack';

interface Props {
  defId: string;
  x: number;
  y: number;
  compact?: boolean;
  mini?: boolean;
}

/** Fantôme de carte pendant le drag tactile. */
export function TouchDragGhost({ defId, x, y, compact = false, mini = false }: Props) {
  const def = getCardDef(defId);
  const size = handCardSize(compact, mini);
  const dims = CARD_DIMENSIONS[size];

  return (
    <div
      className="touch-drag-ghost fixed z-[200] pointer-events-none"
      style={{
        left: x,
        top: y,
        width: dims.width,
        height: dims.height,
        transform: 'translate(-50%, -50%)',
      }}
      aria-hidden
    >
      <div className="touch-drag-ghost__card card-frame neon-border ring-2 ring-cosmos-300/80 overflow-hidden w-full h-full shadow-cosmos opacity-95 scale-105">
        <CardFaceArtStack
          defId={def.id}
          faction={def.faction}
          nameInitial={def.name.charAt(0)}
          holoMode="static"
          interacting={false}
          displayPower={def.power}
          cardSize={size}
          continuousVfxActive={false}
          shakaMandalaActive={false}
          aresInfernoActive={false}
          aresSurge={false}
          showAresEyes={false}
          effectOverflow={false}
        />
      </div>
    </div>
  );
}
