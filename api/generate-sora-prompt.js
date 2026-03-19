// generate-sora-prompt.js
// Option C: Gemini 2.0 Flash (narrative) + Claude Sonnet (technical config)
// Golden template: Subject+Environment → Motion → Camera → Lighting/Mood → Quality/Style → Negative constraints
// Category-aware cinematic styles + few-shot examples

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      productDescription, productUSP, storyline, aiDecideStoryline,
      salesFunnel, videoRatio, videoLength, productCategory,
      videoStyle, tone, cameraMotion, lightingStyle,
      backgroundSetting, audienceEmotion, restrictions,
      hasProductImage, hasCharacterImage,
    } = req.body;

    const ratioLabel = videoRatio === '9_16' ? '9:16 vertical portrait' : '16:9 horizontal landscape';
    const durationSec = videoLength === '5' ? '5' : '10';
    const aspectRatio = videoRatio === '9_16' ? '9:16' : '16:9';

    const funnelGuide = {
      upper:  'AWARENESS — open with a relatable pain point or lifestyle moment, no hard sell, soft CTA',
      middle: 'CONSIDERATION — demonstrate the product solving a real problem, build trust and desire',
      lower:  'CONVERSION — create strong urgency and desire, direct CTA like "shop now" or "limited stock"',
    }[salesFunnel] || 'GENERAL — showcase the product attractively, clear benefit, soft CTA';

    const userFilledAdvanced = videoStyle || tone || cameraMotion || lightingStyle || backgroundSetting || audienceEmotion;

    // ── Category-aware cinematic style guide ──────────────────────────────
    const categoryStyle = {
      tech_gadget: {
        environment: 'clean minimal workspace, glass surfaces, soft natural light from a window',
        motion: 'precise hand interactions, screens lighting up, seamless plug-in moments',
        camera: 'tight close-ups on details, slow rack focus from person to product',
        mood: 'clean, modern, confident — cool neutral tones with accent highlights',
        avoid: 'no cluttered backgrounds, no harsh overhead lighting, no fake holograms',
      },
      consumer_good: {
        environment: 'home setting, natural everyday environment relevant to the product',
        motion: 'natural human interaction with the product, real usage moments',
        camera: 'handheld documentary feel, medium shots with natural cut to close-up detail',
        mood: 'warm, relatable, authentic — golden tones, natural light',
        avoid: 'no overly staged setups, no perfect studio lighting that looks fake',
      },
      skincare: {
        environment: 'bright airy bathroom, vanity with soft morning light, clean white surfaces',
        motion: 'gentle product application, skin close-ups, satisfying texture moments',
        camera: 'extreme close-up on skin and product texture, slow tilt up to face',
        mood: 'soft, pure, clean — warm whites, pastel tones, dewy finish',
        avoid: 'no harsh shadows on skin, no dramatic contrast, no busy backgrounds',
      },
      vitamin_health: {
        environment: 'active lifestyle setting — gym, outdoor morning, clean kitchen',
        motion: 'energetic but controlled movement, product integrated into routine',
        camera: 'dynamic handheld tracking, wide to close-up transition showing transformation',
        mood: 'energetic, vital, optimistic — bright natural light, warm greens and whites',
        avoid: 'no clinical hospital aesthetics, no before/after clichés, no fake energy',
      },
      apparel: {
        environment: 'urban street, minimal studio, or lifestyle environment matching the brand',
        motion: 'natural confident movement — walking, turning, fabric catching the light',
        camera: 'full body to detail shots, slow pan along fabric texture, tracking walk shot',
        mood: 'aspirational, confident — cinematic color grade matching brand identity',
        avoid: 'no stiff posed mannequin look, no over-saturated colors, no busy patterns in background',
      },
      sports_fitness: {
        environment: 'sports court, gym, outdoor track, or relevant athletic environment',
        motion: 'athletic action — jumping, running, explosive movements, product in use',
        camera: 'dynamic low angle during action, slow motion capture of peak movement',
        mood: 'powerful, adrenaline, focused — high contrast, desaturated with color pop',
        avoid: 'no cartoonish motion blur, no flickering, no exaggerated superhero aesthetics',
      },
      food_beverage: {
        environment: 'clean kitchen surface, café setting, or dining environment',
        motion: 'appetising food interaction — pouring, slicing, steam rising, condensation',
        camera: 'macro close-up on texture and detail, slow pour shot, rack focus on product',
        mood: 'warm, appetising, sensory — warm amber tones, soft bokeh backgrounds',
        avoid: 'no artificial food colouring glow, no unrealistic steam effects, no messy plating',
      },
      home_living: {
        environment: 'beautifully styled home interior, natural light, tasteful décor',
        motion: 'product integrated into a living moment — someone using it naturally at home',
        camera: 'wide establishing shot of the room, slow push-in to product detail',
        mood: 'warm, aspirational, comfortable — golden interior light, soft shadows',
        avoid: 'no sterile empty rooms, no overly perfect CGI interiors, no floating objects',
      },
      jewellery_accessories: {
        environment: 'dark premium backdrop, velvet surface, or elegant lifestyle context',
        motion: 'slow rotation of the piece, light catching gemstones or metalwork',
        camera: 'extreme macro close-up of detail, slow circular orbit at low angle',
        mood: 'luxury, precious, timeless — dramatic rim lighting, deep shadows, gold and silver tones',
        avoid: 'no plastic-looking renders, no harsh direct flash lighting, no busy backgrounds',
      },
      software_app: {
        environment: 'modern device screen in real-world context, clean desk or lifestyle setting',
        motion: 'natural screen interaction, UI elements appearing, person reacting positively',
        camera: 'over-shoulder to screen close-up, rack focus from person to device',
        mood: 'clean, modern, efficient — cool blue-white tones with brand color accents',
        avoid: 'no fake holographic UI, no overly fast screen transitions, no generic stock look',
      },
      service: {
        environment: 'professional environment relevant to the service being offered',
        motion: 'real human interaction, problem being solved, transformation moment',
        camera: 'documentary handheld feel, medium close-up on human emotion and reaction',
        mood: 'trustworthy, human, genuine — warm natural tones, authentic feel',
        avoid: 'no overly corporate stock footage look, no stiff handshakes, no generic office clichés',
      },
    };

    // Default style for unknown categories
    const catStyle = categoryStyle[productCategory] || {
      environment: 'clean relevant environment matching the product use case',
      motion: 'natural product interaction showing the key benefit',
      camera: 'combination of wide establishing shot and close-up product detail',
      mood: 'aspirational yet authentic — natural lighting, cinematic color grade',
      avoid: 'no artificial effects, no cluttered backgrounds, no generic stock look',
    };

    // ── Duration blueprint ────────────────────────────────────────────────
    const durationBlueprint = durationSec === '5'
      ? `5 SECONDS — One single uninterrupted cinematic moment. Zero cuts.
One continuous camera move. One emotion. One clear message.
Opening frame (0-1s): Establish subject and environment immediately
Core action (1-4s): The single most impactful visual moment
Closing frame (4-5s): Strong final image — product hero or emotional peak
Dialogue: Maximum 1 sentence, 8-12 words. A tagline, not an explanation.`

      : `10 SECONDS — Complete narrative arc. Maximum 2 cuts.
Beat 1 HOOK (0-2s): The pain point or scroll-stopping opening. No product yet. Make viewer think "that's me."
Beat 2 REVEAL (2-7s): Product enters. Problem solved. Show the transformation. This is the longest beat.
Beat 3 CLOSE (7-10s): Hero product shot. The CTA line. Viewer should feel desire and know what to do.
Dialogue: 2-3 short lines total — one per beat. Conversational, not ad-copy stiff.`;

    // ── Element references ────────────────────────────────────────────────
    const elementInstructions = hasProductImage && hasCharacterImage
      ? `Two reference photos are provided:
@Element1 = the PRODUCT — use "@Element1" every time you reference the product visually
@Element2 = the CHARACTER/TALENT — use "@Element2" every time you reference the person
These are visual consistency anchors. Do not describe their appearance — just use the tags.
Example: "@Element2 picks up @Element1 and examines it closely"`

      : hasProductImage
        ? `One product photo is provided:
@Element1 = the PRODUCT — use "@Element1" every time you reference the product
Do not describe the product's appearance — Kling already has it from the photo.
For the talent: describe a realistic, appropriate person for this product (age, style, energy).`

        : hasCharacterImage
          ? `One character photo is provided:
@Element1 = the CHARACTER/TALENT — use "@Element1" every time you reference the person
Describe the product appearance in full detail based on the product description.`

          : `No reference photos — describe both the product appearance and talent type in full visual detail.
Do NOT use @Element1 or @Element2 tags.`;

    // ── Few-shot examples ─────────────────────────────────────────────────
    const fewShotExamples = `REFERENCE EXAMPLES of excellent Kling prompts:

Example 1 (Urban lifestyle, 10s):
"A cinematic wide shot of a modern Asian city at night during light rain. Neon signs reflecting on wet streets, cars moving slowly, pedestrians with umbrellas. Camera performs a slow dolly forward at street level. Soft cinematic lighting, realistic reflections, shallow depth of field. Ultra-realistic, high detail, film grain, 35mm lens look. No flickering, no motion distortion, no cartoon style."

Example 2 (Wearable tech, 10s):
"A modern lifestyle scene featuring a smart wearable on a young professional's wrist. Natural daylight coming through a window, soft shadows. The person casually moves their hand while checking the device. Camera uses a slow handheld close-up shot. Realistic skin tones, natural colors, cinematic lighting. Ultra-realistic, documentary style. No blur, no exaggerated motion, no artificial glow."

What makes these great:
- Scene and subject established in the first sentence
- Motion described precisely — what is actually moving and how
- Camera described as a separate, specific action
- Lighting described by quality and source, not just a label
- End with what NOT to do — prevents AI hallucination
- No structured tags, no bullet points, pure flowing prose`;

    // ── Gemini system instruction ─────────────────────────────────────────
    const geminiSystemInstruction = `You are a world-class creative director at a top digital advertising agency. You specialise in writing AI video generation prompts for Kling 2.6 Pro that produce broadcast-quality product ad videos.

You write in the GOLDEN TEMPLATE format — six elements woven into flowing cinematic prose:
1. Subject + Environment (who/what, where — establish the scene)
2. Primary motion in the scene (what is actually moving and how)
3. Camera movement description (specific cinematography term + direction)
4. Lighting and mood (quality, source, colour temperature, atmosphere)
5. Visual quality and style (realism level, film look, colour grade)
6. Negative constraints (what NOT to render — prevents AI hallucination)

STRICT RULES:
- Write in one or two flowing paragraphs — NO bullet points, NO numbered lists, NO section headers
- Use real cinematography language: "dolly forward", "rack focus", "handheld tracking", "Dutch angle", "whip pan"
- Dialogue must be woven naturally: the character says "..." or a warm voiceover says "..."
- Audio woven naturally: "soft ambient market sounds fade under a rising piano melody"
- Never use [VISUAL:] [CAMERA:] [VO:] [SOUND:] tags — they confuse Kling
- Never describe things as "beautiful" or "stunning" — be specific instead
- Never use vague mood words like "cinematic" alone — always say what kind of cinematic
- The negative constraints sentence at the end is critical — always include it
- Every prompt must feel like it was written by a human director, not an AI`;

    // ── Gemini user prompt ────────────────────────────────────────────────
    const geminiUserPrompt = `Write a Kling 2.6 Pro video ad prompt for this product.

${fewShotExamples}

━━━ YOUR BRIEF ━━━
Product: ${productDescription}
USP: ${productUSP}
Format: ${ratioLabel}
Duration: ${durationSec} seconds
Sales objective: ${funnelGuide}

${durationBlueprint}

━━━ PRODUCT CATEGORY CINEMATIC GUIDE ━━━
This is a ${productCategory || 'general'} product. Use this as your visual language guide:
- Environment: ${catStyle.environment}
- Motion: ${catStyle.motion}
- Camera: ${catStyle.camera}
- Mood: ${catStyle.mood}
- Avoid: ${catStyle.avoid}
${userFilledAdvanced
  ? `\nUser overrides (incorporate these naturally, they override the guide above where they conflict):
${videoStyle        ? `- Style: ${videoStyle}` : ''}
${tone              ? `- Tone: ${tone}` : ''}
${cameraMotion      ? `- Camera: ${cameraMotion}` : ''}
${lightingStyle     ? `- Lighting: ${lightingStyle}` : ''}
${backgroundSetting ? `- Background: ${backgroundSetting}` : ''}
${audienceEmotion   ? `- Emotion arc: ${audienceEmotion}` : ''}
${restrictions      ? `- Must avoid: ${restrictions}` : ''}`
  : ''}

━━━ STORYLINE ━━━
${aiDecideStoryline
  ? `Creative direction: You decide the best narrative.${storyline ? ` User inspiration: "${storyline}"` : ''} Create the most compelling story for this product and objective.`
  : storyline
    ? `Follow this storyline: "${storyline}". Expand it into a complete cinematic prompt with the golden template.`
    : `No storyline — create the most compelling narrative for this product and sales objective.`}

━━━ VISUAL REFERENCES ━━━
${elementInstructions}

━━━ ANTI-CLICHÉ RULES ━━━
Do NOT use these overused AI video tropes:
- No generic "golden hour" unless the product genuinely calls for it
- No floating product on marble surface unless it's jewellery or luxury goods
- No generic co-working space or coffee shop unless specified
- No slow orbital product shot unless the product design itself is the story
- No "transform your life" type generic voiceover copy
- No blue lens flare effects
- Be specific and original. Make this prompt feel like it was written for THIS product only.

Now write the prompt using the golden template as flowing cinematic prose:`;

    // ── Claude Sonnet config call ─────────────────────────────────────────
    const claudeConfigSystem = `You are a Kling AI technical configuration specialist. Return ONLY valid JSON. No explanation. No markdown. No extra text.`;

    const claudeConfigUser = `Return optimal Kling 2.6 Pro technical config for this ${durationSec}s ${salesFunnel || 'general'} marketing video.

Product category: ${productCategory || 'general'}
Ratio: ${aspectRatio}
Duration: ${durationSec}s (FIXED — do not change this)

User advanced settings (use exactly if provided, otherwise choose best for this product category):
- videoStyle: ${videoStyle || 'NOT SET — choose best for ' + (productCategory || 'general')}
- tone: ${tone || 'NOT SET — choose best'}
- cameraMotion: ${cameraMotion || 'NOT SET — choose best'}
- lightingStyle: ${lightingStyle || 'NOT SET — choose best'}
- backgroundSetting: ${backgroundSetting || 'NOT SET — choose best'}
- audienceEmotion: ${audienceEmotion || 'NOT SET — choose best emotion arc'}

Return exactly this JSON structure with all fields filled:
{"aspect_ratio":"${aspectRatio}","duration":"${durationSec}","cfg_scale":0.5,"resolved":{"videoStyle":"<value>","tone":"<value>","cameraMotion":"<value>","lightingStyle":"<value>","backgroundSetting":"<value>","audienceEmotion":"<value>","rationale":"<one sentence explaining cinematic choices for this product category>"}}`;

    // ── Run both API calls in parallel ────────────────────────────────────
    const [geminiRes, claudeRes] = await Promise.all([

      // Call 1: Gemini 2.0 Flash — narrative prompt
      fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: geminiSystemInstruction }]
          },
          contents: [{
            role: 'user',
            parts: [{ text: geminiUserPrompt }]
          }],
          generationConfig: {
            temperature: 1.0,       // high creativity
            topP: 0.95,
            maxOutputTokens: durationSec === '5' ? 400 : 700,
          }
        }),
      }),

      // Call 2: Claude Sonnet — technical JSON config
      fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          system: claudeConfigSystem,
          messages: [{ role: 'user', content: claudeConfigUser }],
        }),
      }),
    ]);

    const [geminiData, claudeData] = await Promise.all([
      geminiRes.json(),
      claudeRes.json(),
    ]);

    // ── Extract narrative prompt from Gemini ──────────────────────────────
    if (!geminiRes.ok) {
      console.error('Gemini error:', JSON.stringify(geminiData));
      return res.status(geminiRes.status).json({ error: 'Gemini prompt generation failed', details: geminiData });
    }
    const prompt = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    if (!prompt) {
      console.error('Gemini returned empty prompt. Full response:', JSON.stringify(geminiData));
      return res.status(500).json({ error: 'Gemini returned empty response' });
    }

    // ── Extract technical config from Claude ──────────────────────────────
    let videoConfig = { aspect_ratio: aspectRatio, duration: durationSec, cfg_scale: 0.5, resolved: {} };
    if (claudeRes.ok) {
      try {
        const raw = claudeData.content?.find(b => b.type === 'text')?.text?.trim() || '{}';
        const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
        videoConfig = {
          ...parsed,
          // Always enforce user-selected values — never let AI override
          aspect_ratio: aspectRatio,
          duration: durationSec,
          cfg_scale: 0.5,
        };
      } catch (e) {
        console.error('Claude config JSON parse error:', e.message);
      }
    }

    console.log(`[generate-sora-prompt] ${durationSec}s video | Category: ${productCategory || 'general'} | Words: ${prompt.split(/\s+/).length}`);
    console.log(`[generate-sora-prompt] Resolved config:`, JSON.stringify(videoConfig.resolved));

    res.status(200).json({ prompt, videoConfig });

  } catch (error) {
    console.error('generate-sora-prompt error:', error);
    res.status(500).json({ error: 'Prompt generation failed', details: error.message });
  }
}
