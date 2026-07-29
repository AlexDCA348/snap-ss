import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Déploiement dans un sous-dossier (ex: https://alexandre-dechosal.fr/snap-ssa/)
  base: '/snap-ssa/',
});
