// grok-generate-prompt.js
// Expert Grok Prompt Engineer Agent
// Takes final storyline + mode + ratio → generates optimised Grok video prompt

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      mode,               // 'text' | 'image' | 'reference'
      storyline,          // the confirmed storyline object {title, hook, content, cta, emotion, style}
      productDescription,
      productUSP,
      funnel,
      videoRatio,         // '9:16' | '16:9' | '1:1'
      referenceCount,     // number of reference images (for reference mode)
      lang,               // 'en' | 'zh' | 'bm'
    } = req.body;

    if (!storyline || !productDescription) {
      return res.status(400).json({ error: 'storyline and productDescription are required' });
    }

    const ratioLabel = videoRatio === '16:9' ? '16:9 landscape' : videoRatio === '1:1' ? '1:1 square' : '9:16 vertical portrait';

    const funnelGuide = {
      upper:  'AWARENESS — relatable problem hook, no hard sell, soft CTA like "follow for more"',
      middle: 'CONSIDERATION — demonstrate product solving a real problem, build trust',
      lower:  'CONVERSION — create urgency, strong desire, clear buy CTA',
    }[funnel] || 'GENERAL — showcase product attractively with clear benefit';

    const modeInstructions = {
      text: 'TEXT-TO-VIDEO: Generate entirely from text. Describe every visual element precisely — Grok has no reference images.',
      image: 'IMAGE-TO-VIDEO: The first frame image is fixed. Describe only HOW to animate FROM that scene — camera movement, subject action, product interaction.',
      reference: `REFERENCE-TO-VIDEO: ${referenceCount} reference image(s) provided. Use @Image1${referenceCount > 1 ? ', @Image2' : ''}${referenceCount > 2 ? ', @Image3' : ''} to refer to each in the prompt. Grok will maintain visual consistency of these elements throughout.`,
    }[mode];

    const langInstruction = lang === 'zh'
      ? '\n\nIMPORTANT: Write the entire video prompt in Simplified Chinese (简体中文). All scene descriptions, camera directions, audio cues, and CTA must be in Simplified Chinese.'
      : lang === 'bm'
      ? '\n\nIMPORTANT: Write the entire video prompt in Bahasa Malaysia. All scene descriptions, camera directions, audio cues, and CTA must be in Bahasa Malaysia.'
      : '';

    const referenceGuidance = mode === 'reference'
      ? `REFERENCE-TO-VIDEO RULES:
- Reference image(s) show the product/character. Tag them as ${Array.from({length: referenceCount}, (_, i) => `@Image${i+1}`).join(', ')}.
- Do NOT re-describe the reference image in full — Grok already sees it.
- Instead, describe what to ANIMATE (what moves, what the host does with it) and what to PRESERVE (product proportions, colour, host appearance).
- Example approach: "Host lifts @Image1 and holds it face-on to camera, turning it slowly to reveal the side profile..."`
      : '';

    const systemInstruction = `You are an expert Grok AI video prompt engineer with deep knowledge of xAI's Aurora engine (Grok Imagine).${langInstruction}

PROMPT FRAMEWORK — always follow this exact order in one flowing paragraph:
[Subject + Primary Action] → [Location/Scene] → [Camera Movement] → [Lighting/Visual Style] → [Audio/Sound] → [Stability Note] → [Negative Constraints]

NON-NEGOTIABLE RULES:
1. FRONT-LOAD: The very first sentence must name the subject and their primary action. Grok weights the opening most heavily.
2. LENGTH: 50–150 words total. Specific and tight — not a stream of consciousness. Every word earns its place.
3. ONE FOCUS, ONE MOTION: One primary subject, one core action per clip. Do not layer multiple events or scene changes.
4. PRECISE LANGUAGE: Never write vague words like "cinematic", "beautiful", or "stunning" without context. Instead specify HOW — e.g. "soft rim lighting with warm fill", "dolly-in from hip height", "wet pavement reflections".
5. AUDIO IS REQUIRED: Grok generates native synchronized audio. Always specify music mood + at least one ambient sound (e.g. "upbeat lo-fi beat, soft product click", "crowd murmur and gentle jazz").
6. STABILITY NOTE: Before the negative constraints, add one sentence locking in what must stay constant (e.g. "Keep the host's face, outfit and product appearance consistent throughout the clip.").
7. NEGATIVE CONSTRAINTS (always last): "No text overlays, no scene cuts, no warped hands or faces, product maintains exact size and proportions throughout."`;

    // Support both new narrative fields and legacy flat fields
    const hookVisual   = storyline.hook_visual   || storyline.hook    || '';
    const hookScript   = storyline.hook_script   || '';
    const contentVisual = storyline.content_visual || storyline.content || '';
    const contentScript = storyline.content_script || '';
    const ctaVisual    = storyline.cta_visual    || storyline.cta     || '';
    const ctaScript    = storyline.cta_script    || '';

    const userPrompt = `Write one expert Grok AI video prompt for this 10-second ${ratioLabel} product marketing video. One flowing paragraph, 50–150 words.

PRODUCT: ${productDescription}
${productUSP ? `USP: ${productUSP}` : ''}
FUNNEL OBJECTIVE: ${funnelGuide}
MODE: ${modeInstructions}
${referenceGuidance}

CONFIRMED STORYLINE (narrative style — host speaks directly to camera):
Title: ${storyline.title}
Host: ${storyline.host || 'East Asian/Chinese-looking host'}
Scene: ${storyline.scene || 'consistent environment'}

Hook (0-3s):
  Visual: ${hookVisual}
  Script: ${hookScript}

Content (3-8s):
  Visual: ${contentVisual}
  Script: ${contentScript}

CTA (8-10s):
  Visual: ${ctaVisual}
  Script: ${ctaScript}

Emotion: ${storyline.emotion}

CRITICAL — HOST NARRATION IS REQUIRED:
Grok generates native audio including the host's voice. Weave the exact script lines above into the audio section of the prompt using this format:
"Host says in a natural conversational tone: [hook_script]. Then: [content_script]. Closes with: [cta_script]."
Keep the voice authentic and conversational — not a voiceover, but someone talking directly to camera.

REQUIRED ELEMENTS IN ORDER:
1. Subject + opening action (first sentence — who, what they're doing, their emotional state)
2. Location/scene (one consistent environment, 1–2 specific visual details matching the scene above)
3. Camera move (use exact film terms: handheld follow, static medium shot, slow dolly-in, etc.)
4. Lighting (specific and sensory — e.g. "soft window light from left", "warm practical lamp behind host")
5. Host narration + audio (exact script lines woven in naturally + background music mood + one ambient sound)
6. Stability note ("Keep the host's face, outfit and product appearance consistent throughout the clip.")
7. Negative constraints (last sentence — always: "No text overlays, no scene cuts, no warped hands or faces, product maintains exact size and proportions throughout.")

Write as one flowing paragraph. No bullet points. No headers. 50–150 words.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.9,
            topP: 0.95,
            maxOutputTokens: 300,
          },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error('[grok-generate-prompt] Gemini error:', JSON.stringify(data));
      return res.status(response.status).json({ error: 'Prompt generation failed', details: data });
    }

    const prompt = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    if (!prompt) return res.status(500).json({ error: 'Empty response from Gemini' });

    // Auto-generate title from first line of storyline
    const title = storyline.title || prompt.substring(0, 50);

    console.log(`[grok-generate-prompt] mode=${mode} funnel=${funnel} ratio=${videoRatio}`);
    return res.status(200).json({ prompt, title });

  } catch (error) {
    console.error('[grok-generate-prompt] Exception:', error.message);
    return res.status(500).json({ error: 'Prompt generation failed', details: error.message });
  }
}