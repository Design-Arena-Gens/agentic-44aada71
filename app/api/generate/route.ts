import { NextRequest } from "next/server";
import { getQueueItem, updateQueueItem } from "@/lib/promptQueue";
import { generateVideoFromPrompt } from "@/lib/replicate";
import { storePublicFile } from "@/lib/blob";
import { publishInstagramVideo } from "@/lib/instagram";

export async function POST(req: NextRequest) {
  try {
    const { id, postToInstagram } = await req.json();
    if (!id || typeof id !== 'string') return Response.json({ error: 'id required' }, { status: 400 });
    const item = await getQueueItem(id);
    if (!item) return Response.json({ error: 'not found' }, { status: 404 });

    await updateQueueItem(id, { status: 'generating', error: undefined });

    // 1) Generate video from Replicate
    const sourceUrl = await generateVideoFromPrompt(item.prompt);

    // 2) Download and store to Vercel Blob
    const res = await fetch(sourceUrl);
    if (!res.ok) throw new Error(`Failed to download generated video: ${res.status}`);
    const buf = await res.arrayBuffer();
    const today = new Date().toISOString().slice(0,10);
    const stored = await storePublicFile(`videos/${today}-${id}.mp4`, buf, res.headers.get('content-type') || 'video/mp4');

    await updateQueueItem(id, { status: 'stored', videoUrl: stored.url });

    // 3) Optionally post to Instagram immediately
    if (postToInstagram) {
      await publishInstagramVideo(stored.url, item.caption);
      await updateQueueItem(id, { status: 'posted' });
    }

    return Response.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return Response.json({ error: e.message || 'failed' }, { status: 500 });
  }
}
