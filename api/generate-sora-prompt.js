// generate-sora-prompt.js
// Kling 2.6 Pro optimised prompt generator
// Framework: Subject → Action → Environment → Camera/Style (cinematic prose)
// Model: Kling 3.0 Pro | Supports 5s, 10s, 15s | Native audio ON
// Audio: dialogue in quotes, ambient sounds, music tone described naturally
// Based on VEED + toolplay.ai best practices for Kling 2.6 Pro

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
    // Kling 2.6 Pro supports 5s or 10s only
    const durationSec = videoLength === '5' ? '5' : '10';
    const aspectRatio = videoRatio === '9_16' ? '9:16' : '16:9';

    const funnelGuide = {
      upper:  'AWARENESS — hook with a relatable pain point, no hard sell, soft CTA like "discover more" or "follow for more"',
      middle: 'CONSIDERATION — demonstrate product solving problem clearly, build trust, mid CTA like "learn more" or "see how it works"',
      lower:  'CONVERSION — create strong desire and urgency, direct CTA like "shop now", "only X left", "get yours today"',
    }[salesFunnel] || 'GENERAL — showcase product attractively, clear benefit, soft CTA';

    const userFilledAdvanced = videoStyle || tone || cameraMotion || lightingStyle || backgroundSetting || audienceEmotion;

    // ── Duration blueprint ──────────────────────────────────────────────
    const durationBlueprint = durationSec === '5'
      ? `5-SECOND VIDEO — One single cinematic moment. No scene cuts.
STRUCTURE: One continuous shot with a single camera move.
- Subject established immediately (0-1s)
- One key action or reveal (1-4s)
- Strong closing frame (4-5s)
DIALOGUE: Maximum 1 sentence (8-12 words). Punchy tagline or bold claim.
CAMERA: One smooth continuous movement — orbit, push-in, or tilt. No cuts.
PACING: Slow and deliberate. Premium feel. Let the product breathe.`

      : `10-SECOND VIDEO — Complete narrative arc. Maximum 2 scene cuts.
STRUCTURE: 3 beats totalling 10 seconds:
- Beat 1 HOOK (0-2s): Establish the problem or grab attention. Subject in context.
- Beat 2 REVEAL (2-7s): Product enters, solves the problem, show the transformation.
- Beat 3 CLOSE (7-10s): Hero product shot + CTA dialogue. Satisfying conclusion.
DIALOGUE: 2-3 short sentences across the video. One per beat.
  - Hook dialogue (0-2s): Pain point or attention grab
  - Reveal dialogue (2-7s): Product benefit or feature
  - Close dialogue (7-10s): CTA — direct and clear
CAMERA: Each beat has distinct camera energy:
  - Beat 1: Handheld or static — relatable, grounded
  - Beat 2: Smooth tracking or push-in — sense of discovery
  - Beat 3: Low angle hero shot — prestige and desire
PACING: Beat 1 quick and real, Beat 2 smooth and satisfying, Beat 3 slow and premium.`;

    // ── Element reference instructions ──────────────────────────────────
    const elementInstructions = hasProductImage && hasCharacterImage
      ? `REFERENCE ELEMENTS (critical — use these tags exactly as written):
@Element1 = the product (uploaded photo) — use @Element1 every time you mention the product
@Element2 = the talent/character (uploaded photo) — use @Element2 every time you show the person
These tags tell Kling to keep the product and character visually consistent throughout.
Example usage: "@Element2, a confident woman in her 30s, picks up @Element1 and smiles"
Never describe what the product or person looks like — just use @Element1 and @Element2.`

      : hasProductImage
        ? `REFERENCE ELEMENT (critical — use this tag exactly):
@Element1 = the product (uploaded photo) — use @Element1 every time you mention or show the product
This tag tells Kling to keep the product visually consistent throughout.
Example usage: "camera slowly reveals @Element1 on a marble surface"
Do NOT describe what the product looks like — Kling already knows from the photo.
No character photo provided — describe a suitable realistic talent for this product naturally.`

        : hasCharacterImage
          ? `REFERENCE ELEMENT (critical — use this tag exactly):
@Element1 = the talent/character (uploaded photo) — use @Element1 every time you show the person
Example usage: "@Element1, a young professional in smart casual attire, holds up the product"
No product photo provided — describe the product visually from the description.`

          : `No reference photos provided.
Describe the product appearance in detail based on the product description.
Describe the talent/character type appropriate for this product (age, style, energy).
Do NOT use @Element1 or @Element2 tags.`;

    // ── System prompt ────────────────────────────────────────────────────
    const narrativeSystem = `You are a senior creative director writing video ad prompts for Kling 2.6 Pro AI.

KLING PROMPT RULES — follow these exactly:
1. Write like a film director giving scene directions — cinematic prose, not keyword lists
2. Structure every prompt: SUBJECT → ACTION → ENVIRONMENT → CAMERA/STYLE
3. Write in flowing paragraphs, not bullet points or tags
4. For dialogue: write it naturally in the scene description with quotation marks
   Example: She looks at the camera and says "Transform your business today."
5. For audio: describe sounds naturally woven into the scene
   Example: "soft ambient office sounds, keyboard clicks in background, upbeat commercial music builds underneath"
6. For camera: use real cinematography language woven into the description
   Example: "camera tracks slowly left", "rack focus from background to product", "handheld close-up"
7. Be specific and visual — paint a picture the AI can render
8. Never use structured tags like [VISUAL:] [CAMERA:] [VO:] — these confuse Kling
9. Never use keyword lists — write full descriptive sentences
10. The prompt should read like a scene from a film brief

QUALITY STANDARD: Every prompt must be capable of producing a video that could run as a paid social ad.`;

    // ── User message ─────────────────────────────────────────────────────
    const narrativeUser = `Write a Kling 2.6 Pro video ad prompt for this product.

━━━ VIDEO BRIEF ━━━
Format: ${ratioLabel}
Duration: ${durationSec} seconds
Sales objective: ${funnelGuide}

${durationBlueprint}

━━━ PRODUCT ━━━
Description: ${productDescription}
USP: ${productUSP}

━━━ STORYLINE ━━━
${aiDecideStoryline
  ? `Creative direction: AI decides the best narrative.${storyline ? ` User inspiration: "${storyline}"` : ''} Design the most compelling story for this product and funnel stage.`
  : storyline
    ? `Follow this storyline: "${storyline}". Expand it into a full cinematic scene with dialogue and audio.`
    : `No storyline provided — create the most effective marketing narrative for this product.`}

━━━ REFERENCE ELEMENTS ━━━
${elementInstructions}

━━━ CINEMATIC DIRECTION ━━━
${userFilledAdvanced
  ? `User specified (incorporate naturally into the prose — do NOT list them separately):
${videoStyle        ? `Style: ${videoStyle}` : ''}
${tone              ? `Tone: ${tone}` : ''}
${cameraMotion      ? `Camera: ${cameraMotion}` : ''}
${lightingStyle     ? `Lighting: ${lightingStyle}` : ''}
${backgroundSetting ? `Background: ${backgroundSetting}` : ''}
${audienceEmotion   ? `Character emotion arc: ${audienceEmotion}` : ''}
${restrictions      ? `Must avoid: ${restrictions}` : ''}`
  : `Not specified — choose the best cinematic approach for this product type and sales objective. Consider what lighting, environment, camera movement and emotional arc would make this product most desirable.`}

━━━ PROMPT FORMAT REMINDER ━━━
Write one flowing cinematic description.
Structure: Subject → Action → Environment → Camera/Style
Weave dialogue naturally: she says "..." or a voiceover says "..."
Weave audio naturally: "soft piano builds underneath", "ambient café sounds"
NO tags. NO bullet points. NO keyword lists. Pure cinematic prose.

Write the prompt now:`;

    // ── Technical config (parallel call) ─────────────────────────────────
    const configSystem = `You are a Kling AI technical configuration specialist. Return ONLY valid JSON, no explanation, no markdown.`;

    const configUser = `Return optimal Kling 2.6 Pro config for this ${durationSec}s ${salesFunnel || 'general'} marketing video.

PRODUCT: ${productDescription}
RATIO: ${aspectRatio}
DURATION: ${durationSec}s

USER SETTINGS (use exactly if set, otherwise choose best):
- videoStyle: ${videoStyle || 'NOT SET'}
- tone: ${tone || 'NOT SET'}
- cameraMotion: ${cameraMotion || 'NOT SET'}
- lightingStyle: ${lightingStyle || 'NOT SET'}
- backgroundSetting: ${backgroundSetting || 'NOT SET'}
- audienceEmotion: ${audienceEmotion || 'NOT SET'}

Return exactly this JSON:
{"aspect_ratio":"${aspectRatio}","duration":"${durationSec}","cfg_scale":0.5,"resolved":{"videoStyle":"<value>","tone":"<value>","cameraMotion":"<value>","lightingStyle":"<value>","backgroundSetting":"<value>","audienceEmotion":"<value>","rationale":"<one sentence>"}}`;

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
          max_tokens: durationSec === '5' ? 600 : 1000,
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
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      videoConfig = {
        ...parsed,
        // ALWAYS enforce these from user selection — never let Claude override
        aspect_ratio: aspectRatio,
        duration: durationSec,
        cfg_scale: 0.5,
      };
    } catch (e) {
      console.error('Config JSON parse error — using defaults:', e.message);
    }
    console.log(`Duration enforced: ${durationSec}s | Aspect: ${aspectRatio}`);

    console.log(`Prompt generated for ${durationSec}s video. Words: ${prompt.split(/\s+/).length}`);
    console.log('Resolved config:', JSON.stringify(videoConfig.resolved));

    res.status(200).json({ prompt, videoConfig });

  } catch (error) {
    console.error('generate-sora-prompt error:', error);
    res.status(500).json({ error: 'Prompt generation failed', details: error.message });
  }
}
