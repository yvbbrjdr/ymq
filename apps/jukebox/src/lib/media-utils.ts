import child_process from "child_process";

import { MediaItem } from "./media-queue";

export const getMediaMetadata = async (
  query: string,
): Promise<Partial<MediaItem> & { url: string }> => {
  let url: string;
  let isSearchQuery: boolean;
  try {
    const urlObj = new URL(query);
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      throw new Error("Only http(s) URLs are supported");
    }
    url = query;
    isSearchQuery = false;
  } catch {
    url = `ytsearch:${query}`;
    isSearchQuery = true;
  }
  return new Promise((resolve, reject) => {
    child_process.execFile(
      process.env.YT_DLP_BINARY_PATH || "yt-dlp",
      ["--dump-single-json", "--no-warnings", url],
      { maxBuffer: 1024 * 1024 * 10 },
      (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        let data = JSON.parse(stdout);
        if (isSearchQuery) {
          data = data.entries[0];
        }
        resolve({
          title: data.title || undefined,
          description: data.description || undefined,
          channel: data.channel || data.uploader || undefined,
          channelUrl: data.channel_url || data.uploader_url || undefined,
          thumbnail: data.thumbnail || undefined,
          duration: data.duration || undefined,
          viewCount: data.view_count || undefined,
          timestamp: data.timestamp || undefined,
          url: data.original_url,
        });
      },
    );
  });
};
