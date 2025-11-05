export type QueueStatus = "queued" | "generating" | "stored" | "posted" | "failed";

export interface QueueItem {
  id: string;
  prompt: string;
  caption?: string;
  status: QueueStatus;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  videoUrl?: string;
  error?: string;
}

export interface PromptQueueFile {
  queue: QueueItem[];
}
