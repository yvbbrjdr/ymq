import { getConnInfo } from "@hono/node-server/conninfo";
import type { Context } from "hono";

export const getRemoteAddrPort = (c: Context) => {
  const connInfo = getConnInfo(c);
  return `${connInfo.remote.addressType === "IPv6" ? `[${connInfo.remote.address}]` : connInfo.remote.address}:${connInfo.remote.port}`;
};
