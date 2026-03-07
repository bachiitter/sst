declare module 'react-router' {
  export function createRequestHandler(
    build: () => Promise<unknown>,
    mode: string,
  ): (request: Request, context?: unknown) => Promise<Response>;
}

declare module 'sst' {
  export function fromCloudflareEnv(input: Record<string, unknown>): void;
}

declare module 'cloudflare:workers' {
  export const env: Record<string, unknown>;
}
