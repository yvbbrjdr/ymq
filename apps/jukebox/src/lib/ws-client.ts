import type { WsMessage } from "../types/ws-message";

export class WsClient extends EventTarget {
  private static instance: WsClient | null = null;

  private ws: WebSocket | null;
  private boundOnMessage: (event: MessageEvent) => void;
  private boundOnClose: () => void;
  private inflightCommands: Map<
    string,
    { resolve: () => void; reject: (reason?: string) => void }
  >;

  private constructor() {
    super();
    this.ws = null;
    this.boundOnMessage = this.onMessage.bind(this);
    this.boundOnClose = this.onClose.bind(this);
    this.inflightCommands = new Map();
  }

  start() {
    this.ws = new WebSocket("/ws");
    this.ws.addEventListener("message", this.boundOnMessage);
    this.ws.addEventListener("close", this.boundOnClose);
  }

  private onMessage(event: MessageEvent) {
    const parsedMessage: WsMessage = JSON.parse(event.data.toString());
    if (parsedMessage.type === "response") {
      if (!parsedMessage.id) {
        console.warn(
          `Received response with no id: ${JSON.stringify(parsedMessage)}`,
        );
        return;
      }
      const inflight = this.inflightCommands.get(parsedMessage.id);
      if (!inflight) {
        console.warn(`Received response for unknown id: ${parsedMessage.id}`);
        return;
      }
      this.inflightCommands.delete(parsedMessage.id);
      if (parsedMessage.data.ok) {
        inflight.resolve();
      } else {
        inflight.reject(parsedMessage.data.error);
      }
      return;
    }
    this.dispatchEvent(
      new CustomEvent(parsedMessage.type, { detail: parsedMessage.data }),
    );
  }

  private async onClose() {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    this.start();
  }

  private sendMessage(message: WsMessage, timeout: number = 1000) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }
    const requestId = crypto.randomUUID();
    message.id = requestId;
    this.ws.send(JSON.stringify(message));
    return new Promise<void>((resolve, reject) => {
      this.inflightCommands.set(requestId, { resolve, reject });
      setTimeout(() => {
        if (this.inflightCommands.has(requestId)) {
          this.inflightCommands.delete(requestId);
          reject(`WebSocket command timed out: ${message}`);
        }
      }, timeout);
    });
  }

  enqueue(username: string, query: string) {
    return this.sendMessage(
      {
        type: "media-queue/enqueue",
        data: { username, query },
      },
      30000,
    );
  }

  remove(username: string, index: number) {
    return this.sendMessage({
      type: "media-queue/remove",
      data: { username, index },
    });
  }

  playNext() {
    return this.sendMessage({
      type: "media-queue/play-next",
      data: {},
    });
  }

  pause() {
    return this.sendMessage({
      type: "player/pause",
      data: {},
    });
  }

  play() {
    return this.sendMessage({
      type: "player/play",
      data: {},
    });
  }

  seek(position: number) {
    return this.sendMessage({
      type: "player/seek",
      data: { position },
    });
  }

  setVolume(volume: number) {
    return this.sendMessage({
      type: "player/set-volume",
      data: { volume },
    });
  }

  setMuted(muted: boolean) {
    return this.sendMessage({
      type: "player/set-muted",
      data: { muted },
    });
  }

  destroy() {
    if (this.ws) {
      this.ws.removeEventListener("message", this.boundOnMessage);
      this.ws.removeEventListener("close", this.boundOnClose);
      this.ws.close();
      this.ws = null;
    }
  }

  static getInstance() {
    if (!WsClient.instance) {
      WsClient.instance = new WsClient();
    }
    return WsClient.instance;
  }
}
