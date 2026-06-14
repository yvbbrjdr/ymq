import { EventEmitter } from "events";

import { MPVClient, MPVStatus } from "./mpv-client";

export interface MediaItem {
  title: string;
  thumbnail: string;
  url: string;
  addedAt: Date;
  addedBy: string;
}

export interface MediaQueuePerUser {
  username: string;
  queue: MediaItem[];
}

export interface MediaQueueStatus {
  nowPlaying: MediaItem | null;
  queues: MediaQueuePerUser[];
}

export class MediaQueue extends EventEmitter {
  private static instance: MediaQueue | null = null;

  private status: MediaQueueStatus;
  private mpvIdle: boolean;

  private constructor() {
    super();
    this.status = {
      nowPlaying: null,
      queues: [],
    };
    this.mpvIdle = true;
  }

  start() {
    const mpv = MPVClient.getInstance();
    mpv.on("status", (status: MPVStatus) => {
      if (!this.mpvIdle && status.idle) {
        this.playNext();
      }
      this.mpvIdle = status.idle;
    });
  }

  async enqueue(username: string, url: string) {
    let queue = this.status.queues.find((q) => q.username === username);
    if (!queue) {
      queue = { username, queue: [] };
      this.status.queues.push(queue);
    }
    queue.queue.push({
      title: "Unknown",
      thumbnail: "",
      url,
      addedAt: new Date(),
      addedBy: username,
    });
    this.emit("update", this.status);
    if (!this.status.nowPlaying) {
      await this.playNext();
    }
  }

  async playNext() {
    const mpv = MPVClient.getInstance();

    this.status.nowPlaying = null;
    await mpv.stop();
    if (this.status.queues.length === 0) {
      return;
    }
    const queue = this.status.queues.shift()!;
    this.status.nowPlaying = queue.queue.shift()!;
    if (queue.queue.length > 0) {
      this.status.queues.push(queue);
    }
    await mpv.loadfile(this.status.nowPlaying.url);
    await mpv.play();
    await mpv.setFullscreen(true);
    this.emit("update", this.status);
  }

  remove(username: string, index: number) {
    const queue = this.status.queues.find((q) => q.username === username);
    if (!queue) {
      throw new Error(`Queue for user ${username} not found`);
    }
    if (index < 0 || index >= queue.queue.length) {
      throw new Error(`Index out of bounds`);
    }
    queue.queue.splice(index, 1);
    if (queue.queue.length === 0) {
      this.status.queues.splice(this.status.queues.indexOf(queue), 1);
    }
    this.emit("update", this.status);
  }

  static getInstance() {
    if (!MediaQueue.instance) {
      MediaQueue.instance = new MediaQueue();
    }
    return MediaQueue.instance;
  }
}
