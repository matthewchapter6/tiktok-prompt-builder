// Kling 1.6 Standard via fal.ai
// Docs: https://fal.ai/models/fal-ai/kling-video/v1.6/standard/image-to-video
// Pricing: ~$0.29–0.59 per 10s video

// generate-sora-video.js
// Uses @fal-ai/client SDK — add to package.json: "@fal-ai/client": "^1.0.0"
// generate-sora-video.js
// Receives prompt + videoConfig (resolved by AI) and submits to Kling via fal.ai SDK
// generate-sora-video.js
// Receives prompt + videoConfig (resolved by AI) and submits to Kling via fal.ai SDK
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
      videoConfig,       // resolved by AI in generate-sora-prompt
      productImageBase64,
      productImageMime,
    } = req.body;

    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    fal.config({ credentials: process.env.FAL_API_KEY });

    const hasImage = !!productImageBase64;

    // Use videoConfig values resolved by AI — fallback to safe defaults
    const aspectRatio = videoConfig?.aspect_ratio || '9:16';
    const duration    = videoConfig?.duration     || '10'; // default to 10s if not set
    const cfgScale    = videoConfig?.cfg_scale    ?? 0.5;

    // Kling 2.6 Pro — 1080p, cinematic motion, native audio support
    const modelId = hasImage
      ? 'fal-ai/kling-video/v2.6/pro/image-to-video'
      : 'fal-ai/kling-video/v2.6/pro/text-to-video';

    const input = {
      prompt,
      aspect_ratio: aspectRatio,
      duration,       // '5' or '10' — Kling 2.6 Pro supports both
      cfg_scale: cfgScale,
      ...(hasImage ? {
        image_url: `data:${productImageMime || 'image/jpeg'};base64,${productImageBase64}`,
      } : {}),
    };

    console.log('Submitting to Kling. Model:', modelId, '| Ratio:', aspectRatio, '| Duration:', duration, '| cfg_scale:', cfgScale);
    console.log('AI resolved settings:', JSON.stringify(videoConfig?.resolved || {}));

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
