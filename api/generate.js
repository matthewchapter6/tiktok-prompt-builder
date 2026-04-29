// api/generate.js
// Merged: generate-storylines + generate-video-prompt
// POST { type: 'storylines', ... } → generate 5 storyline proposals
// POST { type: 'prompt', ... }     → generate image prompt + animation prompt + video config

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type } = req.body;

  // ── STORYLINES ────────────────────────────────────────────────────────────
  if (type === 'storylines') {
    try {
      const { productDescription, productUSP, productCategory, salesFunnel, videoLength, hasProductImage, hasCharacterImage } = req.body;
      const durationSec = videoLength === '5' ? '5' : '10';
      const funnelGuide = {
        upper:  'AWARENESS — hook with a relatable problem, no hard sell',
        middle: 'CONSIDERATION — show product solving a real problem, build trust',
        lower:  'CONVERSION — strong desire and urgency, clear buy CTA',
      }[salesFunnel] || 'GENERAL — showcase product attractively with clear benefit';

      const systemInstruction = `You are a senior TikTok content creator and video director with 10 years of experience creating viral product ads. You specialise in short-form video storytelling that stops the scroll and drives conversions.

Your job is to propose 5 completely different, creative storyline concepts for a ${durationSec}-second product video ad. Each storyline must feel totally different from the others — different emotions, different scenes, different hooks, different characters.

Return ONLY valid JSON. No explanation. No markdown. No preamble.`;

      const userPrompt = `Propose 5 completely different storyline concepts for this product video ad.

PRODUCT: ${productDescription}
USP: ${productUSP}
CATEGORY: ${productCategory || 'general'}
DURATION: ${durationSec} seconds
OBJECTIVE: ${funnelGuide}
HAS PRODUCT PHOTO: ${hasProductImage ? 'YES' : 'NO'}
HAS CHARACTER PHOTO: ${hasCharacterImage ? 'YES — this specific character must appear in the video' : 'NO — Gemini decides if/what character to use'}

RULES FOR THE 5 STORYLINES:
- Each must have a completely different emotional hook (curiosity, desire, fear of missing out, aspiration, humour, relatability, shock, etc.)
- Each must suggest a different scene/environment
- Each must feel like a different type of ad (lifestyle, demonstration, testimonial, cinematic, UGC, etc.)
- Keep each description SHORT — 2-3 sentences max
- Make each feel specific and vivid, not generic
- Tailor each to the ${durationSec}s duration — short and punchy for 5s, narrative arc for 10s

Return this exact JSON structure:
{
  "storylines": [
    {
      "id": 1,
      "title": "Short catchy title (3-5 words)",
      "description": "2-3 sentence description of what happens in the video. What does the viewer see? What emotion does it create? What is the hook?",
      "hook": "The opening line or visual hook (1 sentence)",
      "emotion": "Primary emotion this targets (e.g. desire, relatability, urgency)"
    },
    ... (5 total)
  ]
}`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
        {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemInstruction }] },
            contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
            generationConfig: { temperature: 1.2, topP: 0.97, maxOutputTokens: 1200 },
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) return res.status(response.status).json({ error: 'Storyline generation failed', details: data });

      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      if (!raw) return res.status(500).json({ error: 'Empty response from Gemini' });

      let parsed;
      try { parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()); }
      catch (e) { return res.status(500).json({ error: 'Failed to parse storylines', raw }); }

      return res.status(200).json(parsed);
    } catch (error) {
      return res.status(500).json({ error: 'Storyline generation failed', details: error.message });
    }
  }

  // ── PROMPT ────────────────────────────────────────────────────────────────
  if (type === 'prompt') {
    try {
      const {
        productDescription, productUSP, productCategory,
        selectedStoryline, salesFunnel, videoRatio, videoLength,
        videoStyle, tone, cameraMotion, lightingStyle,
        backgroundSetting, audienceEmotion, restrictions,
        hasProductImage, hasCharacterImage,
        lang = 'en', model = 'wan',
      } = req.body;

      const langGuide = { zh: 'LANGUAGE: Write entirely in Simplified Chinese (简体中文). Dialogue, voiceover, descriptions — all in Chinese.', bm: 'LANGUAGE: Write entirely in Bahasa Malaysia. Dialogue, voiceover, descriptions — all in Bahasa Malaysia.' }[lang] || 'LANGUAGE: Write in English.';
      const langInstruction = { zh: 'CRITICAL: Write ALL output in Simplified Chinese (简体中文). Dialogue and voiceover must be in Chinese.', bm: 'CRITICAL: Write ALL output in Bahasa Malaysia. Dialogue and voiceover must be in Malay.' }[lang] || '';

      const refTags = model === 'kling'
        ? { product: hasProductImage ? '@Element1' : null, character: hasCharacterImage ? '@Element2' : null, frame: null }
        : { product: hasProductImage ? 'Character1' : null, character: hasProductImage && hasCharacterImage ? 'Character2' : hasCharacterImage ? 'Character1' : null, frame: hasProductImage && hasCharacterImage ? 'Character3' : (hasProductImage || hasCharacterImage) ? 'Character2' : 'Character1' };

      const modelName = model === 'kling' ? 'Kling 2.6 Pro' : 'Wan 2.6 R2V Flash';
      const ratioLabel = videoRatio === '9_16' ? '9:16 vertical portrait' : '16:9 horizontal landscape';
      const aspectRatio = videoRatio === '9_16' ? '9:16' : '16:9';
      const durationSec = videoLength === '5' ? '5' : '10';

      const funnelGuide = { upper: 'AWARENESS — relatable problem moment, soft CTA', middle: 'CONSIDERATION — product solving real problem, build trust', lower: 'CONVERSION — strong desire and urgency, direct buy CTA' }[salesFunnel] || 'GENERAL — showcase product attractively, clear benefit';

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
      const cat = categoryStyles[productCategory] || { env: 'clean relevant environment matching the product', mood: 'aspirational yet authentic', avoid: 'no artificial effects' };
      const durationNote = durationSec === '5' ? '5 seconds — single continuous shot, one cinematic moment, one smooth camera move, 1 dialogue line max' : '10 seconds — 3 beats: Hook(0-2s) + Reveal(2-7s) + Close(7-10s), max 1 cut, 2-3 dialogue lines';

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`;

      const imagePromptSystem = `You are a visual director writing Gemini image generation prompts for product ad first frames. Write a precise, vivid single paragraph describing the perfect opening frame. This is a STILL IMAGE — describe exactly what to render. Output only the prompt, no explanation. Always write the image prompt in English regardless of language setting (image generation models work best with English prompts).`;
      const imagePromptUser = `Write a Gemini image generation prompt for the first frame of this product ad.\n\nSTORYLINE: ${selectedStoryline}\nPRODUCT: ${productDescription} | USP: ${productUSP}\nCATEGORY ENVIRONMENT: ${cat.env}\nMOOD: ${cat.mood}\nFORMAT: ${ratioLabel}\n${hasProductImage ? 'PRODUCT PHOTO: Provided — include the exact product in the scene' : 'NO PRODUCT PHOTO — describe product visually'}\n${hasCharacterImage ? 'CHARACTER PHOTO: Provided — include this exact character in the scene in the opening position described by the storyline' : 'NO CHARACTER PHOTO — if storyline requires a person, describe a suitable realistic character'}\n${lightingStyle ? `LIGHTING: ${lightingStyle}` : ''}\n${backgroundSetting ? `BACKGROUND: ${backgroundSetting}` : ''}\n\nWrite the first frame scene as a single vivid paragraph. Include subject positioning, expression, product placement, lighting, composition. End with: "Ultra-realistic, cinematic photography, high detail, ${ratioLabel}. ${cat.avoid}."`;

      const animationSystem = `${langInstruction ? langInstruction + ' ' : ''}You are a motion director writing ${modelName} image-to-video animation prompts. The first frame is already generated — Kling animates FROM that exact frame. Write ONLY how to animate it using the Golden Template: (1) Opening motion (2) Primary action (3) Camera movement (4) Dialogue/voiceover (5) Audio mood (6) Negative constraints. Write in flowing cinematic prose. No tags. No bullet points. Real camera language only.\n\n${langGuide}\n\nPRODUCT INTEGRITY RULES — always include these in negative constraints:\n- Product must maintain exact size, proportions and scale throughout — do not resize or distort\n- Product labels, text and branding must remain clearly visible and legible\n- Product colours must stay true to the reference — no colour shifts\n- Product shape must not warp, stretch or deform during animation`;
      const animationUser = `Write a Kling 2.6 Pro animation prompt for this ${durationSec}s product ad.\n\nThe first frame is already generated. Describe HOW to animate it.\n\nDURATION RULES: ${durationNote}\nSTORYLINE: ${selectedStoryline}\nPRODUCT: ${productDescription} | USP: ${productUSP}\nOBJECTIVE: ${funnelGuide}\n${hasCharacterImage ? 'CHARACTER: In the first frame — animate this character naturally through the storyline' : ''}\n${cameraMotion ? `CAMERA PREFERENCE: ${cameraMotion}` : ''}\n${tone ? `TONE: ${tone}` : ''}\n${audienceEmotion ? `EMOTION ARC: ${audienceEmotion}` : ''}\n${restrictions ? `AVOID: ${restrictions}` : ''}\n\nGolden Template to follow:\n1. Opening motion — what moves first (breath, hand lift, camera begin)\n2. Primary action — main interaction with product\n3. Camera movement — specific cinematography term and direction\n4. Dialogue/VO — natural lines woven into the scene in quotes\n5. Audio mood — ambient sound + music tone described naturally\n6. Negative constraints — ALWAYS end with: "No product distortion, no resizing of product, product labels remain legible throughout, no colour shifts on product, no warping or stretching of product shape." Plus any other relevant constraints.\n\n${refTags.product ? `REFERENCE TAG FOR PRODUCT: Use "${refTags.product}" whenever you reference the product.` : ''}\n${refTags.character ? `REFERENCE TAG FOR CHARACTER: Use "${refTags.character}" whenever you reference the person.` : ''}\n${refTags.frame ? `REFERENCE TAG FOR FIRST FRAME SCENE: Use "${refTags.frame}" to reference the overall starting scene composition.` : ''}\n\nWrite as one flowing cinematic paragraph.`;

      const claudeConfigSystem = `You are a Kling AI technical configuration specialist. Return ONLY valid JSON. No explanation. No markdown.`;
      const claudeConfigUser = `Return optimal Kling 2.6 Pro image-to-video config.\nProduct: ${productDescription} | Category: ${productCategory || 'general'}\nRatio: ${aspectRatio} | Duration: ${durationSec}s (FIXED — do not change)\nUser settings (use if set, else best for this category):\nvideoStyle: ${videoStyle || 'NOT SET'} | tone: ${tone || 'NOT SET'}\ncameraMotion: ${cameraMotion || 'NOT SET'} | lightingStyle: ${lightingStyle || 'NOT SET'}\nbackgroundSetting: ${backgroundSetting || 'NOT SET'} | audienceEmotion: ${audienceEmotion || 'NOT SET'}\nReturn: {"aspect_ratio":"${aspectRatio}","duration":"${durationSec}","cfg_scale":0.8,"resolved":{"videoStyle":"<v>","tone":"<v>","cameraMotion":"<v>","lightingStyle":"<v>","backgroundSetting":"<v>","audienceEmotion":"<v>","rationale":"<one sentence>"}}`;

      const [imgRes, animRes, cfgRes] = await Promise.all([
        fetch(geminiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ system_instruction: { parts: [{ text: imagePromptSystem }] }, contents: [{ role: 'user', parts: [{ text: imagePromptUser }] }], generationConfig: { temperature: 0.9, maxOutputTokens: 350 } }) }),
        fetch(geminiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ system_instruction: { parts: [{ text: animationSystem }] }, contents: [{ role: 'user', parts: [{ text: animationUser }] }], generationConfig: { temperature: 1.0, maxOutputTokens: durationSec === '5' ? 300 : 550 } }) }),
        fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 400, system: claudeConfigSystem, messages: [{ role: 'user', content: claudeConfigUser }] }) }),
      ]);

      const [imgData, animData, cfgData] = await Promise.all([imgRes.json(), animRes.json(), cfgRes.json()]);
      const imagePrompt = imgData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      let animationPrompt = animData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

      if (!imagePrompt) return res.status(500).json({ error: 'Failed to generate image prompt' });

      if (!animationPrompt) {
        try {
          const fb = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: 'claude-sonnet-4-5', max_tokens: 600, system: animationSystem, messages: [{ role: 'user', content: animationUser }] }) });
          animationPrompt = (await fb.json()).content?.find(b => b.type === 'text')?.text?.trim() || '';
        } catch (e) { console.error('Claude fallback error:', e.message); }
      }
      if (!animationPrompt) return res.status(500).json({ error: 'Failed to generate animation prompt' });

      let videoConfig = { aspect_ratio: aspectRatio, duration: durationSec, cfg_scale: 0.8, resolved: {} };
      try {
        const parsed = JSON.parse((cfgData.content?.find(b => b.type === 'text')?.text?.trim() || '{}').replace(/```json|```/g, '').trim());
        videoConfig = { ...parsed, aspect_ratio: aspectRatio, duration: durationSec, cfg_scale: 0.8 };
      } catch (e) { console.error('Config parse error:', e.message); }

      return res.status(200).json({ imagePrompt, animationPrompt, videoConfig });
    } catch (error) {
      return res.status(500).json({ error: 'Prompt generation failed', details: error.message });
    }
  }

  return res.status(400).json({ error: 'Invalid type. Use "storylines" or "prompt".' });
}
