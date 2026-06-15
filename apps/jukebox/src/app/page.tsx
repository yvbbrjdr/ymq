"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { WsClient } from "../lib/ws-client";

export default function Home() {
  const router = useRouter();
  const wsClient = WsClient.getInstance();
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    const savedUsername = localStorage.getItem("username");
    if (savedUsername) {
      setUsername(savedUsername);
    } else {
      router.push("/login");
    }
  }, []);

  useEffect(() => {
    wsClient.start();
    return () => wsClient.destroy();
  }, [wsClient]);

  return <>{username}</>;
}
