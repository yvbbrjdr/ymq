"use client";

import { useEffect, useMemo } from "react";

import { WsClient } from "../lib/ws-client";

export default function Home() {
  const wsClient = useMemo(() => WsClient.getInstance(), []);

  useEffect(() => {
    wsClient.start();
    return () => wsClient.destroy();
  }, [wsClient]);

  return <></>;
}
