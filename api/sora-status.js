// sora-status.js — polls fal.ai for video generation status
// ✅ NO fal SDK — pure Node https with redirect following

import https from "https";
import http from "http";

// ── Raw HTTPS/HTTP GET with redirect following (up to 5 hops) ────────────
const rawGet = (url, apiKey, redirectCount = 0) => new Promise((resolve, reject) => {
  if (redirectCount > 5) return reject(new Error("Too many redirects"));
  const parsed = new URL(url);
  const lib = parsed.protocol === "https:" ? https : http;
  const req = lib.request(
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
      // ✅ Follow redirects (301, 302, 303, 307, 308)
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        const nextUrl = res.headers.location.startsWith("http")
          ? res.headers.location
          : `${parsed.protocol}//${parsed.hostname}${res.headers.location}`;
        console.log(`[sora-status] Redirect ${res.statusCode} → ${nextUrl}`);
        return rawGet(nextUrl, apiKey, redirectCount + 1).then(resolve).catch(reject);
      }
      let body = "";
      res.on("data", chunk => body += chunk);
      res.on("end", () => {
        console.log(`[sora-status] HTTP ${res.statusCode} body: ${body.slice(0, 300)}`);
        try { resolve({ statusCode: res.statusCode, data: JSON.parse(body) }); }
        catch (e) { resolve({ statusCode: res.statusCode, data: null, raw: body.slice(0, 300) }); }
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

  const baseModel = modelPath.split("/").slice(0, 2).join("/");
  const apiKey = process.env.FAL_API_KEY;

  console.log(`[sora-status] model=${modelPath} baseModel=${baseModel} requestId=${requestId}`);

  try {
    // ── Step 1: Status check (base model) ────────────────────────────────
    const statusUrl = `https://queue.fal.run/${baseModel}/requests/${requestId}/status`;
    console.log(`[sora-status] statusUrl=${statusUrl}`);
    const statusResp = await rawGet(statusUrl, apiKey);
    const statusData = statusResp.data;
    const currentStatus = statusData?.status || statusData?.state || "IN_QUEUE";
    console.log(`[sora-status] currentStatus=${currentStatus}`);

    if (currentStatus === "COMPLETED" || currentStatus === "OK") {

      // ── Strategy A: use response_url from status (with redirect following) ──
      const responseUrl = statusData?.response_url;
      if (responseUrl) {
        console.log(`[sora-status] Strategy A: fetching response_url=${responseUrl}`);
        const resultResp = await rawGet(responseUrl, apiKey);
        console.log(`[sora-status] Strategy A result:`, JSON.stringify(resultResp.data, null, 2));
        const d = resultResp.data;
        const videoUrl =
          d?.video?.url         ||
          d?.video_url          ||
          d?.videos?.[0]?.url   ||
          d?.output?.video?.url ||
          d?.output?.video_url  ||
          d?.url                ||
          null;
        if (videoUrl) {
          console.log(`[sora-status] COMPLETED via Strategy A. videoUrl=${videoUrl}`);
          return res.status(200).json({ status: "COMPLETED", videoUrl });
        }
      }

      // ── Strategy B: full model path result URL ────────────────────────
      const resultUrl = `https://queue.fal.run/${modelPath}/requests/${requestId}`;
      console.log(`[sora-status] Strategy B: fetching resultUrl=${resultUrl}`);
      const resultResp = await rawGet(resultUrl, apiKey);
      console.log(`[sora-status] Strategy B result:`, JSON.stringify(resultResp.data, null, 2));
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
