// generate-video-prompt.js
// Given selected storyline + product info, generates in parallel:
// 1. Image generation prompt (for Gemini first frame)
// 2. Kling animation prompt (for image-to-video — HOW to animate)
// 3. Technical config JSON

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      productDescription, productUSP, productCategory,
      selectedStoryline,   // the chosen storyline text
      salesFunnel, videoRatio, videoLength,
      videoStyle, tone, cameraMotion, lightingStyle,
      backgroundSetting, audienceEmotion, restrictions,
      hasProductImage, hasCharacterImage,
      lang = 'en',
      model = 'wan', // 'wan' | 'kling'
    } = req.body;

    const langGuide = {
      zh: 'LANGUAGE: Write entirely in Simplified Chinese (简体中文). Dialogue, voiceover, descriptions — all in Chinese.',
      bm: 'LANGUAGE: Write entirely in Bahasa Malaysia. Dialogue, voiceover, descriptions — all in Bahasa Malaysia.',
    }[lang] || 'LANGUAGE: Write in English.';

    const langInstruction = {
      zh: 'CRITICAL: Write ALL output in Simplified Chinese (简体中文). Dialogue and voiceover must be in Chinese.',
      bm: 'CRITICAL: Write ALL output in Bahasa Malaysia. Dialogue and voiceover must be in Malay.',
    }[lang] || '';

    // Reference tags per model
    const refTags = model === 'kling'
      ? {
          product:   hasProductImage ? '@Element1' : null,
          character: hasCharacterImage ? '@Element2' : null,
          frame:     null,
        }
      : {
          product:   hasProductImage ? 'Character1' : null,
          character: hasProductImage && hasCharacterImage ? 'Character2' : hasCharacterImage ? 'Character1' : null,
          frame:     hasProductImage && hasCharacterImage ? 'Character3' : (hasProductImage || hasCharacterImage) ? 'Character2' : 'Character1',
        };

    const modelName = model === 'kling' ? 'Kling 2.6 Pro' : 'Wan 2.6 R2V Flash';

    const ratioLabel = videoRatio === '9_16' ? '9:16 vertical portrait' : '16:9 horizontal landscape';
    const aspectRatio = videoRatio === '9_16' ? '9:16' : '16:9';
    const durationSec = videoLength === '5' ? '5' : '10';

    const funnelGuide = {
      upper:  'AWARENESS — relatable problem moment, soft CTA',
      middle: 'CONSIDERATION — product solving real problem, build trust',
      lower:  'CONVERSION — strong desire and urgency, direct buy CTA',
    }[salesFunnel] || 'GENERAL — showcase product attractively, clear benefit';

    // Category visual guide
    const categoryStyles = {
      tech_gadget:           { env: 'clean minimal workspace, glass surfaces, soft natural light', mood: 'clean, modern, confident', avoid: 'no cluttered backgrounds, no harsh lighting' },
      consumer_good:         { env: 'home setting, natural everyday environment', mood: 'warm, relatable, authentic', avoid: 'no overly staged setups' },
      skincare:              { env: 'bright airy bathroom, soft morning light, clean white surfaces', mood: 'soft, pure, clean — warm whites, pastel tones', avoid: 'no harsh shadows on skin' },
      vitamin_health:        { env: 'active lifestyle — gym, outdoor morning, clean kitchen', mood: 'energetic, vital, optimistic', avoid: 'no clinical aesthetics' },
      apparel:               { env: 'urban street, minimal studio, or lifestyle environment', mood: 'aspirational, confident', avoid: 'no stiff posed mannequin look' },
      sports_fitness:        { env: 'sports court, gym, outdoor track', mood: 'powerful, adrenaline, focused', avoid: 'no cartoonish motion blur' },
      food_beverage:         { env: 'clean kitchen surface, café, or dining environment', mood: 'warm, appetising — amber tones', avoid: 'no artificial food colouring glow' },
      home_living:           { env: 'beautifully styled home interior, natural light', mood: 'warm, aspirational, comfortable', avoid: 'no sterile empty rooms' },
      jewellery_accessories: { env: 'dark premium backdrop, velvet surface', mood: 'luxury, precious, timeless', avoid: 'no plastic-looking renders' },
      software_app:          { env: 'modern device in real-world context', mood: 'clean, modern, efficient', avoid: 'no fake holographic UI' },
      service:               { env: 'professional environment relevant to the service', mood: 'trustworthy, human, genuine', avoid: 'no overly corporate stock look' },
    };
    const cat = categoryStyles[productCategory] || {
      env: 'clean relevant environment matching the product', mood: 'aspirational yet authentic', avoid: 'no artificial effects',
    };

    const durationNote = durationSec === '5'
      ? '5 seconds — single continuous shot, one cinematic moment, one smooth camera move, 1 dialogue line max'
      : '10 seconds — 3 beats: Hook(0-2s) + Reveal(2-7s) + Close(7-10s), max 1 cut, 2-3 dialogue lines';

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`;

    // ── CALL 1: Image generation prompt ──────────────────────────────────
    const imagePromptSystem = `You are a visual director writing Gemini image generation prompts for product ad first frames. Write a precise, vivid single paragraph describing the perfect opening frame. This is a STILL IMAGE — describe exactly what to render. Output only the prompt, no explanation. Always write the image prompt in English regardless of language setting (image generation models work best with English prompts).`;

    const imagePromptUser = `Write a Gemini image generation prompt for the first frame of this product ad.

STORYLINE: ${selectedStoryline}
PRODUCT: ${productDescription} | USP: ${productUSP}
CATEGORY ENVIRONMENT: ${cat.env}
MOOD: ${cat.mood}
FORMAT: ${ratioLabel}
${hasProductImage ? 'PRODUCT PHOTO: Provided — include the exact product in the scene' : 'NO PRODUCT PHOTO — describe product visually'}
${hasCharacterImage ? 'CHARACTER PHOTO: Provided — include this exact character in the scene in the opening position described by the storyline' : 'NO CHARACTER PHOTO — if storyline requires a person, describe a suitable realistic character'}
${lightingStyle ? `LIGHTING: ${lightingStyle}` : ''}
${backgroundSetting ? `BACKGROUND: ${backgroundSetting}` : ''}

Write the first frame scene as a single vivid paragraph. Include subject positioning, expression, product placement, lighting, composition. End with: "Ultra-realistic, cinematic photography, high detail, ${ratioLabel}. ${cat.avoid}."`;

    // ── CALL 2: Kling animation prompt ────────────────────────────────────
    const animationSystem = `${langInstruction ? langInstruction + ' ' : ''}You are a motion director writing ${modelName} image-to-video animation prompts. The first frame is already generated — Kling animates FROM that exact frame. Write ONLY how to animate it using the Golden Template: (1) Opening motion (2) Primary action (3) Camera movement (4) Dialogue/voiceover (5) Audio mood (6) Negative constraints. Write in flowing cinematic prose. No tags. No bullet points. Real camera language only.

${langGuide}

PRODUCT INTEGRITY RULES — always include these in negative constraints:
- Product must maintain exact size, proportions and scale throughout — do not resize or distort
- Product labels, text and branding must remain clearly visible and legible
- Product colours must stay true to the reference — no colour shifts
- Product shape must not warp, stretch or deform during animation`;

    const animationUser = `Write a Kling 2.6 Pro animation prompt for this ${durationSec}s product ad.

The first frame is already generated. Describe HOW to animate it.

DURATION RULES: ${durationNote}
STORYLINE: ${selectedStoryline}
PRODUCT: ${productDescription} | USP: ${productUSP}
OBJECTIVE: ${funnelGuide}
${hasCharacterImage ? 'CHARACTER: In the first frame — animate this character naturally through the storyline' : ''}
${cameraMotion ? `CAMERA PREFERENCE: ${cameraMotion}` : ''}
${tone ? `TONE: ${tone}` : ''}
${audienceEmotion ? `EMOTION ARC: ${audienceEmotion}` : ''}
${restrictions ? `AVOID: ${restrictions}` : ''}

Golden Template to follow:
1. Opening motion — what moves first (breath, hand lift, camera begin)
2. Primary action — main interaction with product
3. Camera movement — specific cinematography term and direction
4. Dialogue/VO — natural lines woven into the scene in quotes
5. Audio mood — ambient sound + music tone described naturally
6. Negative constraints — ALWAYS end with: "No product distortion, no resizing of product, product labels remain legible throughout, no colour shifts on product, no warping or stretching of product shape." Plus any other relevant constraints.

${refTags.product ? `REFERENCE TAG FOR PRODUCT: Use "${refTags.product}" whenever you reference the product — e.g. "${refTags.product} maintains its exact appearance throughout". This tag is critical for visual consistency.` : ''}
${refTags.character ? `REFERENCE TAG FOR CHARACTER: Use "${refTags.character}" whenever you reference the person — e.g. "${refTags.character} moves naturally through the scene". This tag is critical for face consistency.` : ''}
${refTags.frame ? `REFERENCE TAG FOR FIRST FRAME SCENE: Use "${refTags.frame}" to reference the overall starting scene composition.` : ''}

Write as one flowing cinematic paragraph. The AI model already sees the first frame — only describe the animation.`;

    // ── CALL 3: Claude config JSON ────────────────────────────────────────
    const claudeConfigSystem = `You are a Kling AI technical configuration specialist. Return ONLY valid JSON. No explanation. No markdown.`;
    const claudeConfigUser = `Return optimal Kling 2.6 Pro image-to-video config.
Product: ${productDescription} | Category: ${productCategory || 'general'}
Ratio: ${aspectRatio} | Duration: ${durationSec}s (FIXED — do not change)
User settings (use if set, else best for this category):
videoStyle: ${videoStyle || 'NOT SET'} | tone: ${tone || 'NOT SET'}
cameraMotion: ${cameraMotion || 'NOT SET'} | lightingStyle: ${lightingStyle || 'NOT SET'}
backgroundSetting: ${backgroundSetting || 'NOT SET'} | audienceEmotion: ${audienceEmotion || 'NOT SET'}
Return: {"aspect_ratio":"${aspectRatio}","duration":"${durationSec}","cfg_scale":0.8,"resolved":{"videoStyle":"<v>","tone":"<v>","cameraMotion":"<v>","lightingStyle":"<v>","backgroundSetting":"<v>","audienceEmotion":"<v>","rationale":"<one sentence>"}}`;

    // ── Run all 3 in parallel ─────────────────────────────────────────────
    const [imgRes, animRes, cfgRes] = await Promise.all([
      fetch(geminiUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: imagePromptSystem }] },
          contents: [{ role: 'user', parts: [{ text: imagePromptUser }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 350 },
        }),
      }),
      fetch(geminiUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: animationSystem }] },
          contents: [{ role: 'user', parts: [{ text: animationUser }] }],
          generationConfig: { temperature: 1.0, maxOutputTokens: durationSec === '5' ? 300 : 550 },
        }),
      }),
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 400, system: claudeConfigSystem, messages: [{ role: 'user', content: claudeConfigUser }] }),
      }),
    ]);

    const [imgData, animData, cfgData] = await Promise.all([imgRes.json(), animRes.json(), cfgRes.json()]);

    const imagePrompt = imgData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    let animationPrompt = animData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    if (!imagePrompt) return res.status(500).json({ error: 'Failed to generate image prompt' });

    // Claude fallback for animation prompt
    if (!animationPrompt) {
      console.warn('Gemini animation prompt empty — falling back to Claude');
      try {
        const fb = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 600, system: animationSystem, messages: [{ role: 'user', content: animationUser }] }),
        });
        const fbData = await fb.json();
        animationPrompt = fbData.content?.find(b => b.type === 'text')?.text?.trim() || '';
      } catch (e) { console.error('Claude fallback error:', e.message); }
    }
    if (!animationPrompt) return res.status(500).json({ error: 'Failed to generate animation prompt' });

    let videoConfig = { aspect_ratio: aspectRatio, duration: durationSec, cfg_scale: 0.8, resolved: {} };
    try {
      const raw = cfgData.content?.find(b => b.type === 'text')?.text?.trim() || '{}';
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      videoConfig = { ...parsed, aspect_ratio: aspectRatio, duration: durationSec, cfg_scale: 0.8 };
    } catch (e) { console.error('Config parse error:', e.message); }

    console.log(`[generate-video-prompt] ${durationSec}s | Category: ${productCategory}`);
    res.status(200).json({ imagePrompt, animationPrompt, videoConfig });

  } catch (error) {
    console.error('generate-video-prompt error:', error);
    res.status(500).json({ error: 'Prompt generation failed', details: error.message });
  }
}
