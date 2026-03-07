import { cloudflare } from '@cloudflare/vite-plugin';
import { reactRouter } from '@react-router/dev/vite';
import { cloudflareDevProxy } from '@react-router/dev/vite/cloudflare';
import { CONFIG_PATH, getLoadContext, writeConfig } from 'sst-react-router-cloudflare';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(async ({ command }) => {
  await writeConfig({
    compatibilityDate: '2025-04-04',
    includeLinks: command === 'serve',
  });

  return {
    plugins: [
      command === 'serve'
        ? cloudflareDevProxy({
            configPath: CONFIG_PATH,
            getLoadContext,
          })
        : cloudflare({
            configPath: CONFIG_PATH,
            viteEnvironment: { name: 'ssr' },
          }),
      reactRouter(),
      tsconfigPaths({ projects: ['./tsconfig.json'] }),
    ],
  };
});
