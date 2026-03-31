// longvideo-extend-clip.js
// Extends an existing Grok video using xai/grok-imagine-video/extend-video
// Used for Clip 2 (6s→12s combined) and Clip 3 (12s→18s combined)
// The output is the full combined video (original + extension stitched together)

import { fal } from "@fal-ai/client";
fal.config({ credentials: process.env.FAL_API_KEY });

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      videoUrl,   // URL of the source video to extend
      prompt,     // Action-only continuation prompt (2-4 sentences)
      clipNumber, // 2 or 3 — for logging purposes
    } = req.body;

    if (!videoUrl) return res.status(400).json({ error: "videoUrl is required" });
    if (!prompt)   return res.status(400).json({ error: "prompt is required" });

    const modelId = "xai/grok-imagine-video/extend-video";
    const input = {
      video_url: videoUrl,
      prompt,
      duration: 6,
    };

    const webhookUrl = `https://${req.headers.host}/api/grok-webhook`;

    console.log(`[longvideo-extend-clip] Submitting clip${clipNumber || '?'} extension`);
    console.log(`[longvideo-extend-clip] sourceVideo=${videoUrl.substring(0, 60)}...`);
    console.log(`[longvideo-extend-clip] prompt: ${prompt.substring(0, 120)}`);

    const { request_id } = await fal.queue.submit(modelId, { input, webhookUrl });

    console.log(`[longvideo-extend-clip] Submitted. request_id=${request_id}`);

    return res.status(200).json({
      requestId: request_id,
      modelId,
      status: "IN_QUEUE",
    });

  } catch (error) {
    console.error("[longvideo-extend-clip] Error:", error.message);
    return res.status(500).json({ error: error.message || "Video extension failed" });
  }
}
