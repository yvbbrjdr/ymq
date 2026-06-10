import { type WebSocketLike, serve, upgradeWebSocket } from "@hono/node-server";
import dotenv from "dotenv";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { WSContext } from "hono/ws";
import { WebSocketServer } from "ws";

import { MPV } from "./mpv.js";
import { getRemoteAddrPort } from "./utils.js";

const teardown = async (mpv: MPV) => {
  console.log("Shutting down MPV Server...");
  mpv.stop();
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
  const wss = new WebSocketServer({ noServer: true });

  app.get("/", (c) => {
    return c.text("Welcome to the MPV Server!");
  });

  const wsClients = new Set<WSContext<WebSocketLike>>();

  mpv.on("data", (data) => {
    const message = data.toString();
    process.stdout.write(
      `Broadcasting message to ${wsClients.size} WebSocket clients: ${message}`,
    );
    for (const ws of wsClients) {
      if (ws.readyState === 1) {
        ws.send(message);
      }
    }
  });

  app.get(
    "/ws",
    upgradeWebSocket((c) => {
      const auth = c.req.header("Authorization");
      if (auth !== `Bearer ${process.env.API_KEY}`) {
        console.warn(
          `Unauthorized WebSocket connection attempt from ${getRemoteAddrPort(c)} with Authorization header: ${auth}`,
        );
        throw new HTTPException(401, { message: "Unauthorized" });
      }

      return {
        onOpen: (evt, ws) => {
          console.log(
            `WebSocket connection established from ${getRemoteAddrPort(c)}`,
          );
          wsClients.add(ws);
        },
        onMessage: (evt) => {
          process.stdout.write(
            `Received message from ${getRemoteAddrPort(c)}: ${evt.data}`,
          );
          mpv.sendCommand(evt.data.toString());
        },
        onClose: (evt, ws) => {
          console.log(
            `WebSocket connection closed from ${getRemoteAddrPort(c)} with code ${evt.code}`,
          );
          wsClients.delete(ws);
        },
        onError: (evt, ws) => {
          console.error(`WebSocket error from ${getRemoteAddrPort(c)}: ${evt}`);
          wsClients.delete(ws);
        },
      };
    }),
  );

  serve(
    {
      fetch: app.fetch,
      port: parseInt(process.env.PORT || "3000"),
      hostname: process.env.HOST,
      websocket: { server: wss },
    },
    (info) => {
      console.log(
        `MPV Server is running on http://${info.family == "IPv6" ? `[${info.address}]` : info.address}:${info.port}`,
      );
    },
  );
};

main();
