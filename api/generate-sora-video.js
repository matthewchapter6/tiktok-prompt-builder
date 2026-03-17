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
    // fal.ai Kling accepts "5" or "10" seconds
    const duration = videoLength === '15' ? '10' : '5';

    const falBody = {
      prompt,
      aspect_ratio: aspectRatio,
      duration,
      cfg_scale: 0.5,
      ...(productImageBase64 ? {
        image_url: `data:${productImageMime || 'image/jpeg'};base64,${productImageBase64}`,
      } : {}),
    };

    const endpoint = productImageBase64
      ? 'https://queue.fal.run/fal-ai/kling-video/v1.6/standard/image-to-video'
      : 'https://queue.fal.run/fal-ai/kling-video/v1.6/standard/text-to-video';

    console.log('Submitting to fal.ai endpoint:', endpoint);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${process.env.FAL_API_KEY}`,
      },
      body: JSON.stringify(falBody),
    });

    const data = await response.json();
    console.log('fal.ai submit response:', JSON.stringify(data));

    if (!response.ok) {
      console.error('fal.ai error:', data);
      return res.status(response.status).json({
        error: 'Video generation failed',
        details: data,
      });
    }

    // fal.ai returns request_id (with underscore)
    const requestId = data.request_id || data.requestId || null;

    if (!requestId) {
      return res.status(500).json({
        error: 'No request ID returned from fal.ai',
        raw: data,
      });
    }

    res.status(200).json({
      requestId,
      status: data.status || 'IN_QUEUE',
    });

  } catch (error) {
    console.error('generate-sora-video error:', error);
    res.status(500).json({
      error: 'Video generation failed',
      details: error.message,
    });
  }
}
