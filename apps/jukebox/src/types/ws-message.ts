export interface WsMediaQueueEnqueueMessage {
  type: "media-queue/enqueue";
  data: {
    username: string;
    url: string;
  };
}

export interface WsMediaQueueRemoveMessage {
  type: "media-queue/remove";
  data: {
    username: string;
    index: number;
  };
}

export type WsMessage = WsMediaQueueEnqueueMessage | WsMediaQueueRemoveMessage;
