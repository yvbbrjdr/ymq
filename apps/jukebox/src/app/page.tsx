"use client";

import { useEffect } from "react";

import { WsClient } from "../lib/ws-client";

export default function Home() {
  const wsClient = WsClient.getInstance();

  useEffect(() => {
    wsClient.start();
    return () => wsClient.destroy();
  }, [wsClient]);

  return <></>;
}
