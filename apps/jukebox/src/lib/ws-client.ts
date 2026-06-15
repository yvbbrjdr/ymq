import type { WsMessage } from "../types/ws-message";

export class WsClient extends EventTarget {
  private static instance: WsClient | null = null;

  private ws: WebSocket | null;
  private boundOnMessage: (event: MessageEvent) => void;
  private boundOnClose: () => void;

  private constructor() {
    super();
    this.ws = null;
    this.boundOnMessage = this.onMessage.bind(this);
    this.boundOnClose = this.onClose.bind(this);
  }

  start() {
    this.ws = new WebSocket("/ws");
    this.ws.addEventListener("message", this.boundOnMessage);
    this.ws.addEventListener("close", this.boundOnClose);
  }

  private onMessage(event: MessageEvent) {
    const parsedMessage: WsMessage = JSON.parse(event.data.toString());
    this.dispatchEvent(
      new CustomEvent(parsedMessage.type, { detail: parsedMessage.data }),
    );
  }

  private async onClose() {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    this.start();
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
