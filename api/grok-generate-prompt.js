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
      reference: `REFERENCE-TO-VIDEO: ${referenceCount} reference image(s) provided. Use @reference1${referenceCount > 1 ? ', @reference2' : ''}${referenceCount > 2 ? `, @reference3` : ''} to refer to each. Grok will maintain visual consistency of these elements throughout.`,
    }[mode];

    const systemInstruction = `You are an expert Grok AI video prompt engineer with deep knowledge of xAI's Aurora engine capabilities.

You understand exactly what parameters produce the best Grok videos:
- Grok excels at cinematic camera work, physics-accurate motion, and native audio
- Grok follows detailed instructions precisely — be specific about camera moves, lighting, character actions
- Grok generates synchronized audio natively — specify music mood, ambient sounds, dialogue
- Structure prompts as: Opening → Action → Close with audio woven throughout
- Use real cinematography language: "slow dolly in", "rack focus to product", "handheld tracking shot"
- For 10-second videos: Hook (0-3s) must stop the scroll, Content (3-8s) shows the benefit, CTA (8-10s) drives action

Your prompt must be a single flowing paragraph — cinematic, specific, and action-focused.
Always end with negative constraints to prevent common AI video artifacts.`;

    const userPrompt = `Write an expert Grok AI video generation prompt for this 10-second ${ratioLabel} product marketing video.

PRODUCT: ${productDescription}
${productUSP ? `USP: ${productUSP}` : ''}
FUNNEL OBJECTIVE: ${funnelGuide}
MODE: ${modeInstructions}

CONFIRMED STORYLINE:
Title: ${storyline.title}
Hook (0-3s): ${storyline.hook}
Content (3-8s): ${storyline.content}
CTA (8-10s): ${storyline.cta}
Emotion: ${storyline.emotion}
Style: ${storyline.style}

PROMPT REQUIREMENTS:
1. Opening motion — what moves first, camera start position
2. Hook execution — exactly how seconds 0-3 grabs attention
3. Product interaction — how the product is shown and used naturally
4. Camera progression — specific moves (dolly, rack focus, push in, etc.)
5. Lighting — specific type that suits the scene and mood
6. Audio — music mood, ambient sounds, any dialogue or voiceover naturally woven in
7. CTA moment — closing shot composition and any on-screen action
8. Negative constraints — end with: "No text overlays, no artificial transitions, no warped hands or faces, product maintains exact size and proportions throughout, no competitor products visible."
${mode === 'reference' ? `9. Reference usage — naturally weave ${Array.from({length: referenceCount}, (_, i) => `@reference${i+1}`).join(', ')} into the prompt so Grok knows which reference applies to which visual element.` : ''}

Write as one flowing cinematic paragraph. Be specific, vivid, and actionable. Do not use bullet points.`;

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
            maxOutputTokens: 800,
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