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
      storyline,
      aiDecideStoryline,
      salesFunnel,
      videoRatio,
      videoLength,
      // Advanced settings — all optional
      videoStyle,
      tone,
      cameraMotion,
      lightingStyle,
      backgroundSetting,
      audienceEmotion,
      restrictions,
      // Product/character images as base64 for visual context
      hasProductImage,
      hasCharacterImage,
    } = req.body;

    const ratioLabel = videoRatio === '9_16' ? '9:16 vertical (portrait)' : '16:9 horizontal (landscape)';
    const funnelGuide = {
      upper: 'AWARENESS — open with a relatable problem, do not hard sell, end with soft CTA like "follow for more"',
      middle: 'CONSIDERATION — show the product solving a problem, build trust, mid-strength CTA',
      lower: 'CONVERSION — urgency and desire, strong direct CTA to buy or visit link',
    }[salesFunnel] || 'GENERAL — show the product attractively, clear benefit, soft CTA';

    const hasAdvanced = videoStyle || tone || cameraMotion || lightingStyle || backgroundSetting || audienceEmotion;

    const systemPrompt = `You are a world-class video director and prompt engineer specialising in AI-generated short-form product promotion videos.

Your job is to write a single, professional, structured video generation prompt for Kling AI (image-to-video model).

RULES:
- Write in English only
- Output ONLY the final prompt — no explanation, no preamble, no markdown
- Length: 150–250 words
- Be specific about visuals, motion, lighting, mood, and camera
- The prompt must result in a high-quality product promotion video
- Always end with a clear description of the final closing shot`;

    const userMessage = `Write a Kling AI video generation prompt for this product promotion video.

VIDEO SPECS:
- Ratio: ${ratioLabel}
- Length: ${videoLength} seconds
- Sales Funnel Stage: ${funnelGuide}

PRODUCT INFO:
- Description: ${productDescription}
- USP (Unique Selling Point): ${productUSP}
${aiDecideStoryline
        ? `- Storyline: AI should create one${storyline ? `. Use this as inspiration: ${storyline}` : ''}`
        : storyline
          ? `- Storyline / Key beats (follow this): ${storyline}`
          : '- Storyline: Not provided — create an engaging one based on the product and funnel stage'}

VISUAL ASSETS PROVIDED:
- Product photo: ${hasProductImage ? 'YES — animate the product naturally, keep it consistent throughout' : 'NO — describe the product visually based on the description'}
- Character/talent photo: ${hasCharacterImage ? 'YES — use this person as the talent, keep their appearance consistent' : 'NO — choose a suitable talent type based on the product'}

${hasAdvanced ? `ADVANCED SETTINGS (user-specified — follow these exactly):
${videoStyle ? `- Video style: ${videoStyle}` : ''}
${tone ? `- Tone: ${tone}` : ''}
${cameraMotion ? `- Camera motion: ${cameraMotion}` : ''}
${lightingStyle ? `- Lighting: ${lightingStyle}` : ''}
${backgroundSetting ? `- Background/environment: ${backgroundSetting}` : ''}
${audienceEmotion ? `- Character emotion arc: ${audienceEmotion}` : ''}
${restrictions ? `- Restrictions: ${restrictions}` : ''}` : `ADVANCED SETTINGS: Not provided by user — you decide the best values for:
- Video style and tone (match the product category and funnel stage)
- Camera angles and movement (make it dynamic and engaging)
- Background/environment (realistic, relevant to product use case)
- Lighting (cinematic quality)
- Character emotion arc (relatable → satisfied/excited)
- Any other cinematic details that improve quality`}

Now write the complete Kling AI video prompt:`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data });

    const prompt = data.content?.find(b => b.type === 'text')?.text?.trim() || '';
    res.status(200).json({ prompt });
  } catch (error) {
    console.error('generate-sora-prompt error:', error);
    res.status(500).json({ error: 'Prompt generation failed', details: error.message });
  }
}
