import type { Config } from "https://edge.netlify.com";

export default async () => new Response("Hello, world");

export const config: Config = {
  path: "/test",
};
