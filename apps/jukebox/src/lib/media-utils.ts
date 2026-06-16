import child_process from "child_process";

import { MediaItem } from "./media-queue";

export const getMediaMetadata = async (
  url: string,
): Promise<Partial<MediaItem>> => {
  return new Promise((resolve) => {
    child_process.exec(
      `yt-dlp -O title -O channel -O thumbnail ${url}`,
      (error, stdout) => {
        if (error) {
          resolve({});
          return;
        }
        const lines = stdout.split("\n");
        resolve({
          title: lines[0],
          channel: lines[1],
          thumbnail: lines[2],
        });
      },
    );
  });
};
