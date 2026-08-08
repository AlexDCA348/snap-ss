import { readFileSync } from 'node:fs';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version?: string;
};
const buildStamp = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Déploiement dans un sous-dossier (ex: https://alexandre-dechosal.fr/snap-ssa/)
  base: '/snap-ssa/',
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) return 'assets/index.css';
          return 'assets/[name][extname]';
        },
      },
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version ?? '0.0.0'),
    __BUILD_STAMP__: JSON.stringify(buildStamp),
  },
});
