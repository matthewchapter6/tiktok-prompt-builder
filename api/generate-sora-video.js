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
    const { prompt, videoRatio, videoLength, productImageBase64, productImageMime } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const aspectRatio = videoRatio === '9_16' ? '9:16' : '16:9';
    const duration = videoLength === '15' ? '10' : '5';
    const hasImage = !!productImageBase64;

    // fal.ai requires input to be nested under "input" key
    const falInput = {
      input: {
        prompt,
        aspect_ratio: aspectRatio,
        duration,
        cfg_scale: 0.5,
        ...(hasImage ? {
          image_url: `data:${productImageMime || 'image/jpeg'};base64,${productImageBase64}`,
        } : {}),
      }
    };

    const modelPath = hasImage
      ? 'fal-ai/kling-video/v1.6/standard/image-to-video'
      : 'fal-ai/kling-video/v1.6/standard/text-to-video';

    const endpoint = `https://queue.fal.run/${modelPath}`;
    console.log('Submitting to:', endpoint);
    console.log('Input (no image data):', JSON.stringify({ ...falInput, input: { ...falInput.input, image_url: hasImage ? '[BASE64]' : undefined } }));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${process.env.FAL_API_KEY}`,
      },
      body: JSON.stringify(falInput),
    });

    const responseText = await response.text();
    console.log('fal.ai submit raw response:', responseText);

    let data;
    try { data = JSON.parse(responseText); }
    catch (e) { return res.status(500).json({ error: 'Invalid JSON from fal.ai', raw: responseText }); }

    if (!response.ok) {
      return res.status(response.status).json({ error: 'fal.ai submission failed', details: data });
    }

    const requestId = data.request_id || data.requestId;
    if (!requestId) {
      return res.status(500).json({ error: 'No request_id in fal.ai response', raw: data });
    }

    res.status(200).json({
      requestId,
      modelPath, // pass back so status polling uses same model path
      status: data.status || 'IN_QUEUE',
    });
  } catch (error) {
    console.error('generate-sora-video error:', error);
    res.status(500).json({ error: error.message });
  }
}
