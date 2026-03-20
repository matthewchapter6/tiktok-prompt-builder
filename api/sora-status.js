// sora-status.js — polls fal.ai for video generation status

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { requestId, modelId } = req.query;

  if (!requestId) {
    return res.status(400).json({ error: 'requestId is required' });
  }

  // Decode modelId — App.js sends encodeURIComponent(modelId)
  const modelPath = modelId
    ? decodeURIComponent(modelId)
    : 'fal-ai/kling-video/v2.6/pro/image-to-video';

  console.log(`[sora-status] modelPath=${modelPath} requestId=${requestId}`);

  try {
    const statusUrl = `https://queue.fal.run/${modelPath}/requests/${requestId}/status`;
    console.log(`[sora-status] Polling: ${statusUrl}`);

    const statusRes = await fetch(statusUrl, {
      headers: { 'Authorization': `Key ${process.env.FAL_API_KEY}` }
    });

    const rawText = await statusRes.text();
    console.log(`[sora-status] fal response ${statusRes.status}: ${rawText.substring(0, 200)}`);

    let data;
    try { data = JSON.parse(rawText); }
    catch (e) { return res.status(500).json({ error: 'Invalid JSON from fal.ai', raw: rawText.substring(0, 500) }); }

    if (!statusRes.ok) {
      return res.status(statusRes.status).json({ error: 'fal.ai status check failed', details: data });
    }

    if (data.status === 'COMPLETED') {
      const resultUrl = `https://queue.fal.run/${modelPath}/requests/${requestId}`;
      const resultRes = await fetch(resultUrl, {
        headers: { 'Authorization': `Key ${process.env.FAL_API_KEY}` }
      });
      const result = await resultRes.json();

      const videoUrl =
        result?.video?.url ||
        result?.video_url ||
        result?.videos?.[0]?.url ||
        null;

      console.log(`[sora-status] COMPLETED. videoUrl=${videoUrl}`);
      return res.status(200).json({ status: 'COMPLETED', videoUrl, result });
    }

    if (data.status === 'FAILED') {
      console.log(`[sora-status] FAILED:`, data.error);
      return res.status(200).json({ status: 'FAILED', error: data.error || 'Video generation failed' });
    }

    // IN_QUEUE or IN_PROGRESS
    return res.status(200).json({
      status: data.status || 'IN_QUEUE',
      queuePosition: data.queue_position ?? null,
    });

  } catch (error) {
    console.error('[sora-status] Exception:', error.message, error.stack);
    return res.status(500).json({ error: 'Status check failed', details: error.message });
  }
}
