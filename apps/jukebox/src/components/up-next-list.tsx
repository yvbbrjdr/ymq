import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import Link from "next/link";

import { MediaItem, MediaQueuePerUser } from "../lib/media-queue";

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
    <div className="flex gap-2 w-full">
      <div className="w-1/3 min-w-1/3 aspect-video rounded-lg overflow-hidden">
        <Link href={item.url} target="_blank">
          <img
            src={item.thumbnail}
            className="w-full h-full object-cover"
            title={item.description}
          />
        </Link>
      </div>
      <div className="flex flex-col gap-1 w-full">
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
