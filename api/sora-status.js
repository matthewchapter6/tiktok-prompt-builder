// sora-status.js — polls fal.ai for video generation status
// Uses fal SDK for correct queue polling across all models

import { fal } from "@fal-ai/client";

// ✅ Configure once at module level, not per-request
fal.config({ credentials: process.env.FAL_API_KEY });

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { requestId, modelId } = req.query;
  if (!requestId) return res.status(400).json({ error: 'requestId is required' });

  const modelPath = modelId
    ? decodeURIComponent(modelId)
    : 'fal-ai/kling-video/v2.6/pro/image-to-video';

  console.log(`[sora-status] model=${modelPath} requestId=${requestId}`);

  try {
    const statusPromise = fal.queue.status(modelPath, { requestId, logs: false });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('fal.ai status check timed out after 20s')), 20000)
    );

    const status = await Promise.race([statusPromise, timeoutPromise]);
    console.log(`[sora-status] status=${status.status} queuePos=${status.queue_position ?? 'n/a'}`);

    if (status.status === 'COMPLETED') {
      let videoUrl = null;

      // ── Strategy 1: result already embedded in status.data (Kling) ──
      if (status.data) {
        const d = status.data;
        videoUrl =
          d?.video?.url ||
          d?.video_url ||
          d?.videos?.[0]?.url ||
          d?.output?.video?.url ||
          d?.url ||
          null;
        console.log(`[sora-status] Strategy 1 (status.data): videoUrl=${videoUrl}`);
      }

      // ── Strategy 2: extract base model from response_url, then call fal.queue.result() ──
      // WAN returns response_url like: https://queue.fal.run/fal-ai/wan/requests/xxx
      // We must use "fal-ai/wan" (not the full subpath) when calling fal.queue.result()
      if (!videoUrl && status.response_url) {
        // Extract base model e.g. "fal-ai/wan" from the response_url
        const match = status.response_url.match(/queue\.fal\.run\/([^/]+\/[^/]+)\/requests/);
        const baseModel = match ? match[1] : modelPath;
        console.log(`[sora-status] Strategy 2: fal.queue.result() with baseModel=${baseModel}`);
        try {
          const result = await fal.queue.result(baseModel, { requestId });
          console.log('[sora-status] fal.queue.result raw:', JSON.stringify(result, null, 2));
          const d = result?.data || result;
          videoUrl =
            d?.video?.url ||
            d?.video_url ||
            d?.videos?.[0]?.url ||
            d?.output?.video?.url ||
            d?.url ||
            null;
          console.log(`[sora-status] Strategy 2 result: videoUrl=${videoUrl}`);
        } catch (resultErr) {
          console.error('[sora-status] Strategy 2 failed:', resultErr.message);
        }
      }

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
