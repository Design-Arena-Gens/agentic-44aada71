import { NextRequest } from "next/server";
import { getNextQueuedItem, updateQueueItem } from "@/lib/promptQueue";
import { generateVideoFromPrompt } from "@/lib/replicate";
import { storePublicFile } from "@/lib/blob";
import { publishInstagramVideo } from "@/lib/instagram";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Restrict to Vercel Cron
  const isCron = req.headers.get('x-vercel-cron') === '1';
  const secret = process.env.CRON_SECRET;
  if (!isCron && (!secret || req.nextUrl.searchParams.get('secret') !== secret))
    return new Response('forbidden', { status: 403 });

  const item = await getNextQueuedItem();
  if (!item) return Response.json({ ok: true, message: 'No queued items' });

  try {
    await updateQueueItem(item.id, { status: 'generating', error: undefined });

    const sourceUrl = await generateVideoFromPrompt(item.prompt);

    const res = await fetch(sourceUrl);
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    const buf = await res.arrayBuffer();
    const today = new Date().toISOString().slice(0,10);
    const stored = await storePublicFile(`videos/${today}-${item.id}.mp4`, buf, res.headers.get('content-type') || 'video/mp4');

    await updateQueueItem(item.id, { status: 'stored', videoUrl: stored.url });

    await publishInstagramVideo(stored.url, item.caption);
    await updateQueueItem(item.id, { status: 'posted' });

    return Response.json({ ok: true, id: item.id, videoUrl: stored.url });
  } catch (e: any) {
    await updateQueueItem(item.id, { status: 'failed', error: e.message || 'failed' });
    return Response.json({ error: e.message || 'failed' }, { status: 500 });
  }
}
