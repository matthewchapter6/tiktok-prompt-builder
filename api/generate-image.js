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
      parts.push({ inline_data: { mime_type: productImage.mimeType, data: productImage.data } });
      parts.push({ text: "This is the product reference image. Use this exact product appearance." });
    }

    if (talentImage) {
      parts.push({ inline_data: { mime_type: talentImage.mimeType, data: talentImage.data } });
      parts.push({ text: "This is the talent/character reference image. Use this exact person's appearance." });
    }

    parts.push({ text: prompt });

    // Valid aspectRatio values: "1:1","9:16","16:9","3:4","4:3","2:3","3:2", etc.
    // Valid imageSize values: "512px", "1K", "2K", "4K" — uppercase K required
    const body = {
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
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
    const candidate = data.candidates?.[0];
    
    // Skip thought parts, find the actual output image
    const imagePart = candidate?.content?.parts?.find(p => p.inline_data && !p.thought);

    if (!imagePart) {
      console.error('No image in response:', JSON.stringify(data));
      return res.status(500).json({ error: 'No image returned from Gemini' });
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
