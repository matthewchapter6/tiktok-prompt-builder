// director-agent.js
// Gemini Flash — analyses storyline and proposes optimal cinematography per clip
// Called when user enables "AI Director" toggle in Builder tab

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      storyline,       // numbered list of clip beats
      productName,
      productCategory,
      keyFeatures,
      usp,
      problem,
      benefit,
      funnel,
      tone,
      platform,
      numClips,
      clipDuration,
      talent,
      talentDetail,
    } = req.body;

    if (!storyline || !productName) {
      return res.status(400).json({ error: 'storyline and productName required' });
    }

    const systemInstruction = `You are a senior TikTok video director and cinematographer with 10 years of experience directing viral product ads.
You analyse a video storyline and propose the optimal cinematography settings for each clip.
You understand that different emotional beats require different camera work, lighting, and audio.
Return ONLY valid JSON. No explanation. No markdown. No preamble.`;

    const userPrompt = `Analyse this ${numClips}-clip ${clipDuration}s-per-clip TikTok product video and propose the best cinematography for each clip.

PRODUCT: ${productName} (${productCategory || 'general'})
KEY FEATURES: ${keyFeatures}
USP: ${usp}
PROBLEM: ${problem}
BENEFIT: ${benefit}
FUNNEL: ${funnel || 'middle'} funnel
TONE: ${tone || 'calm & warm'}
PLATFORM: ${platform || 'TikTok 9:16'}
TALENT: ${talent === 'no_talent' || !talent ? 'NO TALENT — product only, no human faces or bodies' : (talent + (talentDetail ? ', ' + talentDetail : ''))}

STORYLINE:
${storyline}

For each clip, propose the most effective:
- shot_type: what camera distance/angle serves this beat best
- camera_movement: what motion enhances the emotion
- lighting: what lighting suits the scene and tone
- audio_type: silent / ambient / voiceover / ambient+voiceover
- music_mood: what music feeling fits this clip's emotion
- voiceover_tone: how the voiceover should sound (if any)
- transition_out: how this clip should end/transition

Return this exact JSON:
{
  "clips": [
    {
      "clip_number": 1,
      "shot_type": "e.g. Close-up → Medium shot",
      "camera_movement": "e.g. Static open, slow push-in as tension builds",
      "lighting": "e.g. Natural daylight, slightly warm",
      "audio_type": "e.g. Ambient + voiceover",
      "music_mood": "e.g. Soft acoustic, slightly tense then relieved",
      "voiceover_tone": "e.g. Relatable, slightly frustrated",
      "transition_out": "e.g. Clean cut on product reveal"
    }
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
            temperature: 0.7,
            topP: 0.95,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('[director-agent] Gemini error:', JSON.stringify(data));
      return res.status(response.status).json({ error: 'Director agent failed', details: data });
    }

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    if (!raw) return res.status(500).json({ error: 'Empty response from Gemini' });

    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch (e) {
      console.error('[director-agent] JSON parse error:', e.message);
      return res.status(500).json({ error: 'Failed to parse director output', raw });
    }

    console.log(`[director-agent] Generated cinematography for ${parsed.clips?.length} clips`);
    return res.status(200).json(parsed);

  } catch (error) {
    console.error('[director-agent] Exception:', error.message);
    return res.status(500).json({ error: 'Director agent failed', details: error.message });
  }
}
