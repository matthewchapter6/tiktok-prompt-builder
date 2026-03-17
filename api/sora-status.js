// Polls fal.ai queue for video generation status
// Call this every 3-5 seconds from the frontend until status === COMPLETED

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { requestId, endpoint } = req.query;
    if (!requestId) return res.status(400).json({ error: 'requestId is required' });

    // Determine which fal.ai model endpoint to poll
    const modelPath = endpoint === 'text'
      ? 'fal-ai/kling-video/v1.6/standard/text-to-video'
      : 'fal-ai/kling-video/v1.6/standard/image-to-video';

    const response = await fetch(
      `https://queue.fal.run/${modelPath}/requests/${requestId}/status`,
      {
        headers: {
          'Authorization': `Key ${process.env.FAL_API_KEY}`,
        },
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Status check failed', details: data });
    }

    // fal.ai statuses: IN_QUEUE, IN_PROGRESS, COMPLETED, FAILED
    if (data.status === 'COMPLETED') {
      // Fetch the actual result
      const resultResponse = await fetch(
        `https://queue.fal.run/${modelPath}/requests/${requestId}`,
        {
          headers: {
            'Authorization': `Key ${process.env.FAL_API_KEY}`,
          },
        }
      );
      const result = await resultResponse.json();

      return res.status(200).json({
        status: 'COMPLETED',
        videoUrl: result?.video?.url || result?.video_url || null,
        result,
      });
    }

    if (data.status === 'FAILED') {
      return res.status(200).json({
        status: 'FAILED',
        error: data.error || 'Video generation failed',
      });
    }

    // Still processing — return current status and queue position if available
    res.status(200).json({
      status: data.status || 'IN_QUEUE',
      queuePosition: data.queue_position || null,
    });
  } catch (error) {
    console.error('sora-status error:', error);
    res.status(500).json({ error: 'Status check failed', details: error.message });
  }
}
