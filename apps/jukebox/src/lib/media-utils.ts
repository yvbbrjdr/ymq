import child_process from "child_process";

import { MediaItem } from "./media-queue";

export const getMediaMetadata = async (
  url: string,
): Promise<Partial<MediaItem>> => {
  return new Promise((resolve) => {
    child_process.exec(
      `yt-dlp --dump-single-json --no-warnings ${url}`,
      (error, stdout) => {
        if (error) {
          resolve({});
          return;
        }
        const data = JSON.parse(stdout);
        resolve({
          title: data.title || undefined,
          description: data.description || undefined,
          channel: data.channel || undefined,
          channelUrl: data.channel_url || undefined,
          thumbnail: data.thumbnail || undefined,
          duration: data.duration || undefined,
          viewCount: data.view_count || undefined,
          timestamp: data.timestamp || undefined,
        });
      },
    );
  });
};
