import { EventEmitter } from "events";

import WebSocket from "ws";

interface MPVCommandResponse {
  error: string;
  request_id: number;
  data: unknown;
}

interface MPVEvent {
  event: string;
  [key: string]: unknown;
}

type MPVMessage = MPVCommandResponse | MPVEvent;

export class MPVClient extends EventEmitter {
  static instance: MPVClient | null = null;

  private socket: WebSocket | null;
  private serverUrl: string;
  private serverApiKey: string;
  private commandCounter: number;
  private inflightCommands: Map<
    number,
    { resolve: (value: unknown) => void; reject: (reason?: string) => void }
  >;

  constructor() {
    super();
    this.socket = null;
    this.serverUrl = process.env.MPV_SERVER_URL || "ws://localhost:8678/ws";
    this.serverApiKey = process.env.MPV_SERVER_API_KEY || "your-api-key-here";
    this.commandCounter = 0;
    this.inflightCommands = new Map();
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
      data
        .toString()
        .split("\n")
        .forEach((line) => {
          if (line.trim() === "") {
            return;
          }
          let message: MPVMessage;
          try {
            message = JSON.parse(line);
          } catch (err) {
            console.error(`Failed to parse MPV server message: ${err}`);
            return;
          }
          if ("request_id" in message) {
            const response: MPVCommandResponse = message as MPVCommandResponse;
            const inflight = this.inflightCommands.get(response.request_id);
            if (!inflight) {
              console.warn(
                `Received response for unknown request_id ${response.request_id}`,
              );
              return;
            }
            this.inflightCommands.delete(response.request_id);
            if (response.error === "success") {
              inflight.resolve(response.data);
            } else {
              inflight.reject(response.error);
            }
            return;
          }
          if ("event" in message) {
            const event: MPVEvent = message as MPVEvent;
            this.processEvent(event);
            return;
          }
          console.warn(`Received unknown message from MPV server: ${line}`);
        });
    });
    socket.on("close", async () => {
      console.log(`MPV server connection closed, reconnecting...`);
      await new Promise((r) => setTimeout(r, 1000));
      this.start();
    });
  }

  async sendCommand(command: (string | number)[]) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error("MPV server connection is not open");
    }
    const requestId = this.commandCounter++;
    this.socket.send(
      JSON.stringify({
        command,
        request_id: requestId,
        async: true,
      }) + "\n",
    );
    return new Promise((resolve, reject) => {
      this.inflightCommands.set(requestId, { resolve, reject });
    });
  }

  loadfile(url: string) {
    return this.sendCommand(["loadfile", url]);
  }

  processEvent(event: MPVEvent) {
    console.log(`Processing MPV event: ${JSON.stringify(event)}`);
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
