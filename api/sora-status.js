// sora-status.js — polls fal.ai for video generation status
// Uses fal SDK for correct queue polling across all models

import { fal } from "@fal-ai/client";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { requestId, modelId } = req.query;
  if (!requestId) return res.status(400).json({ error: 'requestId is required' });

  // Decode modelId — App.js sends encodeURIComponent(modelId)
  const modelPath = modelId
    ? decodeURIComponent(modelId)
    : 'fal-ai/kling-video/v2.6/pro/image-to-video';

  console.log(`[sora-status] model=${modelPath} requestId=${requestId}`);

  fal.config({ credentials: process.env.FAL_API_KEY });

  try {
    // Use fal SDK for status — works correctly for ALL models
    const status = await fal.queue.status(modelPath, {
      requestId,
      logs: false,
    });

    console.log(`[sora-status] status=${status.status} queuePos=${status.queue_position ?? 'n/a'}`);

    if (status.status === 'COMPLETED') {
      // Fetch the actual result
      const result = await fal.queue.result(modelPath, { requestId });

      const videoUrl =
        result?.data?.video?.url ||
        result?.data?.video_url ||
        result?.data?.videos?.[0]?.url ||
        result?.video?.url ||
        result?.video_url ||
        null;

      console.log(`[sora-status] COMPLETED. videoUrl=${videoUrl}`);
      return res.status(200).json({ status: 'COMPLETED', videoUrl });
    }

    if (status.status === 'FAILED') {
      console.log(`[sora-status] FAILED`);
      return res.status(200).json({ status: 'FAILED', error: 'Video generation failed on fal.ai' });
    }

    // IN_QUEUE or IN_PROGRESS
    return res.status(200).json({
      status: status.status || 'IN_QUEUE',
      queuePosition: status.queue_position ?? null,
    });

  } catch (error) {
    console.error('[sora-status] Exception:', error.message);
    return res.status(500).json({ error: 'Status check failed', details: error.message });
  }
}
