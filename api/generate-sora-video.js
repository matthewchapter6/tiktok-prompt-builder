// Kling 1.6 Standard via fal.ai
// Docs: https://fal.ai/models/fal-ai/kling-video/v1.6/standard/image-to-video
// Pricing: ~$0.29–0.59 per 10s video

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      prompt,
      videoRatio,
      videoLength,
      productImageBase64,
      productImageMime,
    } = req.body;

    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const aspectRatio = videoRatio === '9_16' ? '9:16' : '16:9';
    const duration = videoLength === '15' ? '10' : '5'; // Kling uses 5s or 10s; map 10s→5, 15s→10

    // Build fal.ai request body
    // If product image provided, use image-to-video endpoint for better product consistency
    const falBody = {
      prompt,
      aspect_ratio: aspectRatio,
      duration,
      cfg_scale: 0.5, // creativity balance — 0=strict to prompt, 1=creative
      ...(productImageBase64 ? {
        image_url: `data:${productImageMime || 'image/jpeg'};base64,${productImageBase64}`,
      } : {}),
    };

    // Choose endpoint: image-to-video if product image provided, text-to-video if not
    const endpoint = productImageBase64
      ? 'https://queue.fal.run/fal-ai/kling-video/v1.6/standard/image-to-video'
      : 'https://queue.fal.run/fal-ai/kling-video/v1.6/standard/text-to-video';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${process.env.FAL_API_KEY}`,
      },
      body: JSON.stringify(falBody),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('fal.ai error:', data);
      return res.status(response.status).json({ error: 'Video generation failed', details: data });
    }

    // fal.ai queue returns a request_id for polling
    res.status(200).json({
      requestId: data.request_id,
      status: data.status || 'IN_QUEUE',
    });
  } catch (error) {
    console.error('generate-sora-video error:', error);
    res.status(500).json({ error: 'Video generation failed', details: error.message });
  }
}
