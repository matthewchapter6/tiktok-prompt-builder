// api/video-status.js
// Merged: grok-status + sora-status
// Polls fal.ai for video generation status (used by Kling, Wan, Hailuo, Grok models)

import { fal } from "@fal-ai/client";
fal.config({ credentials: process.env.FAL_API_KEY });

const extractVideoUrl = (data) => {
  if (!data) return null;
  return (
    (typeof data?.video === "string" ? data.video : null) ||
    data?.video?.url         ||
    data?.video?.uri         ||
    data?.video_url          ||
    data?.url                ||
    data?.videos?.[0]?.url   ||
    data?.videos?.[0]?.uri   ||
    data?.output?.video?.url ||
    data?.output?.video_url  ||
    data?.output?.url        ||
    data?.result?.video_url  ||
    data?.result?.url        ||
    null
  );
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { requestId, modelId } = req.query;
  if (!requestId) return res.status(400).json({ error: "requestId is required" });

  const modelPath = modelId
    ? decodeURIComponent(modelId)
    : "fal-ai/kling-video/v2.1/pro/image-to-video";

  console.log(`[video-status] model=${modelPath} requestId=${requestId}`);

  try {
    const status = await Promise.race([
      fal.queue.status(modelPath, { requestId, logs: false }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 20000)),
    ]);

    console.log(`[video-status] status=${status.status}`);

    if (status.status === "COMPLETED") {
      let videoUrl = extractVideoUrl(status.data);

      if (!videoUrl && status.response_url) {
        try {
          const r = await fetch(status.response_url, {
            headers: { Authorization: `Key ${process.env.FAL_API_KEY}` },
          });
          if (r.ok) videoUrl = extractVideoUrl(await r.json());
        } catch (e) {
          console.log(`[video-status] response_url fetch error: ${e.message}`);
        }
      }

      if (!videoUrl) {
        try {
          const result = await fal.queue.result(modelPath, { requestId });
          videoUrl = extractVideoUrl(result) || extractVideoUrl(result?.data) || extractVideoUrl(result?.output);
        } catch (e) {
          console.log(`[video-status] fal.queue.result() error: ${e.message}`);
        }
      }

      return res.status(200).json({ status: "COMPLETED", videoUrl });
    }

    if (status.status === "FAILED") {
      return res.status(200).json({ status: "FAILED", error: "Generation failed" });
    }

    return res.status(200).json({ status: status.status || "IN_QUEUE", queuePosition: status.queue_position ?? null });

  } catch (error) {
    console.error(`[video-status] Exception: ${error.message}`);
    return res.status(500).json({ error: "Status check failed", details: error.message });
  }
}
