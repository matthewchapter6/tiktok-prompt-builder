// generate-sora-prompt.js
// Returns TWO things:
//   1. prompt       — narrative text shown to user for review/edit
//   2. videoConfig  — resolved technical params (ratio, duration, style, camera etc.)
//                     AI fills in any blanks the user left empty

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
    // Kling 2.6 Pro accepts '5' or '10' seconds
    // UI offers '5' or '10' — map directly, no translation needed
    const durationSec = videoLength === '5' ? '5' : '10';
    const funnelGuide = {
      upper:  'AWARENESS — relatable problem hook, no hard sell, soft CTA',
      middle: 'CONSIDERATION — show product solving problem, build trust, mid-strength CTA',
      lower:  'CONVERSION — urgency and desire, strong direct buy CTA',
    }[salesFunnel] || 'GENERAL — show product attractively, clear benefit, soft CTA';

    const userFilledAdvanced = videoStyle || tone || cameraMotion || lightingStyle || backgroundSetting || audienceEmotion;
    const aspectRatio = videoRatio === '9_16' ? '9:16' : '16:9';

    // Duration-aware word count and scene structure
    const durationGuide = durationSec === '5' ? {
      wordCount: '50-70 words MAX — absolutely no more',
      scenes: '1 scene only',
      structure: 'ONE single scene: pick the single most impactful moment (product reveal OR hero shot OR key emotion). No story arc. No transitions. One frozen-in-time cinematic moment.',
      pacing: 'Count your words. 5 seconds = ~12 words of screen action. Every word must earn its place.',
      example: 'Example of a good 5s prompt: "@Element1 shoe rotates slowly on a black marble surface. Golden studio light catches the silver metallic finish. Camera orbits at low angle. Final frame: logo badge fills screen. Sharp. Premium. Minimal."',
    } : {
      wordCount: '100-140 words',
      scenes: '3 beats: Hook (2s) + Benefit (5s) + Hero close-up (3s)',
      structure: 'Beat 1 Hook (2s): establish problem or grab attention. Beat 2 Benefit (5s): show product solving problem or in use. Beat 3 Hero (3s): product close-up, CTA implied.',
      pacing: 'Each beat = 1-2 sentences. Keep cuts sharp. No lingering.',
      example: '',
    };

    const narrativeSystem = `You are a world-class video director writing Kling AI video prompts.
STRICT RULES — violating these ruins the video:
- English only
- Output ONLY the prompt text — zero explanation, zero preamble, zero markdown
- VIDEO LENGTH: ${durationSec} seconds. This is a HARD constraint.
- WORD LIMIT: ${durationGuide.wordCount}. Count your words before submitting.
- SCENE STRUCTURE: ${durationGuide.structure}
- PACING: ${durationGuide.pacing}
${durationGuide.example ? `- ${durationGuide.example}` : ''}
- Be specific about visuals, camera, lighting, motion
- End with the final closing shot — one sentence`;

    const narrativeUser = `Write a Kling AI video prompt for this product ad.

FORMAT: ${ratioLabel} | ${durationSec}s video | ${funnelGuide}
⚠️ WORD LIMIT: ${durationGuide.wordCount} — count every word, do not exceed
⚠️ SCENE STRUCTURE: ${durationGuide.structure}
⚠️ PACING RULE: ${durationGuide.pacing}

PRODUCT:
- Description: ${productDescription}
- USP: ${productUSP}

STORYLINE:
${aiDecideStoryline
  ? `AI creates the storyline.${storyline ? ` Inspiration: ${storyline}` : ''}`
  : storyline
    ? `Follow this: ${storyline}`
    : 'No storyline — create a compelling one for this product and funnel.'}

ASSETS & ELEMENT REFERENCES:
${hasProductImage && hasCharacterImage
  ? `- Product photo: PROVIDED as @Element1 — refer to the product as @Element1 throughout. e.g. "@Element1 shoe sits on the court", "camera reveals @Element1 in golden light"
- Character photo: PROVIDED as @Element2 — refer to the character as @Element2 throughout. e.g. "@Element2 picks up @Element1", "@Element2 walks confidently wearing @Element1"
- IMPORTANT: You MUST use @Element1 for product and @Element2 for character in your prompt — this is how Kling maintains visual consistency`
  : hasProductImage
    ? `- Product photo: PROVIDED as @Element1 — refer to the product as @Element1 throughout. e.g. "camera reveals @Element1", "@Element1 sits on the desk"
- Character: NOT provided — describe a suitable talent type for this product naturally in the prompt. Do NOT use @Element2.
- IMPORTANT: You MUST use @Element1 for the product in your prompt`
    : hasCharacterImage
      ? `- Product: NOT provided — describe the product visually from the description
- Character photo: PROVIDED as @Element1 — refer to the character as @Element1 throughout
- IMPORTANT: You MUST use @Element1 for the character in your prompt`
      : `- No photos provided — describe both the product and suitable talent visually based on the description. Do NOT use @Element1 or @Element2.`
}
- NOTE: Do NOT use image_url or first-frame locking — AI has full creative freedom to open the video however it wants

CINEMATIC SETTINGS:
${userFilledAdvanced
  ? `User specified:\n${videoStyle ? `- Style: ${videoStyle}\n` : ''}${tone ? `- Tone: ${tone}\n` : ''}${cameraMotion ? `- Camera: ${cameraMotion}\n` : ''}${lightingStyle ? `- Lighting: ${lightingStyle}\n` : ''}${backgroundSetting ? `- Background: ${backgroundSetting}\n` : ''}${audienceEmotion ? `- Emotion arc: ${audienceEmotion}\n` : ''}${restrictions ? `- Restrictions: ${restrictions}` : ''}`
  : 'Not specified — choose best cinematic settings for this product type and funnel stage. Weave them into the description naturally.'}

Write the prompt now:`;

    const configSystem = `You are a technical video production assistant for Kling AI. Return ONLY valid JSON, no explanation, no markdown.`;

    const configUser = `Return optimal Kling AI technical config for this video as JSON.

PRODUCT: ${productDescription}
FUNNEL: ${salesFunnel || 'general'}
RATIO: ${ratioLabel}
DURATION: ${durationSec}s

USER SETTINGS (use as-is if set, otherwise choose best):
- videoStyle: ${videoStyle || 'NOT SET'}
- tone: ${tone || 'NOT SET'}
- cameraMotion: ${cameraMotion || 'NOT SET'}
- lightingStyle: ${lightingStyle || 'NOT SET'}
- backgroundSetting: ${backgroundSetting || 'NOT SET'}
- audienceEmotion: ${audienceEmotion || 'NOT SET'}

Return exactly this JSON (fill ALL fields):
{"aspect_ratio":"${aspectRatio}","duration":"${durationSec}","cfg_scale":0.5,"resolved":{"videoStyle":"<value>","tone":"<value>","cameraMotion":"<value>","lightingStyle":"<value>","backgroundSetting":"<value>","audienceEmotion":"<value>","rationale":"<one sentence>"}}`;

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    };

    const [narrativeRes, configRes] = await Promise.all([
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers,
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 600, system: narrativeSystem, messages: [{ role: 'user', content: narrativeUser }] }),
      }),
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers,
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 400, system: configSystem, messages: [{ role: 'user', content: configUser }] }),
      }),
    ]);

    const [narrativeData, configData] = await Promise.all([narrativeRes.json(), configRes.json()]);

    if (!narrativeRes.ok) return res.status(narrativeRes.status).json({ error: narrativeData });
    if (!configRes.ok) return res.status(configRes.status).json({ error: configData });

    let prompt = narrativeData.content?.find(b => b.type === 'text')?.text?.trim() || '';

    // Safety trim: if AI still exceeded word limit, truncate at sentence boundary
    const maxWords = durationSec === '5' ? 70 : 140;
    const words = prompt.split(/\s+/);
    if (words.length > maxWords) {
      console.warn(`Prompt exceeded ${maxWords} words (got ${words.length}) — trimming to last complete sentence`);
      const trimmed = words.slice(0, maxWords).join(' ');
      // Find last sentence boundary
      const lastPeriod = Math.max(trimmed.lastIndexOf('.'), trimmed.lastIndexOf('!'), trimmed.lastIndexOf('?'));
      prompt = lastPeriod > 0 ? trimmed.substring(0, lastPeriod + 1) : trimmed;
    }
    console.log(`Prompt word count: ${prompt.split(/\s+/).length} words (limit: ${maxWords})`);

    let videoConfig = { aspect_ratio: aspectRatio, duration: durationSec, cfg_scale: 0.5, resolved: {} };
    try {
      const raw = configData.content?.find(b => b.type === 'text')?.text?.trim() || '{}';
      videoConfig = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch (e) {
      console.error('Config JSON parse error:', e.message);
    }

    console.log('Prompt OK. AI resolved config:', JSON.stringify(videoConfig.resolved));
    res.status(200).json({ prompt, videoConfig });

  } catch (error) {
    console.error('generate-sora-prompt error:', error);
    res.status(500).json({ error: 'Prompt generation failed', details: error.message });
  }
}
