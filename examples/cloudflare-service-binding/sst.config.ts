/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "cf-service-binding",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "cloudflare",
    };
  },
  async run() {
    const backend = new sst.cloudflare.Worker("Backend", {
      handler: "./backend.ts",
    });

    const frontend = new sst.cloudflare.Worker("Frontend", {
      handler: "./frontend.ts",
      link: [backend],
      url: true,
    });

    return {
      url: frontend.url,
    };
  },
});
