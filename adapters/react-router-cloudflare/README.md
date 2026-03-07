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

export default defineConfig({
  plugins: [
    cloudflare(),
    reactRouter(),
    tsconfigPaths({ projects: ['./tsconfig.json'] })
  ]
})
```

Pass options like `compatibilityDate`, `configPath`, `main`, and `name` if needed.

`compatibilityDate` is optional. If you do not set it, the adapter writes today's date by default, following Cloudflare's recommendation to use a current compatibility date.

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

The Vite plugin wires React Router into SST for local development and Cloudflare builds.

The worker helper and `Resource` API keep the same linked resource access pattern in both environments.
