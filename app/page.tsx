"use client";

import { useEffect, useMemo, useState } from "react";

type QueueItem = {
  id: string;
  prompt: string;
  status: "queued" | "generating" | "stored" | "posted" | "failed";
  createdAt: string;
  updatedAt: string;
  videoUrl?: string;
  error?: string;
};

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const [caption, setCaption] = useState("");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const canSubmit = useMemo(() => prompt.trim().length > 4, [prompt]);

  async function loadQueue() {
    const res = await fetch("/api/prompts", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setQueue(data.queue ?? []);
    }
  }

  useEffect(() => { loadQueue(); }, []);

  async function submitPrompt(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, caption })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to enqueue");
      setPrompt("");
      setCaption("");
      await loadQueue();
      setMessage("Prompt enqueued");
    } catch (err: any) {
      setMessage(err.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  async function runNow(id: string) {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/generate`, { method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ id })});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      await loadQueue();
      setMessage("Generation started");
    } catch (e: any) {
      setMessage(e.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <h1 style={{ fontSize: 28, margin: "12px 0" }}>Agentic Video Poster</h1>
      <p className="small">Generate videos from prompts and auto-post daily to Instagram.</p>
      <hr />
      <div className="card" style={{ marginBottom: 16 }}>
        <form onSubmit={submitPrompt}>
          <label>Video Prompt</label>
          <textarea rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe the video you want..." />
          <div style={{ height: 8 }} />
          <label>Instagram Caption (optional)</label>
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="#hashtags and a short caption" />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 12 }}>
            <button className="primary" disabled={!canSubmit || loading}>Add to Queue</button>
            {message && <span className="small">{message}</span>}
          </div>
        </form>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Queue</h2>
          <button onClick={loadQueue}>Refresh</button>
        </div>
        <table className="table" style={{ marginTop: 8 }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Status</th>
              <th>Prompt</th>
              <th>Video</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {queue.length === 0 && (
              <tr><td colSpan={5} className="small">No items yet</td></tr>
            )}
            {queue.map((q) => (
              <tr key={q.id}>
                <td className="small" style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.id}</td>
                <td>
                  <span className={`badge ${q.status === 'posted' ? 'badge-green' : q.status === 'generating' ? 'badge-yellow' : 'badge-blue'}`}>{q.status}</span>
                </td>
                <td className="small" style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.prompt}</td>
                <td>
                  {q.videoUrl ? <a href={q.videoUrl} target="_blank">Open</a> : <span className="small">?</span>}
                </td>
                <td>
                  <button disabled={loading} onClick={() => runNow(q.id)}>Run now</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
