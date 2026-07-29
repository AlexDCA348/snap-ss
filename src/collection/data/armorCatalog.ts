import { getBuildableCardDefs } from '../../game/buildableCards';
import { getCardDef } from '../../game/cards';
import {
  buildArmorId,
  buildArmorName,
  resolveChapterForCard,
  resolveRarityForCard,
} from '../config/chapterRules';
import {
  buildFragmentId,
  DEFAULT_FRAGMENT_TYPES,
} from '../config/fragmentTypes';
import { STARTER_CARD_ID_SET } from '../config/starterCards';
import type {
  ArmorCatalog,
  ArmorDefinition,
  ArmorFragmentDefinition,
} from '../types';

function buildCatalog(): ArmorCatalog {
  const armors: ArmorDefinition[] = [];
  const fragments: ArmorFragmentDefinition[] = [];

  for (const card of getBuildableCardDefs()) {
    if (STARTER_CARD_ID_SET.has(card.id)) continue;

    const armorId = buildArmorId(card.id);
    const chapterId = resolveChapterForCard(card);
    const rarity = resolveRarityForCard(card);

    const armor: ArmorDefinition = {
      id: armorId,
      name: buildArmorName(card.name),
      rarity,
      unlockedCardId: card.id,
      chapterId,
      requiredFragments: [...DEFAULT_FRAGMENT_TYPES],
    };
    armors.push(armor);

    for (const fragmentType of DEFAULT_FRAGMENT_TYPES) {
      fragments.push({
        id: buildFragmentId(armorId, fragmentType),
        armorId,
        fragmentType,
        rarity,
        chapterId,
      });
    }
  }

  armors.sort((a, b) => {
    const cardA = getCardDef(a.unlockedCardId);
    const cardB = getCardDef(b.unlockedCardId);
    return cardA.cost - cardB.cost || cardA.name.localeCompare(cardB.name, 'fr');
  });

  return {
    armors,
    fragments,
    byArmorId: new Map(armors.map((a) => [a.id, a])),
    byFragmentId: new Map(fragments.map((f) => [f.id, f])),
    byCardId: new Map(armors.map((a) => [a.unlockedCardId, a])),
  };
}

export const ARMOR_CATALOG = buildCatalog();
