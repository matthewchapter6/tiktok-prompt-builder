// grok-generate-storylines.js
// Gemini Flash with vision — generates 5 storyline ideas for Grok tab
// Supports text-only, image (first frame), and reference images

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
    } = req.body;

    if (!productDescription) {
      return res.status(400).json({ error: 'productDescription is required' });
    }

    const funnelGuide = {
      upper:  'AWARENESS — hook with a relatable problem, no hard sell, make viewer curious',
      middle: 'CONSIDERATION — show product solving a real problem, build trust and credibility',
      lower:  'CONVERSION — create urgency, strong desire, clear reason to buy NOW',
    }[funnel] || 'GENERAL — showcase product attractively with a clear benefit';

    const durationNote = '10 seconds — enough for a Hook (0-3s) + Content (3-8s) + CTA (8-10s) arc';

    const systemInstruction = `You are a senior social media content producer and creative director with 10 years experience creating viral TikTok and Instagram Reels product ads.

You specialise in Grok AI video generation — you understand exactly what makes a great Grok video prompt: cinematic camera moves, specific lighting, precise character actions, authentic product interaction, and emotional storytelling arcs.

Your job is to propose 5 completely different, creative storyline concepts for a 10-second product video ad. Each storyline must feel totally different — different emotions, different scenes, different hooks, different energy.

Return ONLY valid JSON. No explanation. No markdown. No preamble.`;

    const userPrompt = `Propose 5 completely different 10-second video storyline concepts for this product.

PRODUCT: ${productDescription}
${productUSP ? `USP: ${productUSP}` : ''}
OBJECTIVE: ${funnelGuide}
DURATION: ${durationNote}
MODE: ${mode === 'image' ? 'Image-to-video — the first frame image is provided, animate FROM this scene' : mode === 'reference' ? 'Reference-to-video — reference images provided, use them as character/product references throughout' : 'Text-to-video — generate from scratch'}

RULES:
- Each storyline must have a completely different emotional hook
- Each must suggest a different scene or environment
- Each must feel like a different type of ad (lifestyle, demo, testimonial, cinematic, UGC)
- For 10s videos: structure as Hook (0-3s) + Content (3-8s) + CTA (8-10s)
- Be specific and cinematic — describe exactly what the camera sees
- ${mode === 'image' ? 'The first frame image is fixed — your storyline must animate naturally FROM that scene' : ''}
- ${mode === 'reference' ? 'Reference images show the product/character — they must appear consistently throughout' : ''}

Return exactly this JSON:
{
  "storylines": [
    {
      "id": 1,
      "title": "3-5 word catchy title",
      "hook": "What happens in seconds 0-3 (camera, action, emotion)",
      "content": "What happens in seconds 3-8 (product interaction, benefit shown)",
      "cta": "What happens in seconds 8-10 (closing shot, call to action)",
      "emotion": "Primary emotion targeted",
      "style": "e.g. UGC, cinematic, lifestyle, testimonial"
    }
  ]
}`;

    // Build Gemini request parts
    const parts = [];

    // Add images if provided (vision capability)
    if (images && images.length > 0) {
      images.forEach((img, idx) => {
        parts.push({
          inline_data: { mime_type: img.mimeType, data: img.data }
        });
        if (mode === 'image') {
          parts.push({ text: `This is the first frame image. The video will animate FROM this exact scene.` });
        } else {
          parts.push({ text: `Reference image ${idx + 1} (@reference${idx + 1}): Use this as a visual reference for the ${idx === 0 ? 'product' : 'character/element'} throughout the video.` });
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
          generationConfig: {
            temperature: 1.2,
            topP: 0.97,
            maxOutputTokens: 1500,
          },
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