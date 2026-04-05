// grok-generate-storylines.js
// Gemini Flash with vision — generates 5 narrative storyline ideas for Short Video (Grok) tab
// Safety-first: forbidden actions, allowed actions, scoring pass

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      mode,                // 'text' | 'image' | 'reference'
      productDescription,  // required
      productUSP,          // optional
      funnel,              // 'upper' | 'middle' | 'lower'
      images,              // array of { data: base64, mimeType } — for image/reference modes
      lang,                // 'en' | 'zh' | 'bm'
    } = req.body;

    if (!productDescription) {
      return res.status(400).json({ error: 'productDescription is required' });
    }

    const funnelGuide = {
      upper:  'AWARENESS — hook with a relatable problem, no hard sell, make viewer curious',
      middle: 'CONSIDERATION — show product solving a real problem, build trust and credibility',
      lower:  'CONVERSION — create urgency, strong desire, clear reason to buy NOW',
    }[funnel] || 'GENERAL — showcase product attractively with a clear benefit';

    const langInstruction = lang === 'zh'
      ? '\n\nIMPORTANT: Generate ALL text fields in Simplified Chinese (简体中文).'
      : lang === 'bm'
      ? '\n\nIMPORTANT: Generate ALL text fields in Bahasa Malaysia.'
      : '';

    const modeContext = mode === 'image'
      ? '\nMODE NOTE: The first frame image is fixed — the story must animate naturally FROM that exact scene. Product is already visible in the first frame.'
      : mode === 'reference'
      ? '\nMODE NOTE: Reference image(s) show the product/character — they must appear consistently throughout. Study the product\'s exact physical form from the reference and do NOT invent behaviors not visible in the image.'
      : '';

    // Detect if a character/host reference image is provided (last image in reference mode when >1 image)
    const hasCharacterImage = mode === 'reference' && images && images.length > 1;

    const systemInstruction = `You are a short-form video scriptwriter AND video generation safety planner for TikTok and Instagram Reels.

You write for Grok AI video generation (Aurora engine). Your primary constraint is NOT creativity — it is VIDEO GENERATION SAFETY. Physical glitches, product inconsistency, and object drift are the #1 failure mode. Every creative decision must be filtered through generation safety first.

GENERATION SAFETY RULES (non-negotiable — override any creative preference):
- SAME SCENE throughout — one location, one consistent environment, no cuts
- HOST STAYS STILL — seated or standing in one spot. No walking, no large body turns
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
- product setup, assembly, or installation demonstration
- product feature demo requiring physical interaction (no opening lids, pressing buttons, adjusting stands, unfolding)
- unfolding, folding, opening, or closing the product — the product appears exactly as shown in the reference image
- host absent from the CTA scene
- showing the back, side panel, or bottom of the product — always front face toward camera
- product on host's lap — always on a flat stable surface (desk, table)
- surface change between beats — product must start and end on the same surface

ALLOWED ACTIONS ONLY:
- host holds product steadily at chest level, facing camera
- host slowly lifts product from table to chest level, facing camera
- host gently tilts product less than 20 degrees toward camera
- host places product back on the same surface it started on
- host holds product with both hands if it is large or heavy
- host makes eye contact with camera while holding product still
- host gives a small confident nod
- host points gently beside product toward camera

SCENE RISK CLASSIFICATION:
- low: product on table, hand holding still, close-up, slow push-in, studio background
- medium: presenter holds product and talks, one slow reposition, one subtle camera move
- high: walking, behind-body reveal, setup demo, surface change, host absent, showing product back
Only LOW and MEDIUM risk scenes are acceptable. HIGH risk must be rewritten.

STORYTELLING FORMAT:
- Host is a STORYTELLER speaking directly to camera like a trusted friend
- First-person voice throughout ("I was so tired of...", "Then I found...", "Now I never...")
- NEVER use advertiser language: no "amazing", "incredible", "game-changer", "life-changing"
- HOST APPEARANCE: ${hasCharacterImage ? 'A character reference image has been provided (last image). You MUST base the host description on this exact person — match their gender, approximate age, and ethnicity precisely. Do NOT invent a different gender or appearance.' : 'Default to East Asian / Chinese-looking host unless the product specifically targets a different demographic.'}
- SCRIPT LINES MUST USE OUTCOME LANGUAGE, NOT PROCESS LANGUAGE — host describes result or feeling, never how the product works or sets up. Forbidden: "it connects with one cable", "just plug it in", "sets up in seconds". Allowed: "now I can actually see what I'm doing", "I get more done wherever I go".

NARRATIVE ARC for 10-second video (strict):
- Hook (0-3s): Host expresses a real relatable pain point. Product already visible in scene (on table beside host) — but not introduced yet. Product appears ready-to-use, never in packaging.
- Content (3-8s): Host picks up or gestures to product at chest level facing camera. Shows one key thing simply. No complex demonstration.
- CTA (8-10s): Host describes the after state. Product held steady or placed back on surface. Host always visible. Natural low-pressure CTA.

Return ONLY valid JSON. No explanation. No markdown.${langInstruction}`;

    const userPrompt = `Propose 5 completely different 10-second narrative product stories for Grok AI video generation.

PRODUCT: ${productDescription}
${productUSP ? `USP: ${productUSP}` : ''}
OBJECTIVE: ${funnelGuide}
DURATION: 10 seconds = Hook (0-3s) + Content (3-8s) + CTA (8-10s)${modeContext}

SAFETY-FIRST REQUIREMENT: Each storyline must be a simple commerce video designed for AI video generation controllability. Prioritize product consistency, simple motion, single product focus, stable environment, and minimal object interaction. Every proposed action must be from the ALLOWED ACTIONS list.

DIFFERENTIATION RULES — each story must differ by:
- A completely different pain point or life situation
- A different life context (e.g. travelling, at home, at work, morning routine)
- A different emotional angle (frustration, embarrassment, exhaustion, overwhelm)
- A different type of person

For each storyline also output:
- scene_risk: "low" or "medium" only
- allowed_actions: list of specific allowed actions used
- forbidden_check: true (confirm no forbidden actions present)

REFERENCE EXAMPLE (match this format):
Product: Desk organizer
hook_visual: "Host sits at tidy desk with product placed visibly beside keyboard, sighs, gestures at clutter on one side"
hook_script: "I was so sick of my desk looking like a disaster zone every single morning..."
content_visual: "Host slowly picks up organizer with both hands at chest level, tilts gently toward camera"
content_script: "Then I found this — everything just clicks into place."
cta_visual: "Host places organizer back on desk, leans back slightly, satisfied look, product fully visible"
cta_script: "Now everything has a place. If your desk looks like mine did — link in bio."

Return exactly this JSON:
{
  "storylines": [
    {
      "id": 1,
      "title": "3-5 word catchy title",
      "style": "narrative",
      "host": "gender, age range, look/energy",
      "scene": "One consistent low-risk location",
      "emotion": "Primary emotion targeted",
      "scene_risk": "low or medium",
      "allowed_actions": ["list of specific allowed actions used"],
      "forbidden_check": true,
      "hook_visual": "Product already in scene, host body language, no forbidden actions",
      "hook_script": "Exact words in Hook",
      "content_visual": "Simple allowed action at chest level facing camera",
      "content_script": "Exact words in Content — outcome language only",
      "cta_visual": "Product held steady or placed back, host always visible",
      "cta_script": "Exact words in CTA + natural low-pressure CTA"
    }
  ]
}`;

    const parts = [];

    if (images && images.length > 0) {
      images.forEach((img, idx) => {
        parts.push({ inline_data: { mime_type: img.mimeType, data: img.data } });
        if (mode === 'image') {
          parts.push({ text: 'This is the first frame image. The video will animate FROM this exact scene. Product is already visible.' });
        } else if (idx === images.length - 1 && hasCharacterImage) {
          parts.push({ text: 'This is the character reference image. You MUST describe the host in all storylines to match this exact person — same gender, approximate age, and ethnicity. Do not invent a different character.' });
        } else {
          parts.push({ text: `This is the product reference image. Study the product\'s exact physical form — its shape, whether it is one solid piece or has moving parts. All storyline actions must be physically consistent with this image. Do NOT invent product behaviors (folding, unfolding, opening) not visible in this image.` });
        }
      });
    }

    parts.push({ text: userPrompt });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts }],
          generationConfig: { temperature: 1.1, topP: 0.97, maxOutputTokens: 3500 },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error('[grok-generate-storylines] Gemini error:', JSON.stringify(data));
      return res.status(response.status).json({ error: 'Storyline generation failed', details: data });
    }

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    if (!raw) return res.status(500).json({ error: 'Empty response from Gemini' });

    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch (e) {
      console.error('[grok-generate-storylines] Parse error:', e.message);
      return res.status(500).json({ error: 'Failed to parse storylines', raw });
    }

    // ── Safety scoring pass ──────────────────────────────────────────────────
    try {
      const scores = await scoreStorylines(parsed.storylines);
      parsed.storylines = parsed.storylines.map(s => ({
        ...s,
        safety_score: scores[s.id]?.score ?? null,
        safety_note:  scores[s.id]?.note  ?? null,
      }));
    } catch (scoreErr) {
      console.warn('[grok-generate-storylines] Scoring failed (non-fatal):', scoreErr.message);
    }

    console.log(`[grok-generate-storylines] mode=${mode} funnel=${funnel} stories=${parsed.storylines?.length}`);
    return res.status(200).json(parsed);

  } catch (error) {
    console.error('[grok-generate-storylines] Exception:', error.message);
    return res.status(500).json({ error: 'Storyline generation failed', details: error.message });
  }
}

// ── Safety scoring helper ─────────────────────────────────────────────────────

async function scoreStorylines(storylines) {
  const scoringPrompt = `You are a Grok AI video generation safety expert. Score each storyline for AI video generation safety.

SCORING CRITERIA:
5 stars — fully safe: product beside host from frame 1, allowed actions only, host present all beats, same surface throughout, front face of product toward camera, outcome-based scripts
4 stars — minor risk: one slightly vague action or minor script issue, no forbidden actions
3 stars — moderate risk: one forbidden action (rotation, vague "holds up", surface change, feature/process language)
2 stars — high risk: multiple forbidden actions, or one severe issue (showing product back, product on lap, host absent in CTA)
1 star  — very high risk: multiple severe issues (unfolding, setup demo, walking, behind-body reveal)

FORBIDDEN ACTIONS (any = deduct at least 1 star):
- rotation beyond 20 degrees / showing product back or side
- unfolding, opening, assembling, setup demo
- walking, running, large body turns
- product on lap or unstable surface
- surface change between beats
- host absent from any beat
- process language in scripts
- vague hold with no direction ("holds it up" with no chest level / facing camera)

Storylines to score:
${storylines.map(s => `
ID: ${s.id}
Title: ${s.title}
Hook visual: ${s.hook_visual}
Content visual: ${s.content_visual}
Content script: "${s.content_script}"
CTA visual: ${s.cta_visual}
Scene: ${s.scene}
`).join('\n---\n')}

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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: scoringPrompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 800 },
      }),
    }
  );
  const data = await response.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  const scored = JSON.parse(raw.replace(/```json|```/g, '').trim());
  return scored.scores;
}
