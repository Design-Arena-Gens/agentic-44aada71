const GRAPH_BASE = "https://graph.facebook.com/v21.0";

function requiredEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env ${key}`);
  return v;
}

export interface PublishResult {
  containerId: string;
  mediaId: string;
}

export async function publishInstagramVideo(videoUrl: string, caption?: string): Promise<PublishResult> {
  const IG_USER_ID = requiredEnv("IG_USER_ID");
  const IG_ACCESS_TOKEN = requiredEnv("IG_ACCESS_TOKEN");

  // Step 1: Create media container
  const createParams = new URLSearchParams({
    media_type: "VIDEO",
    video_url: videoUrl,
    caption: caption || "",
    access_token: IG_ACCESS_TOKEN,
  });
  const createRes = await fetch(`${GRAPH_BASE}/${IG_USER_ID}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: createParams.toString()
  });
  const createJson = await createRes.json();
  if (!createRes.ok || !createJson.id) {
    throw new Error(`Failed to create IG media container: ${createRes.status} ${JSON.stringify(createJson)}`);
  }
  const containerId = createJson.id as string;

  // Optionally poll container status (recommended)
  const maxChecks = 20;
  for (let i = 0; i < maxChecks; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const statusRes = await fetch(`${GRAPH_BASE}/${containerId}?fields=status_code&access_token=${IG_ACCESS_TOKEN}`);
    const statusJson = await statusRes.json();
    const status = statusJson.status_code as string | undefined;
    if (status === "FINISHED") break;
    if (status === "ERROR") throw new Error(`IG container processing error: ${JSON.stringify(statusJson)}`);
    // continue polling otherwise
    if (i === maxChecks - 1) throw new Error(`IG container not ready after polling`);
  }

  // Step 2: Publish media
  const pubParams = new URLSearchParams({
    creation_id: containerId,
    access_token: IG_ACCESS_TOKEN,
  });
  const pubRes = await fetch(`${GRAPH_BASE}/${IG_USER_ID}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: pubParams.toString(),
  });
  const pubJson = await pubRes.json();
  if (!pubRes.ok || !pubJson.id) {
    throw new Error(`Failed to publish IG media: ${pubRes.status} ${JSON.stringify(pubJson)}`);
  }

  return { containerId, mediaId: pubJson.id as string };
}
