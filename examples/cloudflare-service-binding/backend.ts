import { WorkerEntrypoint } from "cloudflare:workers";

export default class Backend extends WorkerEntrypoint {
  log() {
    console.log("Hello from Worker B");
  }

  async fetch() {
    return Response.json({ ok: true });
  }
}
