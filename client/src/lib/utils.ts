import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format date to a readable string
export function formatDate(date: Date | string | undefined): string {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ZMW",
    minimumFractionDigits: 2,
  }).format(amount);
}

// Shorten a hash for display
export function shortenHash(hash: string, length: number = 10): string {
  if (!hash) return "";
  if (hash.length <= length * 2) return hash;
  return `${hash.substring(0, length)}...${hash.substring(hash.length - length)}`;
}

// Get block type based on transactions
export function getBlockType(block: any): { type: string; color: string } {
  if (!block || !block.data || !block.data.transactions || !block.data.transactions.length) {
    return { type: "Unknown", color: "gray" };
  }
  
  const tx = block.data.transactions[0];
  
  if (block.index === 0) {
    return { type: "Genesis", color: "gray" };
  }
  
  switch (tx.type) {
    case "policy":
      return { type: "Policy", color: "blue" };
    case "claim":
      return { type: "Claim", color: "green" };
    case "settlement":
      return { type: "Settlement", color: "amber" };
    case "evidence":
      return { type: "Evidence", color: "purple" };
    default:
      return { type: "Other", color: "gray" };
  }
}

// Get status color class
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
    case "approved":
    case "completed":
    case "verified":
      return "bg-green-100 text-green-800";
    case "processing":
    case "syncing":
      return "bg-gray-100 text-gray-800";
    case "pending_evidence":
    case "pending evidence":
      return "bg-amber-100 text-amber-800";
    case "investigation":
    case "rejected":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

// Convert timestamp to relative time (e.g., "2 minutes ago")
export function timeAgo(date: Date | string): string {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  const seconds = Math.floor((new Date().getTime() - d.getTime()) / 1000);
  
  let interval = Math.floor(seconds / 31536000);
  if (interval > 1) return `${interval} years ago`;
  if (interval === 1) return "1 year ago";
  
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) return `${interval} months ago`;
  if (interval === 1) return "1 month ago";
  
  interval = Math.floor(seconds / 86400);
  if (interval > 1) return `${interval} days ago`;
  if (interval === 1) return "1 day ago";
  
  interval = Math.floor(seconds / 3600);
  if (interval > 1) return `${interval} hours ago`;
  if (interval === 1) return "1 hour ago";
  
  interval = Math.floor(seconds / 60);
  if (interval > 1) return `${interval} minutes ago`;
  if (interval === 1) return "1 minute ago";
  
  return "just now";
}
