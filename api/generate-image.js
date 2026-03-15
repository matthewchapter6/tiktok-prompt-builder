export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
    try {
      const { prompt, productImage, talentImage, aspectRatio } = req.body;
  
      // Build contents array — text prompt first, then optional reference images
      const parts = [];
  
      // Add reference images if provided
      if (productImage) {
        parts.push({
          inline_data: {
            mime_type: productImage.mimeType,
            data: productImage.data
          }
        });
        parts.push({ text: "This is the product reference image. Use this exact product appearance." });
      }
  
      if (talentImage) {
        parts.push({
          inline_data: {
            mime_type: talentImage.mimeType,
            data: talentImage.data
          }
        });
        parts.push({ text: "This is the talent/character reference image. Use this exact person's appearance." });
      }
  
      // Main image generation prompt
      parts.push({ text: prompt });
  
      const body = {
        contents: [{ parts }],
        generationConfig: {
          responseModalities: ["IMAGE", "TEXT"],
          ...(aspectRatio && { aspectRatio })
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
  
      // Extract image from response
      const candidate = data.candidates?.[0];
      const imagePart = candidate?.content?.parts?.find(p => p.inline_data);
  
      if (!imagePart) {
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