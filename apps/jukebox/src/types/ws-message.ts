import type { MediaQueueStatus } from "../lib/media-queue";
import type { MPVStatus } from "../lib/mpv-client";

export interface WsBaseMessage {
  type: string;
  id?: string;
  data: object;
}

export interface WsResponseMessage extends WsBaseMessage {
  type: "response";
  data: {
    ok: boolean;
    error: string;
  };
}

export interface WsMediaQueueEnqueueMessage extends WsBaseMessage {
  type: "media-queue/enqueue";
  data: {
    username: string;
    query: string;
  };
}

export interface WsMediaQueueRemoveMessage extends WsBaseMessage {
  type: "media-queue/remove";
  data: {
    username: string;
    index: number;
  };
}

export interface WsMediaQueuePlayNextMessage extends WsBaseMessage {
  type: "media-queue/play-next";
  data: Record<string, never>;
}

export interface WsMediaQueueStatusMessage extends WsBaseMessage {
  type: "media-queue/status";
  data: MediaQueueStatus;
}

export interface WsPlayerPauseMessage extends WsBaseMessage {
  type: "player/pause";
  data: Record<string, never>;
}

export interface WsPlayerPlayMessage extends WsBaseMessage {
  type: "player/play";
  data: Record<string, never>;
}

export interface WsPlayerSeekMessage extends WsBaseMessage {
  type: "player/seek";
  data: {
    position: number;
  };
}

export interface WsPlayerSetVolumeMessage extends WsBaseMessage {
  type: "player/set-volume";
  data: {
    volume: number;
  };
}

export interface WsPlayerSetMutedMessage extends WsBaseMessage {
  type: "player/set-muted";
  data: {
    muted: boolean;
  };
}

export interface WsPlayerStatusMessage extends WsBaseMessage {
  type: "player/status";
  data: MPVStatus;
}

export type WsMessage =
  | WsResponseMessage
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
