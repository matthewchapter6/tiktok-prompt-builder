// generate-sora-video.js
// Supports two models:
// 1. Kling 2.6 Pro image-to-video (with audio, @Element1/@Element2)
// 2. Wan 2.6 R2V Flash (with audio, Character1/Character2/Character3)

import { fal } from "@fal-ai/client";

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

    fal.config({ credentials: process.env.FAL_API_KEY });

    const aspectRatio = videoConfig?.aspect_ratio || '9:16';
    const duration    = videoConfig?.duration     || '10';

    // ── Upload first frame ────────────────────────────────────────────────
    const frameBlob = base64ToBlob(firstFrameBase64, firstFrameMime || 'image/jpeg');
    const frameUrl  = await fal.storage.upload(frameBlob);
    console.log('First frame uploaded:', frameUrl);

    // ── Upload product + character if provided ────────────────────────────
    let productUrl   = null;
    let characterUrl = null;
    if (productImageBase64) {
      const blob = base64ToBlob(productImageBase64, productImageMime || 'image/jpeg');
      productUrl = await fal.storage.upload(blob);
      console.log('Product image uploaded');
    }
    if (characterImageBase64) {
      const blob = base64ToBlob(characterImageBase64, characterImageMime || 'image/jpeg');
      characterUrl = await fal.storage.upload(blob);
      console.log('Character image uploaded');
    }

    let modelId, input;

    if (model === 'kling') {
      // ── KLING 2.6 PRO ─────────────────────────────────────────────────
      // image_url = first frame, elements = product + character references
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

      console.log('=== KLING 2.6 PRO IMAGE-TO-VIDEO ===');
      console.log(`Ratio: ${aspectRatio} | Duration: ${duration}s | Audio: ON`);
      console.log(`Elements: ${elements.length} (product + character)`);

    } else {
      // ── WAN 2.6 R2V FLASH ─────────────────────────────────────────────
      // All references passed as image_urls:
      // [0] product photo   → Character1 in prompt
      // [1] character photo → Character2 in prompt
      // [2] first frame     → Character3 in prompt
      const imageUrls = [];
      if (productUrl)   imageUrls.push(productUrl);   // Character1
      if (characterUrl) imageUrls.push(characterUrl); // Character2
      imageUrls.push(frameUrl);                        // Character3 (or Character1 if no product/character)

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

      console.log('=== WAN 2.6 R2V FLASH ===');
      console.log(`Ratio: ${aspectRatio} | Duration: ${duration}s | Audio: ON | Resolution: 720p`);
      console.log(`References: ${imageUrls.length} images (Character1–Character${imageUrls.length})`);
    }

    console.log('--- ANIMATION PROMPT ---');
    console.log(prompt);
    console.log('--- END ---');

    const { request_id, status_url, response_url } = await fal.queue.submit(modelId, { input });
    console.log('Submitted. request_id:', request_id);

    res.status(200).json({
      requestId: request_id,
      statusUrl: status_url,
      responseUrl: response_url,
      modelId,
      status: 'IN_QUEUE',
    });

  } catch (error) {
    console.error('generate-sora-video error:', error);
    res.status(500).json({ error: error.message || 'Video generation failed' });
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
