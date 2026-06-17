import { EventEmitter } from "events";

import { getMediaMetadata } from "./media-utils";
import { MPVClient } from "./mpv-client";

export interface MediaItem {
  title?: string;
  description?: string;
  channel?: string;
  channelUrl?: string;
  thumbnail?: string;
  duration?: number;
  viewCount?: number;
  timestamp?: number;
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

  status: MediaQueueStatus;
  private playingNext: boolean;

  private constructor() {
    super();
    this.status = {
      nowPlaying: null,
      queues: [],
    };
    this.playingNext = false;
  }

  start() {
    const mpv = MPVClient.getInstance();
    mpv.on("end-file", (reason: string) => {
      if (reason !== "stop") {
        this.playNext();
      }
    });
  }

  async enqueue(username: string, url: string) {
    const metadata = await getMediaMetadata(url);
    let queue = this.status.queues.find((q) => q.username === username);
    if (!queue) {
      queue = { username, queue: [] };
      this.status.queues.push(queue);
    }
    queue.queue.push({
      ...metadata,
      url,
      addedAt: new Date(),
      addedBy: username,
    });
    this.emit("status", this.status);
    if (!this.status.nowPlaying) {
      await this.playNext();
    }
  }

  async playNext() {
    if (this.playingNext) {
      return;
    }
    this.playingNext = true;

    try {
      const mpv = MPVClient.getInstance();

      this.status.nowPlaying = null;
      this.emit("status", this.status);
      await mpv.stop();
      if (this.status.queues.length === 0) {
        return;
      }
      await mpv.loadfile(this.status.queues[0].queue[0].url);
      await mpv.play();
      await mpv.setFullscreen(true);
      const queue = this.status.queues.shift()!;
      this.status.nowPlaying = queue.queue.shift()!;
      if (queue.queue.length > 0) {
        this.status.queues.push(queue);
      }
      this.emit("status", this.status);
    } finally {
      this.playingNext = false;
    }
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
    this.emit("status", this.status);
  }

  static getInstance() {
    if (!MediaQueue.instance) {
      MediaQueue.instance = new MediaQueue();
    }
    return MediaQueue.instance;
  }
}
