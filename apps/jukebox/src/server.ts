import { createServer } from "http";

import dotenv from "dotenv";
import next from "next";

import { MediaQueue } from "./lib/media-queue";
import { MPVClient } from "./lib/mpv-client";
import { WsServer } from "./lib/ws-server";

const main = async () => {
  dotenv.config();

  const mpv = MPVClient.getInstance();
  mpv.start();

  const mediaQueue = MediaQueue.getInstance();
  mediaQueue.start();

  const app = next({ dev: process.env.NODE_ENV !== "production" });
  const host = process.env.HOST || "::";
  const port = parseInt(process.env.PORT || "3000");

  await app.prepare();

  const server = createServer(app.getRequestHandler());
  const wsServer = WsServer.getInstance();
  wsServer.start(server);
  server.listen(port, host, undefined, () => {
    console.log(
      `MJB is running on http://${host.includes(":") ? `[${host}]` : host}:${port}`,
    );
  });
};

main();
