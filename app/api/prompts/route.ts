import { NextRequest } from "next/server";
import { addPromptToQueue, listQueue } from "@/lib/promptQueue";

export async function GET() {
  const queue = await listQueue();
  return Response.json({ queue });
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, caption } = await req.json();
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 5) {
      return Response.json({ error: "Prompt required (min 5 chars)" }, { status: 400 });
    }
    const item = await addPromptToQueue(prompt.trim(), typeof caption === 'string' ? caption : undefined);
    return Response.json({ item });
  } catch (e: any) {
    return Response.json({ error: e.message || 'Invalid request' }, { status: 400 });
  }
}
