import type { FragmentType } from '../types';

export interface FragmentTypeDefinition {
  type: FragmentType;
  label: string;
}

export const DEFAULT_FRAGMENT_TYPES: FragmentType[] = [
  'helmet',
  'chest',
  'leftArm',
  'rightArm',
  'leftLeg',
  'rightLeg',
];

export const FRAGMENT_TYPE_LABELS: Record<FragmentType, string> = {
  helmet: 'Casque',
  chest: 'Plastron',
  leftArm: 'Bras gauche',
  rightArm: 'Bras droit',
  leftLeg: 'Jambe gauche',
  rightLeg: 'Jambe droite',
};

export const FRAGMENT_TYPES: FragmentTypeDefinition[] = DEFAULT_FRAGMENT_TYPES.map(
  (type) => ({
    type,
    label: FRAGMENT_TYPE_LABELS[type],
  }),
);

export function getFragmentLabel(type: FragmentType): string {
  return FRAGMENT_TYPE_LABELS[type];
}

export function buildFragmentId(armorId: string, fragmentType: FragmentType): string {
  return `${armorId}:${fragmentType}`;
}
