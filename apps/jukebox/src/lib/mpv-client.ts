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

interface MPVStatus {
  idle: boolean;
  pause: boolean;
  duration: number;
  position: number;
  volume: number;
  muted: boolean;
}

type MPVMessage = MPVCommandResponse | MPVEvent;

export class MPVClient extends EventEmitter {
  private static instance: MPVClient | null = null;

  private socket: WebSocket | null;
  private serverUrl: string;
  private serverApiKey: string;
  private commandCounter: number;
  private inflightCommands: Map<
    number,
    { resolve: (value: unknown) => void; reject: (reason?: string) => void }
  >;
  private status!: MPVStatus;

  constructor() {
    super();
    this.socket = null;
    this.serverUrl = process.env.MPV_SERVER_URL || "ws://localhost:8678/ws";
    this.serverApiKey = process.env.MPV_SERVER_API_KEY || "your-api-key-here";
    this.commandCounter = 0;
    this.inflightCommands = new Map();
    this.resetStatus();
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
      this.unobserveProperty(1);
      this.unobserveProperty(2);
      this.unobserveProperty(3);
      this.unobserveProperty(4);
      this.unobserveProperty(5);
      this.observeProperty("pause", 1);
      this.observeProperty("duration", 2);
      this.observeProperty("time-pos", 3);
      this.observeProperty("volume", 4);
      this.observeProperty("mute", 5);
    });
    socket.on("error", (err) => {
      console.error(`Failed to connect to MPV server: ${err}`);
    });
    socket.on("message", (data) => {
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
    socket.on("close", () => {
      console.log(`MPV server connection closed, reconnecting...`);
      setTimeout(() => this.start(), 1000);
    });
  }

  private sendCommand(command: unknown[]) {
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

  private getProperty(property: string) {
    return this.sendCommand(["get_property", property]);
  }

  private getPropertyString(property: string) {
    return this.sendCommand(["get_property_string", property]);
  }

  private setProperty(property: string, value: unknown) {
    return this.sendCommand(["set_property", property, value]);
  }

  private setPropertyString(property: string, value: string) {
    return this.sendCommand(["set_property_string", property, value]);
  }

  private observeProperty(property: string, id: number) {
    return this.sendCommand(["observe_property", id, property]);
  }

  private unobserveProperty(id: number) {
    return this.sendCommand(["unobserve_property", id]);
  }

  loadfile(url: string) {
    return this.sendCommand(["loadfile", url]);
  }

  pause() {
    return this.setProperty("pause", true);
  }

  play() {
    return this.setProperty("pause", false);
  }

  stop() {
    return this.sendCommand(["stop"]);
  }

  seek(position: number) {
    return this.sendCommand(["seek", position, "absolute"]);
  }

  setVolume(volume: number) {
    return this.setProperty("volume", volume);
  }

  setMuted(muted: boolean) {
    return this.setProperty("mute", muted);
  }

  private processEvent(event: MPVEvent) {
    switch (event.event) {
      case "playback-restart":
        this.updateStatus({ idle: false });
        break;
      case "end-file":
      case "idle":
        this.updateStatus({
          idle: true,
          pause: false,
          position: 0,
          duration: 0,
        });
        break;
      case "property-change":
        switch (event.name) {
          case "pause":
            this.updateStatus({ pause: (event.data ?? false) as boolean });
            break;
          case "duration":
            this.updateStatus({ duration: (event.data ?? 0) as number });
            break;
          case "time-pos":
            this.updateStatus({ position: (event.data ?? 0) as number });
            break;
          case "volume":
            this.updateStatus({ volume: (event.data ?? 100) as number });
            break;
          case "mute":
            this.updateStatus({ muted: (event.data ?? false) as boolean });
            break;
        }
        break;
    }
  }

  destroy() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.close();
      this.socket = null;
    }
    this.inflightCommands.forEach(({ reject }) => {
      reject("MPV client destroyed");
    });
    this.inflightCommands.clear();
    this.commandCounter = 0;
    this.resetStatus();
  }

  reconnect() {
    this.destroy();
    this.start();
  }

  private updateStatus(status: Partial<MPVStatus>) {
    this.status = { ...this.status, ...status };
    this.emit("status", this.status);
  }

  private resetStatus() {
    this.updateStatus({
      idle: true,
      pause: false,
      duration: 0,
      position: 0,
      volume: 100,
      muted: false,
    });
  }

  static getInstance() {
    if (!MPVClient.instance) {
      MPVClient.instance = new MPVClient();
    }
    return MPVClient.instance;
  }
}
