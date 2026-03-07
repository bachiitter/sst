# sst-react-router-cloudflare

Use SST resources from a React Router app running on Cloudflare Workers.

## Install

```bash
npm install sst-react-router-cloudflare
```

## Configure Vite

Add the Cloudflare plugin before `reactRouter()` in `vite.config.ts`.

```ts
import { reactRouter } from '@react-router/dev/vite'
import { cloudflare } from 'sst-react-router-cloudflare/vite'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ command }) => ({
  plugins: [
    cloudflare({
      command,
      compatibilityDate: '2025-04-04'
    }),
    reactRouter(),
    tsconfigPaths({ projects: ['./tsconfig.json'] })
  ]
}))
```

## Worker entry

Export the Worker handler from your Cloudflare entry file.

```ts
import { worker } from 'sst-react-router-cloudflare'

export default worker(import.meta.env.MODE)
```

## Read resources

Import `Resource` anywhere you need linked SST resources.

```ts
import { Resource } from 'sst-react-router-cloudflare/resource'

const bucketName = Resource.MyBucket.name
```

## How it works

The Vite plugin connects React Router to SST during local development and prepares the build for Cloudflare Workers.

The worker helper and `Resource` API keep the same linked resource access pattern in both environments.
