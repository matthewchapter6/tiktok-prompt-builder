// grok-webhook.js
// fal.ai calls this when a Grok video generation completes
// Updates grok_generations table in Supabase with video URL

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const payload = req.body;
    console.log("[grok-webhook] received:", JSON.stringify(payload, null, 2));

    const requestId = payload?.request_id;
    if (!requestId) {
      console.error("[grok-webhook] No request_id in payload");
      return res.status(200).json({ ok: true });
    }

    // Extract video URL from various payload shapes
    const data = payload?.payload || payload?.data || payload;
    const videoUrl =
      data?.video?.url       ||
      data?.video_url        ||
      data?.videos?.[0]?.url ||
      null;

    console.log(`[grok-webhook] requestId=${requestId} videoUrl=${videoUrl}`);

    if (videoUrl) {
      const supabase = createClient(
        process.env.VITE_SUPABASE_URL,
        process.env.VITE_SUPABASE_ANON_KEY
      );

      const { error } = await supabase
        .from("grok_generations")
        .update({
          status: "completed",
          video_url: videoUrl,
          completed_at: new Date().toISOString(),
        })
        .eq("request_id", requestId);

      if (error) console.error("[grok-webhook] Supabase update error:", error.message);
      else console.log("[grok-webhook] ✅ Supabase updated. videoUrl=", videoUrl);
    } else {
      console.warn("[grok-webhook] No videoUrl found in payload");
    }

    // Always return 200 so fal.ai does not retry
    return res.status(200).json({ ok: true });

  } catch (error) {
    console.error("[grok-webhook] Exception:", error.message);
    return res.status(200).json({ ok: true });
  }
}