import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import Link from "next/link";

import { MediaItem, MediaQueuePerUser } from "../lib/media-queue";
import { formatNumber, formatTime } from "../lib/utils";

export interface UpNextListItemProps {
  curUsername: string;
  item: MediaItem;
  index: number;
  onRemove: (username: string, index: number) => void;
}

export function UpNextListItem({
  curUsername,
  item,
  index,
  onRemove,
}: UpNextListItemProps) {
  return (
    <div className="flex gap-2 w-full items-center">
      <div className="w-1/3 min-w-1/3 aspect-video rounded-lg overflow-hidden">
        <Link href={item.url} target="_blank">
          <div className="relative w-full h-full">
            <img
              src={item.thumbnail}
              className="absolute inset-0 w-full h-full object-cover"
              title={item.description}
            />
            <div className="absolute bottom-0 right-0 px-1 mr-1 mb-1 rounded-sm bg-black/50 flex items-center justify-center">
              <p className="text-white text-xs">
                {formatTime(item.duration ?? 0)}
              </p>
            </div>
          </div>
        </Link>
      </div>
      <div className="flex flex-col w-full">
        <Link href={item.url} target="_blank" className="w-fit">
          <h3 className="text-md font-medium line-clamp-1" title={item.title}>
            {item.title}
          </h3>
        </Link>
        <Link href={item.channelUrl ?? ""} target="_blank" className="w-fit">
          <p
            className="text-sm text-gray-400 line-clamp-1"
            title={item.channel}
          >
            {item.channel}
          </p>
        </Link>
        <p className="text-sm text-gray-400">
          {formatNumber(item.viewCount ?? 0)} views •{" "}
          {new Date((item.timestamp ?? 0) * 1000).toLocaleDateString()}
        </p>
      </div>
      {item.addedBy === curUsername && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(curUsername, index)}
        >
          <Trash />
        </Button>
      )}
    </div>
  );
}

export interface UpNextListPerUserProps {
  curUsername: string;
  queue: MediaQueuePerUser;
  onRemove: (username: string, index: number) => void;
}

export function UpNextListPerUser({
  curUsername,
  queue,
  onRemove,
}: UpNextListPerUserProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-md font-medium text-gray-400">{queue.username}</p>
      {queue.queue.map((item, index) => (
        <UpNextListItem
          key={index}
          curUsername={curUsername}
          item={item}
          index={index}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

export interface UpNextListProps {
  curUsername: string;
  queues: MediaQueuePerUser[];
  onRemove: (username: string, index: number) => void;
}

export function UpNextList({ curUsername, queues, onRemove }: UpNextListProps) {
  return (
    <div className="flex flex-col gap-2">
      {queues.map((queue) => (
        <UpNextListPerUser
          key={queue.username}
          curUsername={curUsername}
          queue={queue}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
