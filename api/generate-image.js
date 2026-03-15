export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { prompt, productImage, talentImage, aspectRatio } = req.body;

    // Build contents array
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

    // Map aspect ratio to Gemini's accepted image_size format
    const sizeMap = {
      "9:16": "1024x1792",
      "16:9": "1792x1024",
      "1:1":  "1024x1024",
    };
    const imageSize = sizeMap[aspectRatio] || "1024x1792";

    const body = {
      contents: [{ parts }],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
        image: { imageSize }
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
    const imagePart = candidate?.content?.parts?.find(p => p.inline_data);

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
