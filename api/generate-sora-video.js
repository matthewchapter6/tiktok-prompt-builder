// generate-sora-video.js
// Kling 2.6 Pro image-to-video via fal.ai SDK
// Receives: first frame image URL + animation prompt
// The first frame already contains the correct product/character appearance
// Kling just needs to animate FROM that frame

import { fal } from "@fal-ai/client";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      prompt,           // animation prompt — HOW to animate
      videoConfig,      // aspect ratio, duration, cfg_scale
      firstFrameBase64, // base64 of the Gemini-generated first frame
      firstFrameMime,   // mime type of first frame
    } = req.body;

    if (!prompt) return res.status(400).json({ error: 'Animation prompt is required' });
    if (!firstFrameBase64) return res.status(400).json({ error: 'First frame image is required' });

    fal.config({ credentials: process.env.FAL_API_KEY });

    const aspectRatio = videoConfig?.aspect_ratio || '9:16';
    const duration    = videoConfig?.duration     || '10';
    const cfgScale    = videoConfig?.cfg_scale    ?? 0.8;

    // ── Upload first frame to fal storage ─────────────────────────────────
    const frameBlob = base64ToBlob(firstFrameBase64, firstFrameMime || 'image/jpeg');
    const frameUrl  = await fal.storage.upload(frameBlob);
    console.log('First frame uploaded to fal storage:', frameUrl);

    // ── Always image-to-video — Kling animates FROM the first frame ───────
    const modelId = 'fal-ai/kling-video/v2.6/pro/image-to-video';

    const input = {
      prompt,           // animation instructions only
      image_url: frameUrl, // the first frame to animate from
      aspect_ratio: aspectRatio,
      duration,
      cfg_scale: cfgScale,
    };

    console.log('=== KLING 2.6 PRO IMAGE-TO-VIDEO ===');
    console.log('Model:', modelId);
    console.log('Ratio:', aspectRatio, '| Duration:', duration, 's | cfg_scale:', cfgScale);
    console.log('First frame URL:', frameUrl);
    console.log('--- ANIMATION PROMPT ---');
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
