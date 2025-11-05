import { readJsonFromBlob, writeJsonToBlob } from "./blob";
import { QueueItem, PromptQueueFile } from "./types";

const PROMPTS_PATH = "data/prompts.json";

async function ensureQueue(): Promise<PromptQueueFile> {
  const data = await readJsonFromBlob<PromptQueueFile>(PROMPTS_PATH, { queue: [] });
  if (!data.queue) data.queue = [];
  return data;
}

export async function addPromptToQueue(prompt: string, caption?: string): Promise<QueueItem> {
  const now = new Date().toISOString();
  const item: QueueItem = {
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`,
    prompt,
    caption,
    status: "queued",
    createdAt: now,
    updatedAt: now
  };
  const data = await ensureQueue();
  data.queue.push(item);
  await writeJsonToBlob(PROMPTS_PATH, data);
  return item;
}

export async function listQueue(): Promise<QueueItem[]> {
  const data = await ensureQueue();
  return data.queue.sort((a,b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getQueueItem(id: string): Promise<QueueItem | undefined> {
  const data = await ensureQueue();
  return data.queue.find(q => q.id === id);
}

export async function updateQueueItem(id: string, updates: Partial<QueueItem>): Promise<QueueItem | undefined> {
  const data = await ensureQueue();
  const idx = data.queue.findIndex(q => q.id === id);
  if (idx === -1) return undefined;
  const item = data.queue[idx];
  const next: QueueItem = { ...item, ...updates, updatedAt: new Date().toISOString() };
  data.queue[idx] = next;
  await writeJsonToBlob(PROMPTS_PATH, data);
  return next;
}

export async function getNextQueuedItem(): Promise<QueueItem | undefined> {
  const data = await ensureQueue();
  return data.queue.find(q => q.status === "queued");
}
