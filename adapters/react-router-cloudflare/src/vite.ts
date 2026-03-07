import { cloudflare as cloudflarePlugin } from '@cloudflare/vite-plugin';
import { cloudflareDevProxy } from '@react-router/dev/vite/cloudflare';
import { CONFIG_PATH, getLoadContext } from './index.js';
import { writeConfigSync } from './config.js';
import type { WriteConfigInput } from './config.js';

export type CloudflareInput = WriteConfigInput;

export function cloudflare(input: CloudflareInput = {}): any[] {
  const configPath = input.configPath ?? CONFIG_PATH;

  return [
    createConfigWriterPlugin({
      ...input,
      configPath,
      includeLinks: true,
    }, 'serve'),
    createConfigWriterPlugin({
      ...input,
      configPath,
      includeLinks: false,
    }, 'build'),
    withApply(
      cloudflareDevProxy({
        configPath,
        getLoadContext,
      }),
      'serve',
    ),
    withApply(
      cloudflarePlugin({
        configPath,
        viteEnvironment: { name: 'ssr' },
      }),
      'build',
    ),
  ];
}

function createConfigWriterPlugin(input: WriteConfigInput, apply: 'build' | 'serve') {
  return {
    apply,
    config() {
      writeConfigSync(input);
    },
    name: `sst-react-router-cloudflare:config:${apply}`,
  };
}

function withApply(plugin: any, apply: 'build' | 'serve') {
  return {
    ...plugin,
    apply,
  };
}
