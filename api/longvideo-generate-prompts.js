// longvideo-generate-prompts.js
// Generates 3 separate prompts for an 18s chained Grok video:
//   Prompt 1 — Full cinematic brief for reference-to-video (Act 1, 6s Hook)
//   Prompt 2 — Action-only continuation for extend-video (Act 2, 6s Content)
//   Prompt 3 — Action-only continuation for extend-video (Act 3, 6s CTA)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      storyline,           // { title, hook, content, cta, host, scene, emotion, style }
      productDescription,
      productUSP,
      funnel,
      videoRatio,          // '9:16' | '16:9' | '1:1'
      shape,               // optional
      dimensions,          // optional: { height, width, depth }
      lang,                // 'en' | 'zh' | 'bm'
    } = req.body;

    if (!storyline || !productDescription) {
      return res.status(400).json({ error: 'storyline and productDescription are required' });
    }

    const ratioLabel = videoRatio === '16:9' ? '16:9 landscape' : videoRatio === '1:1' ? '1:1 square' : '9:16 vertical portrait';

    const funnelGuide = {
      upper:  'AWARENESS — relatable hook, no hard sell, soft CTA like "follow for more"',
      middle: 'CONSIDERATION — demonstrate solving a real problem, build trust',
      lower:  'CONVERSION — create urgency, desire, clear buy CTA',
    }[funnel] || 'GENERAL — showcase product attractively with clear benefit';

    const dimParts = [];
    if (dimensions?.height) dimParts.push(`${dimensions.height}cm tall`);
    if (dimensions?.width)  dimParts.push(`${dimensions.width}cm wide`);
    if (dimensions?.depth)  dimParts.push(`${dimensions.depth}cm deep`);
    const shapeContext = shape
      ? `Product shape: ${shape}${dimParts.length ? `, approximately ${dimParts.join(' × ')}` : ''}. Ensure host grip and interactions are physically realistic.`
      : '';

    const langInstruction = lang === 'zh'
      ? '\n\nIMPORTANT: Write ALL three prompts entirely in Simplified Chinese (简体中文).'
      : lang === 'bm'
      ? '\n\nIMPORTANT: Write ALL three prompts entirely in Bahasa Malaysia.'
      : '';

    const systemInstruction = `You are an expert Grok AI video prompt engineer specialising in 18-second chained product marketing videos.${langInstruction}

You understand how the 3-clip chain works technically:
- Clip 1 (reference-to-video): generates a 6s video using the product image as @Image1 reference. Needs a FULL cinematic brief.
- Clip 2 (extend-video): extends Clip 1. Grok already knows the scene, host, lighting, and style from Clip 1. Only needs the NEW ACTION for seconds 6-12.
- Clip 3 (extend-video): extends Clip 2. Again — only the new action for seconds 12-18.

CRITICAL for Prompt 2 and Prompt 3:
- Do NOT repeat camera setup, lighting, style, or character description — Grok inherits all of that from the previous clip
- Only describe what CHANGES or CONTINUES: the host's actions, movements, speech, product interaction
- Keep extend prompts SHORT (2-4 sentences max) and action-focused
- Start extend prompts with "Continue the scene:" to signal continuation
- The product must remain visible/in-hand for Prompt 2 per the story design
- Prompt 3 should deliver the CTA with product still visible or placed on surface in shot`;

    const userPrompt = `Write 3 prompts for this 18-second product marketing video chain.

PRODUCT: ${productDescription}
${productUSP ? `USP: ${productUSP}` : ''}
${shapeContext}
FUNNEL: ${funnelGuide}
RATIO: ${ratioLabel}
HOST: ${storyline.host || 'To be determined by Grok based on product'}
SCENE: ${storyline.scene || 'Clean, product-appropriate environment'}
STYLE: ${storyline.style || 'Cinematic'}

CONFIRMED STORYLINE:
Title: ${storyline.title}
Act 1 — Hook (0-6s): ${storyline.hook}
Act 2 — Content (6-12s): ${storyline.content}
Act 3 — CTA (12-18s): ${storyline.cta}
Emotion: ${storyline.emotion}

---

PROMPT 1 REQUIREMENTS (reference-to-video, 6s):
- Full cinematic brief as one flowing paragraph
- Use @Image1 to refer to the product reference image — weave naturally (e.g. "holding @Image1", "showcasing @Image1")
- Include: host description, opening camera position/motion, Act 1 action, scene/environment, lighting, audio mood
- End with: "No text overlays, no warped hands or faces, product maintains exact size and proportions, no scene cuts."

PROMPT 2 REQUIREMENTS (extend-video, 6s):
- Start with "Continue the scene:"
- Describe ONLY the new actions for seconds 6-12 (Act 2 content)
- 2-4 sentences maximum — action and movement only
- Do NOT re-describe scene, lighting, host appearance, or camera setup

PROMPT 3 REQUIREMENTS (extend-video, 6s):
- Start with "Continue the scene:"
- Describe ONLY the new actions for seconds 12-18 (Act 3 CTA)
- 2-4 sentences maximum — host CTA delivery, closing gesture
- Product should still be visible or deliberately placed in shot

Return exactly this JSON (no markdown, no extra keys):
{
  "prompt1": "...",
  "prompt2": "...",
  "prompt3": "..."
}`;

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
            maxOutputTokens: 1500,
          },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error('[longvideo-generate-prompts] Gemini error:', JSON.stringify(data));
      return res.status(response.status).json({ error: 'Prompt generation failed', details: data });
    }

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    if (!raw) return res.status(500).json({ error: 'Empty response from Gemini' });

    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch (e) {
      console.error('[longvideo-generate-prompts] Parse error:', e.message);
      return res.status(500).json({ error: 'Failed to parse prompts', raw });
    }

    if (!parsed.prompt1 || !parsed.prompt2 || !parsed.prompt3) {
      return res.status(500).json({ error: 'Incomplete prompts returned', raw });
    }

    console.log(`[longvideo-generate-prompts] funnel=${funnel} ratio=${videoRatio} title="${storyline.title}"`);
    return res.status(200).json(parsed);

  } catch (error) {
    console.error('[longvideo-generate-prompts] Exception:', error.message);
    return res.status(500).json({ error: 'Prompt generation failed', details: error.message });
  }
}
