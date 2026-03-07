import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from 'node:process';

type SstLink = {
  include?: SstLinkInclude[];
  properties: Record<string, unknown>;
};

type SstLinkInclude = {
  binding?: string;
  properties?: Record<string, unknown>;
  type: string;
};

export type WorkerConfig = {
  ai?: { binding: string };
  compatibility_date: string;
  compatibility_flags?: string[];
  d1_databases?: Array<{ binding: string; database_id: string }>;
  kv_namespaces?: Array<{ binding: string; id: string }>;
  main: string;
  name: string;
  queues?: {
    producers?: Array<{
      binding: string;
      delivery_delay?: number;
      queue: string;
      remote?: boolean;
    }>;
  };
  r2_buckets?: Array<{
    binding: string;
    bucket_name: string;
    jurisdiction?: string;
  }>;
  services?: Array<{
    binding: string;
    entrypoint?: string;
    environment?: string;
    service: string;
  }>;
  vars?: Record<string, string>;
};

export const CONFIG_PATH = '.sst/react-router-cloudflare.json';

export interface WriteConfigInput {
  compatibilityDate?: string;
  configPath?: string;
  includeLinks?: boolean;
  main?: string;
  name?: string;
}

export async function writeConfig(input: WriteConfigInput = {}) {
  const filePath = path.resolve(input.configPath ?? CONFIG_PATH);
  const config = createConfig({
    ...input,
    configPath: filePath,
  });

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(config, null, 2));

  return filePath;
}

export function writeConfigSync(input: WriteConfigInput = {}) {
  const filePath = path.resolve(input.configPath ?? CONFIG_PATH);
  const config = createConfig({
    ...input,
    configPath: filePath,
  });

  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(config, null, 2));

  return filePath;
}

export function createConfig(input: WriteConfigInput = {}): WorkerConfig {
  const configPath = path.resolve(input.configPath ?? CONFIG_PATH);
  const config: WorkerConfig = {
    compatibility_date: input.compatibilityDate ?? getDefaultCompatibilityDate(),
    compatibility_flags: ['nodejs_compat'],
    main: resolveMainPath(configPath, input.main ?? './workers/app.ts'),
    name: input.name ?? getPackageName(),
  };

  if (input.includeLinks === false) {
    return config;
  }

  if (env.SST_RESOURCE_App) {
    config.vars = {
      ...(config.vars ?? {}),
      SST_RESOURCE_App: env.SST_RESOURCE_App,
    };
  }

  for (const [name, link] of Object.entries(getSstLinks())) {
    applySstLink(config, name, link);
  }

  return config;
}

function getSstLinks() {
  const rawLinks = env.SST_LINKS_JSON;
  if (!rawLinks) {
    return {} as Record<string, SstLink>;
  }

  try {
    const parsed = JSON.parse(rawLinks) as unknown;
    if (!isRecord(parsed)) {
      return {} as Record<string, SstLink>;
    }

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, SstLink] => {
        return isSstLink(entry[1]);
      }),
    );
  } catch {
    return {} as Record<string, SstLink>;
  }
}

function applySstLink(config: WorkerConfig, name: string, link: SstLink) {
  const binding = link.include?.find((item) => item.type === 'cloudflare.binding');

  if (!binding || typeof binding.binding !== 'string') {
    setVar(config, name, JSON.stringify(link.properties));
    return;
  }

  const properties = binding.properties;

  if (binding.binding === 'aiBindings') {
    config.ai ??= { binding: name };
    return;
  }

  if (binding.binding === 'd1DatabaseBindings') {
    const databaseId = getString(properties, 'id');
    if (!databaseId) {
      return;
    }

    config.d1_databases = addNamedBinding(config.d1_databases, {
      binding: name,
      database_id: databaseId,
    });
    return;
  }

  if (binding.binding === 'kvNamespaceBindings') {
    const namespaceId = getString(properties, 'namespaceId');
    if (!namespaceId) {
      return;
    }

    config.kv_namespaces = addNamedBinding(config.kv_namespaces, {
      binding: name,
      id: namespaceId,
    });
    return;
  }

  if (binding.binding === 'queueBindings') {
    const queueName = getString(properties, 'queueName');
    if (!queueName) {
      return;
    }

    config.queues ??= { producers: [] };
    config.queues.producers = addNamedBinding(config.queues.producers, {
      binding: name,
      queue: queueName,
    });
    return;
  }

  if (binding.binding === 'r2BucketBindings') {
    const bucketName = getString(properties, 'bucketName');
    if (!bucketName) {
      return;
    }

    config.r2_buckets = addNamedBinding(config.r2_buckets, {
      binding: name,
      bucket_name: bucketName,
    });
    return;
  }

  if (binding.binding === 'serviceBindings') {
    const service = getString(properties, 'service');
    if (!service) {
      return;
    }

    config.services = addNamedBinding(config.services, {
      binding: name,
      service,
    });
    return;
  }

  if (
    binding.binding === 'plainTextBindings' ||
    binding.binding === 'secretTextBindings'
  ) {
    const text = getString(properties, 'text');
    if (text) {
      setVar(config, name, text);
      return;
    }
  }

  setVar(config, name, JSON.stringify(link.properties));
}

function getDefaultCompatibilityDate() {
  return new Date().toISOString().slice(0, 10);
}

function resolveMainPath(configPath: string, main: string) {
  if (!main.startsWith('.')) {
    return main;
  }

  const absoluteMain = path.resolve(main);
  const relativeMain = path.relative(path.dirname(configPath), absoluteMain);
  return relativeMain.startsWith('.') ? relativeMain : `./${relativeMain}`;
}

function getPackageName() {
  try {
    const packageJson = JSON.parse(
      readFileSync(path.resolve('package.json'), 'utf-8'),
    ) as { name?: unknown };
    return typeof packageJson.name === 'string'
      ? packageJson.name
      : 'react-router-cloudflare';
  } catch {
    return 'react-router-cloudflare';
  }
}

function addNamedBinding<T extends { binding: string }>(
  current: T[] | undefined,
  value: T,
) {
  if (current?.some((item) => item.binding === value.binding)) {
    return current;
  }

  return [...(current ?? []), value];
}

function getString(
  value: Record<string, unknown> | undefined,
  key: string,
) {
  const item = value?.[key];
  return typeof item === 'string' ? item : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isSstLink(value: unknown): value is SstLink {
  if (!isRecord(value)) {
    return false;
  }

  return isRecord(value.properties);
}

function setVar(config: WorkerConfig, name: string, value: string) {
  if (config.vars?.[name]) {
    return;
  }

  config.vars = {
    ...(config.vars ?? {}),
    [name]: value,
  };
}
