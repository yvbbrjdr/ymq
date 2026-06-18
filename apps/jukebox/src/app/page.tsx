"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Slider } from "@/components/ui/slider";
import {
  ClipboardPaste,
  LogOut,
  Pause,
  Play,
  Plus,
  Radio,
  SkipForward,
  Tv,
  User,
  Volume2,
  VolumeX,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { MediaQueueStatus } from "../lib/media-queue";
import { MPVStatus } from "../lib/mpv-client";
import { formatTime } from "../lib/utils";
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
  const [playerPosition, setPlayerPosition] = useState<number>(0);
  const positionDragging = useRef<boolean>(false);

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
      if (!positionDragging.current) {
        setPlayerPosition(status.position);
      }
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
          <Card className="relative px-6 py-6">
            {mediaQueueStatus.nowPlaying?.thumbnail && (
              <>
                <div
                  className="absolute inset-0 scale-110 bg-cover bg-center opacity-40 blur-2xl"
                  style={{
                    backgroundImage: `url(${mediaQueueStatus.nowPlaying?.thumbnail})`,
                  }}
                />
                <div className="absolute inset-0 bg-card/70" />
              </>
            )}
            <div className="relative z-10 flex flex-col gap-4">
              <div className="w-full aspect-video rounded-xl overflow-hidden border border-gray-500">
                {mediaQueueStatus.nowPlaying ? (
                  <Link href={mediaQueueStatus.nowPlaying.url} target="_blank">
                    <img
                      src={mediaQueueStatus.nowPlaying.thumbnail}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                ) : (
                  <div className="w-full h-full flex flex-col gap-2 items-center justify-center">
                    <Tv className="text-gray-400 size-10" />
                    <p className="text-gray-400">No media playing</p>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1">
                {mediaQueueStatus.nowPlaying?.title ? (
                  <Link href={mediaQueueStatus.nowPlaying.url} target="_blank">
                    <h2 className="text-2xl font-bold">
                      {mediaQueueStatus.nowPlaying.title}
                    </h2>
                  </Link>
                ) : (
                  <h2 className="text-2xl font-bold">No media playing</h2>
                )}
                {mediaQueueStatus.nowPlaying?.channel ? (
                  <Link
                    href={mediaQueueStatus.nowPlaying?.channelUrl ?? ""}
                    target="_blank"
                  >
                    <p className="text-md text-gray-400">
                      {mediaQueueStatus.nowPlaying.channel}
                    </p>
                  </Link>
                ) : (
                  <p className="text-md text-gray-400">No channel</p>
                )}
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex flex-col items-center gap-1 w-full">
                  <div className="flex justify-between w-full">
                    <p className="text-md text-gray-400">
                      {formatTime(playerPosition)}
                    </p>
                    <p className="text-md text-gray-400">
                      {formatTime(playerStatus.duration)}
                    </p>
                  </div>
                  <Slider
                    min={0}
                    max={playerStatus.duration}
                    value={[playerPosition]}
                    onValueChange={(value) => {
                      setPlayerPosition(value[0]);
                      wsClient.seek(value[0]);
                      positionDragging.current = false;
                    }}
                    onPointerDown={() => {
                      positionDragging.current = true;
                    }}
                  />
                </div>
                <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center">
                  <div />
                  <div className="flex items-center justify-center">
                    <Button variant="ghost" className="size-12 invisible" />
                    <Button
                      variant="ghost"
                      className="size-16"
                      disabled={playerStatus.idle}
                      onClick={() => {
                        if (playerStatus.pause) {
                          wsClient.play();
                        } else {
                          wsClient.pause();
                        }
                      }}
                    >
                      {playerStatus.pause || playerStatus.idle ? (
                        <Play className="size-8" />
                      ) : (
                        <Pause className="size-8" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      className="size-12"
                      disabled={playerStatus.idle}
                      onClick={() => {
                        wsClient.playNext();
                      }}
                    >
                      <SkipForward className="size-6" />
                    </Button>
                  </div>
                  <div className="flex w-40 justify-self-end gap-1">
                    <Button
                      variant="ghost"
                      className="size-10"
                      onClick={() => {
                        wsClient.setMuted(!playerStatus.muted);
                      }}
                    >
                      {playerStatus.muted ? (
                        <VolumeX className="size-5" />
                      ) : (
                        <Volume2 className="size-5" />
                      )}
                    </Button>
                    <Slider
                      min={0}
                      max={100}
                      value={[playerStatus.volume]}
                      onValueChange={(value) => {
                        wsClient.setVolume(value[0]);
                      }}
                    />
                  </div>
                </div>
              </div>
              <pre>{JSON.stringify(mediaQueueStatus.nowPlaying, null, 2)}</pre>
            </div>
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
