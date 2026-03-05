import { Resource } from "sst";

export default {
  async fetch() {
    await Resource.Backend.log();

    return Response.json({ message: "Hello World" });
  },
};
