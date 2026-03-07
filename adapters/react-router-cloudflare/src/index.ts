import { createRequestHandler } from 'react-router';
import { env } from 'process';
import { CONFIG_PATH, createConfig, writeConfig } from './config.js';
import { setCloudflareBindings } from './resource-state.js';

export { CONFIG_PATH, createConfig, writeConfig };

export function getLoadContext(input: {
  context: {
    cloudflare: {
      env: unknown;
    };
  };
}): any {
  if (isRecord(input.context.cloudflare.env)) {
    setCloudflareBindings(resolveBindings(input.context.cloudflare.env));
  }
  return input.context;
}

export function worker(mode: string) {
  const requestHandler = createRequestHandler(
    () => import('virtual:react-router/server-build'),
    mode,
  );

  return {
    async fetch(request: Request, workerEnv: Record<string, unknown>, ctx: unknown) {
      return requestHandler(request, {
        cloudflare: { env: workerEnv, ctx },
      });
    },
  };
}

function resolveBindings(workerEnv: Record<string, unknown>) {
  const result: Record<string, unknown> = {};

  if (env.SST_RESOURCE_App) {
    result.SST_RESOURCE_App = env.SST_RESOURCE_App;
  }

  const rawLinks = env.SST_LINKS_JSON;
  if (!rawLinks) {
    return { ...result, ...workerEnv };
  }

  try {
    const links = JSON.parse(rawLinks) as unknown;
    if (!isRecord(links)) {
      return { ...result, ...workerEnv };
    }

    for (const name of Object.keys(links)) {
      const envValue = workerEnv[name];
      if (typeof envValue !== 'undefined') {
        result[name] = envValue;
        continue;
      }

      const resourceValue = env[`SST_RESOURCE_${name}`];
      if (resourceValue) {
        result[`SST_RESOURCE_${name}`] = resourceValue;
      }
    }

    return result;
  } catch {
    return { ...result, ...workerEnv };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
