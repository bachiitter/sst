import { cloudflare as cloudflarePlugin } from '@cloudflare/vite-plugin';
import { cloudflareDevProxy } from '@react-router/dev/vite/cloudflare';
import { CONFIG_PATH, getLoadContext } from './index.js';
import { writeConfigSync } from './config.js';
import type { WriteConfigInput } from './config.js';

export interface CloudflareInput extends WriteConfigInput {
  command: 'build' | 'serve';
}

export function cloudflare(input: CloudflareInput): any {
  writeConfigSync({
    compatibilityDate: input.compatibilityDate,
    configPath: input.configPath,
    includeLinks: input.command === 'serve',
    main: input.main,
    name: input.name,
  });

  return input.command === 'serve'
    ? cloudflareDevProxy({
        configPath: input.configPath ?? CONFIG_PATH,
        getLoadContext,
      })
    : cloudflarePlugin({
        configPath: input.configPath ?? CONFIG_PATH,
        viteEnvironment: { name: 'ssr' },
      });
}
