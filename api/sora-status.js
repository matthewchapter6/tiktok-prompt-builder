import { fal } from "@fal-ai/client";
fal.config({ credentials: process.env.FAL_API_KEY });

const extractVideoUrl = (data) => {
  if (!data) return null;
  return (
    data?.video?.url         ||
    data?.video_url          ||
    data?.videos?.[0]?.url   ||
    data?.output?.video?.url ||
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
    : "fal-ai/kling-video/v2.6/pro/image-to-video";

  const isWan = modelPath.includes("wan");
  console.log(`[sora-status] model=${modelPath} requestId=${requestId} isWan=${isWan}`);

  try {
    const status = await Promise.race([
      fal.queue.status(modelPath, { requestId, logs: false }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 20000))
    ]);

    console.log(`[sora-status] status=${status.status} inference_time=${status.metrics?.inference_time ?? "n/a"}`);

    if (status.status === "COMPLETED") {
      let videoUrl = extractVideoUrl(status.data);
      console.log(`[sora-status] videoUrl from status.data: ${videoUrl ?? "null"}`);

      // Use the response_url from the status object directly — this is the correct endpoint
      if (!videoUrl && status.response_url) {
        console.log(`[sora-status] Fetching response_url: ${status.response_url}`);
        try {
          const r = await fetch(status.response_url, {
            headers: { "Authorization": `Key ${process.env.FAL_API_KEY}` }
          });
          const body = await r.text();
          console.log(`[sora-status] response_url HTTP ${r.status} body: ${body.slice(0, 1000)}`);
          if (r.ok) {
            const data = JSON.parse(body);
            videoUrl = extractVideoUrl(data);
            console.log(`[sora-status] videoUrl from response_url: ${videoUrl ?? "null"}`);
          }
        } catch (e) {
          console.log(`[sora-status] response_url fetch error: ${e.message}`);
        }
      }

      console.log(`[sora-status] Final videoUrl=${videoUrl ?? "null"}`);
      return res.status(200).json({ status: "COMPLETED", videoUrl });
    }

    if (status.status === "FAILED") {
      return res.status(200).json({ status: "FAILED", error: "Generation failed" });
    }

    return res.status(200).json({
      status: status.status || "IN_QUEUE",
      queuePosition: status.queue_position ?? null,
    });

  } catch (error) {
    console.error(`[sora-status] Exception: ${error.message}`);
    return res.status(500).json({ error: "Status check failed", details: error.message });
  }
}
