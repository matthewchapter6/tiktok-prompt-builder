// grok-generate-video.js
// Submits video generation job to fal.ai Grok Imagine
// Supports text-to-video, image-to-video, and reference-to-video

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
      mode,                  // 'text' | 'image' | 'reference'
      prompt,                // the final video prompt
      videoRatio,            // '9:16' | '16:9' | '1:1'
      firstFrameBase64,      // base64 image — for image mode
      firstFrameMime,
      referenceImages,       // array of { data: base64, mimeType } — for reference mode
    } = req.body;

    if (!prompt) return res.status(400).json({ error: "Prompt is required" });

    const aspectRatio = videoRatio || "9:16";

    let modelId, input;

    if (mode === "image") {
      // ── IMAGE-TO-VIDEO ─────────────────────────────────────────────────
      if (!firstFrameBase64) {
        return res.status(400).json({ error: "First frame image required for image-to-video mode" });
      }

      const frameBlob = base64ToBlob(firstFrameBase64, firstFrameMime || "image/jpeg");
      const frameUrl = await fal.storage.upload(frameBlob);
      console.log(`[grok-generate-video] Uploaded first frame: ${frameUrl}`);

      modelId = "xai/grok-imagine-video/image-to-video";
      input = {
        prompt,
        image_url: frameUrl,
        aspect_ratio: aspectRatio,
        duration: 10,
        resolution: "720p",
      };

    } else if (mode === "reference") {
      // ── REFERENCE-TO-VIDEO ─────────────────────────────────────────────
      if (!referenceImages || referenceImages.length === 0) {
        return res.status(400).json({ error: "At least one reference image required" });
      }

      // Upload all reference images in parallel
      console.log(`[grok-generate-video] Uploading ${referenceImages.length} reference images...`);
      const uploadedUrls = await Promise.all(
        referenceImages.map(img => {
          const blob = base64ToBlob(img.data, img.mimeType || "image/jpeg");
          return fal.storage.upload(blob);
        })
      );
      console.log(`[grok-generate-video] Uploaded ${uploadedUrls.length} reference images`);

      // Build components array for Grok reference-to-video
      const components = uploadedUrls.map((url, idx) => ({
        type: "image",
        url,
        tag: `@reference${idx + 1}`,
      }));

      modelId = "xai/grok-imagine-video/image-to-video";
      input = {
        prompt,
        image_url: uploadedUrls[0], // first reference as primary frame
        aspect_ratio: aspectRatio,
        duration: 10,
        resolution: "720p",
        components,
      };

    } else {
      // ── TEXT-TO-VIDEO ──────────────────────────────────────────────────
      modelId = "xai/grok-imagine-video/text-to-video";
      input = {
        prompt,
        aspect_ratio: aspectRatio,
        duration: 10,
        resolution: "720p",
      };
    }

    console.log(`[grok-generate-video] mode=${mode} model=${modelId} ratio=${aspectRatio}`);
    console.log(`[grok-generate-video] prompt: ${prompt.substring(0, 100)}...`);

    const webhookUrl = `https://${req.headers.host}/api/grok-webhook`;

    const { request_id } = await fal.queue.submit(modelId, {
      input,
      webhookUrl,
    });

    console.log(`[grok-generate-video] Submitted. request_id=${request_id}`);

    return res.status(200).json({
      requestId: request_id,
      modelId,
      status: "IN_QUEUE",
    });

  } catch (error) {
    console.error("[grok-generate-video] Error:", error.message);
    return res.status(500).json({ error: error.message || "Video generation failed" });
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