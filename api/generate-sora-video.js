// generate-sora-video.js
// Supports two models:
// 1. Kling 2.6 Pro image-to-video (with audio, @Element1/@Element2)
// 2. Wan 2.6 R2V Flash (with audio, Character1/Character2/Character3)

import { fal } from "@fal-ai/client";

// ✅ Configure once at module level
fal.config({ credentials: process.env.FAL_API_KEY });

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      prompt, videoConfig,
      firstFrameBase64, firstFrameMime,
      productImageBase64, productImageMime,
      characterImageBase64, characterImageMime,
      model = "wan", // 'wan' | 'kling'
    } = req.body;

    if (!prompt) return res.status(400).json({ error: "Animation prompt required" });
    if (!firstFrameBase64) return res.status(400).json({ error: "First frame image required" });

    const aspectRatio = videoConfig?.aspect_ratio || "9:16";
    const duration    = videoConfig?.duration     || "10";

    // ── Convert base64 to Blobs ───────────────────────────────────────────
    const frameBlob     = base64ToBlob(firstFrameBase64, firstFrameMime || "image/jpeg");
    const productBlob   = productImageBase64
      ? base64ToBlob(productImageBase64, productImageMime || "image/jpeg")
      : null;
    const characterBlob = characterImageBase64
      ? base64ToBlob(characterImageBase64, characterImageMime || "image/jpeg")
      : null;

    // ✅ Upload all images in PARALLEL — 3x faster, avoids timeout
    console.log(`[generate-sora-video] Uploading ${1 + (productBlob ? 1 : 0) + (characterBlob ? 1 : 0)} images in parallel...`);
    const [frameUrl, productUrl, characterUrl] = await Promise.all([
      fal.storage.upload(frameBlob),
      productBlob   ? fal.storage.upload(productBlob)   : Promise.resolve(null),
      characterBlob ? fal.storage.upload(characterBlob) : Promise.resolve(null),
    ]);
    console.log(`[generate-sora-video] Uploads done. frameUrl=${frameUrl}`);

    let modelId, input;

    if (model === "kling") {
      // ── KLING 2.6 PRO ─────────────────────────────────────────────────
      const cfgScale = videoConfig?.cfg_scale ?? 0.8;
      const elements = [];
      if (productUrl)   elements.push({ images: [{ url: productUrl }] });
      if (characterUrl) elements.push({ images: [{ url: characterUrl }] });

      // Strip @Element1/@Element2 refs from prompt if no element images uploaded
      const cleanPrompt = elements.length > 0
        ? prompt
        : prompt.replace(/@Element\d+/g, "").replace(/\s+/g, " ").trim();
      if (elements.length === 0 && cleanPrompt !== prompt) {
        console.log("[generate-sora-video] Stripped @Element refs (no element images)");
      }

      modelId = "fal-ai/kling-video/v2.6/pro/image-to-video";
      input = {
        prompt: cleanPrompt,
        image_url: frameUrl,
        aspect_ratio: aspectRatio,
        duration,
        cfg_scale: cfgScale,
        generate_audio: true,
        ...(elements.length > 0 ? { elements } : {}),
      };
      console.log("[generate-sora-video] === KLING 2.6 PRO ===");

    } else {
      // ── WAN 2.6 R2V FLASH ─────────────────────────────────────────────
      const imageUrls = [];
      if (productUrl)   imageUrls.push(productUrl);
      if (characterUrl) imageUrls.push(characterUrl);
      imageUrls.push(frameUrl);

      modelId = "fal-ai/wan/v2.6/reference-to-video/flash";
      input = {
        prompt,
        image_urls: imageUrls,
        aspect_ratio: aspectRatio,
        duration,
        resolution: "720p",
        enable_audio: true,
        negative_prompt: "distorted product, blurry, low quality, warped text, deformed labels",
      };
      console.log("[generate-sora-video] === WAN 2.6 R2V FLASH ===");
    }

    console.log(`[generate-sora-video] Ratio: ${aspectRatio} | Duration: ${duration}s`);
    console.log("[generate-sora-video] Prompt:", prompt.slice(0, 100));
    console.log("[generate-sora-video] Full input:", JSON.stringify(input));

    // ✅ Webhook URL — fal.ai will POST the result here when done
    // This bypasses the broken WAN queue result endpoint entirely
    const webhookUrl = `https://${req.headers.host}/api/fal-webhook`;
    console.log(`[generate-sora-video] webhookUrl=${webhookUrl}`);

    const { request_id, status_url, response_url } = await fal.queue.submit(modelId, {
      input,
      webhookUrl,
    });
    console.log("[generate-sora-video] Submitted. request_id:", request_id);

    return res.status(200).json({
      requestId: request_id,
      statusUrl: status_url,
      responseUrl: response_url,
      modelId,
      status: "IN_QUEUE",
    });

  } catch (error) {
    console.error("[generate-sora-video] Error:", error.message || error);
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
