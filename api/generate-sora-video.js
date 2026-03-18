// generate-sora-video.js
// Kling 2.6 Pro via fal.ai SDK
//
// CORRECT approach for marketing videos:
// - Both product + character go into elements[] as REFERENCES (not first frame)
// - This gives Kling creative freedom to generate engaging scenes
// - Product = @Element1, Character = @Element2 (referenced in prompt)
// - Always uses text-to-video model (no image_url = no locked first frame)

import { fal } from "@fal-ai/client";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      prompt,
      videoConfig,
      productImageBase64,
      productImageMime,
      characterImageBase64,
      characterImageMime,
    } = req.body;

    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    fal.config({ credentials: process.env.FAL_API_KEY });

    const hasProductImage   = !!productImageBase64;
    const hasCharacterImage = !!characterImageBase64;

    const aspectRatio = videoConfig?.aspect_ratio || '9:16';
    const duration    = videoConfig?.duration     || '10';
    const cfgScale    = videoConfig?.cfg_scale    ?? 0.5;

    // ── Upload images to fal storage to get public URLs ──────────────────
    let productImageUrl   = null;
    let characterImageUrl = null;

    if (hasProductImage) {
      const blob = base64ToBlob(productImageBase64, productImageMime || 'image/jpeg');
      productImageUrl = await fal.storage.upload(blob);
      console.log('Product image uploaded to fal storage');
    }

    if (hasCharacterImage) {
      const blob = base64ToBlob(characterImageBase64, characterImageMime || 'image/jpeg');
      characterImageUrl = await fal.storage.upload(blob);
      console.log('Character image uploaded to fal storage');
    }

    // ── Build elements array ───────────────────────────────────────────────
    // Both product and character go as elements (reference mode, not first frame)
    // Product = @Element1, Character = @Element2
    const elements = [];

    if (hasProductImage) {
      elements.push({ images: [{ url: productImageUrl }] }); // @Element1
    }
    if (hasCharacterImage) {
      elements.push({ images: [{ url: characterImageUrl }] }); // @Element2
    }

    // ── Always use text-to-video (no image_url = AI creates opening freely) ─
    const modelId = 'fal-ai/kling-video/v2.6/pro/text-to-video';

    const input = {
      prompt,
      aspect_ratio: aspectRatio,
      duration,
      cfg_scale: cfgScale,
      ...(elements.length > 0 ? { elements } : {}),
    };

    console.log('Model:', modelId);
    console.log('Ratio:', aspectRatio, '| Duration:', duration, '| cfg_scale:', cfgScale);
    console.log('Elements:', elements.length, '(product:', hasProductImage, ', character:', hasCharacterImage, ')');
    console.log('Prompt (first 120 chars):', prompt.substring(0, 120));

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
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return new Blob(byteArrays, { type: mimeType });
}
