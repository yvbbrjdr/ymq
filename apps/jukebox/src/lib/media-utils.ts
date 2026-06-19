import child_process from "child_process";

import { MediaItem } from "./media-queue";

const getYtDlpBinaryPath = () => {
  return process.env.YT_DLP_BINARY_PATH || "yt-dlp";
};

const getUrlFromQuery = (query: string): Promise<string> => {
  try {
    const url = new URL(query);
    if (!["http:", "https:"].includes(url.protocol)) {
      throw new Error("Only http(s) URLs are supported");
    }
    return Promise.resolve(query);
  } catch {
    return new Promise((resolve, reject) => {
      child_process.execFile(
        getYtDlpBinaryPath(),
        ["-O", "original_url", `ytsearch:${query}`],
        (error, stdout) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(stdout.trim());
        },
      );
    });
  }
};

export const getMediaMetadata = async (
  query: string,
): Promise<Partial<MediaItem> & { url: string }> => {
  const url = await getUrlFromQuery(query);
  return new Promise((resolve, reject) => {
    child_process.execFile(
      getYtDlpBinaryPath(),
      ["--dump-single-json", "--no-warnings", url],
      (error, stdout) => {
        if (error) {
          reject(error);
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
          url,
        });
      },
    );
  });
};
