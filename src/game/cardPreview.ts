import { getCardDef } from './cards';
import type { CardInstance, PlayerId } from './types';

let previewUid = 0;

/** Instance factice pour afficher une carte hors partie (deck builder, bibliothèque). */
export function defToPreviewInstance(
  defId: string,
  ownerId: PlayerId = 'player',
): CardInstance {
  previewUid += 1;
  const def = getCardDef(defId);
  return {
    uid: `preview-${defId}-${previewUid}`,
    defId: def.id,
    ownerId,
    basePower: def.power,
    revealed: true,
  };
}
