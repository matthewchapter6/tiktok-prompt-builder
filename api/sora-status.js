// sora-status.js — polls fal.ai for video generation status
// ✅ NO fal SDK — pure Node https, zero interception
// ✅ Per fal.ai docs: subpath NOT used for status/result — only base model

import https from "https";

// ── Raw HTTPS GET with full response header logging ───────────────────────
const rawRequest = (url, apiKey, method = "GET") => new Promise((resolve, reject) => {
  const parsed = new URL(url);
  const req = https.request(
    {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        "Authorization": `Key ${apiKey}`,
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    },
    (res) => {
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        // Log allow header if 405 — tells us what method fal.ai wants
        if (res.statusCode === 405) {
          console.log(`[sora-status] 405 Allow header: ${res.headers["allow"] || "not provided"}`);
        }
        console.log(`[sora-status] HTTP ${res.statusCode} from ${method} ${url.replace(/019d[^?]*/,"***")}`);
        console.log(`[sora-status] body: ${body.slice(0, 500)}`);
        let data = null;
        try { data = JSON.parse(body); } catch (e) { data = null; }
        resolve({ statusCode: res.statusCode, data, headers: res.headers });
      });
    }
  );
  req.on("error", reject);
  req.setTimeout(20000, () => { req.destroy(); reject(new Error("Request timeout after 20s")); });
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

  // Per fal.ai docs: base model only for status and result
  const baseModel = modelPath.split("/").slice(0, 2).join("/");
  const apiKey = process.env.FAL_API_KEY;

  console.log(`[sora-status] model=${modelPath} baseModel=${baseModel} requestId=${requestId}`);

  try {
    // ── Step 1: Status (base model) ───────────────────────────────────────
    const statusUrl = `https://queue.fal.run/${baseModel}/requests/${requestId}/status`;
    const statusResp = await rawRequest(statusUrl, apiKey, "GET");
    const statusData = statusResp.data;
    const currentStatus = statusData?.status || statusData?.state || "IN_QUEUE";
    console.log(`[sora-status] currentStatus=${currentStatus}`);

    if (currentStatus === "COMPLETED" || currentStatus === "OK") {

      // ── Try A: GET base model result (per fal.ai docs) ──────────────────
      const resultUrlBase = `https://queue.fal.run/${baseModel}/requests/${requestId}`;
      const resultA = await rawRequest(resultUrlBase, apiKey, "GET");

      // Check response field (per fal.ai docs, output is in "response" key)
      const dA = resultA.data?.response || resultA.data;
      const videoUrlA =
        dA?.video?.url     ||
        dA?.video_url      ||
        dA?.videos?.[0]?.url ||
        dA?.output?.video?.url ||
        dA?.url            ||
        null;

      if (videoUrlA) {
        console.log(`[sora-status] COMPLETED via Try A. videoUrl=${videoUrlA}`);
        return res.status(200).json({ status: "COMPLETED", videoUrl: videoUrlA });
      }

      // ── Try B: GET full model path result ───────────────────────────────
      const resultUrlFull = `https://queue.fal.run/${modelPath}/requests/${requestId}`;
      const resultB = await rawRequest(resultUrlFull, apiKey, "GET");

      const dB = resultB.data?.response || resultB.data;
      const videoUrlB =
        dB?.video?.url     ||
        dB?.video_url      ||
        dB?.videos?.[0]?.url ||
        dB?.output?.video?.url ||
        dB?.url            ||
        null;

      if (videoUrlB) {
        console.log(`[sora-status] COMPLETED via Try B. videoUrl=${videoUrlB}`);
        return res.status(200).json({ status: "COMPLETED", videoUrl: videoUrlB });
      }

      // ── Try C: POST full model path (405 suggests wrong method on full path) ──
      const resultC = await rawRequest(resultUrlFull, apiKey, "POST");

      const dC = resultC.data?.response || resultC.data;
      const videoUrlC =
        dC?.video?.url     ||
        dC?.video_url      ||
        dC?.videos?.[0]?.url ||
        dC?.output?.video?.url ||
        dC?.url            ||
        null;

      if (videoUrlC) {
        console.log(`[sora-status] COMPLETED via Try C (POST). videoUrl=${videoUrlC}`);
        return res.status(200).json({ status: "COMPLETED", videoUrl: videoUrlC });
      }

      console.log(`[sora-status] All strategies exhausted. videoUrl=null`);
      return res.status(200).json({ status: "COMPLETED", videoUrl: null });
    }

    if (currentStatus === "FAILED" || currentStatus === "ERROR") {
      return res.status(200).json({ status: "FAILED", error: "Video generation failed on fal.ai" });
    }

    return res.status(200).json({
      status: currentStatus,
      queuePosition: statusData?.queue_position ?? null,
    });

  } catch (error) {
    console.error("[sora-status] Exception:", error.message);
    return res.status(500).json({ error: "Status check failed", details: error.message });
  }
}
