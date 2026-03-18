// generate-sora-prompt.js
// Generates a professional Kling 2.6 Pro marketing video prompt
// with duration-appropriate scene design + voiceover script

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      productDescription, productUSP, storyline, aiDecideStoryline,
      salesFunnel, videoRatio, videoLength,
      videoStyle, tone, cameraMotion, lightingStyle,
      backgroundSetting, audienceEmotion, restrictions,
      hasProductImage, hasCharacterImage,
    } = req.body;

    const ratioLabel = videoRatio === '9_16' ? '9:16 vertical portrait' : '16:9 horizontal landscape';
    const durationSec = videoLength === '5' ? '5' : '10';
    const aspectRatio = videoRatio === '9_16' ? '9:16' : '16:9';

    const funnelGuide = {
      upper:  'AWARENESS — hook with a relatable pain point, no hard sell, end with curiosity-driven soft CTA like "discover more"',
      middle: 'CONSIDERATION — demonstrate product solving the problem clearly, build trust, mid-strength CTA like "learn more" or "see it in action"',
      lower:  'CONVERSION — create urgency and desire, strong direct CTA like "shop now", "limited stock", "get yours today"',
    }[salesFunnel] || 'GENERAL — show product benefit clearly, emotionally connect with viewer, soft CTA';

    const userFilledAdvanced = videoStyle || tone || cameraMotion || lightingStyle || backgroundSetting || audienceEmotion;

    // ── Duration-specific video design blueprint ──────────────────────────
    const videoBlueprint = durationSec === '5' ? `
DURATION: 5 seconds — this is an ultra-short impact video
DESIGN PHILOSOPHY: One single, unforgettable cinematic moment. No story arc. No transitions.
The entire 5 seconds must be ONE scene designed to stop the scroll and create instant desire.

SCENE STRUCTURE (5s):
- [0-1s] HOOK FRAME: The most visually striking opening possible — product hero shot OR extreme close-up OR unexpected angle
- [1-4s] SUSTAINED BEAUTY SHOT: Hold on the product/scene, let motion and light do the storytelling
- [4-5s] LOGO/BADGE CLOSE-UP: End on brand or product identifier

VOICEOVER (5s): Maximum 1 punchy sentence (8-12 words). Should be a bold claim or tagline.
Example VO: "The only portable monitor that fits in your life." OR "Limited to 2000 pairs. Don't miss yours."

CAMERA: One smooth continuous move — slow orbit, gentle push-in, or elegant tilt. No cuts.
PACING: Slow and deliberate. Let the product breathe. Luxury feel.` 

    : `
DURATION: 10 seconds — short narrative marketing video
DESIGN PHILOSOPHY: A complete emotional journey. Hook the viewer, show the problem, reveal the solution, drive action.

SCENE STRUCTURE (10s) — 3 beats:
- [0-2s] HOOK/PROBLEM (2s): Open with the pain point or relatable moment. Viewer thinks "that's me". Create tension.
- [2-7s] PRODUCT REVEAL & BENEFIT (5s): The product enters and solves the problem. Show the transformation. Make it feel magical.
- [7-10s] HERO SHOT & CTA (3s): Product glory shot. Voiceover delivers the CTA. Leave viewer wanting it.

VOICEOVER (10s): 2-3 sentences total — one per beat:
- HOOK VO (beat 1): Identify the pain point. e.g. "Tired of squinting at one tiny screen?"
- BENEFIT VO (beat 2): Introduce the solution. e.g. "Vflow Monitor — your second screen, anywhere in seconds."
- CTA VO (beat 3): Drive action. e.g. "USB-C plug and play. Shop now."

CAMERA: Each beat has its own camera personality:
- Beat 1: Handheld, slightly restless — mimics the frustration
- Beat 2: Smooth push-in or orbit — sense of discovery and wonder  
- Beat 3: Low angle hero shot — prestige and desire
PACING: Beat 1 quick and relatable, beat 2 satisfying and smooth, beat 3 slow and premium.`;

    // ── Element references based on uploaded photos ───────────────────────
    const elementRefs = hasProductImage && hasCharacterImage
      ? `ELEMENT REFERENCES (CRITICAL — use these exact tags):
- @Element1 = the product (from uploaded product photo) — use @Element1 wherever you mention the product
- @Element2 = the character/talent (from uploaded photo) — use @Element2 wherever you show the person
- Example: "@Element2 sits at a cramped desk, then picks up @Element1 and their face transforms with relief"`

      : hasProductImage
        ? `ELEMENT REFERENCES (CRITICAL):
- @Element1 = the product (from uploaded product photo) — use @Element1 wherever you mention or show the product
- No character photo — describe a suitable relatable talent naturally (young professional, student, etc.)
- Example: "Camera slowly reveals @Element1 rotating in golden studio light"`

        : hasCharacterImage
          ? `ELEMENT REFERENCES (CRITICAL):
- @Element1 = the character/talent (from uploaded photo) — use @Element1 wherever you show the person
- No product photo — describe the product visually based on the description provided
- Example: "@Element1 struggles with a small screen, then discovers the product"`

          : `No reference photos uploaded — describe both product appearance and talent type naturally based on the product description. Do NOT use @Element1 or @Element2.`;

    // ── System prompt ─────────────────────────────────────────────────────
    const narrativeSystem = `You are a senior creative director at a top-tier digital marketing agency, specialising in AI-generated video ads for social media.

You write Kling 2.6 Pro video generation prompts that produce scroll-stopping, conversion-driving product videos.

Your prompts always include:
1. A precise VISUAL DESCRIPTION of each scene (what Kling should render)
2. VOICEOVER SCRIPT lines embedded naturally (Kling 2.6 Pro generates audio from these)
3. CAMERA DIRECTION for each moment
4. SOUND/MUSIC MOOD guidance

OUTPUT FORMAT: Write the complete prompt as one flowing block of text. 
- Weave visual description, camera direction, and voiceover naturally together
- Use format: [VISUAL: ...] [VO: "..."] [CAMERA: ...] for each beat
- End with [SOUND: ...] for the overall audio mood
- No markdown headers, no bullet points in the final output — flowing prose with the bracketed cues

QUALITY STANDARD: Every prompt you write should be capable of producing a video that could run as a paid social ad.`;

    // ── User message ──────────────────────────────────────────────────────
    const narrativeUser = `Write a complete Kling 2.6 Pro video ad prompt for this product.

━━━ VIDEO SPECS ━━━
Format: ${ratioLabel}
Duration: ${durationSec} seconds (HARD LIMIT — design every scene to fit exactly within this)
Sales Objective: ${funnelGuide}
${videoBlueprint}

━━━ PRODUCT BRIEF ━━━
Product: ${productDescription}
USP: ${productUSP}

━━━ STORYLINE DIRECTION ━━━
${aiDecideStoryline
  ? `Creative direction: AI decides the best narrative${storyline ? `. User inspiration: "${storyline}"` : ''}. Design the most compelling story for this product and funnel stage.`
  : storyline
    ? `Follow this storyline: "${storyline}". Expand it into a full scene-by-scene video prompt with voiceover.`
    : `No storyline provided — create the most effective marketing narrative for this product targeting the ${salesFunnel || 'general'} funnel stage.`}

━━━ VISUAL REFERENCES ━━━
${elementRefs}

━━━ CINEMATIC SETTINGS ━━━
${userFilledAdvanced
  ? `User specified (follow exactly):
${videoStyle        ? `Style: ${videoStyle}` : ''}
${tone              ? `Tone: ${tone}` : ''}
${cameraMotion      ? `Camera motion: ${cameraMotion}` : ''}
${lightingStyle     ? `Lighting: ${lightingStyle}` : ''}
${backgroundSetting ? `Background: ${backgroundSetting}` : ''}
${audienceEmotion   ? `Emotion arc: ${audienceEmotion}` : ''}
${restrictions      ? `Restrictions: ${restrictions}` : ''}`
  : `Not specified — you decide the best cinematic approach that matches the product type, target audience, and funnel stage. Choose settings that maximise emotional impact and product desire.`}

━━━ VOICEOVER REQUIREMENTS ━━━
- Write natural, conversational VO lines — not stiff ad copy
- Match the tone to the funnel stage (${salesFunnel || 'general'})
- VO should feel like a real person talking, not a radio announcer
- Include the VO as [VO: "..."] cues embedded in the scene descriptions
- Kling 2.6 Pro will synthesise the voice from these lines

Now write the complete video prompt:`;

    // ── Technical config call (parallel) ─────────────────────────────────
    const configSystem = `You are a Kling AI technical configuration specialist. Return ONLY valid JSON, no explanation, no markdown.`;

    const configUser = `Return optimal Kling 2.6 Pro technical config for this ${durationSec}-second ${salesFunnel || 'general'} marketing video.

PRODUCT: ${productDescription}
RATIO: ${aspectRatio}
DURATION: ${durationSec}s

USER SETTINGS (use exactly if set, otherwise choose best for a high-quality marketing video):
- videoStyle: ${videoStyle || 'NOT SET — choose best for product marketing'}
- tone: ${tone || 'NOT SET — choose best for this product and funnel'}
- cameraMotion: ${cameraMotion || 'NOT SET — choose cinematic option'}
- lightingStyle: ${lightingStyle || 'NOT SET — choose premium option'}
- backgroundSetting: ${backgroundSetting || 'NOT SET — choose relevant environment'}
- audienceEmotion: ${audienceEmotion || 'NOT SET — choose emotion arc that drives conversion'}

Return exactly this JSON:
{"aspect_ratio":"${aspectRatio}","duration":"${durationSec}","cfg_scale":0.5,"resolved":{"videoStyle":"<value>","tone":"<value>","cameraMotion":"<value>","lightingStyle":"<value>","backgroundSetting":"<value>","audienceEmotion":"<value>","rationale":"<one sentence explaining the creative choices>"}}`;

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    };

    // Run both calls in parallel
    const [narrativeRes, configRes] = await Promise.all([
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers,
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: durationSec === '5' ? 500 : 900, // 10s needs more tokens for full VO + scenes
          system: narrativeSystem,
          messages: [{ role: 'user', content: narrativeUser }],
        }),
      }),
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers,
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          system: configSystem,
          messages: [{ role: 'user', content: configUser }],
        }),
      }),
    ]);

    const [narrativeData, configData] = await Promise.all([
      narrativeRes.json(),
      configRes.json(),
    ]);

    if (!narrativeRes.ok) return res.status(narrativeRes.status).json({ error: narrativeData });
    if (!configRes.ok) return res.status(configRes.status).json({ error: configData });

    const prompt = narrativeData.content?.find(b => b.type === 'text')?.text?.trim() || '';

    let videoConfig = { aspect_ratio: aspectRatio, duration: durationSec, cfg_scale: 0.5, resolved: {} };
    try {
      const raw = configData.content?.find(b => b.type === 'text')?.text?.trim() || '{}';
      videoConfig = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch (e) {
      console.error('Config JSON parse error:', e.message);
    }

    console.log(`Prompt generated for ${durationSec}s video. Words: ${prompt.split(/\s+/).length}`);
    console.log('AI resolved config:', JSON.stringify(videoConfig.resolved));

    res.status(200).json({ prompt, videoConfig });

  } catch (error) {
    console.error('generate-sora-prompt error:', error);
    res.status(500).json({ error: 'Prompt generation failed', details: error.message });
  }
}
