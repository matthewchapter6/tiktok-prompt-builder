// longvideo-api.js
// Single serverless function for all Long Video operations
// action: 'storylines' | 'prompts' | 'clip1' | 'extend'

import { fal } from "@fal-ai/client";
fal.config({ credentials: process.env.FAL_API_KEY });

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action } = req.body;
  if (!action) return res.status(400).json({ error: "action is required" });

  if (action === "storylines") return handleStorylines(req, res);
  if (action === "prompts")    return handlePrompts(req, res);
  if (action === "clip1")      return handleClip1(req, res);
  if (action === "extend")     return handleExtend(req, res);

  return res.status(400).json({ error: `Unknown action: ${action}` });
}

// ── ACTION: Generate 5 storylines ────────────────────────────────────────────

async function handleStorylines(req, res) {
  try {
    const {
      productDescription,
      productUSP,
      funnel,
      shape,
      dimensions,
      productImage,
      lang,
    } = req.body;

    if (!productDescription) return res.status(400).json({ error: "productDescription is required" });

    const funnelGuide = {
      upper:  "AWARENESS — hook with a relatable problem, no hard sell, make viewer curious",
      middle: "CONSIDERATION — show product solving a real problem, build trust and credibility",
      lower:  "CONVERSION — create urgency, strong desire, clear reason to buy NOW",
    }[funnel] || "GENERAL — showcase product attractively with a clear benefit";

    const dimParts = [];
    if (dimensions?.height) dimParts.push(`${dimensions.height}cm tall`);
    if (dimensions?.width)  dimParts.push(`${dimensions.width}cm wide`);
    if (dimensions?.depth)  dimParts.push(`${dimensions.depth}cm deep`);
    const shapeContext = shape
      ? `PRODUCT SHAPE & SIZE: ${shape}${dimParts.length ? ` — approximately ${dimParts.join(", ")}` : ""} — ensure the host holds and interacts with the product in a physically realistic way.`
      : "";

    const langInstruction = lang === "zh"
      ? "\n\nIMPORTANT: Generate ALL text fields in Simplified Chinese (简体中文)."
      : lang === "bm"
      ? "\n\nIMPORTANT: Generate ALL text fields in Bahasa Malaysia."
      : "";

    const systemInstruction = `You are a short-form video scriptwriter specialising in narrative-style product stories for TikTok and Instagram Reels.

STORYTELLING FORMAT (non-negotiable):
- The host is a STORYTELLER, not an advertiser. They speak directly to camera like a trusted friend sharing a genuine discovery.
- SAME SCENE throughout all 3 acts — one location, one consistent environment, no cuts to different places.
- MINIMAL HOST MOVEMENT — host stays seated or standing in frame. Only allowed movements: holding product up to show, placing it on a surface, picking it up. No walking, no dramatic transitions.
- Host NARRATES the entire 18 seconds in first-person voice ("I was so tired of...", "Then I found...", "Now I never...").
- NEVER use advertiser language: no "amazing", "incredible", "game-changer", "life-changing". Use honest, specific, conversational words.
- DEFAULT HOST APPEARANCE: East Asian / Chinese-looking host unless the product specifically targets a different demographic.

NARRATIVE ARC (strict):
- Act 1 Hook (0-6s): Open mid-frustration. Host expresses a real, relatable pain point in first person. The scene reflects the "before" state visually. Viewer should think "that's exactly me."
- Act 2 Content (6-12s): Host introduces the product as a natural discovery. Shows it simply — holds it up, demonstrates one key thing. Narrates what it does in plain, honest language.
- Act 3 CTA (12-18s): Host describes the "after" state — relief, satisfaction, improvement. Ends with a low-pressure, natural CTA ("link in bio", "I'll leave it below").

TONE RULES:
- Conversational, authentic, slightly vulnerable — NOT polished ad energy
- The pain point must feel REAL and relatable before the product is introduced
- Script lines must sound like something a real person would actually say out loud

Return ONLY valid JSON. No explanation. No markdown.${langInstruction}`;

    const userPrompt = `Propose 5 completely different 18-second narrative product stories for this product.

PRODUCT: ${productDescription}
${productUSP ? `USP: ${productUSP}` : ""}
${shapeContext}
OBJECTIVE: ${funnelGuide}

DIFFERENTIATION RULES — each story must differ by:
- A completely different pain point or life situation that creates the problem
- A different life context (e.g. travelling, at home, at work, with family, morning routine, etc.)
- A different emotional angle (frustration, embarrassment, exhaustion, overwhelm, anxiety, etc.)
- A different type of person whose life this story belongs to

REFERENCE EXAMPLE (match this tone and format exactly):
Product: Desk organizer
hook_visual: "Host sits at a cluttered desk, sighs, gestures at the mess around them"
hook_script: "I was so sick of my desk looking like a disaster zone every single morning..."
content_visual: "Host picks up organizer, slots items in one by one while talking to camera"
content_script: "Then I found this — everything just clicks into place. Took me five minutes to set up."
cta_visual: "Host leans back satisfied, tidy desk visible behind them, product sitting on desk"
cta_script: "Now everything has a place. If your desk looks like mine did — link in bio."

Return exactly this JSON:
{
  "storylines": [
    {
      "id": 1,
      "title": "3-5 word catchy title",
      "style": "narrative",
      "host": "gender, age range, look/energy that fits this specific pain point and person",
      "scene": "One consistent location and setup used across all 3 acts",
      "emotion": "Primary emotion targeted (e.g. relief, relatability, satisfaction)",
      "hook_visual": "What is physically visible in Act 1 — the before state and host body language",
      "hook_script": "Exact words the host says in Act 1 — first-person, pain point, conversational tone",
      "content_visual": "Minimal visual action in Act 2 — host holds/shows/uses product while talking",
      "content_script": "Exact words in Act 2 — what the product does, plain language, no hype",
      "cta_visual": "Final visual in Act 3 — after state, product visible, host looks satisfied",
      "cta_script": "Exact words in Act 3 — satisfying resolution + natural low-pressure CTA"
    }
  ]
}`;

    const parts = [];
    if (productImage?.data) {
      parts.push({ inline_data: { mime_type: productImage.mimeType || "image/jpeg", data: productImage.data } });
      parts.push({ text: "This is the product reference image. Use it to understand the product's appearance, colour, and real-world size so host interactions are physically realistic." });
    }
    parts.push({ text: userPrompt });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: "user", parts }],
          generationConfig: { temperature: 1.1, topP: 0.97, maxOutputTokens: 3500 },
        }),
      }
    );
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: "Storyline generation failed", details: data });

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    if (!raw) return res.status(500).json({ error: "Empty response from Gemini" });

    let parsed;
    try { parsed = JSON.parse(raw.replace(/```json|```/g, "").trim()); }
    catch (e) { return res.status(500).json({ error: "Failed to parse storylines", raw }); }

    console.log(`[longvideo-api:storylines] funnel=${funnel} stories=${parsed.storylines?.length}`);
    return res.status(200).json(parsed);

  } catch (error) {
    console.error("[longvideo-api:storylines] Exception:", error.message);
    return res.status(500).json({ error: "Storyline generation failed", details: error.message });
  }
}

// ── ACTION: Generate 3-part prompts ──────────────────────────────────────────

async function handlePrompts(req, res) {
  try {
    const { storyline, productDescription, productUSP, funnel, videoRatio, shape, dimensions, productImageCount = 1, hasCharacterImage = false, lang } = req.body;

    if (!storyline || !productDescription) return res.status(400).json({ error: "storyline and productDescription are required" });

    const ratioLabel = videoRatio === "16:9" ? "16:9 landscape" : videoRatio === "1:1" ? "1:1 square" : "9:16 vertical portrait";
    const funnelGuide = {
      upper:  "AWARENESS — relatable hook, no hard sell, soft CTA",
      middle: "CONSIDERATION — demonstrate solving a real problem, build trust",
      lower:  "CONVERSION — create urgency, desire, clear buy CTA",
    }[funnel] || "GENERAL — showcase product attractively";

    const dimParts = [];
    if (dimensions?.height) dimParts.push(`${dimensions.height}cm tall`);
    if (dimensions?.width)  dimParts.push(`${dimensions.width}cm wide`);
    if (dimensions?.depth)  dimParts.push(`${dimensions.depth}cm deep`);
    const shapeContext = shape
      ? `Product shape: ${shape}${dimParts.length ? `, approximately ${dimParts.join(" × ")}` : ""}. Ensure host grip and interactions are physically realistic.`
      : "";

    const langInstruction = lang === "zh"
      ? "\n\nIMPORTANT: Write ALL three prompts entirely in Simplified Chinese (简体中文)."
      : lang === "bm"
      ? "\n\nIMPORTANT: Write ALL three prompts entirely in Bahasa Malaysia."
      : "";

    // Build @Image reference tags based on what was uploaded
    const productTags = Array.from({ length: productImageCount }, (_, i) => `@Image${i + 1}`).join(", ");
    const characterTag = hasCharacterImage ? `@Image${productImageCount + 1}` : null;
    const allImageRefs = [
      `${productTags}: Product reference image${productImageCount > 1 ? "s" : ""} — show what to ANIMATE (host interactions) and PRESERVE (shape, proportions, colour)`,
      characterTag ? `${characterTag}: Host/character reference — maintain this person's exact face, skin tone, outfit, and energy throughout all clips` : null,
    ].filter(Boolean).join("\n- ");

    const systemInstruction = `You are an expert Grok AI video prompt engineer specialising in 18-second chained product marketing videos powered by xAI's Aurora engine.${langInstruction}

HOW THE 3-CLIP CHAIN WORKS:
- Clip 1 (reference-to-video, 6s): Grok generates from scratch using reference images. Needs a COMPLETE brief covering all visual layers.
- Clip 2 (extend-video, 6s): Grok INHERITS the full scene, host, lighting, and style from Clip 1. Only the new host action is needed.
- Clip 3 (extend-video, 6s): Same — Grok inherits everything. Only the CTA action is needed.

REFERENCE IMAGES PROVIDED:
- ${allImageRefs}

HOST DEFAULT: East Asian / Chinese-looking host unless the storyline specifies otherwise.

PROMPT 1 FRAMEWORK — follow this order in one flowing paragraph (80–150 words):
[Host + Opening Action] → [Location/Scene] → [Camera Move] → [Lighting] → [Audio] → [Stability Note] → [Negative Constraints]

PROMPT 1 NON-NEGOTIABLE RULES:
1. FRONT-LOAD: First sentence = host description + primary action. Grok weights the opening most heavily.
2. REFERENCE USAGE: Use ${productTags} for the product. Do NOT re-describe it in full — focus on ANIMATE (what the host does with it) and PRESERVE (exact shape, proportions, colour).${characterTag ? `\n3. CHARACTER: Use ${characterTag} for the host face/appearance. Preserve their exact look throughout.` : ""}
3. PRECISE LANGUAGE: No vague words like "cinematic" or "dynamic" — be specific: "soft top-light with warm rim", "handheld follow at chest height", "upbeat lo-fi beat with light product tap sound".
4. AUDIO IS REQUIRED: Grok generates native audio. Specify music genre/mood + at least one ambient sound.
5. STABILITY NOTE: Penultimate sentence must lock in: "Keep the host's face, outfit and ${productTags} appearance consistent throughout."
6. NEGATIVE CONSTRAINTS (always last): "No text overlays, no scene cuts, no warped hands or faces, product maintains exact size and proportions."

PHYSICAL REALISM RULES (critical — prevents AI physics errors):
- GRIP: If product is large, heavy, or awkward — host must use BOTH hands; no one-handed floating hold
- WEIGHT: Describe weight cues — e.g. "host lifts the box with a slight effort", "holds bottle firmly with two hands"
- PRODUCT INTERIOR: If product is a bottle, box, or container — describe what it contains; never show an empty interior
- NO MAGIC PROPS: Everything in the scene must already exist from the first frame; no new objects appear mid-clip
- GRAVITY: Liquids flow naturally, objects settle on surfaces, fabric moves with body motion

PROMPTS 2 & 3 RULES (extend-video — strict):
- 20–40 words MAXIMUM. One sentence preferred, two sentences at most.
- Start with "Continue the scene:" — this signals video extension to Grok.
- Describe ONLY the new host action and any product movement.
- DO NOT repeat scene, lighting, camera setup, or host appearance — Grok already knows all of this.
- For Prompt 3: include a clear CTA gesture (e.g. "points to camera", "holds product up with a confident nod").`;

    const userPrompt = `Write 3 Grok video prompts for this 18-second product marketing chain.

PRODUCT: ${productDescription}
${productUSP ? `USP: ${productUSP}` : ""}
${shapeContext}
FUNNEL: ${funnelGuide}
RATIO: ${ratioLabel}
HOST: ${storyline.host || "Gemini should decide based on product and funnel"}
SCENE: ${storyline.scene || "Clean, product-appropriate environment"}

CONFIRMED STORYLINE:
Act 1 — Hook (0-6s):
  Visual: ${storyline.hook_visual || storyline.hook || ""}
  Script (host narration): "${storyline.hook_script || ""}"
Act 2 — Content (6-12s):
  Visual: ${storyline.content_visual || storyline.content || ""}
  Script (host narration): "${storyline.content_script || ""}"
Act 3 — CTA (12-18s):
  Visual: ${storyline.cta_visual || storyline.cta || ""}
  Script (host narration): "${storyline.cta_script || ""}"
Emotion: ${storyline.emotion}
Style: ${storyline.style}

---

PROMPT 1 — reference-to-video (6s Hook), 80–150 words, one paragraph:
Order: Host+Action → Scene → Camera → Lighting → Audio → Stability Note → Negative Constraints
Use ${productTags} for the product.${characterTag ? ` Use ${characterTag} for the host face.` : ""} Show what the host DOES with it, not what it looks like. Apply physical realism rules.

PROMPT 2 — extend-video (6s Content), 20–40 words:
"Continue the scene:" + host action for Act 2 only. Nothing else.

PROMPT 3 — extend-video (6s CTA), 20–40 words:
"Continue the scene:" + host CTA action + clear call-to-action gesture. Nothing else.

Return exactly this JSON (no markdown, no extra keys):
{
  "prompt1": "...",
  "prompt2": "...",
  "prompt3": "..."
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.9, topP: 0.95, maxOutputTokens: 600 },
        }),
      }
    );
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: "Prompt generation failed", details: data });

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    if (!raw) return res.status(500).json({ error: "Empty response from Gemini" });

    let parsed;
    try { parsed = JSON.parse(raw.replace(/```json|```/g, "").trim()); }
    catch (e) { return res.status(500).json({ error: "Failed to parse prompts", raw }); }

    if (!parsed.prompt1 || !parsed.prompt2 || !parsed.prompt3) return res.status(500).json({ error: "Incomplete prompts returned", raw });

    console.log(`[longvideo-api:prompts] funnel=${funnel} ratio=${videoRatio} title="${storyline.title}"`);
    return res.status(200).json(parsed);

  } catch (error) {
    console.error("[longvideo-api:prompts] Exception:", error.message);
    return res.status(500).json({ error: "Prompt generation failed", details: error.message });
  }
}

// ── ACTION: Generate Clip 1 (reference-to-video, 6s) ─────────────────────────

async function handleClip1(req, res) {
  try {
    const {
      prompt, videoRatio,
      productImagesBase64, productImagesMime,
      characterImageBase64, characterImageMime,
    } = req.body;

    if (!prompt) return res.status(400).json({ error: "prompt is required" });
    if (!productImagesBase64?.length) return res.status(400).json({ error: "productImagesBase64 is required" });

    // Upload all product images, then optional character image
    const referenceImageUrls = [];
    for (let i = 0; i < productImagesBase64.length; i++) {
      const blob = base64ToBlob(productImagesBase64[i], (productImagesMime?.[i]) || "image/jpeg");
      const url = await fal.storage.upload(blob);
      console.log(`[longvideo-api:clip1] Uploaded product image ${i + 1}: ${url}`);
      referenceImageUrls.push(url);
    }
    if (characterImageBase64) {
      const blob = base64ToBlob(characterImageBase64, characterImageMime || "image/jpeg");
      const url = await fal.storage.upload(blob);
      console.log(`[longvideo-api:clip1] Uploaded character image: ${url}`);
      referenceImageUrls.push(url);
    }

    const modelId = "xai/grok-imagine-video/reference-to-video";
    const input = {
      prompt,
      reference_image_urls: referenceImageUrls,
      aspect_ratio: videoRatio || "9:16",
      duration: 6,
      resolution: "720p",
    };

    const webhookUrl = `https://${req.headers.host}/api/grok-webhook`;
    const { request_id } = await fal.queue.submit(modelId, { input, webhookUrl });

    console.log(`[longvideo-api:clip1] Submitted. request_id=${request_id}`);
    return res.status(200).json({ requestId: request_id, modelId, status: "IN_QUEUE" });

  } catch (error) {
    console.error("[longvideo-api:clip1] Error:", error.message);
    return res.status(500).json({ error: error.message || "Clip 1 generation failed" });
  }
}

// ── ACTION: Extend clip (extend-video) ───────────────────────────────────────

async function handleExtend(req, res) {
  try {
    const { videoUrl, prompt, clipNumber } = req.body;

    if (!videoUrl) return res.status(400).json({ error: "videoUrl is required" });
    if (!prompt)   return res.status(400).json({ error: "prompt is required" });

    const modelId = "xai/grok-imagine-video/extend-video";
    const input = { video_url: videoUrl, prompt, duration: 6 };

    const webhookUrl = `https://${req.headers.host}/api/grok-webhook`;
    const { request_id } = await fal.queue.submit(modelId, { input, webhookUrl });

    console.log(`[longvideo-api:extend] clip${clipNumber || "?"} request_id=${request_id}`);
    return res.status(200).json({ requestId: request_id, modelId, status: "IN_QUEUE" });

  } catch (error) {
    console.error("[longvideo-api:extend] Error:", error.message);
    return res.status(500).json({ error: error.message || "Video extension failed" });
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function base64ToBlob(base64, mimeType) {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i);
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return new Blob(byteArrays, { type: mimeType });
}
