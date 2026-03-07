/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "cf-rr-v7",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "cloudflare",
    };
  },
  async run() {
    const bucket = new sst.cloudflare.Bucket("MyBucket");
    const message = new sst.Secret("MyMessage", "Hello from SST");

    new sst.cloudflare.x.React("MyWeb", {
      link: [bucket, message],
    });
  },
});
