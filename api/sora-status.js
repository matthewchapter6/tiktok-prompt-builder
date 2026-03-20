// sora-status.js — polls fal.ai for video generation status
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
    const statusPromise = fal.queue.status(modelPath, { requestId, logs: false });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("fal.ai status check timed out after 20s")), 20000)
    );
    const status = await Promise.race([statusPromise, timeoutPromise]);

    console.log(`[sora-status] status=${status.status} queuePos=${status.queue_position ?? "n/a"}`);

    if (status.status === "COMPLETED") {
      // Try extracting from status.data first
      let videoUrl = extractVideoUrl(status.data);
      console.log(`[sora-status] videoUrl from status.data: ${videoUrl ?? "null"}`);

      // Fallback: fetch the response_url directly
      if (!videoUrl) {
        try {
          // Build the response_url from the requestId
          // For Kling: https://queue.fal.run/fal-ai/kling-video/v2.6/pro/image-to-video/requests/{id}
          // For WAN: https://queue.fal.run/fal-ai/wan/requests/{id}
          const responseUrl = status.response_url ||
            `https://queue.fal.run/${modelPath}/requests/${requestId}`;

          console.log(`[sora-status] Fetching response_url: ${responseUrl}`);

          const resultRes = await fetch(responseUrl, {
            method: "GET",
            headers: {
              "Authorization": `Key ${process.env.FAL_API_KEY}`,
              "Content-Type": "application/json",
            },
          });

          console.log(`[sora-status] response_url HTTP ${resultRes.status}`);

          if (resultRes.ok) {
            const resultData = await resultRes.json();
            console.log(`[sora-status] response_url body keys: ${Object.keys(resultData).join(", ")}`);
            videoUrl = extractVideoUrl(resultData);
            console.log(`[sora-status] videoUrl from response_url: ${videoUrl ?? "null"}`);
          } else {
            const errText = await resultRes.text();
            console.log(`[sora-status] response_url error: ${errText}`);
          }
        } catch (e) {
          console.log(`[sora-status] response_url fetch failed: ${e.message}`);
        }
      }

      console.log(`[sora-status] COMPLETED. Final videoUrl=${videoUrl ?? "null"}`);
      return res.status(200).json({ status: "COMPLETED", videoUrl });
    }

    if (status.status === "FAILED") {
      console.log("[sora-status] FAILED");
      return res.status(200).json({ status: "FAILED", error: "Video generation failed on fal.ai" });
    }

    return res.status(200).json({
      status: status.status || "IN_QUEUE",
      queuePosition: status.queue_position ?? null,
    });

  } catch (error) {
    console.error("[sora-status] Exception:", error.message);
    return res.status(500).json({ error: "Status check failed", details: error.message });
  }
}
