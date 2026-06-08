import { serve } from "@hono/node-server";
import dotenv from "dotenv";
import { Hono } from "hono";

import { MPV } from "./mpv.js";

const teardown = async (mpv: MPV) => {
  console.log("Shutting down MPV Server...");
  await mpv.stop();
  console.log("MPV Server has been shut down.");
  process.exit(0);
};

const main = async () => {
  dotenv.config();

  const mpv = new MPV();
  await mpv.start();

  process.on("SIGINT", () => teardown(mpv));
  process.on("SIGTERM", () => teardown(mpv));

  const app = new Hono();

  app.get("/", (c) => {
    return c.text("Welcome to the MPV Server!");
  });

  serve(
    {
      fetch: app.fetch,
      port: parseInt(process.env.PORT || "3000"),
      hostname: process.env.HOST,
    },
    (info) => {
      console.log(
        `MPV Server is running on http://${info.family == "IPv6" ? `[${info.address}]` : info.address}:${info.port}`,
      );
    },
  );
};

main();
