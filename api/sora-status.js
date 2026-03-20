// sora-status.js — polls fal.ai for video generation status
// ✅ NO fal SDK import — SDK patches global fetch AND https module,
//    which corrupts our direct API calls. We use pure Node https instead.

import https from "https";

// ── Pure Node.js HTTPS request — zero SDK interference ───────────────────
const rawGet = (url, apiKey) => new Promise((resolve, reject) => {
  const parsed = new URL(url);
  const req = https.request(
    {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: "GET",
      headers: {
        "Authorization": `Key ${apiKey}`,
        "Accept": "application/json",
      },
    },
    (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch (e) { reject(new Error(`JSON parse failed: ${body.slice(0, 200)}`)); }
      });
    }
  );
  req.on("error", reject);
  req.setTimeout(20000, () => { req.destroy(); reject(new Error("Request timeout after 20s")); });
  req.end();
});

// ── Extract base model from full model path ───────────────────────────────
// "fal-ai/wan/v2.6/reference-to-video/flash" → "fal-ai/wan"
// "fal-ai/kling-video/v2.6/pro/image-to-video" → "fal-ai/kling-video"
const getBaseModel = (modelPath) => modelPath.split("/").slice(0, 2).join("/");

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

  const baseModel = getBaseModel(modelPath);
  const apiKey = process.env.FAL_API_KEY;

  console.log(`[sora-status] model=${modelPath} baseModel=${baseModel} requestId=${requestId}`);

  try {
    // ── Check status ──────────────────────────────────────────────────────
    const statusUrl = `https://queue.fal.run/${baseModel}/requests/${requestId}/status`;
    console.log(`[sora-status] Checking status: ${statusUrl}`);

    const statusResp = await rawGet(statusUrl, apiKey);
    console.log(`[sora-status] status response:`, JSON.stringify(statusResp.data));

    const statusData = statusResp.data;
    const currentStatus = statusData?.status || statusData?.state || "IN_QUEUE";

    if (currentStatus === "COMPLETED" || currentStatus === "OK") {
      // ── Fetch result ────────────────────────────────────────────────────
      const resultUrl = `https://queue.fal.run/${baseModel}/requests/${requestId}`;
      console.log(`[sora-status] Fetching result: ${resultUrl}`);

      const resultResp = await rawGet(resultUrl, apiKey);
      console.log(`[sora-status] result raw:`, JSON.stringify(resultResp.data, null, 2));

      const d = resultResp.data;
      const videoUrl =
        d?.video?.url         ||
        d?.video_url          ||
        d?.videos?.[0]?.url   ||
        d?.output?.video?.url ||
        d?.output?.video_url  ||
        d?.url                ||
        null;

      console.log(`[sora-status] COMPLETED. videoUrl=${videoUrl}`);
      return res.status(200).json({ status: "COMPLETED", videoUrl });
    }

    if (currentStatus === "FAILED" || currentStatus === "ERROR") {
      console.log("[sora-status] FAILED");
      return res.status(200).json({ status: "FAILED", error: "Video generation failed on fal.ai" });
    }

    // IN_QUEUE or IN_PROGRESS
    console.log(`[sora-status] still running: ${currentStatus}`);
    return res.status(200).json({
      status: currentStatus,
      queuePosition: statusData?.queue_position ?? null,
    });

  } catch (error) {
    console.error("[sora-status] Exception:", error.message);
    return res.status(500).json({ error: "Status check failed", details: error.message });
  }
}
