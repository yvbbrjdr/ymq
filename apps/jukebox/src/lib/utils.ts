import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function formatNumber(number: number) {
  if (number < 1000) {
    return number.toLocaleString();
  }
  if (number < 1000000) {
    return `${(number / 1000).toFixed(0)}K`;
  }
  if (number < 1000000000) {
    return `${(number / 1000000).toFixed(0)}M`;
  }
  if (number < 1000000000000) {
    return `${(number / 1000000000).toFixed(0)}B`;
  }
  return `${(number / 1000000000000).toFixed(0)}T`;
}
