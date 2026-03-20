// generate-sora-video.js
// Supports two models:
// 1. Kling 2.6 Pro image-to-video (with audio, @Element1/@Element2)
// 2. Wan 2.6 R2V Flash (with audio, Character1/Character2/Character3)

import { fal } from "@fal-ai/client";

// ✅ Configure once at module level, not per-request
fal.config({ credentials: process.env.FAL_API_KEY });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      prompt, videoConfig,
      firstFrameBase64, firstFrameMime,
      productImageBase64, productImageMime,
      characterImageBase64, characterImageMime,
      model = 'wan', // 'wan' | 'kling'
    } = req.body;

    if (!prompt) return res.status(400).json({ error: 'Animation prompt required' });
    if (!firstFrameBase64) return res.status(400).json({ error: 'First frame image required' });

    const aspectRatio = videoConfig?.aspect_ratio || '9:16';
    const duration    = videoConfig?.duration     || '10';

    // ── Convert base64 to Blobs ───────────────────────────────────────────
    const frameBlob     = base64ToBlob(firstFrameBase64, firstFrameMime || 'image/jpeg');
    const productBlob   = productImageBase64
      ? base64ToBlob(productImageBase64, productImageMime || 'image/jpeg')
      : null;
    const characterBlob = characterImageBase64
      ? base64ToBlob(characterImageBase64, characterImageMime || 'image/jpeg')
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

    if (model === 'kling') {
      // ── KLING 2.6 PRO ─────────────────────────────────────────────────
      const cfgScale = videoConfig?.cfg_scale ?? 0.8;
      const elements = [];
      if (productUrl)   elements.push({ images: [{ url: productUrl }] });   // @Element1
      if (characterUrl) elements.push({ images: [{ url: characterUrl }] }); // @Element2

      modelId = 'fal-ai/kling-video/v2.6/pro/image-to-video';
      input = {
        prompt,
        image_url: frameUrl,
        aspect_ratio: aspectRatio,
        duration,
        cfg_scale: cfgScale,
        generate_audio: true,
        ...(elements.length > 0 ? { elements } : {}),
      };

      console.log('[generate-sora-video] === KLING 2.6 PRO IMAGE-TO-VIDEO ===');
      console.log(`Ratio: ${aspectRatio} | Duration: ${duration}s | Audio: ON`);
      console.log(`Elements: ${elements.length} (product + character)`);

    } else {
      // ── WAN 2.6 R2V FLASH ─────────────────────────────────────────────
      // [0] product photo   → Character1 in prompt
      // [1] character photo → Character2 in prompt
      // [2] first frame     → Character3 in prompt
      const imageUrls = [];
      if (productUrl)   imageUrls.push(productUrl);   // Character1
      if (characterUrl) imageUrls.push(characterUrl); // Character2
      imageUrls.push(frameUrl);                        // Character3 (or Character1 if no others)

      modelId = 'fal-ai/wan/v2.6/reference-to-video/flash';
      input = {
        prompt,
        image_urls: imageUrls,
        aspect_ratio: aspectRatio,
        duration,
        resolution: '720p',
        enable_audio: true,
        negative_prompt: 'distorted product, blurry, low quality, warped text, deformed labels',
      };

      console.log('[generate-sora-video] === WAN 2.6 R2V FLASH ===');
      console.log(`Ratio: ${aspectRatio} | Duration: ${duration}s | Audio: ON | Resolution: 720p`);
      console.log(`References: ${imageUrls.length} images (Character1–Character${imageUrls.length})`);
    }

    console.log('--- ANIMATION PROMPT ---');
    console.log(prompt);
    console.log('--- END ---');

    const { request_id, status_url, response_url } = await fal.queue.submit(modelId, { input });
    console.log('[generate-sora-video] Submitted. request_id:', request_id);

    return res.status(200).json({
      requestId: request_id,
      statusUrl: status_url,
      responseUrl: response_url,
      modelId,
      status: 'IN_QUEUE',
    });

  } catch (error) {
    console.error('[generate-sora-video] Error:', error.message || error);
    return res.status(500).json({ error: error.message || 'Video generation failed' });
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
