import { YtDlp } from "ytdlp-nodejs";

export interface MediaMetadata {
  title: string;
  thumbnail: string;
}

export const getMediaMetadata = async (url: string): Promise<MediaMetadata> => {
  const ytdlp = new YtDlp();

  try {
    const info = await ytdlp.getInfoAsync<"video">(url);

    return {
      title: info.title || "Unknown",
      thumbnail: info.thumbnail || "",
    };
  } catch (error) {
    console.error(`Failed to fetch media metadata for ${url}:`, error);

    return {
      title: "Unknown",
      thumbnail: "",
    };
  }
};
