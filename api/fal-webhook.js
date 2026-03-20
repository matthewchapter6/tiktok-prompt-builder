// api/fal-webhook.js
// fal.ai calls this endpoint when a video generation completes
// Updates Supabase with the video URL

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const payload = req.body;
    console.log("[fal-webhook] received:", JSON.stringify(payload, null, 2));

    const requestId = payload?.request_id;
    if (!requestId) {
      console.error("[fal-webhook] No request_id in payload");
      return res.status(200).json({ ok: true });
    }

    // fal.ai webhook payload shapes:
    // Shape A: { request_id, payload: { video: { url } } }
    // Shape B: { request_id, video: { url } }
    // Shape C: { request_id, data: { video: { url } } }
    const data = payload?.payload || payload?.data || payload;
    const videoUrl =
      data?.video?.url       ||
      data?.video_url        ||
      data?.videos?.[0]?.url ||
      null;

    console.log(`[fal-webhook] requestId=${requestId} videoUrl=${videoUrl}`);

    if (videoUrl) {
      // ✅ Uses existing VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY env vars
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY
      );

      const { error } = await supabase
        .from("sora_generations")
        .update({
          status: "completed",
          video_url: videoUrl,
          completed_at: new Date().toISOString(),
        })
        .eq("request_id", requestId);

      if (error) console.error("[fal-webhook] Supabase update error:", error.message);
      else console.log("[fal-webhook] ✅ Supabase updated. videoUrl=", videoUrl);
    } else {
      console.warn("[fal-webhook] No videoUrl found in payload");
    }

    // Always return 200 so fal.ai doesn't retry
    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error("[fal-webhook] Exception:", error.message);
    return res.status(200).json({ ok: true }); // Always 200 to fal.ai
  }
}
