// sora-status.js — polls fal.ai for video generation status

import { fal } from "@fal-ai/client";
import https from "https";

// ✅ Configure once at module level
fal.config({ credentials: process.env.FAL_API_KEY });

// ✅ Raw HTTPS fetch — bypasses fal SDK's global fetch interceptor completely
const rawFetch = (url, apiKey) => new Promise((resolve, reject) => {
  const parsed = new URL(url);
  const options = {
    hostname: parsed.hostname,
    path: parsed.pathname + parsed.search,
    method: "GET",
    headers: {
      "Authorization": `Key ${apiKey}`,
      "Accept": "application/json",
    },
  };
  const req = https.request(options, (res) => {
    let body = "";
    res.on("data", chunk => body += chunk);
    res.on("end", () => {
      try { resolve(JSON.parse(body)); }
      catch (e) { reject(new Error(`JSON parse failed: ${body}`)); }
    });
  });
  req.on("error", reject);
  req.setTimeout(15000, () => { req.destroy(); reject(new Error("rawFetch timeout")); });
  req.end();
});

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
      let videoUrl = null;

      // ── Strategy 1: result embedded in status.data (Kling) ──
      if (status.data) {
        const d = status.data;
        videoUrl =
          d?.video?.url    ||
          d?.video_url     ||
          d?.videos?.[0]?.url ||
          d?.output?.video?.url ||
          d?.url           ||
          null;
        console.log(`[sora-status] Strategy 1 (status.data): videoUrl=${videoUrl}`);
      }

      // ── Strategy 2: raw HTTPS call to response_url (WAN) ──
      // Uses Node https module — completely bypasses fal SDK fetch interceptor
      if (!videoUrl && status.response_url) {
        console.log(`[sora-status] Strategy 2: rawFetch to ${status.response_url}`);
        try {
          const data = await rawFetch(status.response_url, process.env.FAL_API_KEY);
          console.log("[sora-status] rawFetch result:", JSON.stringify(data, null, 2));
          videoUrl =
            data?.video?.url    ||
            data?.video_url     ||
            data?.videos?.[0]?.url ||
            data?.output?.video?.url ||
            data?.url           ||
            null;
          console.log(`[sora-status] Strategy 2 result: videoUrl=${videoUrl}`);
        } catch (fetchErr) {
          console.error("[sora-status] Strategy 2 rawFetch failed:", fetchErr.message);
        }
      }

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
