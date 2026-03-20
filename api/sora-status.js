// sora-status.js — polls fal.ai for video generation status
// ✅ Only checks status — result (video URL) is now set by webhook in Supabase
// ✅ For Kling model, videoUrl is still extracted from status.data directly

import { fal } from "@fal-ai/client";

fal.config({ credentials: process.env.FAL_API_KEY });

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
    : "fal-ai/kling-video/v2.6/pro/image-to-video";

  console.log(`[sora-status] model=${modelPath} requestId=${requestId}`);

  try {
    const statusPromise = fal.queue.status(modelPath, { requestId, logs: false });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("fal.ai status check timed out after 20s")), 20000)
    );
    const status = await Promise.race([statusPromise, timeoutPromise]);

    console.log(`[sora-status] status=${status.status} queuePos=${status.queue_position ?? "n/a"}`);

    if (status.status === "COMPLETED") {
      // ✅ For Kling: videoUrl is embedded in status.data — return it directly
      // ✅ For WAN: status.data is null — webhook already updated Supabase
      //    App.js will read videoUrl from Supabase when it gets null here
      const d = status.data;
      const videoUrl =
        d?.video?.url         ||
        d?.video_url          ||
        d?.videos?.[0]?.url   ||
        d?.output?.video?.url ||
        null;

      console.log(`[sora-status] COMPLETED. videoUrl=${videoUrl ?? "null — will be read from Supabase"}`);
      return res.status(200).json({ status: "COMPLETED", videoUrl });
    }

    if (status.status === "FAILED") {
      console.log("[sora-status] FAILED");
      return res.status(200).json({ status: "FAILED", error: "Video generation failed on fal.ai" });
    }

    // IN_QUEUE or IN_PROGRESS
    return res.status(200).json({
      status: status.status || "IN_QUEUE",
      queuePosition: status.queue_position ?? null,
    });

  } catch (error) {
    console.error("[sora-status] Exception:", error.message);
    return res.status(500).json({ error: "Status check failed", details: error.message });
  }
}
