const BASE = import.meta.env.BASE_URL;

/** URL publique d'un sprite sous `public/auras/`. */
export function auraUrl(relativePath: string): string {
  const path = relativePath.replace(/^\//, '');
  const normalized = path.startsWith('auras/') ? path : `auras/${path}`;
  return `${BASE}${normalized}`;
}

/** Variables CSS pour les fonds d'aura définis dans index.css. */
export function initAuraCssVars(): void {
  const root = document.documentElement;
  root.style.setProperty(
    '--vfx-shaka-mandala-ring',
    `url('${auraUrl('shaka/mandala-ring.svg')}')`,
  );
  root.style.setProperty(
    '--vfx-algol-stone-texture',
    `url('${auraUrl('algol/stone-texture.svg')}')`,
  );
}
