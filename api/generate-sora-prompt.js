// generate-video-prompt.js
// Generates TWO things for the new Create Video flow:
// 1. Gemini image prompt (for first frame generation via generate-image.js)
// 2. Kling animation prompt (for image-to-video — HOW to animate, not WHAT to show)
// 3. Technical config JSON (aspect ratio, duration, style)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      productDescription,
      productUSP,
      productCategory,
      storyline,
      aiDecideStoryline,
      salesFunnel,
      videoRatio,
      videoLength,
      videoStyle,
      tone,
      cameraMotion,
      lightingStyle,
      backgroundSetting,
      audienceEmotion,
      restrictions,
      hasProductImage,
      hasCharacterImage,
    } = req.body;

    const ratioLabel = videoRatio === '9_16' ? '9:16 vertical portrait' : '16:9 horizontal landscape';
    const aspectRatio = videoRatio === '9_16' ? '9:16' : '16:9';
    const durationSec = videoLength === '5' ? '5' : '10';

    const funnelGuide = {
      upper:  'AWARENESS — relatable problem moment, no hard sell, soft CTA',
      middle: 'CONSIDERATION — product solving a real problem, build trust',
      lower:  'CONVERSION — strong desire and urgency, direct buy CTA',
    }[salesFunnel] || 'GENERAL — showcase product attractively, clear benefit';

    const userFilledAdvanced = videoStyle || tone || cameraMotion || lightingStyle || backgroundSetting || audienceEmotion;

    // ── Category-aware visual style ───────────────────────────────────────
    const categoryStyle = {
      tech_gadget:          { env: 'clean minimal workspace, glass surfaces, soft natural light', mood: 'clean, modern, confident', avoid: 'no cluttered backgrounds, no harsh lighting' },
      consumer_good:        { env: 'home setting, natural everyday environment', mood: 'warm, relatable, authentic', avoid: 'no overly staged setups' },
      skincare:             { env: 'bright airy bathroom, vanity with soft morning light', mood: 'soft, pure, clean — warm whites, pastel tones', avoid: 'no harsh shadows on skin, no dramatic contrast' },
      vitamin_health:       { env: 'active lifestyle — gym, outdoor morning, clean kitchen', mood: 'energetic, vital, optimistic', avoid: 'no clinical aesthetics, no fake energy' },
      apparel:              { env: 'urban street, minimal studio, or lifestyle environment', mood: 'aspirational, confident', avoid: 'no stiff posed mannequin look' },
      sports_fitness:       { env: 'sports court, gym, outdoor track', mood: 'powerful, adrenaline, focused — high contrast', avoid: 'no cartoonish motion blur, no flickering' },
      food_beverage:        { env: 'clean kitchen surface, café setting, or dining environment', mood: 'warm, appetising — warm amber tones', avoid: 'no artificial food colouring glow' },
      home_living:          { env: 'beautifully styled home interior, natural light', mood: 'warm, aspirational, comfortable', avoid: 'no sterile empty rooms' },
      jewellery_accessories:{ env: 'dark premium backdrop, velvet surface', mood: 'luxury, precious, timeless', avoid: 'no plastic-looking renders, no harsh flash' },
      software_app:         { env: 'modern device screen in real-world context', mood: 'clean, modern, efficient', avoid: 'no fake holographic UI' },
      service:              { env: 'professional environment relevant to the service', mood: 'trustworthy, human, genuine', avoid: 'no overly corporate stock footage look' },
    };
    const catStyle = categoryStyle[productCategory] || {
      env: 'clean relevant environment matching the product use case',
      mood: 'aspirational yet authentic — natural lighting, cinematic color grade',
      avoid: 'no artificial effects, no cluttered backgrounds',
    };

    // ── Duration-aware animation structure ────────────────────────────────
    const animationStructure = durationSec === '5'
      ? `5 SECONDS — One continuous animation from the first frame.
Single smooth camera move only — no cuts.
The first frame already shows the scene — just animate it:
- Subtle subject motion (hand movement, breath, gentle interaction)
- One camera move (dolly in, orbit, push-in, or tilt)
- Dialogue: max 1 sentence (8-12 words), a tagline or bold claim
- End on a strong hero frame`
      : `10 SECONDS — Animate from the first frame with max 1 cut.
Beat 1 (0-3s): Animate the opening scene — subtle motion, camera establishes
Beat 2 (3-8s): Subject interacts with product — the key action moment
Beat 3 (8-10s): Pull back or push in to hero closing frame + CTA dialogue
Dialogue: 2-3 short lines, one per beat`;

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    };

    // ── CALL 1: Gemini — generate the first frame image prompt ───────────
    const imagePromptSystem = `You are a visual director writing Gemini image generation prompts for product ad first frames.
Write a single paragraph describing the perfect opening frame of a ${durationSec}s product video ad.
This is a STILL IMAGE prompt — describe exactly what should appear in the frame.
Rules:
- Describe the scene, subject, product placement, lighting, and composition precisely
- The image must work as the perfect first frame of the video — it sets up the action to follow
- For character: describe how they are positioned and their expression
- For product: describe exactly where it appears in the frame
- Do NOT use @Element1/@Element2 tags — just describe what to render
- End with quality instruction: "Ultra-realistic, high detail, cinematic photography, ${ratioLabel}"
- Keep it under 120 words`;

    const imagePromptUser = `Write a Gemini image prompt for the first frame of this ${durationSec}s product ad.

Product: ${productDescription}
USP: ${productUSP}
Category style: Environment: ${catStyle.env} | Mood: ${catStyle.mood}
Sales objective: ${funnelGuide}
Ratio: ${ratioLabel}
Has product photo: ${hasProductImage ? 'YES — product will be overlaid via reference image' : 'NO — describe product visually'}
Has character photo: ${hasCharacterImage ? 'YES — character will be overlaid via reference image' : 'NO — describe suitable talent'}

Storyline context: ${aiDecideStoryline ? 'AI decides' : storyline || 'Not provided'}
${userFilledAdvanced ? `Style notes: ${[lightingStyle, backgroundSetting, tone].filter(Boolean).join(', ')}` : ''}

Write the first frame image prompt now:`;

    // ── CALL 2: Gemini — generate the Kling animation prompt ─────────────
    const animationPromptSystem = `You are a motion director writing Kling AI image-to-video animation prompts.
The first frame image is ALREADY GENERATED — Kling will animate FROM that exact frame.
Your job is ONLY to describe HOW to animate it — not what the scene looks like.

GOLDEN ANIMATION TEMPLATE:
1. Opening motion (what moves first and how — subject breath, hand lift, camera begin)
2. Primary action (the main thing that happens — interaction with product, movement)
3. Camera movement (specific cinematography term and direction)
4. Dialogue/voiceover (natural, woven into the action)
5. Audio mood (ambient sound + music tone)
6. Negative constraints (what NOT to do)

RULES:
- Write in flowing prose — no tags, no bullet points
- Use real camera language: "slow dolly in", "rack focus", "handheld tracking"
- Dialogue in natural quotes: she says "..." or a voiceover says "..."
- Never describe the scene — Kling already sees it from the first frame
- Keep it tight and action-focused
- Always end with negative constraints`;

    const animationPromptUser = `Write a Kling image-to-video animation prompt for this ${durationSec}s product ad.

The first frame is already generated. Now describe HOW to animate it.

${animationStructure}

Product: ${productDescription}
USP: ${productUSP}
Sales objective: ${funnelGuide}
Has product in frame: ${hasProductImage ? 'YES' : 'NO'}
Has character in frame: ${hasCharacterImage ? 'YES' : 'NO'}

Storyline: ${aiDecideStoryline ? `AI decides the best animation narrative for this product and objective` : storyline ? `Follow this: "${storyline}"` : 'Create the most effective animation for this product'}

${userFilledAdvanced ? `User direction: ${[cameraMotion && `Camera: ${cameraMotion}`, tone && `Tone: ${tone}`, audienceEmotion && `Emotion: ${audienceEmotion}`, restrictions && `Avoid: ${restrictions}`].filter(Boolean).join(' | ')}` : 'Choose the best cinematic approach for this product category and objective.'}

Remember: Kling already sees the first frame. Only describe the animation — camera, motion, dialogue, audio, and what NOT to do.

Write the animation prompt now:`;

    // ── CALL 3: Claude — technical config JSON ────────────────────────────
    const configSystem = `You are a Kling AI technical configuration specialist. Return ONLY valid JSON. No explanation. No markdown.`;
    const configUser = `Return optimal Kling 2.6 Pro image-to-video config for this ${durationSec}s ${salesFunnel || 'general'} product ad.
Product category: ${productCategory || 'general'}
Ratio: ${aspectRatio} | Duration: ${durationSec}s (FIXED)
User settings (use if set, else choose best):
- videoStyle: ${videoStyle || 'NOT SET'}
- tone: ${tone || 'NOT SET'}
- cameraMotion: ${cameraMotion || 'NOT SET'}
- lightingStyle: ${lightingStyle || 'NOT SET'}
- backgroundSetting: ${backgroundSetting || 'NOT SET'}
- audienceEmotion: ${audienceEmotion || 'NOT SET'}
Return: {"aspect_ratio":"${aspectRatio}","duration":"${durationSec}","cfg_scale":0.8,"resolved":{"videoStyle":"<v>","tone":"<v>","cameraMotion":"<v>","lightingStyle":"<v>","backgroundSetting":"<v>","audienceEmotion":"<v>","rationale":"<one sentence>"}}`;

    // ── Run all 3 calls in parallel ───────────────────────────────────────
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`;

    const [imagePromptRes, animationPromptRes, configRes] = await Promise.all([

      // Call 1: Gemini — image prompt
      fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: imagePromptSystem }] },
          contents: [{ role: 'user', parts: [{ text: imagePromptUser }] }],
          generationConfig: { temperature: 0.9, topP: 0.95, maxOutputTokens: 300 },
        }),
      }),

      // Call 2: Gemini — animation prompt
      fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: animationPromptSystem }] },
          contents: [{ role: 'user', parts: [{ text: animationPromptUser }] }],
          generationConfig: { temperature: 1.0, topP: 0.95, maxOutputTokens: durationSec === '5' ? 300 : 500 },
        }),
      }),

      // Call 3: Claude — technical config
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          system: configSystem,
          messages: [{ role: 'user', content: configUser }],
        }),
      }),
    ]);

    const [imagePromptData, animationPromptData, configData] = await Promise.all([
      imagePromptRes.json(),
      animationPromptRes.json(),
      configRes.json(),
    ]);

    // Extract image prompt
    const imagePrompt = imagePromptData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    if (!imagePrompt) {
      console.error('Image prompt failed:', JSON.stringify(imagePromptData));
      return res.status(500).json({ error: 'Failed to generate image prompt' });
    }

    // Extract animation prompt (with Claude fallback)
    let animationPrompt = animationPromptData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    if (!animationPrompt) {
      console.warn('Animation prompt from Gemini empty — falling back to Claude');
      try {
        const fallback = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 600,
            system: animationPromptSystem,
            messages: [{ role: 'user', content: animationPromptUser }],
          }),
        });
        const fallbackData = await fallback.json();
        animationPrompt = fallbackData.content?.find(b => b.type === 'text')?.text?.trim() || '';
      } catch (e) {
        console.error('Claude fallback failed:', e.message);
      }
    }
    if (!animationPrompt) return res.status(500).json({ error: 'Failed to generate animation prompt' });

    // Extract config
    let videoConfig = { aspect_ratio: aspectRatio, duration: durationSec, cfg_scale: 0.8, resolved: {} };
    if (configRes.ok) {
      try {
        const raw = configData.content?.find(b => b.type === 'text')?.text?.trim() || '{}';
        const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
        videoConfig = { ...parsed, aspect_ratio: aspectRatio, duration: durationSec, cfg_scale: 0.8 };
      } catch (e) {
        console.error('Config parse error:', e.message);
      }
    }

    console.log(`[generate-video-prompt] ${durationSec}s | Category: ${productCategory || 'general'}`);
    console.log('[generate-video-prompt] Image prompt:', imagePrompt.substring(0, 100));
    console.log('[generate-video-prompt] Animation prompt:', animationPrompt.substring(0, 100));

    res.status(200).json({ imagePrompt, animationPrompt, videoConfig });

  } catch (error) {
    console.error('generate-video-prompt error:', error);
    res.status(500).json({ error: 'Prompt generation failed', details: error.message });
  }
}
