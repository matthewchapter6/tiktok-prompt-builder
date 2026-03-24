// generate-sora-video.js
// Supports three models:
// 1. Kling v3 Pro image-to-video (with audio, @Element1/@Element2)
// 2. Wan 2.6 I2V Flash (with audio, first frame only)
// 3. Hailuo 2.3 Fast Pro image-to-video (with audio, first frame only)

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
      model = "wan", // 'wan' | 'kling' | 'hailuo'
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
      if (productUrl)   elements.push({ frontal_image_url: productUrl, reference_image_urls: [productUrl] });
      if (characterUrl) elements.push({ frontal_image_url: characterUrl, reference_image_urls: [characterUrl] });

      const cleanPrompt = elements.length > 0
        ? prompt
        : prompt.replace(/@Element\d+/g, "").replace(/\s+/g, " ").trim();

      console.log("[generate-sora-video] === KLING 2.6 PRO ===");
      console.log("[generate-sora-video] elements count:", elements.length);

      modelId = "fal-ai/kling-video/v3/pro/image-to-video";
      input = {
        prompt: cleanPrompt,
        start_image_url: frameUrl,
        aspect_ratio: aspectRatio,
        duration,
        cfg_scale: cfgScale,
        generate_audio: true,
        ...(elements.length > 0 ? { elements } : {}),
      };

    } else if (model === "hailuo") {
      // ── HAILUO 2.3 FAST PRO ───────────────────────────────────────────
      // I2V model — animates from first frame
      // Strip @Element / Character refs — not supported
      const cleanPromptHailuo = prompt
        .replace(/@Element[0-9]+/g, "")
        .replace(/Character[0-9]+/g, "the subject")
        .replace(/@Video[0-9]+/g, "")
        .replace(/\s+/g, " ").trim();

      // Hailuo 2.3 Fast Pro resolution constraint:
      // - 1080p only supports up to 6s max → use for 5s videos
      // - 768p supports 5s and 10s → use for 10s videos
      const hailuoResolution = String(duration) === "10" ? "768p" : "1080p";

      modelId = "fal-ai/minimax/hailuo-2.3-fast/pro/image-to-video";
      input = {
        prompt: cleanPromptHailuo,
        image_url: frameUrl,
        duration: String(duration),
        resolution: hailuoResolution,
      };
      console.log(`[generate-sora-video] === HAILUO 2.3 FAST PRO === resolution=${hailuoResolution}`);

    } else {
      // ── WAN 2.6 IMAGE-TO-VIDEO FLASH ─────────────────────────────────
      // I2V model — animates from first frame
      // Strip Character/Video refs from prompt
      const cleanPromptWan = prompt
        .replace(/Character[0-9]+/g, "the subject")
        .replace(/@Video[0-9]+/g, "")
        .replace(/\s+/g, " ").trim();

      modelId = "wan/v2.6/image-to-video/flash";
      input = {
        prompt: cleanPromptWan,
        image_url: frameUrl,
        aspect_ratio: aspectRatio,
        duration,
        resolution: "720p",
        enable_audio: true,
        negative_prompt: "distorted product, blurry, low quality, warped text, deformed labels",
      };
      console.log("[generate-sora-video] === WAN 2.6 I2V FLASH ===");
    }

    console.log(`[generate-sora-video] Ratio: ${aspectRatio} | Duration: ${duration}s`);
    console.log("[generate-sora-video] Prompt:", prompt.slice(0, 100));
    console.log("[generate-sora-video] Full input:", JSON.stringify(input));

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
