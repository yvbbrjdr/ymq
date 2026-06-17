"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ClipboardPaste, LogOut, Plus, Radio, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { MediaQueueStatus } from "../lib/media-queue";
import { MPVStatus } from "../lib/mpv-client";
import { WsClient } from "../lib/ws-client";

export default function Home() {
  const router = useRouter();
  const wsClient = WsClient.getInstance();
  const [username, setUsername] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [playerStatus, setPlayerStatus] = useState<MPVStatus>({
    idle: true,
    pause: false,
    duration: 0,
    position: 0,
    volume: 0,
    muted: false,
  });
  const [mediaQueueStatus, setMediaQueueStatus] = useState<MediaQueueStatus>({
    nowPlaying: null,
    queues: [],
  });

  useEffect(() => {
    const savedUsername = localStorage.getItem("username");
    if (savedUsername) {
      setUsername(savedUsername);
    } else {
      router.push("/login");
    }
  }, []);

  useEffect(() => {
    wsClient.addEventListener("player/status", (event) => {
      const status = (event as CustomEvent<MPVStatus>).detail;
      setPlayerStatus(status);
    });
    wsClient.addEventListener("media-queue/status", (event) => {
      const status = (event as CustomEvent<MediaQueueStatus>).detail;
      setMediaQueueStatus(status);
    });
    wsClient.start();
    return () => wsClient.destroy();
  }, [wsClient]);

  const handleAddToQueue = () => {
    const trimmedQuery = query.trim();
    if (trimmedQuery === "") {
      return;
    }
    wsClient.enqueue(username, trimmedQuery);
    setQuery("");
  };

  return (
    <div className="container mx-auto px-10 my-10 flex flex-col gap-8">
      <Card className="px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Radio className="text-primary" />
              <p className="text-md text-gray-400">YMQ Jukebox</p>
            </div>
            <h1 className="text-5xl font-bold">Drop the beat!</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="cursor-default">
              <User className="mr-2" />
              {username}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem("username");
                router.push("/login");
              }}
            >
              <LogOut className="mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </Card>
      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Now Playing</h2>
            </CardHeader>
            <CardContent>
              <pre>{JSON.stringify(playerStatus, null, 2)}</pre>
              <pre>{JSON.stringify(mediaQueueStatus.nowPlaying, null, 2)}</pre>
            </CardContent>
          </Card>
        </div>
        <div className="col-span-1 flex flex-col gap-8">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Add to Queue</h2>
              <p className="text-sm text-gray-400">
                Paste a URL or enter a search query to add it to the queue
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <InputGroup>
                  <InputGroupInput
                    type="text"
                    placeholder="URL or search query"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleAddToQueue();
                      }
                    }}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      size="icon-xs"
                      onClick={() => {
                        navigator.clipboard.readText().then((text) => {
                          setQuery(text);
                        });
                      }}
                    >
                      <ClipboardPaste />
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                <Button onClick={handleAddToQueue}>
                  <Plus />
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Up Next</h2>
            </CardHeader>
            <CardContent>
              <pre>{JSON.stringify(mediaQueueStatus.queues, null, 2)}</pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
