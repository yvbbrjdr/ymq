import { EventEmitter } from "events";

import { WebSocket } from "ws";

import type { WsMessage } from "../types/ws-message";

export class WsClient extends EventEmitter {
  private static instance: WsClient | null = null;

  private ws: WebSocket | null;

  private constructor() {
    super();
    this.ws = null;
  }

  start() {
    this.ws = new WebSocket("/ws");
    this.ws.on("message", (data) => {
      const parsedMessage: WsMessage = JSON.parse(data.toString());
      this.emit(parsedMessage.type, parsedMessage.data);
    });
  }

  private sendMessage(message: WsMessage) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }
    this.ws.send(JSON.stringify(message));
  }

  enqueue(username: string, url: string) {
    this.sendMessage({
      type: "media-queue/enqueue",
      data: { username, url },
    });
  }

  remove(username: string, index: number) {
    this.sendMessage({
      type: "media-queue/remove",
      data: { username, index },
    });
  }

  playNext() {
    this.sendMessage({
      type: "media-queue/play-next",
      data: {},
    });
  }

  pause() {
    this.sendMessage({
      type: "player/pause",
      data: {},
    });
  }

  play() {
    this.sendMessage({
      type: "player/play",
      data: {},
    });
  }

  stop() {
    this.sendMessage({
      type: "player/stop",
      data: {},
    });
  }

  seek(position: number) {
    this.sendMessage({
      type: "player/seek",
      data: { position },
    });
  }

  setVolume(volume: number) {
    this.sendMessage({
      type: "player/set-volume",
      data: { volume },
    });
  }

  setMuted(muted: boolean) {
    this.sendMessage({
      type: "player/set-muted",
      data: { muted },
    });
  }

  static getInstance() {
    if (!WsClient.instance) {
      WsClient.instance = new WsClient();
    }
    return WsClient.instance;
  }
}
