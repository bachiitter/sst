import { cloudflare as cloudflarePlugin } from '@cloudflare/vite-plugin';
import { cloudflareDevProxy } from '@react-router/dev/vite/cloudflare';
import { getLoadContext } from './index.js';
import { CONFIG_PATH, writeConfigSync } from './config.js';
import type { WriteConfigInput } from './config.js';

export type CloudflareInput = WriteConfigInput;

export function cloudflare(input: CloudflareInput = {}): any {
  const command = getCommand();
  const configPath = input.configPath ?? CONFIG_PATH;

  writeConfigSync({
    compatibilityDate: input.compatibilityDate,
    configPath,
    includeLinks: command === 'serve',
    main: input.main,
    name: input.name,
  });

  return command === 'serve'
    ? cloudflareDevProxy({
        configPath,
        getLoadContext,
      })
    : cloudflarePlugin({
        configPath,
        viteEnvironment: { name: 'ssr' },
      });
}

function getCommand(): 'build' | 'serve' {
  const args = new Set(process.argv.slice(2));

  if (args.has('dev') || args.has('serve')) {
    return 'serve';
  }

  return 'build';
}
