// generate-storylines.js
// Gemini 2.0 Flash generates 5 creative storyline proposals
// Used in Flow B when user selects "AI decides storyline"

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
      salesFunnel,
      videoLength,
      hasProductImage,
      hasCharacterImage,
    } = req.body;

    const durationSec = videoLength === '5' ? '5' : '10';

    const funnelGuide = {
      upper:  'AWARENESS — hook with a relatable problem, no hard sell',
      middle: 'CONSIDERATION — show product solving a real problem, build trust',
      lower:  'CONVERSION — strong desire and urgency, clear buy CTA',
    }[salesFunnel] || 'GENERAL — showcase product attractively with clear benefit';

    const systemInstruction = `You are a senior TikTok content creator and video director with 10 years of experience creating viral product ads. You specialise in short-form video storytelling that stops the scroll and drives conversions.

Your job is to propose 5 completely different, creative storyline concepts for a ${durationSec}-second product video ad. Each storyline must feel totally different from the others — different emotions, different scenes, different hooks, different characters.

Return ONLY valid JSON. No explanation. No markdown. No preamble.`;

    const userPrompt = `Propose 5 completely different storyline concepts for this product video ad.

PRODUCT: ${productDescription}
USP: ${productUSP}
CATEGORY: ${productCategory || 'general'}
DURATION: ${durationSec} seconds
OBJECTIVE: ${funnelGuide}
HAS PRODUCT PHOTO: ${hasProductImage ? 'YES' : 'NO'}
HAS CHARACTER PHOTO: ${hasCharacterImage ? 'YES — this specific character must appear in the video' : 'NO — Gemini decides if/what character to use'}

RULES FOR THE 5 STORYLINES:
- Each must have a completely different emotional hook (curiosity, desire, fear of missing out, aspiration, humour, relatability, shock, etc.)
- Each must suggest a different scene/environment
- Each must feel like a different type of ad (lifestyle, demonstration, testimonial, cinematic, UGC, etc.)
- Keep each description SHORT — 2-3 sentences max
- Make each feel specific and vivid, not generic
- Tailor each to the ${durationSec}s duration — short and punchy for 5s, narrative arc for 10s

Return this exact JSON structure:
{
  "storylines": [
    {
      "id": 1,
      "title": "Short catchy title (3-5 words)",
      "description": "2-3 sentence description of what happens in the video. What does the viewer see? What emotion does it create? What is the hook?",
      "hook": "The opening line or visual hook (1 sentence)",
      "emotion": "Primary emotion this targets (e.g. desire, relatability, urgency)"
    },
    ... (5 total)
  ]
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
            temperature: 1.2,
            topP: 0.97,
            maxOutputTokens: 1200,
          },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error('Gemini error:', JSON.stringify(data));
      return res.status(response.status).json({ error: 'Storyline generation failed', details: data });
    }

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    if (!raw) return res.status(500).json({ error: 'Empty response from Gemini' });

    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch (e) {
      console.error('JSON parse error:', e.message, 'Raw:', raw.substring(0, 200));
      return res.status(500).json({ error: 'Failed to parse storylines', raw });
    }

    console.log(`[generate-storylines] Generated ${parsed.storylines?.length} storylines`);
    res.status(200).json(parsed);

  } catch (error) {
    console.error('generate-storylines error:', error);
    res.status(500).json({ error: 'Storyline generation failed', details: error.message });
  }
}
