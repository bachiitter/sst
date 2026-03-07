import { env } from 'process';

declare global {
  var $SST_REACT_ROUTER_CLOUDFLARE: Record<string, unknown> | undefined;
}

export function setCloudflareBindings(input: Record<string, unknown>) {
  const bindings = getCloudflareBindings();

  for (let [key, value] of Object.entries(input)) {
    if (typeof value === 'string') {
      try {
        value = JSON.parse(value);
      } catch {}
    }

    bindings[key] = value;

    if (key.startsWith('SST_RESOURCE_')) {
      bindings[key.slice('SST_RESOURCE_'.length)] = value;
    }
  }
}

export function getCloudflareBinding(name: string) {
  const bindings = getCloudflareBindings();
  if (name in bindings) {
    return bindings[name];
  }

  return undefined;
}

export function getCloudflareBindings() {
  globalThis.$SST_REACT_ROUTER_CLOUDFLARE ??= {};
  return globalThis.$SST_REACT_ROUTER_CLOUDFLARE;
}

export function getLinkedResource(name: string) {
  const binding = getCloudflareBinding(name);
  if (typeof binding !== 'undefined') {
    return binding;
  }

  if (!env.SST_RESOURCE_App && typeof getCloudflareBinding('App') === 'undefined') {
    throw new Error(
      'It does not look like SST links are active. If this is in local development and you are not starting this process through the multiplexer, wrap your command with `sst dev -- <command>`',
    );
  }

  throw new Error(`"${name}" is not linked in your sst.config.ts`);
}
