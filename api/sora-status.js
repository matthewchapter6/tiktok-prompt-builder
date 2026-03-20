// sora-status.js
// Polls fal.ai queue for video generation status
// Supports any model — uses modelId param from generate-sora-video response

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { requestId, modelId } = req.query;
    if (!requestId) return res.status(400).json({ error: 'requestId is required' });

    // Use modelId from the generation response — supports both Kling and Wan
    const modelPath = modelId || 'fal-ai/kling-video/v2.6/pro/image-to-video';

    const statusRes = await fetch(
      `https://queue.fal.run/${modelPath}/requests/${requestId}/status`,
      { headers: { 'Authorization': `Key ${process.env.FAL_API_KEY}` } }
    );

    const data = await statusRes.json();
    if (!statusRes.ok) {
      console.error('sora-status fal error:', JSON.stringify(data));
      return res.status(statusRes.status).json({ error: 'Status check failed', details: data });
    }

    if (data.status === 'COMPLETED') {
      const resultRes = await fetch(
        `https://queue.fal.run/${modelPath}/requests/${requestId}`,
        { headers: { 'Authorization': `Key ${process.env.FAL_API_KEY}` } }
      );
      const result = await resultRes.json();

      // Handle different response formats across models
      const videoUrl =
        result?.video?.url ||
        result?.video_url ||
        result?.videos?.[0]?.url ||
        null;

      console.log('Video completed. URL:', videoUrl);
      return res.status(200).json({ status: 'COMPLETED', videoUrl, result });
    }

    if (data.status === 'FAILED') {
      return res.status(200).json({ status: 'FAILED', error: data.error || 'Video generation failed' });
    }

    res.status(200).json({
      status: data.status || 'IN_QUEUE',
      queuePosition: data.queue_position ?? null,
    });

  } catch (error) {
    console.error('sora-status error:', error);
    res.status(500).json({ error: 'Status check failed', details: error.message });
  }
}
