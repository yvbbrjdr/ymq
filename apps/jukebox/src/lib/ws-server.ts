import type { IncomingMessage, Server } from "http";

import { type WebSocket, WebSocketServer } from "ws";

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
  }

  private messageReceived(message: string) {
    console.log(
      `Received message from ${this.getRemoteAddrPort()}: ${message}`,
    );
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

  start(httpServer: Server) {
    this.server = new WebSocketServer({ server: httpServer, path: "/ws" });
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
