import { OPTS, FUNNEL_OPTIONS } from "../constants/options";

export const clipSec = plan => plan === "pro" ? 10 : 6;

export const calcClips = (plan, dur) => {
  const cs = clipSec(plan);
  const total = parseInt(dur) || cs;
  return Math.ceil(total / cs);
};

export const settingLabel = f => {
  if (f.settingPreset === "custom") return f.settingCustom || "Custom location";
  return OPTS.settingPreset.find(o => o.value === f.settingPreset)?.label || "Not specified";
};

export const lightingLabel = f => {
  if (f.lightingPreset === "custom") return f.lightingCustom || "Custom lighting";
  return OPTS.lightingPreset.find(o => o.value === f.lightingPreset)?.label || "Natural daylight";
};

export const buildClipPrompts = (f, storyline) => {
  const cs = clipSec(f.grokPlan);
  const total = parseInt(f.totalDuration) || cs;
  const numClips = Math.ceil(total / cs);
  const funnelOpt = FUNNEL_OPTIONS.find(o => o.value === f.funnel);
  const toneLabel = f.tone.length ? f.tone.join(", ") : "calm & warm";
  const camOpt = OPTS.cameraMove.find(o => o.value === f.cameraMove);
  const heroOpt = OPTS.heroAngle.find(o => o.value === f.heroAngle);
  const talentOpt = OPTS.talent.find(o => o.value === f.talent);
  const styleOpt = OPTS.videoStyle.find(o => o.value === f.videoStyle);
  const ctaLabel = f.cta.map(c => OPTS.cta.find(o => o.value === c)?.label).filter(Boolean).join(" / ");
  const restrictions = f.restrictions.map(r => `❌ ${OPTS.restrictions.find(o => o.value === r)?.label}`).join("  ");

  const baseContext = `
PRODUCT: ${f.productName} | ${f.productCategory}
COLORS: ${f.keyColors || "as per product"}
KEY FEATURES: ${f.keyFeatures}
USP: ${f.usp || f.keyBenefit || f.keyFeatures}
SALES FUNNEL: ${funnelOpt?.label || ""} (${funnelOpt?.tag || ""})
FUNNEL OBJECTIVE: ${funnelOpt?.objective || ""}
FUNNEL APPROACH: ${funnelOpt?.examples?.join(", ") || ""}
STYLE: ${styleOpt?.label} | TONE: ${toneLabel}
LOCATION: ${settingLabel(f)}${f.settingDetail ? ` — ${f.settingDetail}` : ""}
LIGHTING: ${lightingLabel(f)}
TALENT: ${f.talent !== "no_talent" ? `${talentOpt?.label}${f.talentStyle.length ? ", " + f.talentStyle.join(", ") : ""}${f.talentDetail ? ", " + f.talentDetail : ""}` : "No talent — product only"}
CAMERA: ${camOpt?.label} | HERO ANGLE: ${heroOpt?.label || "45° elevated"}
${restrictions ? `RESTRICTIONS: ${restrictions}` : ""}`.trim();

  const storyLines = storyline ? storyline.split("\n").filter(l => l.trim()) : [];

  const clips = [];
  for (let i = 0; i < numClips; i++) {
    const clipNum = i + 1;
    const startSec = i * cs;
    const endSec = Math.min((i + 1) * cs, total);
    const actualDur = endSec - startSec;
    const isLast = clipNum === numClips;
    const isFirst = clipNum === 1;

    const beatHint = storyLines[i] ? `SCENE BEAT: ${storyLines[i]}` :
      isFirst ? `SCENE BEAT: Hook — grab attention immediately. Show: ${f.problemStatement || f.keyBenefit || f.keyFeatures}` :
      isLast ? `SCENE BEAT: Close — ${ctaLabel || "hero shot of product, clean and confident"}` :
      `SCENE BEAT: Middle — demonstrate product benefit naturally. Focus on: ${f.keyBenefit || f.keyFeatures}`;

    clips.push({
      label: `CLIP ${clipNum} of ${numClips}`,
      timing: `${startSec}s – ${endSec}s (${actualDur}s)`,
      isLast,
      isFirst,
      prompt: `═══════════════════════════════════
🎬 GROK VIDEO PROMPT — CLIP ${clipNum}/${numClips}
${f.grokPlan === "pro" ? "⭐ Grok Pro" : "🆓 Grok Free"} | ${actualDur}s clip | Timeline: ${startSec}s–${endSec}s
═══════════════════════════════════

${baseContext}

${beatHint}

${isFirst ? `HOOK APPROACH: ${f.hook.map(h => OPTS.hooks.find(o => o.value === h)?.label).filter(Boolean).join(" + ")}
Open strong — first 1–2 seconds must stop the scroll.` : ""}
${isLast ? `CTA: ${ctaLabel}
End on clean hero shot — ${heroOpt?.label || "45° elevated"} — product centered, no distractions.` : ""}
${f.productRules ? `\nPRODUCT RULES:\n${f.productRules.split("\n").map(l => "• " + l).join("\n")}` : ""}
${f.voLang && f.voLang !== "none" ? `\nAUDIO: Natural audio + voiceover in ${OPTS.voLang.find(o => o.value === f.voLang)?.label}. Tone: ${f.voTone || "conversational, not scripted"}.` : "\nAUDIO: Natural ambient sound only — no music, no voiceover."}
${clipNum < numClips ? `\n⚡ CONTINUITY NOTE: This clip will be stitched with Clip ${clipNum + 1}. End on a clean frame — avoid abrupt motion cuts.` : ""}

❗ OVERALL: Everything must feel authentic, natural, purposeful. Not staged. Not an ad — even if it is one.
═══════════════════════════════════`
    });
  }
  return clips;
};

export const fetchStoryline = async (f, setLoading, setStoryline, setError) => {
  setLoading(true); setError("");
  const numClips = calcClips(f.grokPlan, f.totalDuration);
  const cs = clipSec(f.grokPlan);
  try {
    const res = await fetch("/api/storyline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: `You are a Creative Director specialising in short-form TikTok/social video content.
You write punchy, visual, scroll-stopping video storylines.
You must return ONLY a plain numbered list — one line per clip beat, no extra commentary, no markdown, no preamble.
Each line = one clip = exactly ${cs} seconds of visual action. Total clips: ${numClips}.
Each line should describe: what the CAMERA sees + what HAPPENS + the emotional beat. Be specific and visual.`,
        messages: [{
          role: "user",
          content: `Generate a ${numClips}-beat video storyline for this product:

Product: ${f.productName || "unnamed product"}
Category: ${f.productCategory || "consumer product"}
Key Features: ${f.keyFeatures || "not specified"}
USP: ${f.usp || "not specified"}
Problem Solved: ${f.problemStatement || "not specified"}
Core Benefit: ${f.keyBenefit || "not specified"}
Video Style: ${f.videoStyle}
Tone: ${f.tone.join(", ") || "calm, warm"}
Hook Strategy: ${f.hook.map(h => OPTS.hooks.find(o => o.value === h)?.label).join(", ") || "not specified"}
CTA: ${f.cta.map(c => OPTS.cta.find(o => o.value === c)?.label).join(", ") || "not specified"}
Setting: ${settingLabel(f)}
Talent: ${f.talent}
Sales Funnel Stage: ${FUNNEL_OPTIONS.find(o => o.value === f.funnel)?.label || "not specified"}
Funnel Objective: ${FUNNEL_OPTIONS.find(o => o.value === f.funnel)?.objective || "not specified"}
Funnel Content Approach: ${FUNNEL_OPTIONS.find(o => o.value === f.funnel)?.examples?.join(", ") || "not specified"}

IMPORTANT: The storyline MUST align with the ${FUNNEL_OPTIONS.find(o =>
