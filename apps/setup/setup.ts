import child_process from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import prompts from "prompts";

interface BinaryLookupMetadata {
  names: string[];
  macosAppName?: string;
}

interface BrowserLookupMetadata extends BinaryLookupMetadata {
  displayName: string;
  ytDlpFlag: string;
}

const mpvMetadata: BinaryLookupMetadata = {
  names: ["mpv"],
  macosAppName: "mpv",
};

const ytDlpMetadata: BinaryLookupMetadata = {
  names: ["yt-dlp"],
};

const browserMetadata: BrowserLookupMetadata[] = [
  {
    names: ["brave", "brave-browser", "brave-browser-stable"],
    macosAppName: "Brave Browser",
    displayName: "Brave",
    ytDlpFlag: "brave",
  },
  {
    names: ["google-chrome", "google-chrome-stable"],
    macosAppName: "Google Chrome",
    displayName: "Google Chrome",
    ytDlpFlag: "chrome",
  },
  {
    names: ["chromium", "chromium-browser"],
    macosAppName: "Chromium",
    displayName: "Chromium",
    ytDlpFlag: "chromium",
  },
  {
    names: ["microsoft-edge", "microsoft-edge-stable"],
    macosAppName: "Microsoft Edge",
    displayName: "Microsoft Edge",
    ytDlpFlag: "edge",
  },
  {
    names: ["firefox"],
    macosAppName: "Firefox",
    displayName: "Firefox",
    ytDlpFlag: "firefox",
  },
  {
    names: ["opera", "opera-stable"],
    macosAppName: "Opera",
    displayName: "Opera",
    ytDlpFlag: "opera",
  },
  {
    names: [],
    macosAppName: "Safari",
    displayName: "Safari",
    ytDlpFlag: "safari",
  },
  {
    names: ["vivaldi", "vivaldi-stable"],
    macosAppName: "Vivaldi",
    displayName: "Vivaldi",
    ytDlpFlag: "vivaldi",
  },
  {
    names: ["naver-whale-stable"],
    macosAppName: "Whale",
    displayName: "Whale",
    ytDlpFlag: "whale",
  },
];

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const detectBinary = async (metadata: BinaryLookupMetadata) => {
  for (const name of metadata.names) {
    const fromPath = await new Promise<string | null>((resolve) => {
      child_process.execFile("which", [name], (error, stdout) => {
        if (error) {
          resolve(null);
          return;
        }
        resolve(stdout.trim());
      });
    });
    if (fromPath) {
      return fromPath;
    }
  }
  if (!metadata.macosAppName) {
    return null;
  }
  const appPath = path.join(
    "/Applications",
    `${metadata.macosAppName}.app`,
    "Contents",
    "MacOS",
    metadata.macosAppName,
  );
  if (fs.existsSync(appPath)) {
    return appPath;
  }
  return null;
};

const saveEnv = (env: Record<string, string>, filePath: string) => {
  const content =
    Object.entries(env)
      .map(
        ([key, value]) =>
          `${key}="${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`,
      )
      .join("\n") + "\n";
  fs.writeFileSync(path.join(projectRoot, filePath), content);
};

const main = async () => {
  let mpvBinaryPath = await detectBinary(mpvMetadata);
  if (mpvBinaryPath) {
    console.log(`Found MPV binary at ${mpvBinaryPath}`);
  } else {
    console.log(
      "MPV binary not found in the system, please make sure it is installed and enter the path to the binary.",
    );
    const result = await prompts({
      type: "text",
      name: "mpvBinaryPath",
      message: "Path to MPV binary:",
      validate: (value) => {
        if (!value) {
          return "Please enter a path to the MPV binary.";
        }
        return fs.existsSync(value) || "No file exists at that path.";
      },
    });
    mpvBinaryPath = result.mpvBinaryPath as string;
  }

  let ytDlpBinaryPath = await detectBinary(ytDlpMetadata);
  if (ytDlpBinaryPath) {
    console.log(`Found yt-dlp binary at ${ytDlpBinaryPath}`);
  } else {
    console.log(
      "yt-dlp binary not found in the system, please make sure it is installed and enter the path to the binary.",
    );
    const result = await prompts({
      type: "text",
      name: "ytDlpBinaryPath",
      message: "Path to yt-dlp binary:",
      validate: (value) => {
        if (!value) {
          return "Please enter a path to the yt-dlp binary.";
        }
        return fs.existsSync(value) || "No file exists at that path.";
      },
    });
    ytDlpBinaryPath = result.ytDlpBinaryPath as string;
  }

  const browserDetected = await Promise.all(
    browserMetadata.map(async (browser) => {
      return {
        displayName: browser.displayName,
        ytDlpFlag: browser.ytDlpFlag,
        detected: (await detectBinary(browser)) !== null,
      };
    }),
  );
  browserDetected.sort((a, b) => Number(b.detected) - Number(a.detected));
  const result = await prompts({
    type: "select",
    name: "ytDlpCookiesFromBrowser",
    message: "Select a browser to use for yt-dlp cookies:",
    choices: [
      { title: "None", value: null },
      ...browserDetected.map((browser) => ({
        title: `${browser.displayName}${browser.detected ? " (detected)" : ""}`,
        value: browser.ytDlpFlag,
      })),
    ],
    initial: browserDetected[0].detected ? 1 : 0,
  });
  const ytDlpCookiesFromBrowser = result.ytDlpCookiesFromBrowser as
    | string
    | null;

  const mpvServerEnv = {
    MPV_BINARY_PATH: mpvBinaryPath,
    YT_DLP_BINARY_PATH: ytDlpBinaryPath,
    ...(ytDlpCookiesFromBrowser
      ? { YT_DLP_COOKIES_FROM_BROWSER: ytDlpCookiesFromBrowser }
      : {}),
  };
  const jukeboxEnv = {
    YT_DLP_BINARY_PATH: ytDlpBinaryPath,
    ...(ytDlpCookiesFromBrowser
      ? { YT_DLP_COOKIES_FROM_BROWSER: ytDlpCookiesFromBrowser }
      : {}),
  };

  saveEnv(mpvServerEnv, "apps/mpv-server/.env");
  saveEnv(jukeboxEnv, "apps/jukebox/.env");
};

main();
