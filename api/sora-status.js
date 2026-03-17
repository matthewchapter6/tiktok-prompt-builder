// Polls fal.ai queue for video generation status
// Call this every 3-5 seconds from the frontend until status === COMPLETED

// fal.ai Queue REST API docs: https://docs.fal.ai/model-apis/model-endpoints/queue
// Status:  GET  https://queue.fal.run/{modelPath}/requests/{requestId}/status
// Result:  GET  https://queue.fal.run/{modelPath}/requests/{requestId}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { requestId, modelPath } = req.query;
    if (!requestId) return res.status(400).json({ error: 'requestId is required' });

    // Use modelPath passed from the submit step, fallback to image-to-video
    const model = modelPath
      ? decodeURIComponent(modelPath)
      : 'fal-ai/kling-video/v1.6/standard/image-to-video';

    const headers = {
      'Authorization': `Key ${process.env.FAL_API_KEY}`,
    };

    // Step 1: Check status
    const statusUrl = `https://queue.fal.run/${model}/requests/${requestId}/status`;
    console.log('Polling status URL:', statusUrl);

    const statusRes = await fetch(statusUrl, { method: 'GET', headers });
    const statusText = await statusRes.text();
    console.log('Status response:', statusRes.status, statusText);

    if (!statusRes.ok) {
      return res.status(500).json({
        error: `fal.ai status check failed with ${statusRes.status}`,
        details: statusText,
      });
    }

    let statusData;
    try { statusData = JSON.parse(statusText); }
    catch (e) { return res.status(500).json({ error: 'Invalid JSON from status', raw: statusText }); }

    const status = statusData.status;

    if (status === 'IN_QUEUE' || status === 'IN_PROGRESS') {
      return res.status(200).json({
        status,
        queuePosition: statusData.queue_position ?? null,
      });
    }

    if (status === 'FAILED') {
      return res.status(200).json({
        status: 'FAILED',
        error: statusData.error || 'Generation failed on fal.ai',
      });
    }

    if (status === 'COMPLETED') {
      // Step 2: Fetch the result
      const resultUrl = `https://queue.fal.run/${model}/requests/${requestId}`;
      console.log('Fetching result URL:', resultUrl);

      const resultRes = await fetch(resultUrl, { method: 'GET', headers });
      const resultText = await resultRes.text();
      console.log('Result response:', resultRes.status, resultText.substring(0, 300));

      if (!resultRes.ok) {
        return res.status(500).json({
          error: `fal.ai result fetch failed with ${resultRes.status}`,
          details: resultText,
        });
      }

      let result;
      try { result = JSON.parse(resultText); }
      catch (e) { return res.status(500).json({ error: 'Invalid JSON from result', raw: resultText }); }

      // fal.ai Kling returns: { "video": { "url": "https://..." } }
      const videoUrl =
        result?.video?.url ||
        result?.video_url ||
        result?.videos?.[0]?.url ||
        result?.output?.video?.url ||
        null;

      if (!videoUrl) {
        console.error('No video URL in result:', JSON.stringify(result));
        return res.status(200).json({
          status: 'COMPLETED',
          videoUrl: null,
          error: 'Video completed but no URL found',
          rawResult: result,
        });
      }

      return res.status(200).json({ status: 'COMPLETED', videoUrl });
    }

    // Unknown status
    return res.status(200).json({ status: status || 'UNKNOWN', queuePosition: null });

  } catch (error) {
    console.error('sora-status error:', error.message);
    res.status(500).json({ error: error.message });
  }
}
