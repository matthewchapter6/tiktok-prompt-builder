// generate-sora-prompt.js
// Returns TWO things:
//   1. prompt       — narrative text shown to user for review/edit
//   2. videoConfig  — resolved technical params (ratio, duration, style, camera etc.)
//                     AI fills in any blanks the user left empty
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

    const narrativeSystem = `You are a world-class video director specialising in AI-generated short-form product promotion videos for Kling AI.
Write a single cinematic video generation prompt. Rules:
- English only
- Output ONLY the prompt text, no explanation, no preamble, no markdown
- 150-250 words
- Be specific: visuals, motion, lighting, mood, camera moves, character emotions
- Structure: Hook scene, Product reveal/benefit, Closing hero shot
- Always describe the final closing shot explicitly`;

    const narrativeUser = `Write a Kling AI video prompt for this product ad.

FORMAT: ${ratioLabel} | ${durationSec}s | ${funnelGuide}

PRODUCT:
- Description: ${productDescription}
- USP: ${productUSP}

STORYLINE:
${aiDecideStoryline
  ? `AI creates the storyline.${storyline ? ` Inspiration: ${storyline}` : ''}`
  : storyline
    ? `Follow this: ${storyline}`
    : 'No storyline — create a compelling one for this product and funnel.'}

ASSETS:
- Product photo: ${hasProductImage ? 'YES — animate naturally, keep consistent' : 'NO — describe visually from description'}
- Talent photo: ${hasCharacterImage ? 'YES — use this person consistently' : 'NO — choose suitable talent'}

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

    const prompt = narrativeData.content?.find(b => b.type === 'text')?.text?.trim() || '';

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
