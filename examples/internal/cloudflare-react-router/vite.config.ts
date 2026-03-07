import { cloudflare } from 'sst-react-router-cloudflare/vite';
import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(({ command }) => ({
  plugins: [
    cloudflare({
      command,
      compatibilityDate: '2025-04-04',
    }),
    reactRouter(),
    tsconfigPaths({ projects: ['./tsconfig.json'] }),
  ],
}));
