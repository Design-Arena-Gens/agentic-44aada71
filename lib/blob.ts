import { list, put } from "@vercel/blob";

export async function readJsonFromBlob<T>(path: string, defaultValue: T): Promise<T> {
  const l = await list({ prefix: path });
  const entry = l.blobs.find(b => b.pathname === path) || l.blobs[0];
  if (!entry) return defaultValue;
  const res = await fetch(entry.url, { cache: 'no-store' });
  if (!res.ok) return defaultValue;
  return await res.json() as T;
}

export async function writeJsonToBlob(path: string, data: unknown) {
  await put(path, JSON.stringify(data, null, 2), {
    access: "public",
    contentType: "application/json"
  });
}

export async function storePublicFile(path: string, data: ArrayBuffer, contentType: string): Promise<{ url: string; pathname: string; }> {
  const blob = await put(path, Buffer.from(data), {
    access: "public",
    contentType
  });
  return { url: blob.url, pathname: blob.pathname } as any;
}
