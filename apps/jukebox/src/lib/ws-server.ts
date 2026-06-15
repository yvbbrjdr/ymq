import type { IncomingMessage, Server } from "http";
import type { Duplex } from "stream";

import type { UpgradeHandler } from "next/dist/server/next";
import { type WebSocket, WebSocketServer } from "ws";

import type { WsMessage } from "../types/ws-message";
import { MediaQueue } from "./media-queue";
import { MPVClient } from "./mpv-client";

class WsConnection {
  private ws: WebSocket;
  private remoteAddress: string;
  private remotePort: number;

  constructor(ws: WebSocket, req: IncomingMessage) {
    this.ws = ws;
    this.remoteAddress = req.socket.remoteAddress?.includes(":")
      ? `[${req.socket.remoteAddress}]`
      : (req.socket.remoteAddress ?? "");
    this.remotePort = req.socket.remotePort ?? 0;
    this.ws.on("message", (data) => this.messageReceived(data.toString()));

    const mediaQueue = MediaQueue.getInstance();
    const mpv = MPVClient.getInstance();

    this.sendMessage(
      JSON.stringify({
        type: "media-queue/status",
        data: mediaQueue.status,
      }),
    );
    this.sendMessage(
      JSON.stringify({
        type: "player/status",
        data: mpv.status,
      }),
    );
  }

  private messageReceived(message: string) {
    console.log(
      `Received message from ${this.getRemoteAddrPort()}: ${message}`,
    );

    const mediaQueue = MediaQueue.getInstance();
    const mpv = MPVClient.getInstance();

    let parsedMessage: WsMessage;
    try {
      parsedMessage = JSON.parse(message);
    } catch (error) {
      console.error(
        `Failed to parse message from ${this.getRemoteAddrPort()}: ${error}`,
      );
      return;
    }

    switch (parsedMessage.type) {
      case "media-queue/enqueue":
        mediaQueue.enqueue(parsedMessage.data.username, parsedMessage.data.url);
        break;
      case "media-queue/remove":
        mediaQueue.remove(
          parsedMessage.data.username,
          parsedMessage.data.index,
        );
        break;
      case "player/pause":
        mpv.pause();
        break;
      case "player/play":
        mpv.play();
        break;
      case "player/stop":
        mpv.stop();
        break;
      case "player/seek":
        mpv.seek(parsedMessage.data.position);
        break;
      case "player/set-volume":
        mpv.setVolume(parsedMessage.data.volume);
        break;
      case "player/set-muted":
        mpv.setMuted(parsedMessage.data.muted);
        break;
    }
  }

  sendMessage(message: string) {
    this.ws.send(message);
  }

  getRemoteAddrPort() {
    return `${this.remoteAddress}:${this.remotePort}`;
  }
}

export class WsServer {
  private static instance: WsServer | null = null;

  private server: WebSocketServer | null;
  private connections: WsConnection[];

  private constructor() {
    this.server = null;
    this.connections = [];
  }

  start(httpServer: Server, nextUpgradeHandler: UpgradeHandler) {
    this.server = new WebSocketServer({ noServer: true });
    httpServer.on("upgrade", (req, socket, head) => {
      if (req.url === "/ws") {
        this.handleUpgrade(req, socket, head);
        return;
      }

      nextUpgradeHandler(req, socket, head);
    });

    this.server.on("connection", (ws: WebSocket, req: IncomingMessage) => {
      const connection = new WsConnection(ws, req);
      console.log(
        `WebSocket connection established from ${connection.getRemoteAddrPort()}`,
      );
      this.connections.push(connection);
      ws.on("close", () => {
        console.log(
          `WebSocket connection closed from ${connection.getRemoteAddrPort()}`,
        );
        this.connections.splice(this.connections.indexOf(connection), 1);
      });
      ws.on("error", (error) => {
        console.error(`Error from ${connection.getRemoteAddrPort()}: ${error}`);
        this.connections.splice(this.connections.indexOf(connection), 1);
      });
    });

    const mediaQueue = MediaQueue.getInstance();
    const mpv = MPVClient.getInstance();

    mediaQueue.on("status", (status) => {
      this.broadcastMessage(
        JSON.stringify({
          type: "media-queue/status",
          data: status,
        }),
      );
    });
    mpv.on("status", (status) => {
      this.broadcastMessage(
        JSON.stringify({
          type: "player/status",
          data: status,
        }),
      );
    });
  }

  handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer) {
    if (!this.server) {
      throw new Error("WebSocket server not started");
    }

    this.server.handleUpgrade(req, socket, head, (ws) => {
      this.server?.emit("connection", ws, req);
    });
  }

  private broadcastMessage(message: string) {
    this.connections.forEach((connection) => connection.sendMessage(message));
  }

  static getInstance() {
    if (!WsServer.instance) {
      WsServer.instance = new WsServer();
    }
    return WsServer.instance;
  }
}
