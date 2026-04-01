// grok-generate-storylines.js
// Gemini Flash with vision — generates 5 narrative storyline ideas for Short Video (Grok) tab
// Follows the same narrative framework as Long Video for consistency

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
      ? '\nMODE NOTE: The first frame image is fixed — the story must animate naturally FROM that exact scene.'
      : mode === 'reference'
      ? '\nMODE NOTE: Reference image(s) show the product/character — they must appear consistently throughout.'
      : '';

    const systemInstruction = `You are a short-form video scriptwriter specialising in narrative-style product stories for TikTok and Instagram Reels.

STORYTELLING FORMAT (non-negotiable):
- The host is a STORYTELLER, not an advertiser. They speak directly to camera like a trusted friend sharing a genuine discovery.
- SAME SCENE throughout — one location, one consistent environment, no cuts to different places.
- MINIMAL HOST MOVEMENT — host stays seated or standing in frame. Only allowed movements: holding product up to show, placing it on a surface, picking it up. No walking, no dramatic transitions.
- Host NARRATES the entire video in first-person voice ("I was so tired of...", "Then I found...", "Now I never...").
- NEVER use advertiser language: no "amazing", "incredible", "game-changer", "life-changing". Use honest, specific, conversational words.
- DEFAULT HOST APPEARANCE: East Asian / Chinese-looking host unless the product specifically targets a different demographic.

NARRATIVE ARC for 10-second video (strict):
- Hook (0-3s): Open mid-frustration. Host expresses a real, relatable pain point in first person. The scene reflects the "before" state visually. Viewer should think "that's exactly me."
- Content (3-8s): Host introduces the product as a natural discovery. Shows it simply — holds it up, demonstrates one key thing. Narrates what it does in plain, honest language.
- CTA (8-10s): Host describes the "after" state — relief, satisfaction, improvement. Ends with a low-pressure, natural CTA ("link in bio", "I'll leave it below").

TONE RULES:
- Conversational, authentic, slightly vulnerable — NOT polished ad energy
- The pain point must feel REAL and relatable before the product is introduced
- Script lines must sound like something a real person would actually say out loud

Return ONLY valid JSON. No explanation. No markdown.${langInstruction}`;

    const userPrompt = `Propose 5 completely different 10-second narrative product stories for this product.

PRODUCT: ${productDescription}
${productUSP ? `USP: ${productUSP}` : ''}
OBJECTIVE: ${funnelGuide}
DURATION: 10 seconds = Hook (0-3s) + Content (3-8s) + CTA (8-10s)${modeContext}

DIFFERENTIATION RULES — each story must differ by:
- A completely different pain point or life situation that creates the problem
- A different life context (e.g. travelling, at home, at work, with family, morning routine, etc.)
- A different emotional angle (frustration, embarrassment, exhaustion, overwhelm, anxiety, etc.)
- A different type of person whose life this story belongs to

REFERENCE EXAMPLE (match this tone and format exactly):
Product: Desk organizer
hook_visual: "Host sits at a cluttered desk, sighs, gestures at the mess around them"
hook_script: "I was so sick of my desk looking like a disaster zone every single morning..."
content_visual: "Host picks up organizer, slots items in one by one while talking to camera"
content_script: "Then I found this — everything just clicks into place. Took me five minutes to set up."
cta_visual: "Host leans back satisfied, tidy desk visible behind them, product sitting on desk"
cta_script: "Now everything has a place. If your desk looks like mine did — link in bio."

Return exactly this JSON:
{
  "storylines": [
    {
      "id": 1,
      "title": "3-5 word catchy title",
      "style": "narrative",
      "host": "gender, age range, look/energy that fits this specific pain point and person",
      "scene": "One consistent location and setup used across all 3 beats",
      "emotion": "Primary emotion targeted (e.g. relief, relatability, satisfaction)",
      "hook_visual": "What is physically visible in Hook (0-3s) — the before state and host body language",
      "hook_script": "Exact words the host says in Hook — first-person, pain point, conversational tone",
      "content_visual": "Minimal visual action in Content (3-8s) — host holds/shows/uses product while talking",
      "content_script": "Exact words in Content — what the product does, plain language, no hype",
      "cta_visual": "Final visual in CTA (8-10s) — after state, product visible, host looks satisfied",
      "cta_script": "Exact words in CTA — satisfying resolution + natural low-pressure CTA"
    }
  ]
}`;

    const parts = [];

    if (images && images.length > 0) {
      images.forEach((img, idx) => {
        parts.push({ inline_data: { mime_type: img.mimeType, data: img.data } });
        if (mode === 'image') {
          parts.push({ text: `This is the first frame image. The video will animate FROM this exact scene.` });
        } else {
          parts.push({ text: `Reference image ${idx + 1}: Use this as a visual reference for the ${idx === 0 ? 'product' : 'character/element'} — ensure host interactions are physically realistic.` });
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

    console.log(`[grok-generate-storylines] mode=${mode} funnel=${funnel} stories=${parsed.storylines?.length}`);
    return res.status(200).json(parsed);

  } catch (error) {
    console.error('[grok-generate-storylines] Exception:', error.message);
    return res.status(500).json({ error: 'Storyline generation failed', details: error.message });
  }
}
