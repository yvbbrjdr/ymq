import { EventEmitter } from "events";

import WebSocket from "ws";

export class MPVClient extends EventEmitter {
  static instance: MPVClient | null = null;

  private socket: WebSocket | null;
  private serverUrl: string;
  private serverApiKey: string;

  constructor() {
    super();
    this.socket = null;
    this.serverUrl = process.env.MPV_SERVER_URL || "ws://localhost:8678/ws";
    this.serverApiKey = process.env.MPV_SERVER_API_KEY || "your-api-key-here";
  }

  start() {
    console.log(`Connecting to MPV server at ${this.serverUrl}...`);
    const socket = new WebSocket(this.serverUrl, {
      headers: {
        Authorization: `Bearer ${this.serverApiKey}`,
      },
    });
    socket.on("open", () => {
      console.log(`Connected to MPV server at ${this.serverUrl}`);
      this.socket = socket;
    });
    socket.on("error", (err) => {
      console.error(`Failed to connect to MPV server: ${err}`);
    });
    socket.on("message", (data) => {
      process.stdout.write(`Received message from MPV server: ${data}`);
    });
    socket.on("close", async () => {
      console.log(`MPV server connection closed, reconnecting...`);
      await new Promise((r) => setTimeout(r, 1000));
      this.start();
    });
  }

  async stop() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  static getInstance() {
    if (!MPVClient.instance) {
      MPVClient.instance = new MPVClient();
    }
    return MPVClient.instance;
  }
}
