import Replicate from "replicate";

const REQUIRED_ENV = ["REPLICATE_API_TOKEN", "REPLICATE_MODEL"] as const;

export function assertReplicateEnv() {
  for (const k of REQUIRED_ENV) {
    if (!process.env[k]) throw new Error(`Missing env ${k}`);
  }
}

export async function generateVideoFromPrompt(prompt: string): Promise<string> {
  assertReplicateEnv();
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! });
  const model = process.env.REPLICATE_MODEL!; // e.g. "camenduru/zeroscope-v2-xl:VERSION_HASH"
  const input: Record<string, any> = { prompt };
  if (process.env.REPLICATE_INPUT_JSON) {
    try {
      const j = JSON.parse(process.env.REPLICATE_INPUT_JSON);
      Object.assign(input, j);
    } catch {}
  }
  const output = await replicate.run(model as `${string}/${string}` | `${string}/${string}:${string}` as any, { input });
  // Many video models return an array of URLs or a single URL
  let url: string | undefined;
  if (Array.isArray(output)) {
    url = output.find((u: any) => typeof u === 'string' && (u.endsWith('.mp4') || u.startsWith('http')));
    if (!url && output.length > 0 && typeof output[0] === 'string') url = output[0];
  } else if (typeof output === 'string') {
    url = output;
  } else if (output && typeof output === 'object' && 'output' in (output as any)) {
    const inner = (output as any).output;
    if (Array.isArray(inner)) url = inner[0];
    if (typeof inner === 'string') url = inner;
  }
  if (!url) throw new Error("No video URL in model output");
  return url;
}
