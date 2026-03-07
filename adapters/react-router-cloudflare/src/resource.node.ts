import { Resource as ResourceBase } from 'sst/resource';
import { getLinkedResource } from './resource-state.js';

export const Resource = new Proxy(
  {},
  {
    get(_target, prop: string) {
      try {
        return getLinkedResource(prop);
      } catch {
        return ResourceBase[prop as keyof typeof ResourceBase];
      }
    },
  },
) as Record<string, any>;
