import fs from "fs/promises";
import path from "path";
import { ComponentResourceOptions, Output } from "@pulumi/pulumi";
import { VisibleError } from "../../error.js";
import { Plan, SsrSite, SsrSiteArgs } from "../ssr-site.js";
import { existsAsync } from "../../../util/fs.js";

export interface ReactArgs extends SsrSiteArgs {
  /**
   * Configure how this component works in `sst dev`.
   *
   * :::note
   * In `sst dev` your React Router app is run in dev mode; it's not deployed.
   * :::
   *
   * Instead of deploying your React Router app, this starts it in dev mode. It's run
   * as a separate process in the `sst dev` multiplexer. Read more about
   * [`sst dev`](/docs/reference/cli/#dev).
   *
   * To disable dev mode, pass in `false`.
   */
  dev?: SsrSiteArgs["dev"];
  /**
   * Path to the directory where your React Router app is located. This path is relative to your `sst.config.ts`.
   *
   * By default it assumes your React Router app is in the root of your SST app.
   * @default `"."`
   *
   * @example
   *
   * If your React Router app is in a package in your monorepo.
   *
   * ```js
   * {
   *   path: "packages/web"
   * }
   * ```
   */
  path?: SsrSiteArgs["path"];
  /**
   * [Link resources](/docs/linking/) to your React Router app. This will:
   *
   * 1. Grant the permissions needed to access the resources.
   * 2. Allow you to access them in your app using the [SDK](/docs/reference/sdk/).
   *
   * @example
   *
   * Takes a list of resources to link to the app.
   *
   * ```js
   * {
   *   link: [bucket, stripeKey]
   * }
   * ```
   */
  link?: SsrSiteArgs["link"];
  /**
   * Set environment variables in your React Router app. These are made available:
   *
   * 1. In `react-router build`, they are loaded into the Cloudflare worker environment.
   * 2. Locally while running `react-router dev` through `sst dev`.
   *
   * :::tip
   * You can also `link` resources to your React Router app and access them in a type-safe way with the [SDK](/docs/reference/sdk/). We recommend linking since it's more secure.
   * :::
   *
   * @example
   * ```js
   * {
   *   environment: {
   *     API_URL: api.url,
   *     MESSAGE: "Hello from SST"
   *   }
   * }
   * ```
   */
  environment?: SsrSiteArgs["environment"];
  /**
   * Set a custom domain for your React Router app.
   *
   * @example
   *
   * ```js
   * {
   *   domain: "my-app.com"
   * }
   * ```
   */
  domain?: SsrSiteArgs["domain"];
  /**
   * The command used internally to build your React Router app.
   *
   * @default `"npm run build"`
   *
   * @example
   *
   * If you want to use a different build command.
   * ```js
   * {
   *   buildCommand: "yarn build"
   * }
   * ```
   */
  buildCommand?: SsrSiteArgs["buildCommand"];
}

/**
 * The `React` component lets you deploy a [React Router](https://reactrouter.com/) app to Cloudflare Workers.
 *
 * This component is experimental and is available under `sst.cloudflare.x.React`.
 * SST creates the worker entry for you, so you don't need a `wrangler.jsonc` just to use this component.
 *
 * @example
 *
 * #### Minimal example
 *
 * Deploy the React Router app that's in the project root.
 *
 * ```js title="sst.config.ts"
 * new sst.cloudflare.x.React("MyWeb");
 * ```
 *
 * #### Change the path
 *
 * Deploys the React Router app in the `my-react-router-app/` directory.
 *
 * ```js {2} title="sst.config.ts"
 * new sst.cloudflare.x.React("MyWeb", {
 *   path: "my-react-router-app/"
 * });
 * ```
 *
 * #### Add a custom domain
 *
 * Set a custom domain for your React Router app.
 *
 * ```js {2} title="sst.config.ts"
 * new sst.cloudflare.x.React("MyWeb", {
 *   domain: "my-app.com"
 * });
 * ```
 *
 * #### Link resources
 *
 * [Link resources](/docs/linking/) to your React Router app. This will grant permissions
 * to the resources and allow you to access them in your app.
 *
 * ```ts {4} title="sst.config.ts"
 * const bucket = new sst.cloudflare.Bucket("MyBucket");
 *
 * new sst.cloudflare.x.React("MyWeb", {
 *   link: [bucket]
 * });
 * ```
 *
 * You can create a local resource helper for your app and use it to access the
 * linked resources in your server-side React Router code.
 *
 * ```ts title="resource.ts"
 * import { Resource as resource } from "sst-react-router-cloudflare/resource";
 * import type { Resource as SstResource } from "sst";
 *
 * export const Resource = resource as SstResource;
 * ```
 *
 * ```ts title="app/routes/home.tsx"
 * import { Resource } from "../resource";
 *
 * export async function loader() {
 *   const objects = await Resource.MyBucket.list();
 *   return { count: objects.objects.length };
 * }
 * ```
 */
export class React extends SsrSite {
  constructor(
    name: string,
    args: ReactArgs = {},
    opts: ComponentResourceOptions = {},
  ) {
    super(__pulumiType, name, args, opts);
  }

  protected buildPlan(outputPath: Output<string>): Output<Plan> {
    return outputPath.apply(async (outputPath) => {
      const serverDir = path.join(outputPath, "build", "server");
      const clientDir = path.join(outputPath, "build", "client");
      const manifestPath = path.join(serverDir, "wrangler.json");
      const serverBuildPath = path.join(serverDir, "index.js");
      const wrapperPath = path.join(serverDir, "sst-react-router-worker.mjs");

      if (await existsAsync(manifestPath)) {
        const manifest = await parseManifest(manifestPath);
        const server = path.join("build", "server", manifest.main);
        const assets = path.join("build", "server", manifest.assets.directory);

        if (!(await existsAsync(path.join(outputPath, server)))) {
          throw new VisibleError(
            `SSR server bundle "${manifest.main}" not found in the build output at:\n` +
              `  "${path.resolve(serverDir)}".\n\n` +
              `If your React Router project is entirely pre-rendered, use the \`sst.cloudflare.StaticSite\` component instead of \`sst.cloudflare.x.React\`.`,
          );
        }

        if (!(await existsAsync(path.join(outputPath, assets)))) {
          throw new VisibleError(
            `Static assets directory "${manifest.assets.directory}" not found in the build output at:\n` +
              `  "${path.resolve(serverDir)}".`,
          );
        }

        return {
          server: `./${server}`,
          assets: `./${assets}`,
        };
      }

      if (!(await existsAsync(serverBuildPath))) {
        throw new VisibleError(
          `SSR server build "index.js" not found in the build output at:\n` +
            `  "${path.resolve(serverDir)}".\n\n` +
            `Make sure your app is built with \`react-router build\`.`,
        );
      }

      if (!(await existsAsync(clientDir))) {
        throw new VisibleError(
          `Static assets directory "build/client" not found in the build output at:\n` +
            `  "${path.resolve(outputPath, "build")}".`,
        );
      }

      await fs.writeFile(
        wrapperPath,
        [
          'import { createRequestHandler } from "react-router";',
          'import { wrapCloudflareHandler } from "sst";',
          'const requestHandler = createRequestHandler(() => import("./index.js"), "production");',
          "",
          "const handler = {",
          "  async fetch(request, env, ctx) {",
          "    return requestHandler(request, {",
          "      cloudflare: { env, ctx },",
          "    });",
          "  },",
          "};",
          "",
          "export default wrapCloudflareHandler(handler);",
          "",
        ].join("\n"),
      );

      return {
        server: "./build/server/sst-react-router-worker.mjs",
        assets: "./build/client",
      };
    });
  }

  /**
   * The URL of the React Router app.
   *
   * If the `domain` is set, this is the URL with the custom domain.
   * Otherwise, it's the auto-generated Worker URL.
   */
  public get url() {
    return super.url;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function parseManifest(filePath: string) {
  let manifest: unknown;

  try {
    manifest = JSON.parse(await fs.readFile(filePath, "utf-8"));
  } catch {
    throw new VisibleError(
      `React Router's Cloudflare build manifest is invalid at:\n` +
        `  "${path.resolve(filePath)}".`,
    );
  }

  if (!isRecord(manifest) || typeof manifest.main !== "string") {
    throw new VisibleError(
      `React Router's Cloudflare build manifest is missing the worker entry file in:\n` +
        `  "${path.resolve(filePath)}".`,
    );
  }

  if (!isRecord(manifest.assets) || typeof manifest.assets.directory !== "string") {
    throw new VisibleError(
      `React Router's Cloudflare build manifest is missing the assets directory in:\n` +
        `  "${path.resolve(filePath)}".`,
    );
  }

  return manifest as {
    assets: { directory: string };
    main: string;
  };
}

const __pulumiType = "sst:cloudflare:React";
// @ts-expect-error
React.__pulumiType = __pulumiType;
