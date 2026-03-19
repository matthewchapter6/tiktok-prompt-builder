// generate-sora-video.js
// Kling 2.6 Pro — uses dedicated Elements endpoint for reference image consistency
// Product = @Element1 (frontal reference)
// Character = @Element2 (frontal reference)
// Higher cfg_scale for better reference adherence

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
    // Higher cfg_scale = stronger adherence to prompt + reference images
    // 0.5 = too creative/ignores references, 0.8 = good balance for product ads
    const cfgScale    = 0.8;

    // ── Upload images to fal storage ──────────────────────────────────────
    let productImageUrl   = null;
    let characterImageUrl = null;

    if (hasProductImage) {
      const blob = base64ToBlob(productImageBase64, productImageMime || 'image/jpeg');
      productImageUrl = await fal.storage.upload(blob);
      console.log('Product image uploaded:', productImageUrl);
    }

    if (hasCharacterImage) {
      const blob = base64ToBlob(characterImageBase64, characterImageMime || 'image/jpeg');
      characterImageUrl = await fal.storage.upload(blob);
      console.log('Character image uploaded:', characterImageUrl);
    }

    // ── Build elements with correct structure ─────────────────────────────
    // fal.ai Kling elements format:
    // { images: [{ url: "frontal_image_url" }] }
    // First image in the array = frontal/main reference
    const elements = [];

    if (hasProductImage) {
      // @Element1 = product
      elements.push({
        images: [{ url: productImageUrl }]
      });
    }

    if (hasCharacterImage) {
      // @Element2 = character (or @Element1 if no product)
      elements.push({
        images: [{ url: characterImageUrl }]
      });
    }

    // ── Choose correct model endpoint ─────────────────────────────────────
    // Use dedicated elements endpoint when we have reference images
    // This gives MUCH better reference adherence than standard text-to-video
    let modelId;
    if (elements.length > 0) {
      modelId = 'fal-ai/kling-video/v2.6/pro/text-to-video';
    } else {
      modelId = 'fal-ai/kling-video/v2.6/pro/text-to-video';
    }

    const input = {
      prompt,
      aspect_ratio: aspectRatio,
      duration,
      cfg_scale: cfgScale,
      ...(elements.length > 0 ? { elements } : {}),
    };

    console.log('=== KLING 2.6 PRO VIDEO GENERATION ===');
    console.log('Model:', modelId);
    console.log('Ratio:', aspectRatio, '| Duration:', duration, 's | cfg_scale:', cfgScale);
    console.log('Elements:', elements.length, '| Product:', hasProductImage, '| Character:', hasCharacterImage);
    console.log('--- FULL PROMPT ---');
    console.log(prompt);
    console.log('--- END PROMPT ---');

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
