// longvideo-generate-clip1.js
// Submits Clip 1 (6s) to fal.ai using Grok reference-to-video
// The product image is used as @Image1 reference

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
      prompt,               // Prompt 1 — full cinematic brief with @Image1
      videoRatio,           // '9:16' | '16:9' | '1:1'
      productImageBase64,   // required — product reference image
      productImageMime,
    } = req.body;

    if (!prompt) return res.status(400).json({ error: "prompt is required" });
    if (!productImageBase64) return res.status(400).json({ error: "productImageBase64 is required" });

    const aspectRatio = videoRatio || "9:16";

    // Upload product image to fal storage
    const imageBlob = base64ToBlob(productImageBase64, productImageMime || "image/jpeg");
    const imageUrl = await fal.storage.upload(imageBlob);
    console.log(`[longvideo-generate-clip1] Uploaded product image: ${imageUrl}`);

    const modelId = "xai/grok-imagine-video/reference-to-video";
    const input = {
      prompt,
      reference_image_urls: [imageUrl],
      aspect_ratio: aspectRatio,
      duration: 6,
      resolution: "720p",
    };

    const webhookUrl = `https://${req.headers.host}/api/grok-webhook`;

    console.log(`[longvideo-generate-clip1] Submitting clip1 model=${modelId} ratio=${aspectRatio}`);
    console.log(`[longvideo-generate-clip1] prompt: ${prompt.substring(0, 120)}...`);

    const { request_id } = await fal.queue.submit(modelId, { input, webhookUrl });

    console.log(`[longvideo-generate-clip1] Submitted. request_id=${request_id}`);

    return res.status(200).json({
      requestId: request_id,
      modelId,
      status: "IN_QUEUE",
    });

  } catch (error) {
    console.error("[longvideo-generate-clip1] Error:", error.message);
    return res.status(500).json({ error: error.message || "Clip 1 generation failed" });
  }
}

function base64ToBlob(base64, mimeType) {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i);
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return new Blob(byteArrays, { type: mimeType });
}
