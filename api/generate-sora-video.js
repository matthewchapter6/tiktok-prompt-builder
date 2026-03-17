// Kling 1.6 Standard via fal.ai
// Docs: https://fal.ai/models/fal-ai/kling-video/v1.6/standard/image-to-video
// Pricing: ~$0.29–0.59 per 10s video

// generate-sora-video.js
// Uses @fal-ai/client SDK — add to package.json: "@fal-ai/client": "^1.0.0"
import { fal } from "@fal-ai/client";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt, videoRatio, videoLength, productImageBase64, productImageMime } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    fal.config({ credentials: process.env.FAL_API_KEY });

    const aspectRatio = videoRatio === '9_16' ? '9:16' : '16:9';
    const duration = videoLength === '15' ? '10' : '5';
    const hasImage = !!productImageBase64;

    const modelId = hasImage
      ? 'fal-ai/kling-video/v1.6/standard/image-to-video'
      : 'fal-ai/kling-video/v1.6/standard/text-to-video';

    const input = {
      prompt,
      aspect_ratio: aspectRatio,
      duration,
      cfg_scale: 0.5,
      ...(hasImage ? {
        image_url: `data:${productImageMime || 'image/jpeg'};base64,${productImageBase64}`,
      } : {}),
    };

    console.log('Submitting to fal.ai model:', modelId);

    const { request_id, status_url, response_url } = await fal.queue.submit(modelId, { input });

    console.log('Submitted. request_id:', request_id, 'status_url:', status_url);

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
