// grok-generate-prompt.js
// Expert Grok Prompt Engineer Agent
// Takes final storyline + mode + ratio → generates optimised Grok video prompt
// Includes always-on guardrails, inline @Image tags, dimensions, and prompt safety linter

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      mode,               // 'text' | 'image' | 'reference'
      storyline,          // the confirmed storyline object
      productDescription,
      productUSP,
      funnel,
      videoRatio,         // '9:16' | '16:9' | '1:1'
      referenceCount,     // number of reference images (for reference mode)
      lang,               // 'en' | 'zh' | 'bm'
    } = req.body;

    if (!storyline || !productDescription) {
      return res.status(400).json({ error: 'storyline and productDescription are required' });
    }

    const ratioLabel = videoRatio === '16:9' ? '16:9 landscape' : videoRatio === '1:1' ? '1:1 square' : '9:16 vertical portrait';

    const funnelGuide = {
      upper:  'AWARENESS — relatable problem hook, no hard sell, soft CTA like "follow for more"',
      middle: 'CONSIDERATION — demonstrate product solving a real problem, build trust',
      lower:  'CONVERSION — create urgency, strong desire, clear buy CTA',
    }[funnel] || 'GENERAL — showcase product attractively with clear benefit';

    const langInstruction = lang === 'zh'
      ? '\n\nIMPORTANT: Write the entire video prompt in Simplified Chinese (简体中文).'
      : lang === 'bm'
      ? '\n\nIMPORTANT: Write the entire video prompt in Bahasa Malaysia.'
      : '';

    // Build image tag references
    const count = referenceCount || 0;
    const productTags = mode === 'reference' && count > 0
      ? Array.from({ length: count }, (_, i) => `@Image${i + 1}`).join(', ')
      : null;

    const modeInstructions = {
      text: 'TEXT-TO-VIDEO: Generate entirely from text. Describe every visual element precisely — Grok has no reference images.',
      image: 'IMAGE-TO-VIDEO: The first frame image is fixed. Describe only HOW to animate FROM that scene — camera movement, subject action, product interaction.',
      reference: `REFERENCE-TO-VIDEO: ${count} reference image(s) provided as ${productTags}. You MUST write these tags inline in the prompt when describing the product and host — e.g. "the product (${productTags}) sits on the desk". Missing tags = Grok hallucinates appearance.`,
    }[mode];

    const systemInstruction = `You are an expert Grok AI video prompt engineer with deep knowledge of xAI's Aurora engine (Grok Imagine).${langInstruction}

PROMPT FRAMEWORK — always follow this exact order in one flowing paragraph:
[Subject + Primary Action] → [Location/Scene] → [Camera] → [Lighting] → [Audio] → [Product Lock Statement] → [Negative Constraints]

NON-NEGOTIABLE RULES:
1. FRONT-LOAD: First sentence = subject description + primary action. Grok weights the opening most heavily.${productTags ? `\n2. IMAGE TAGS INLINE: Write ${productTags} directly in the sentence describing the product — e.g. "the product (${productTags}) sits on the desk beside the host". Never describe the product without the tags.` : ''}
2. PRECISE LANGUAGE: No vague words like "cinematic", "dynamic", "beautiful". Be specific: "soft top-light with warm rim", "locked-off medium shot at chest height".
3. ONE FOCUS, ONE MOTION: One primary subject, one core action. No layered events or scene changes.
4. AUDIO REQUIRED: Specify music mood + at least one ambient sound.
5. PRODUCT LOCK STATEMENT (second-to-last sentence): "Keep the host's face, outfit, and ${productTags ? `${productTags} — same shape, color, finish, and size` : 'product appearance'} — consistent and unchanged throughout."
6. NEGATIVE CONSTRAINTS (always last): "No text overlays, no scene cuts, no warped or fused fingers, no warped faces, no duplicate person, no phantom second hand, no new objects, product maintains exact size and proportions, no transparency."

ALWAYS-ON GUARDRAILS — inject into every prompt:

PRODUCT LOCK:
- One product only — same exact product as reference
- Same shape, same color, same finish, same size
- Product remains solid and fully opaque — no transparency, no ghosting
- Product must appear READY-TO-USE — never in packaging, never wrapped
- Always show FRONT FACE of product toward camera — never back, side, or bottom

PHYSICS LOCK:
- No morphing, no deformation, no transparency
- No sudden appearance or disappearance of objects
- No object penetration (product does not pass through hands or body)
- No floating — product rests on surfaces or is gripped by hand
- One person only — no duplicate or secondary person in frame
- When host holds product: one hand visible only, five fingers fully visible and natural

MOTION LOCK — only these actions permitted:
- Host holds product steadily at chest level, facing camera
- Host slowly lifts product from table to chest level
- Host gently tilts product less than 20 degrees toward camera
- Host places product back on same surface
- Host gives small confident nod
NEVER: throwing, fast movement, spinning, walking, behind-body reveal, product flying, liquid pouring, setup demo, showing product back/side

PHYSICAL REALISM RULES:
- GRIP: Large or heavy product = host uses BOTH hands
- WEIGHT: Describe weight cues — "holds bottle firmly", "lifts box with slight effort"
- NO MAGIC PROPS: All objects must exist from frame 1`;

    const hookVisual    = storyline.hook_visual    || storyline.hook    || '';
    const hookScript    = storyline.hook_script    || '';
    const contentVisual = storyline.content_visual || storyline.content || '';
    const contentScript = storyline.content_script || '';
    const ctaVisual     = storyline.cta_visual     || storyline.cta     || '';
    const ctaScript     = storyline.cta_script     || '';

    const userPrompt = `Write one expert Grok AI video prompt for this 10-second ${ratioLabel} product marketing video. One flowing paragraph, 80–150 words.

PRODUCT: ${productDescription}
${productUSP ? `USP: ${productUSP}` : ''}
FUNNEL OBJECTIVE: ${funnelGuide}
MODE: ${modeInstructions}

CONFIRMED STORYLINE:
Title: ${storyline.title}
Host: ${storyline.host || 'East Asian/Chinese-looking host'}
Scene: ${storyline.scene || 'consistent environment'}

Hook (0-3s):
  Visual: ${hookVisual}
  Script: "${hookScript}"

Content (3-8s):
  Visual: ${contentVisual}
  Script: "${contentScript}"

CTA (8-10s):
  Visual: ${ctaVisual}
  Script: "${ctaScript}"

Emotion: ${storyline.emotion}

CRITICAL — HOST NARRATION IS REQUIRED:
Grok generates native audio including host voice. Weave all exact script lines into the audio section:
"Host says in a natural conversational tone: [hook_script]. Then: [content_script]. Closes with: [cta_script]."${productTags ? `

CRITICAL — IMAGE TAGS:
Write ${productTags} inline when describing the product. Write the character tag inline when describing the host (if character reference image provided). These must appear in context — not just at the end.` : ''}

REQUIRED ORDER:
1. Subject + opening action (who, what, emotional state)
2. Location/scene (one consistent environment, 1-2 specific details)
3. Camera (exact: locked-off medium shot, slow dolly-in, etc.)
4. Lighting (specific: "soft top-light with warm rim", "diffused window light")
5. Host narration + audio (exact scripts woven in + music mood + one ambient sound)
6. Product lock statement
7. Negative constraints

Write as one flowing paragraph. No bullet points. No headers. 80–150 words.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.9, topP: 0.95, maxOutputTokens: 400 },
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error('[grok-generate-prompt] Gemini error:', JSON.stringify(data));
      return res.status(response.status).json({ error: 'Prompt generation failed', details: data });
    }

    let prompt = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    if (!prompt) return res.status(500).json({ error: 'Empty response from Gemini' });

    // ── Prompt safety linter ──────────────────────────────────────────────────
    const lintWarnings = [];
    prompt = lintPrompt(prompt, lintWarnings);
    if (lintWarnings.length) console.warn(`[grok-generate-prompt] Linter rewrote ${lintWarnings.length} phrase(s)`);

    const title = storyline.title || prompt.substring(0, 50);

    console.log(`[grok-generate-prompt] mode=${mode} funnel=${funnel} ratio=${videoRatio}`);
    return res.status(200).json({ prompt, title, _lintWarnings: lintWarnings.length ? lintWarnings : undefined });

  } catch (error) {
    console.error('[grok-generate-prompt] Exception:', error.message);
    return res.status(500).json({ error: 'Prompt generation failed', details: error.message });
  }
}

// ── Prompt Safety Linter ──────────────────────────────────────────────────────

const RISKY_PHRASES = [
  [/\bfast(?:ly)?\s+(?:mov(?:es?|ing)|motion|action|pan|zoom|cut)\b/gi,         'controlled smooth movement'],
  [/\bdramatic\s+(?:mov(?:es?|ing)|motion|action|reveal|turn)\b/gi,             'gentle controlled movement'],
  [/\bdynamic\s+(?:mov(?:es?|ing)|motion|action|energy|shot)\b/gi,              'steady controlled shot'],
  [/\bcinematic\s+(?:mov(?:es?|ing)|motion|action|energy)\b/gi,                 'steady locked-off shot'],
  [/\bspinn?(?:ing|s|ed)?\b/gi,                                                  'gently tilting less than 20 degrees'],
  [/\bdanc(?:ing|es?|ed)\b/gi,                                                   'standing still'],
  [/\bjump(?:ing|s|ed)?\b/gi,                                                    'standing still'],
  [/\brunn?(?:ing|s|ed)?\b/gi,                                                   'standing still'],
  [/\bwalk(?:ing|s|ed)?\s+(?:while|with|toward|forward)\b/gi,                   'standing still while holding product'],
  [/\bthrow(?:ing|s|n|ew)?\b/gi,                                                 'slowly lifting'],
  [/\btoss(?:ing|es|ed)?\b/gi,                                                   'gently placing'],
  [/\bcatch(?:ing|es|ed)?\b/gi,                                                  'holding steadily'],
  [/\bfli(?:p|ps|pping|pped)\b/gi,                                               'gently tilting'],
  [/\bspray(?:ing|s|ed)?\b/gi,                                                   'holding product steadily'],
  [/\bpour(?:ing|s|ed)?\b/gi,                                                    'holding product steadily'],
  [/\bsplash(?:ing|es|ed)?\b/gi,                                                 'holding product steadily'],
  [/\btear(?:ing|s)?\s+(?:open|apart|package)\b/gi,                             'holding package steadily'],
  [/\bopen(?:ing|s|ed)?\s+(?:the\s+)?(?:package|box|bottle|lid|cap)\b/gi,       'holding product with packaging intact'],
  [/\bbite?(?:s|ing|ten)?\b/gi,                                                  'holding product near face'],
  [/\bmagically\b/gi,                                                             'smoothly'],
  [/\bsuddenly\b/gi,                                                              'smoothly'],
  [/\bappears?\s+(?:from\s+)?(?:nowhere|behind|thin\s+air)\b/gi,                'is already visible in scene'],
  [/\bbehind\s+(?:the\s+)?(?:back|body)\b/gi,                                    'at chest level'],
  [/\bfloating?\b/gi,                                                             'held steadily by hand'],
  [/(?<!no\s)(?<!no,\s)\bmorphing?\b/gi,                                         'remaining unchanged'],
  [/(?<!no\s)(?<!no,\s)\bdeform(?:ing|s|ed)?\b/gi,                              'remaining solid and unchanged'],
  [/\bplug(?:ging|s|ged)?\s+in\b/gi,                                             'holding product steadily'],
  [/\bconnect(?:ing|s|ed)?\s+(?:the\s+)?cable\b/gi,                             'holding product steadily'],
  [/\bset(?:ting)?\s+up\b/gi,                                                    'holding product toward camera'],
  [/\bunbox(?:ing|es|ed)?\b/gi,                                                  'holding product steadily'],
  [/\bunfold(?:ing|s|ed)?\b/gi,                                                  'holding product steadily'],
  [/\badjust(?:ing|s|ed)?\s+(?:the\s+)?(?:stand|angle|screen|monitor)\b/gi,     'holding product steadily'],
  [/\bpress(?:ing|es|ed)?\s+(?:the\s+)?button\b/gi,                             'pointing gently beside product'],
  [/\bopen(?:ing|s|ed)?\s+(?:the\s+)?(?:lid|box|flap|cover)\b/gi,              'holding product with packaging intact'],
  [/\brotate?(?:s|ing|d)?\b/gi,                                                  'gently tilting less than 20 degrees'],
  [/\bswing(?:ing|s)?\b/gi,                                                      'gently tilting'],
  [/\bgestures?\s+(?:widely|broadly|dramatically|at the chaos|around)\b/gi,     'points gently beside product'],
  [/\bconnects?\s+(?:up\s+)?(?:easily|simply|quickly|with\s+one\s+cable|in\s+seconds)\b/gi, 'works wherever I go'],
  [/\bjust\s+(?:plug|one\s+cable|connect)\b/gi,                                 'works wherever I go'],
  [/\bsets?\s+up\s+in\s+(?:seconds|minutes|one\s+minute|no\s+time)\b/gi,       'ready when I need it'],
  [/\beasy\s+to\s+(?:connect|set\s+up|plug\s+in|install)\b/gi,                 'works wherever I go'],
];

function lintPrompt(prompt, warnings = []) {
  let result = prompt;
  for (const [pattern, replacement] of RISKY_PHRASES) {
    const before = result;
    result = result.replace(pattern, replacement);
    if (result !== before) warnings.push({ pattern: pattern.source, replacement });
  }
  return result;
}
