import type { MediaQueueStatus } from "../lib/media-queue";
import type { MPVStatus } from "../lib/mpv-client";

export interface WsMediaQueueEnqueueMessage {
  type: "media-queue/enqueue";
  data: {
    username: string;
    query: string;
  };
}

export interface WsMediaQueueRemoveMessage {
  type: "media-queue/remove";
  data: {
    username: string;
    index: number;
  };
}

export interface WsMediaQueuePlayNextMessage {
  type: "media-queue/play-next";
  data: Record<string, never>;
}

export interface WsMediaQueueStatusMessage {
  type: "media-queue/status";
  data: MediaQueueStatus;
}

export interface WsPlayerPauseMessage {
  type: "player/pause";
  data: Record<string, never>;
}

export interface WsPlayerPlayMessage {
  type: "player/play";
  data: Record<string, never>;
}

export interface WsPlayerSeekMessage {
  type: "player/seek";
  data: {
    position: number;
  };
}

export interface WsPlayerSetVolumeMessage {
  type: "player/set-volume";
  data: {
    volume: number;
  };
}

export interface WsPlayerSetMutedMessage {
  type: "player/set-muted";
  data: {
    muted: boolean;
  };
}

export interface WsPlayerStatusMessage {
  type: "player/status";
  data: MPVStatus;
}

export type WsMessage =
  | WsMediaQueueEnqueueMessage
  | WsMediaQueueRemoveMessage
  | WsMediaQueuePlayNextMessage
  | WsMediaQueueStatusMessage
  | WsPlayerPauseMessage
  | WsPlayerPlayMessage
  | WsPlayerSeekMessage
  | WsPlayerSetVolumeMessage
  | WsPlayerSetMutedMessage
  | WsPlayerStatusMessage;
