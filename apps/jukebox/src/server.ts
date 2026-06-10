import { createServer } from "http";

import dotenv from "dotenv";
import next from "next";

import { MPVClient } from "./lib/mpv-client";

const main = async () => {
  dotenv.config();

  MPVClient.getInstance().start();

  const app = next({ dev: process.env.NODE_ENV !== "production" });
  const host = process.env.HOST || "::";
  const port = parseInt(process.env.PORT || "3000");

  await app.prepare();

  createServer(app.getRequestHandler()).listen(port, host);

  console.log(
    `MJB is running on http://${host.includes(":") ? `[${host}]` : host}:${port}`,
  );
};

main();
