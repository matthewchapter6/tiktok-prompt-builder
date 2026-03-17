// Polls fal.ai queue for video generation status
// Call this every 3-5 seconds from the frontend until status === COMPLETED

// fal.ai Queue REST API docs: https://docs.fal.ai/model-apis/model-endpoints/queue
// Status:  GET  https://queue.fal.run/{modelPath}/requests/{requestId}/status
// Result:  GET  https://queue.fal.run/{modelPath}/requests/{requestId}

// sora-status.js
// Uses @fal-ai/client SDK — add to package.json: "@fal-ai/client": "^1.0.0"
import { fal } from "@fal-ai/client";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { requestId, modelId } = req.query;
    if (!requestId) return res.status(400).json({ error: 'requestId is required' });

    fal.config({ credentials: process.env.FAL_API_KEY });

    const model = modelId
      ? decodeURIComponent(modelId)
      : 'fal-ai/kling-video/v1.6/standard/image-to-video';

    console.log('Checking status for requestId:', requestId, 'model:', model);

    const statusData = await fal.queue.status(model, {
      requestId,
      logs: false,
    });

    console.log('Status:', statusData.status);

    if (statusData.status === 'IN_QUEUE' || statusData.status === 'IN_PROGRESS') {
      return res.status(200).json({
        status: statusData.status,
        queuePosition: statusData.queue_position ?? null,
      });
    }

    if (statusData.status === 'FAILED') {
      return res.status(200).json({
        status: 'FAILED',
        error: statusData.error || 'Generation failed',
      });
    }

    if (statusData.status === 'COMPLETED') {
      console.log('Completed! Fetching result...');

      const result = await fal.queue.result(model, { requestId });
      console.log('Result keys:', Object.keys(result?.data || result || {}));

      const data = result?.data || result;
      const videoUrl =
        data?.video?.url ||
        data?.video_url ||
        data?.videos?.[0]?.url ||
        null;

      if (!videoUrl) {
        console.error('No video URL found. Result:', JSON.stringify(data));
        return res.status(200).json({
          status: 'COMPLETED',
          videoUrl: null,
          error: 'Video completed but URL not found',
          rawResult: data,
        });
      }

      return res.status(200).json({ status: 'COMPLETED', videoUrl });
    }

    return res.status(200).json({ status: statusData.status || 'UNKNOWN' });

  } catch (error) {
    console.error('sora-status error:', error.message, error.body || '');
    res.status(500).json({ error: error.message });
  }
}
