// storyline.js
// Gemini 2.0 Flash — Builder tab "Generate Storyline Idea" button
// Faster and cheaper than Claude for short creative list generation

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { system, messages } = req.body;

    if (!messages || !messages.length) {
      return res.status(400).json({ error: 'messages required' });
    }

    const userText = messages[0]?.content || '';

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: system || '' }] },
          contents: [{ role: 'user', parts: [{ text: userText }] }],
          generationConfig: {
            temperature: 1.0,
            topP: 0.95,
            maxOutputTokens: 1200,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('[storyline] Gemini error:', JSON.stringify(data));
      return res.status(response.status).json({ error: 'Gemini API error', details: data });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    if (!text) {
      return res.status(500).json({ error: 'Empty response from Gemini' });
    }

    console.log('[storyline] Generated successfully via Gemini Flash');

    // Return in Anthropic-compatible format so App.js parsing works unchanged
    return res.status(200).json({
      content: [{ type: 'text', text }]
    });

  } catch (error) {
    console.error('[storyline] Exception:', error.message);
    return res.status(500).json({ error: 'Storyline generation failed', details: error.message });
  }
}
