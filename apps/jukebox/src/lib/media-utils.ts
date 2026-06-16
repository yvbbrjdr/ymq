import child_process from "child_process";

export interface MediaMetadata {
  title: string;
  channel: string;
  thumbnail: string;
}

export const getMediaMetadata = async (url: string): Promise<MediaMetadata> => {
  return new Promise((resolve) => {
    child_process.exec(
      `yt-dlp -O title -O channel -O thumbnail ${url}`,
      (error, stdout) => {
        if (error) {
          resolve({
            title: "Unknown",
            channel: "Unknown",
            thumbnail: "",
          });
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
