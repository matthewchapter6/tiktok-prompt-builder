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
      characterImage,
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

    const systemInstruction = `You are a short-form video scriptwriter AND video generation safety planner for TikTok and Instagram Reels.

You write for Grok AI video generation (Aurora engine). Your primary constraint is NOT creativity — it is VIDEO GENERATION SAFETY. Physical glitches, product inconsistency, and object drift are the #1 failure mode. Every creative decision must be filtered through generation safety first.

GENERATION SAFETY RULES (non-negotiable — override any creative preference):
- SAME SCENE throughout all 3 acts — one location, one consistent environment, no cuts
- HOST STAYS STILL — seated or standing in one spot. Only allowed: slow lift of product, gentle tilt toward camera, place on surface, small nod
- PRODUCT IS ALWAYS VISIBLE — never hidden behind body, never off-screen, never emerging from nowhere
- ONE PRODUCT ONLY — no duplicates, no new props appearing mid-scene
- NO COMPLEX INTERACTION — no opening packages, no pouring liquids, no tearing, no biting

FORBIDDEN ACTIONS (auto-reject any scene containing these):
- throwing, tossing, catching
- fast movement, dramatic movement, spinning, dancing, jumping, running
- walking while holding product
- revealing product from behind the back or body
- product flying, floating, or appearing mid-air
- liquid pouring, splashing, or dripping
- product morphing, resizing, or changing appearance
- multiple objects colliding
- complex hand gestures or finger articulation
- large body turns (more than 30 degrees)
- transitions between locations
- product rotation beyond 20 degrees
- wide arm gestures or sweeping hand movements
- product setup, assembly, or installation demonstration (no plugging in cables, connecting parts, unboxing, or configuring)
- product feature demo requiring physical interaction (no opening lids, pressing buttons, adjusting stands, unfolding)
- unfolding, folding, opening, or closing the product — the product appears exactly as shown in the reference image, already in its ready-to-use state. Do NOT invent foldable or openable behaviors unless they are clearly visible in the product reference image.
- host absent from the CTA scene — host must always be visible holding or beside the product in every act

ALLOWED ACTIONS ONLY:
- host holds product steadily at chest level, facing camera — always specify "chest level, facing camera"
- host slowly lifts product from table to chest level, facing camera
- host gently tilts product less than 20 degrees toward camera
- host places product back on the same surface it started on
- host holds product with both hands if it is large or heavy
- host makes eye contact with camera while holding product still
- host gives a small confident nod
- host points gently beside product toward camera

SURFACE CONSISTENCY RULE — critical:
- The product must start and end on the SAME surface in every act (e.g. if it starts on the desk, it must return to the desk — never move it to a different table, shelf, or surface between clips)
- Never describe the product on the host's lap — always on a flat stable surface (desk, table)

PRODUCT ORIENTATION RULE:
- Always show the FRONT FACE of the product toward camera — never show the back, side panel, or bottom
- "Showing the slim profile" is allowed only as a very slight tilt — never a full side-on view

SCENE RISK CLASSIFICATION — you must assign each scene a risk level:
- low: product on table, hand holding still, close-up, slow push-in, studio background
- medium: presenter holds product and talks, one slow reposition, one subtle camera move
- high: walking, product moving behind body, multiple props, opening/tearing/pouring, complex body movement, product setup or demo, host absent from frame
Only LOW and MEDIUM risk scenes are acceptable. HIGH risk scenes must be rewritten to LOW or MEDIUM before output.

STORYTELLING FORMAT:
- Host is a STORYTELLER speaking directly to camera like a trusted friend
- First-person voice throughout ("I was so tired of...", "Then I found...", "Now I never...")
- NEVER use advertiser language: no "amazing", "incredible", "game-changer", "life-changing"
- HOST APPEARANCE: ${characterImage ? 'A character reference image has been provided (see image). You MUST base the host description on this exact person — match their gender, approximate age, and ethnicity precisely. Set the host field to describe this specific person (e.g. "Young East Asian woman, approximately 25, as per uploaded character reference"). Do NOT invent a different gender or appearance.' : "Default to East Asian / Chinese-looking host unless the product specifically targets a different demographic."}
- SCRIPT LINES MUST USE OUTCOME LANGUAGE, NOT PROCESS LANGUAGE — the host describes the result or feeling, never how the product works or sets up. Forbidden in scripts: "it connects with one cable", "just plug it in", "sets up in seconds", "one cable and you're done", "easy to connect", "connects up easily". Allowed instead: "now I have double the screen space", "I can actually see what I'm doing", "I get more done wherever I go".

NARRATIVE ARC:
- Act 1 Hook (0-6s): Host expresses a real relatable pain point. Product is already visible in scene (on table beside host, in hand, on shelf) — but host has not introduced it yet. Product appears ready-to-use, never in a box or packaging.
- Act 2 Content (6-12s): Host picks up or gestures to product. Shows one key thing simply. No complex demonstration. No unboxing, no setup.
- Act 3 CTA (12-18s): Host describes the after state. Product held steady or placed on surface. Host always visible. Ends with natural low-pressure CTA.

Return ONLY valid JSON. No explanation. No markdown.${langInstruction}`;

    const userPrompt = `Propose 5 completely different 18-second narrative product stories for Grok AI video generation.

PRODUCT: ${productDescription}
${productUSP ? `USP: ${productUSP}` : ""}
${shapeContext}
OBJECTIVE: ${funnelGuide}

SAFETY-FIRST REQUIREMENT: Each storyline must be a simple 3-shot commerce video designed for AI video generation controllability. Prioritize product consistency, simple motion, single product focus, stable environment, and minimal object interaction. Every proposed action must be from the ALLOWED ACTIONS list.

DIFFERENTIATION RULES — each story must differ by:
- A completely different pain point or life situation
- A different life context (e.g. travelling, at home, at work, morning routine)
- A different emotional angle (frustration, embarrassment, exhaustion, overwhelm)
- A different type of person

For each storyline, also output:
- scene_risk: "low" or "medium" only (never high)
- allowed_actions: list of specific actions used from the allowed list
- forbidden_check: confirm none of the forbidden actions are present (true/false)

REFERENCE EXAMPLE (match this format exactly):
Product: Desk organizer
hook_visual: "Host sits at tidy desk with product placed visibly beside keyboard, sighs, gestures at clutter on one side"
hook_script: "I was so sick of my desk looking like a disaster zone every single morning..."
content_visual: "Host slowly picks up organizer with both hands, tilts it gently toward camera"
content_script: "Then I found this — everything just clicks into place. Took me five minutes to set up."
cta_visual: "Host places organizer back on desk, leans back slightly, satisfied look, product fully visible"
cta_script: "Now everything has a place. If your desk looks like mine did — link in bio."

Return exactly this JSON:
{
  "storylines": [
    {
      "id": 1,
      "title": "3-5 word catchy title",
      "style": "narrative",
      "host": "gender, age range, look/energy that fits this specific pain point and person",
      "scene": "One consistent low-risk location used across all 3 acts",
      "emotion": "Primary emotion targeted",
      "scene_risk": "low or medium",
      "allowed_actions": ["list of specific allowed actions used"],
      "forbidden_check": true,
      "hook_visual": "What is physically visible — product already in scene, host body language (no forbidden actions)",
      "hook_script": "Exact words the host says in Act 1",
      "content_visual": "Simple allowed action with product in Act 2",
      "content_script": "Exact words in Act 2",
      "cta_visual": "Final visual — product held steady or on surface, host satisfied",
      "cta_script": "Exact words in Act 3 + natural CTA"
    }
  ]
}`;

    const parts = [];
    if (productImage?.data) {
      parts.push({ inline_data: { mime_type: productImage.mimeType || "image/jpeg", data: productImage.data } });
      parts.push({ text: "This is the product reference image. Study the product's exact physical form — its shape, whether it is one solid piece or has moving parts, its proportions and size. All storyline actions must be physically consistent with what you see in this image. Do NOT invent product behaviors (folding, unfolding, opening, detaching) that are not visible in this image." });
    }
    if (characterImage?.data) {
      parts.push({ inline_data: { mime_type: characterImage.mimeType || "image/jpeg", data: characterImage.data } });
      parts.push({ text: "This is the character reference image. You MUST describe the host in all storylines to match this exact person — same gender, approximate age, and ethnicity. Do not invent a different character." });
    }
    parts.push({ text: userPrompt });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GOOGLE_API_KEY}`,
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

    // ── Safety scoring pass ──────────────────────────────────────────────────
    try {
      const scores = await scoreStorylines(parsed.storylines);
      parsed.storylines = parsed.storylines.map(s => ({
        ...s,
        safety_score: scores[s.id]?.score ?? null,
        safety_note:  scores[s.id]?.note  ?? null,
      }));
    } catch (scoreErr) {
      console.warn("[longvideo-api:storylines] Scoring failed (non-fatal):", scoreErr.message);
    }

    console.log(`[longvideo-api:storylines] funnel=${funnel} stories=${parsed.storylines?.length}`);
    return res.status(200).json(parsed);

  } catch (error) {
    console.error("[longvideo-api:storylines] Exception:", error.message);
    return res.status(500).json({ error: "Storyline generation failed", details: error.message });
  }
}

// ── Safety scoring helper ─────────────────────────────────────────────────────

async function scoreStorylines(storylines) {
  const scoringPrompt = `You are a Grok AI video generation safety expert. Score each storyline for AI video generation safety.

SCORING CRITERIA (deduct stars for each issue found):
5 stars — fully safe: product beside host from frame 1, allowed actions only, host present all 3 acts, same surface throughout, front face of product always toward camera, outcome-based scripts
4 stars — minor risk: one slightly vague action description, or minor script issue, but no forbidden actions
3 stars — moderate risk: one forbidden action present (rotation, vague "holds up", surface change, feature/process language in script)
2 stars — high risk: multiple forbidden actions, or one severe issue (showing product back, product on lap, host absent in CTA, scene location change)
1 star  — very high risk: multiple severe issues, or actions that will almost certainly cause physics glitches (unfolding, setup demo, walking, behind-body reveal)

FORBIDDEN ACTIONS (any of these = deduct at least 1 star):
- rotation beyond 20 degrees / showing product back or side
- unfolding, opening, assembling, setup demo
- walking, running, large body turns
- product on lap or unstable surface
- surface change between acts
- host absent from any act
- process language in scripts ("connects with", "sets up", "plugs in")
- vague hold description ("holds it up" with no direction specified)

Storylines to score:
${storylines.map(s => `
ID: ${s.id}
Title: ${s.title}
Hook visual: ${s.hook_visual}
Content visual: ${s.content_visual}
Content script: "${s.content_script}"
CTA visual: ${s.cta_visual}
Scene: ${s.scene}
`).join("\n---\n")}

Return ONLY valid JSON, no markdown:
{
  "scores": {
    "1": { "score": 5, "note": "one-line reason" },
    "2": { "score": 4, "note": "one-line reason" },
    "3": { "score": 3, "note": "one-line reason" },
    "4": { "score": 2, "note": "one-line reason" },
    "5": { "score": 1, "note": "one-line reason" }
  }
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GOOGLE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: scoringPrompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 800 },
      }),
    }
  );
  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
  const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
  return parsed.scores;
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
- Clip 2 (extend-video, 6s): Grok INHERITS the full scene, host, lighting, and style from Clip 1. Only the new host action + product lock is needed.
- Clip 3 (extend-video, 6s): Same — Grok inherits everything. Only the CTA action + product lock is needed.

REFERENCE IMAGES PROVIDED:
- ${allImageRefs}

HOST DEFAULT: East Asian / Chinese-looking host unless the storyline specifies otherwise.

═══════════════════════════════════════════
ALWAYS-ON GUARDRAILS — inject into ALL 3 prompts automatically, every time:
═══════════════════════════════════════════

PRODUCT LOCK (repeat in every prompt):
- One product only — same exact product as ${productTags}
- Same shape, same color, same finish, same size as reference image
- Product remains solid and fully opaque — no transparency, no ghosting
- Product stays proportional to the hand, table, or body at all times
- No duplicate product
- Product must always appear READY-TO-USE — never in a box, never in packaging, never wrapped. It sits on the desk or table as an already-owned item from frame 1.

PHYSICS LOCK (repeat in every prompt):
- No morphing, no deformation, no transparency
- No sudden appearance or disappearance of objects
- No object penetration (product does not pass through hands or body)
- No floating — product rests on surfaces or is gripped by hand
- No scale drift between clips
- One person only — no duplicate or secondary person in frame
- When host holds product: one hand visible only, five fingers fully visible and natural, no warped or fused fingers

MOTION LOCK — only these actions are permitted:
- Host holds product steadily at chest or waist level
- Host slowly lifts product from surface to camera level
- Host gently tilts product less than 20 degrees toward camera
- Host places product on table
- Host gives a small confident nod
- Host points gently beside product
NEVER include: throwing, fast movement, spinning, walking, behind-body reveal, product flying, liquid pouring, large body turns

SCENE LOCK (repeat in every prompt):
- Same background, same lighting, same environment, same host clothing
- No extra props appearing that were not in Clip 1
- Camera stays at consistent height and distance

═══════════════════════════════════════════
PROMPT 1 RULES (reference-to-video, 80–150 words, one paragraph):
═══════════════════════════════════════════
Framework order: [Host + Opening Action] → [Location/Scene] → [Camera] → [Lighting] → [Host Narration + Audio] → [Product Lock Statement] → [Negative Constraints]

1. FRONT-LOAD: First sentence = host description + primary action.${characterTag ? ` Always write "${characterTag}" inline when first describing the host — e.g. "A young East Asian woman (${characterTag}) sits at..."` : ""}
2. PRODUCT MUST BE IN FRAME FROM FRAME 1: Write the product image tags ${productTags} inline in the prompt when first describing the product position — e.g. "the portable monitor (${productTags}) sits on the desk beside the host". Do NOT describe the product in plain text only — the tags MUST appear in the sentence so Grok links the uploaded images as the visual anchor. This anchors product appearance so Clips 2 and 3 inherit it correctly.
3. PRECISE LANGUAGE: No vague words like "cinematic" or "dynamic" — be specific: "soft top-light with warm rim", "locked-off shot at chest height".
4. HOST NARRATION: Format as: Host says in a natural conversational tone: "[exact hook_script text]"
5. BACKGROUND AUDIO: Soft background music genre + one ambient sound. Keep subtle.
6. PRODUCT LOCK STATEMENT (second-to-last sentence): "Keep the host's face${characterTag ? ` (${characterTag})` : ""}, outfit, and ${productTags} — same shape, color, finish, and size — consistent and unchanged throughout."
7. NEGATIVE CONSTRAINTS (always last): "No text overlays, no scene cuts, no warped or fused fingers, no warped faces, no duplicate person, no phantom second hand, no new objects, product maintains exact size and proportions, no transparency."

PHYSICAL REALISM RULES:
- GRIP: Large or heavy product = host uses BOTH hands
- WEIGHT: Describe weight cues — "holds bottle firmly", "lifts box with slight effort"
- PRODUCT INTERIOR: If bottle/box/container — describe contents; never show empty interior
- NO MAGIC PROPS: All objects must exist from frame 1

═══════════════════════════════════════════
PROMPTS 2 & 3 RULES (extend-video — strict):
═══════════════════════════════════════════
- 50–80 words. Three sentences max.
- Sentence 1: "Continue the scene exactly:"
- Sentence 2: Host says: "[exact script text]" + brief simple visual action (allowed actions only)
- Sentence 3 (PRODUCT LOCK — mandatory in every extension): "Maintain exact continuity: same host face, same outfit, same background, same lighting — ${productTags} must remain identical in shape, color, finish, size, and opacity. One person only, one hand visible, five fingers natural. No drift, no morphing, no new objects."
- For Prompt 3 only: you MUST describe the physical transition from Clip 2's ending state to Clip 3's state. If Clip 2 ended with the host holding the product, Clip 3 MUST start with the host gently placing the product back on the surface FIRST — then the CTA gesture. Never skip the placing action and jump straight to "product on table" — Grok will hallucinate a duplicate product materializing on the table while the host is still holding the original. Correct format: "Host gently places ${productTags} back on the desk, then gives a confident nod toward camera." Wrong format: "Monitor visible on table, host nods" — this causes the magic appearance glitch.`;

    const userPrompt = `Write 3 Grok video prompts for this 18-second product marketing chain.

PRODUCT: ${productDescription}
${productUSP ? `USP: ${productUSP}` : ""}
${shapeContext}
FUNNEL: ${funnelGuide}
RATIO: ${ratioLabel}
HOST: ${storyline.host || "decide based on product and funnel"}
SCENE: ${storyline.scene || "Clean, product-appropriate environment"}
SCENE RISK: ${storyline.scene_risk || "low"}

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
Order: Host+Action → Scene → Camera → Lighting → Host Narration (use hook_script exactly) + Background Audio → Product Lock Statement → Negative Constraints
CRITICAL — IMAGE TAGS MUST APPEAR INLINE IN THE PROMPT TEXT:
- Write ${productTags} directly in the sentence describing the product — e.g. "the portable monitor (${productTags}) sits on the desk". Never describe the product without the tags.${characterTag ? `\n- Write ${characterTag} directly in the sentence describing the host — e.g. "A young East Asian woman (${characterTag}) sits at her desk". Never describe the host without the tag.` : ""}
- These tags are how Grok links your uploaded images — missing tags = Grok hallucinates the product and host appearance.
DIMENSIONS: If product shape and dimensions are provided, include them explicitly — e.g. "the monitor (${productTags}) measures approximately [H]cm × [W]cm × [D]cm, [shape]-shaped".

PROMPT 2 — extend-video (6s Content), 50–80 words:
"Continue the scene exactly:" + Host says: "[exact content_script text]" + one simple allowed action with product + mandatory Product Lock sentence.

PROMPT 3 — extend-video (6s CTA), 50–80 words:
"Continue the scene exactly:" + Host says: "[exact cta_script text]" + CTA gesture (holds product toward camera, confident nod) + mandatory Product Lock sentence.

Return exactly this JSON (no markdown, no extra keys):
{
  "prompt1": "...",
  "prompt2": "...",
  "prompt3": "..."
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GOOGLE_API_KEY}`,
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

    // ── Prompt safety linter: rewrite risky phrases before sending to Grok ──
    const lintWarnings = [];
    parsed.prompt1 = lintPrompt(parsed.prompt1, lintWarnings);
    parsed.prompt2 = lintPrompt(parsed.prompt2, lintWarnings);
    parsed.prompt3 = lintPrompt(parsed.prompt3, lintWarnings);
    if (lintWarnings.length) console.warn(`[longvideo-api:prompts] Safety linter rewrote ${lintWarnings.length} phrase(s):`, lintWarnings);

    console.log(`[longvideo-api:prompts] funnel=${funnel} ratio=${videoRatio} title="${storyline.title}"`);
    return res.status(200).json({ ...parsed, _lintWarnings: lintWarnings.length ? lintWarnings : undefined });

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

// ── Prompt Safety Linter ─────────────────────────────────────────────────────

const RISKY_PHRASES = [
  [/\bfast(?:ly)?\s+(?:mov(?:es?|ing)|motion|action|pan|zoom|cut)\b/gi,         "controlled smooth movement"],
  [/\bdramatic\s+(?:mov(?:es?|ing)|motion|action|reveal|turn)\b/gi,             "gentle controlled movement"],
  [/\bdynamic\s+(?:mov(?:es?|ing)|motion|action|energy|shot)\b/gi,              "steady controlled shot"],
  [/\bcinematic\s+(?:mov(?:es?|ing)|motion|action|energy)\b/gi,                 "steady locked-off shot"],
  [/\bspinn?(?:ing|s|ed)?\b/gi,                                                  "gently tilting less than 20 degrees"],
  [/\bdanc(?:ing|es?|ed)\b/gi,                                                   "standing still"],
  [/\bjump(?:ing|s|ed)?\b/gi,                                                    "standing still"],
  [/\brunn?(?:ing|s|ed)?\b/gi,                                                   "standing still"],
  [/\bwalk(?:ing|s|ed)?\s+(?:while|with|toward|forward)\b/gi,                   "standing still while holding product"],
  [/\bthrow(?:ing|s|n|ew)?\b/gi,                                                 "slowly lifting"],
  [/\btoss(?:ing|es|ed)?\b/gi,                                                   "gently placing"],
  [/\bcatch(?:ing|es|ed)?\b/gi,                                                  "holding steadily"],
  [/\bfli(?:p|ps|pping|pped)\b/gi,                                               "gently tilting"],
  [/\bspray(?:ing|s|ed)?\b/gi,                                                   "holding product steadily"],
  [/\bpour(?:ing|s|ed)?\b/gi,                                                    "holding product steadily"],
  [/\bsplash(?:ing|es|ed)?\b/gi,                                                 "holding product steadily"],
  [/\btear(?:ing|s)?\s+(?:open|apart|package)\b/gi,                             "holding package steadily"],
  [/\bopen(?:ing|s|ed)?\s+(?:the\s+)?(?:package|box|bottle|lid|cap)\b/gi,       "holding product with packaging intact"],
  [/\bbite?(?:s|ing|ten)?\b/gi,                                                  "holding product near face"],
  [/\bexplod(?:ing|es?|ed)?\b/gi,                                                "steady held shot"],
  [/\bmagically\b/gi,                                                             "smoothly"],
  [/\bsuddenly\b/gi,                                                              "smoothly"],
  [/\bappears?\s+(?:from\s+)?(?:nowhere|behind|thin\s+air)\b/gi,                "is already visible in scene"],
  [/\bbehind\s+(?:the\s+)?(?:back|body)\b/gi,                                    "at chest level"],
  [/\bflyies?\s+(?:through|across|into)\b/gi,                                    "is held steadily"],
  [/\bfloating?\b/gi,                                                             "held steadily by hand"],
  [/(?<!no\s)(?<!no,\s)\bmorphing?\b/gi,                                         "remaining unchanged"],
  [/(?<!no\s)(?<!no,\s)\bdeform(?:ing|s|ed)?\b/gi,                              "remaining solid and unchanged"],
  [/\bplug(?:ging|s|ged)?\s+in\b/gi,                                             "holding product steadily"],
  [/\bconnect(?:ing|s|ed)?\s+(?:the\s+)?cable\b/gi,                             "holding product steadily"],
  [/\bset(?:ting)?\s+up\b/gi,                                                    "holding product toward camera"],
  [/\bunbox(?:ing|es|ed)?\b/gi,                                                  "holding product steadily"],
  [/\bunfold(?:ing|s|ed)?\b/gi,                                                  "holding product steadily"],
  [/\badjust(?:ing|s|ed)?\s+(?:the\s+)?(?:stand|angle|screen|monitor)\b/gi,     "holding product steadily"],
  [/\bpress(?:ing|es|ed)?\s+(?:the\s+)?button\b/gi,                             "pointing gently beside product"],
  [/\bopen(?:ing|s|ed)?\s+(?:the\s+)?(?:lid|box|flap|cover)\b/gi,              "holding product with packaging intact"],
  [/\brotate?(?:s|ing|d)?\b/gi,                                                  "gently tilting less than 20 degrees"],
  [/\bswing(?:ing|s)?\b/gi,                                                      "gently tilting"],
  [/\bswing(?:ing|s)?\s+arm\b/gi,                                               "pointing gently beside product"],
  [/\bgestures?\s+(?:widely|broadly|dramatically|at the chaos|around)\b/gi,     "points gently beside product"],
  [/\bconnects?\s+(?:up\s+)?(?:easily|simply|quickly|with\s+one\s+cable|in\s+seconds)\b/gi, "works wherever I go"],
  [/\bjust\s+(?:plug|one\s+cable|connect)\b/gi,                                 "works wherever I go"],
  [/\bsets?\s+up\s+in\s+(?:seconds|minutes|one\s+minute|no\s+time)\b/gi,       "ready when I need it"],
  [/\beasy\s+to\s+(?:connect|set\s+up|plug\s+in|install)\b/gi,                 "works wherever I go"],
];

function lintPrompt(prompt, warnings = []) {
  let result = prompt;
  for (const [pattern, replacement] of RISKY_PHRASES) {
    const before = result;
    result = result.replace(pattern, replacement);
    if (result !== before) {
      warnings.push({ pattern: pattern.source, replacement });
    }
  }
  return result;
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
