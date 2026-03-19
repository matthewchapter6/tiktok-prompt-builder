// generate-sora-video.js — Kling 2.6 Pro image-to-video
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
      productImageBase64, productImageMime,   // optional: product reference for elements
      characterImageBase64, characterImageMime, // optional: character reference for elements
    } = req.body;

    if (!prompt) return res.status(400).json({ error: 'Animation prompt required' });
    if (!firstFrameBase64) return res.status(400).json({ error: 'First frame image required' });

    fal.config({ credentials: process.env.FAL_API_KEY });

    const aspectRatio = videoConfig?.aspect_ratio || '9:16';
    const duration    = videoConfig?.duration     || '10';
    const cfgScale    = videoConfig?.cfg_scale    ?? 0.8;

    // ── Upload first frame (required) ─────────────────────────────────────
    const frameBlob = base64ToBlob(firstFrameBase64, firstFrameMime || 'image/jpeg');
    const frameUrl  = await fal.storage.upload(frameBlob);
    console.log('First frame uploaded:', frameUrl);

    // ── Upload product + character as elements (optional references) ──────
    // Elements maintain visual consistency alongside the first frame
    // Product = @Element1, Character = @Element2 (referenced in animation prompt)
    const elements = [];
    if (productImageBase64) {
      const blob = base64ToBlob(productImageBase64, productImageMime || 'image/jpeg');
      const url  = await fal.storage.upload(blob);
      elements.push({ images: [{ url }] }); // @Element1
      console.log('Product reference uploaded as @Element1');
    }
    if (characterImageBase64) {
      const blob = base64ToBlob(characterImageBase64, characterImageMime || 'image/jpeg');
      const url  = await fal.storage.upload(blob);
      elements.push({ images: [{ url }] }); // @Element2
      console.log('Character reference uploaded as @Element2');
    }

    const modelId = 'fal-ai/kling-video/v2.6/pro/image-to-video';

    const input = {
      prompt,
      image_url: frameUrl,        // first frame — Kling animates FROM this
      aspect_ratio: aspectRatio,
      duration,
      cfg_scale: cfgScale,
      ...(elements.length > 0 ? { elements } : {}), // product/character references
    };

    console.log('=== KLING 2.6 PRO IMAGE-TO-VIDEO ===');
    console.log('Ratio:', aspectRatio, '| Duration:', duration, 's | cfg_scale:', cfgScale);
    console.log('Elements:', elements.length, '(product + character references)');
    console.log('--- ANIMATION PROMPT ---');
    console.log(prompt);
    console.log('--- END ---');

    const { request_id, status_url, response_url } = await fal.queue.submit(modelId, { input });
    console.log('Submitted. request_id:', request_id);

    res.status(200).json({ requestId: request_id, statusUrl: status_url, responseUrl: response_url, modelId, status: 'IN_QUEUE' });

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
