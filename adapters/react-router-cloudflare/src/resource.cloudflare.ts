import { env } from 'cloudflare:workers';

export const Resource = new Proxy(
  {},
  {
    get(_target, prop: string) {
      if (prop in env) {
        const value = env[prop as keyof typeof env];
        if (typeof value === 'string') {
          try {
            return JSON.parse(value);
          } catch {
            return value;
          }
        }

        return value;
      }

      if (prop === 'App' && typeof env.SST_RESOURCE_App === 'string') {
        return JSON.parse(env.SST_RESOURCE_App);
      }

      throw new Error(`"${prop}" is not linked in your sst.config.ts`);
    },
  },
) as Record<string, any>;
