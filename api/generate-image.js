export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt, productImage, talentImage, aspectRatio } = req.body;

    const parts = [];

    if (productImage) {
      parts.push({
        inline_data: { mime_type: productImage.mimeType, data: productImage.data }
      });
      parts.push({ text: "This is the product reference image. Use this exact product appearance." });
    }

    if (talentImage) {
      parts.push({
        inline_data: { mime_type: talentImage.mimeType, data: talentImage.data }
      });
      parts.push({ text: "This is the talent/character reference image. Use this exact person's appearance." });
    }

    parts.push({ text: prompt });

    const body = {
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],  // ← must include TEXT for this model
        imageConfig: {
          aspectRatio: aspectRatio || "9:16",
          imageSize: "1K"
        }
      }
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      const err = await response.json();
      console.error('Gemini error:', JSON.stringify(err));
      return res.status(response.status).json({ error: err });
    }

    const data = await response.json();

    // Log full response to Vercel logs
    console.log('Gemini full response:', JSON.stringify(data, null, 2));

    const parts_out = data.candidates?.[0]?.content?.parts || [];

    // Filter out thought parts — REST API marks them with `thoughtSignature` (not `thought: true`)
    const imagePart = parts_out.find(p => {
      if (!p.inline_data) return false;
      if (p.thought === true) return false;       // legacy flag
      if (p.thoughtSignature) return false;        // ← REST API thought marker
      return true;
    });

    if (!imagePart) {
      console.error('No image in response. Full data:', JSON.stringify(data));
      return res.status(500).json({
        error: 'No image returned from Gemini',
        debug: data
      });
    }

    res.status(200).json({
      imageData: imagePart.inline_data.data,
      mimeType: imagePart.inline_data.mime_type
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Image generation failed', details: error.message });
  }
}
