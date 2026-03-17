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

    const modelPath = endpoint === 'text'
      ? 'fal-ai/kling-video/v1.6/standard/text-to-video'
      : 'fal-ai/kling-video/v1.6/standard/image-to-video';

    const headers = {
      'Authorization': `Key ${process.env.FAL_API_KEY}`,
      'Content-Type': 'application/json',
    };

    // First check status
    const statusRes = await fetch(
      `https://queue.fal.run/${modelPath}/requests/${requestId}/status`,
      { headers }
    );

    if (!statusRes.ok) {
      const errText = await statusRes.text();
      console.error('fal.ai status error:', statusRes.status, errText);
      return res.status(500).json({
        error: 'Status check failed',
        details: errText,
        falStatus: statusRes.status,
      });
    }

    const statusData = await statusRes.json();
    console.log('fal.ai status response:', JSON.stringify(statusData));

    // Still in queue or processing
    if (statusData.status === 'IN_QUEUE' || statusData.status === 'IN_PROGRESS') {
      return res.status(200).json({
        status: statusData.status,
        queuePosition: statusData.queue_position ?? null,
      });
    }

    // Failed
    if (statusData.status === 'FAILED') {
      return res.status(200).json({
        status: 'FAILED',
        error: statusData.error || 'Video generation failed on fal.ai',
      });
    }

    // Completed — fetch the actual result
    if (statusData.status === 'COMPLETED') {
      const resultRes = await fetch(
        `https://queue.fal.run/${modelPath}/requests/${requestId}`,
        { headers }
      );

      if (!resultRes.ok) {
        const errText = await resultRes.text();
        console.error('fal.ai result fetch error:', resultRes.status, errText);
        return res.status(500).json({
          error: 'Failed to fetch completed video',
          details: errText,
        });
      }

      const result = await resultRes.json();
      console.log('fal.ai result:', JSON.stringify(result));

      // fal.ai Kling returns video URL in different possible locations
      const videoUrl =
        result?.video?.url ||
        result?.video_url ||
        result?.videos?.[0]?.url ||
        result?.output?.video?.url ||
        null;

      if (!videoUrl) {
        console.error('No video URL found in result:', JSON.stringify(result));
        return res.status(200).json({
          status: 'COMPLETED',
          videoUrl: null,
          error: 'Video generated but URL not found',
          rawResult: result,
        });
      }

      return res.status(200).json({
        status: 'COMPLETED',
        videoUrl,
      });
    }

    // Unknown status — return as-is
    return res.status(200).json({
      status: statusData.status || 'UNKNOWN',
      queuePosition: statusData.queue_position ?? null,
      raw: statusData,
    });

  } catch (error) {
    console.error('sora-status handler error:', error);
    res.status(500).json({
      error: 'Status check failed',
      details: error.message,
    });
  }
}
