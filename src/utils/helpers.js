import { OPTS, FUNNEL_OPTIONS, PLATFORM_ASPECT, o } from "../constants/options";

const getClipRole = (clipNum, numClips, lang) => {
  const roles = {
    en: {
      single: { role: "HOOK + CONTENT + CTA", tag: "🎣📖📢", desc: "Single clip — open with hook, show product benefit, end with CTA" },
      hookContent: { role: "HOOK + CONTENT", tag: "🎣📖", desc: "Open with hook, introduce problem and product" },
      contentCta: { role: "CONTENT + CTA", tag: "📖📢", desc: "Demonstrate key benefit, end with strong CTA" },
      hook: { role: "HOOK", tag: "🎣", desc: "Stop the scroll — grab attention in first 1–2 seconds. Do NOT show product prominently yet." },
      cta: { role: "CTA", tag: "📢", desc: "Drive action — hero product shot, clear reason to act now." },
      content: { role: "CONTENT", tag: "📖", desc: "Demonstrate the product — show the problem being solved or benefit delivered." },
    },
    zh: {
      single: { role: "钩子 + 内容 + CTA", tag: "🎣📖📢", desc: "单一片段 — 开场用钩子，展示产品利益，以CTA结尾" },
      hookContent: { role: "钩子 + 内容", tag: "🎣📖", desc: "用钩子开场，介绍问题和产品" },
      contentCta: { role: "内容 + CTA", tag: "📖📢", desc: "展示核心利益，以强力CTA结尾" },
      hook: { role: "钩子", tag: "🎣", desc: "停住滑动 — 在最初1–2秒内抓住注意力。暂时不要突出展示产品。" },
      cta: { role: "CTA", tag: "📢", desc: "驱动行动 — 产品主镜头，给出立即行动的明确理由。" },
      content: { role: "内容", tag: "📖", desc: "展示产品 — 呈现正在解决的问题或带来的利益。" },
    },
    bm: {
      single: { role: "HOOK + KANDUNGAN + CTA", tag: "🎣📖📢", desc: "Klip tunggal — buka dengan hook, tunjukkan manfaat produk, akhiri dengan CTA" },
      hookContent: { role: "HOOK + KANDUNGAN", tag: "🎣📖", desc: "Buka dengan hook, perkenalkan masalah dan produk" },
      contentCta: { role: "KANDUNGAN + CTA", tag: "📖📢", desc: "Tunjukkan manfaat utama, akhiri dengan CTA yang kuat" },
      hook: { role: "HOOK", tag: "🎣", desc: "Hentikan skrol — tarik perhatian dalam 1–2 saat pertama. JANGAN tunjukkan produk secara menonjol lagi." },
      cta: { role: "CTA", tag: "📢", desc: "Dorong tindakan — tembakan hero produk, alasan yang jelas untuk bertindak sekarang." },
      content: { role: "KANDUNGAN", tag: "📖", desc: "Tunjukkan produk — paparkan masalah yang diselesaikan atau manfaat yang disampaikan." },
    },
  };
  const r = roles[lang] || roles.en;
  if (numClips === 1) return r.single;
  if (numClips === 2) return clipNum === 1 ? r.hookContent : r.contentCta;
  if (clipNum === 1) return r.hook;
  if (clipNum === numClips) return r.cta;
  return r.content;
};

// ── UI primitives ──────────────────────────────────────────────────────────
const Section = ({ title, emoji, subtitle, children }) => (
  <div className="mb-5 border border-gray-200 rounded-xl overflow-hidden">
    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
      <h2 className="font-bold text-gray-800 text-sm">{emoji} {title}</h2>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    <div className="p-4 space-y-3">{children}</div>
  </div>
);

const Field = ({ label, required, hint, children }) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 mb-1">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
    {children}
  </div>
);

const TextInput = ({ value, onChange, placeholder }) => (
  <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
    value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
);

const TextArea = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea
    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none overflow-hidden"
    value={value}
    onChange={e => { onChange(e.target.value); e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
    onInput={e => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
    placeholder={placeholder} rows={rows} />
);

const Select = ({ value, onChange, options }) => (
  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
    value={value} onChange={e => onChange(e.target.value)}>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

const Chips = ({ value, onChange, options, single }) => {
  const toggle = v => {
    if (single) { onChange(value === v ? "" : v); return; }
    const arr = Array.isArray(value) ? value : [];
    onChange(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  };
  const isSelected = v => single ? value === v : Array.isArray(value) && value.includes(v);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o.value} onClick={() => toggle(o.value)}
          className={`px-3 py-1 rounded-full text-xs border transition-all ${isSelected(o.value) ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
};

const AdvancedToggle = ({ isOpen, onToggle, t, sectionCount }) => (
  <button onClick={onToggle}
    className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 transition-all group mb-5">
    <div className="flex items-center gap-2">
      <span className="text-base">{isOpen ? "🔼" : "🔽"}</span>
      <div className="text-left">
        <p className="text-sm font-bold text-gray-700 group-hover:text-blue-600 transition-colors">
          {isOpen ? t.btnHideAdvanced : t.btnShowAdvanced}
        </p>
        <p className="text-xs text-gray-400">
          {isOpen ? t.hintAdvancedCollapse : t.hintAdvancedSub(sectionCount)}
        </p>
      </div>
    </div>
    <span className={`text-xs font-semibold px-2 py-1 rounded-full transition-all ${isOpen ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600"}`}>
      {isOpen ? "Hide" : "Optional"}
    </span>
  </button>
);

// ── Language selector component ────────────────────────────────────────────
const LangSelector = ({ lang, setLang }) => (
  <div className="flex gap-1">
    {[["en", "EN"], ["zh", "中文"], ["bm", "BM"]].map(([code, label]) => (
      <button key={code} onClick={() => setLang(code)}
        className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${lang === code ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-500 border-gray-200 hover:border-blue-300"}`}>
        {label}
      </button>
    ))}
  </div>
);

// ── Platform → aspect ratio ────────────────────────────────────────────────

const clipSec = plan => plan === "pro" ? 10 : 6;
const calcClips = (plan, dur) => { const cs = clipSec(plan); const total = parseInt(dur) || cs; return Math.ceil(total / cs); };
const settingLabel = (f, lang = "en") => { if (f.settingPreset === "custom") return f.settingCustom || "Custom location"; return o("settingPreset", lang).find(x => x.value === f.settingPreset)?.label || "Not specified"; };
const lightingLabel = (f, lang = "en") => { if (f.lightingPreset === "custom") return f.lightingCustom || "Custom lighting"; return o("lightingPreset", lang).find(x => x.value === f.lightingPreset)?.label || "Natural daylight"; };
const optLabel = (opts, val) => (Array.isArray(opts) ? opts : []).find(o => o.value === val)?.label || val || "";
const chipsLabel = (opts, vals) => (Array.isArray(vals) ? vals : []).map(v => optLabel(opts, v)).filter(Boolean).join(", ");
const productCatOpts = (lang) => OPTS.productCategory[lang] || OPTS.productCategory.en;
const productCatLabel = (f, lang) => {
  if (f.productCategory === "other") return f.productCategoryCustom || "";
  return optLabel(productCatOpts(lang), f.productCategory);
};

// ── the compressImage code ──────────────────────────────────────────────────────────
const compressImage = (file, maxSizeKB = 800) => new Promise(resolve => {
  const canvas = document.createElement("canvas");
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    let { width, height } = img;
    const maxDim = 1024;
    if (width > maxDim || height > maxDim) {
      const ratio = Math.min(maxDim / width, maxDim / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }
    canvas.width = width; canvas.height = height;
    canvas.getContext("2d").drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);
    const tryQuality = (q) => {
      const dataUrl = canvas.toDataURL("image/jpeg", q);
      const sizeKB = (dataUrl.length * 3) / 4 / 1024;
      if (sizeKB > maxSizeKB && q > 0.3) return tryQuality(q - 0.1);
      resolve({ data: dataUrl.split(",")[1], mimeType: "image/jpeg" });
    };
    tryQuality(0.85);
  };
  img.src = url;
});

// ── File → base64 ──────────────────────────────────────────────────────────
const fileToBase64 = file => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve({ data: r.result.split(",")[1], mimeType: file.type });
  r.onerror = reject;
  r.readAsDataURL(file);
});

// ── Build Gemini first frame prompt ───────────────────────────────────────
const buildImagePrompt = (f, lang) => {
  const funnelOpt = { upper: "Upper Funnel — Awareness", middle: "Middle Funnel — Consideration", lower: "Lower Funnel — Conversion" }[f.funnel] || "";
  const talentOpt = o("talent",lang).find(x => o.value === f.talent);
  const aspectInfo = PLATFORM_ASPECT[f.platform] || PLATFORM_ASPECT.tiktok;
  const styleOpt = o("videoStyle",lang).find(x => o.value === f.videoStyle);
  const toneLabel = chipsLabel(o("tone",lang), f.tone) || "calm, warm";
  const catLabel = productCatLabel(f, lang);

  return `Generate a single cinematic first frame image for a ${aspectInfo.label} ${styleOpt?.label || "UGC"} video ad.

PRODUCT: ${f.productName}${catLabel ? ` (${catLabel})` : ""}
${f.keyColors ? `PRODUCT COLORS: ${f.keyColors}` : ""}
${f.keyFeaturesCustom ? `KEY FEATURES: ${f.keyFeaturesCustom}` : ""}
SETTING: ${settingLabel(f,lang)}${f.settingDetail ? ` — ${f.settingDetail}` : ""}
LIGHTING: ${lightingLabel(f,lang)}
TALENT: ${f.talent && f.talent !== "no_talent" ? `${talentOpt?.label || ""}${chipsLabel(o("talentStyle",lang), f.talentStyle) ? " — " + chipsLabel(o("talentStyle",lang), f.talentStyle) : ""}${f.talentDetail ? " — " + f.talentDetail : ""}` : "No people — product only"}
TONE: ${toneLabel}
FUNNEL STAGE: ${funnelOpt}
HOOK INTENT: ${chipsLabel(o("hooks",lang), f.hook) || "grab attention"}
PROBLEM TO HINT AT: ${f.problemStatement || "not specified"}

REQUIREMENTS:
- Aspect ratio: ${aspectInfo.ratio}
- This is the FIRST FRAME of a video — it must immediately grab attention
- Show the scene naturally — NOT a posed advertisement look
- Product must be clearly visible and match the description above
- Cinematic quality, realistic lighting, authentic feel
- NO text overlays, NO watermarks, NO UI elements in the image
${f.funnel === "upper" ? "- MOOD: Relatable everyday moment — hint at a problem, do NOT show the product as a solution yet" : ""}
${f.funnel === "middle" ? "- MOOD: Engaging — show product in active natural use, solving a problem" : ""}
${f.funnel === "lower" ? "- MOOD: Aspirational and confident — show the positive outcome and lifestyle result" : ""}`;
};

// ── Prompt generator ───────────────────────────────────────────────────────
const buildClipPrompts = (f, storyline, hasFirstFrame, lang, agentClips = []) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const cs = clipSec(f.grokPlan);
  const total = parseInt(f.totalDuration) || cs;
  const numClips = Math.ceil(total / cs);
  const toneLabel = chipsLabel(o("tone",lang), f.tone) || "calm & warm";
  const camOpt = o("cameraMove",lang).find(x => o.value === f.cameraMove);
  const heroOpt = f.heroAngle ? o("heroAngle",lang).find(x => o.value === f.heroAngle) : null;
  const talentOpt = o("talent",lang).find(x => o.value === f.talent);
  const styleOpt = o("videoStyle",lang).find(x => o.value === f.videoStyle);
  const ctaLabel = chipsLabel(o("cta",lang), f.cta);
  const catLabel = productCatLabel(f, lang);
  const restrictions = (Array.isArray(f.restrictions) ? f.restrictions : []).map(r => `❌ ${optLabel(o("restrictions",lang), r)}`).join("  ");
  const antiHalluc = (Array.isArray(f.antiHallucination) ? f.antiHallucination : []).map(r => `❌ ${optLabel(o("antiHallucination",lang), r)}`).join("  ");
  const storyLines = storyline ? storyline.split("\n").filter(l => l.trim()) : [];

  const funnelDir = {
    upper: { hook: "Open with relatable problem or POV. Do NOT mention the product yet. Make viewer say 'that's so me'.", content: "Introduce product naturally as a discovery. Soft curious tone — not a hard sell.", cta: "Soft CTA only — follow, save, or comment. No price, no urgency." },
    middle: { hook: "Agitate the pain point clearly. Viewer should feel 'yes, that's my problem'.", content: "Show product solving the problem with clear before/after or feature demo. Build trust.", cta: "Mid-strength CTA — link in bio, comment for info. Can mention price." },
    lower: { hook: "Open with urgency, social proof, or bold claim. Viewer should feel they're missing out.", content: "Highlight key value — price, offer, or transformation. Create strong desire.", cta: "Strong direct CTA — buy now, limited offer, link in bio. Urgency or scarcity." },
  };
  const fd = funnelDir[f.funnel] || funnelDir.middle;

  const FUNNEL_OPTIONS_LOCAL = [
    { value: "upper", label: t.funnelUpperLabel, tag: t.funnelUpperTag, objective: t.funnelUpperObj },
    { value: "middle", label: t.funnelMiddleLabel, tag: t.funnelMiddleTag, objective: t.funnelMiddleObj },
    { value: "lower", label: t.funnelLowerLabel, tag: t.funnelLowerTag, objective: t.funnelLowerObj },
  ];
  const funnelOpt = FUNNEL_OPTIONS_LOCAL.find(o => o.value === f.funnel);

  const opt = (label, val) => val ? `${label}: ${val}` : "";
  const aspectInfo = PLATFORM_ASPECT[f.platform] || PLATFORM_ASPECT.tiktok;

  const firstFrameBlock = hasFirstFrame
    ? `FIRST FRAME IMAGE: ✅ PROVIDED
• Start the video from the attached reference image exactly
• Match product appearance, talent look, setting and lighting from the reference
• Do NOT redesign or reimagine — animate and extend what is in the reference image
• Every frame must feel like a natural continuation of the first frame`
    : "";

  const baseContextLines = [
    `CAMPAIGN: ${f.campaignName || "Untitled"}`,
    `PLATFORM: ${optLabel(OPTS.platform, f.platform)} (${aspectInfo.ratio})`,
    `PRODUCT: ${f.productName} | ${catLabel}`,
    `KEY FEATURES: ${f.keyFeaturesCustom}`,
    `USP: ${f.usp}`,
    `PROBLEM BEING SOLVED: ${f.problemStatement}`,
    `CORE BENEFIT: ${f.keyBenefit}`,
    `HOOK STRATEGY: ${chipsLabel(o("hooks",lang), f.hook)}`,
    `CTA: ${ctaLabel}`,
    funnelOpt ? `SALES FUNNEL: ${funnelOpt.label} (${funnelOpt.tag})` : "",
    funnelOpt ? `FUNNEL OBJECTIVE: ${funnelOpt.objective}` : "",
    opt("COLORS", f.keyColors),
    opt("TARGET AUDIENCE", chipsLabel(o("targetAudience",lang), f.targetAudience)),
    opt("PRODUCT RULES", f.productRules),
    opt("STYLE", styleOpt?.label),
    opt("TONE", toneLabel),
    opt("REALISM", optLabel(o("realism",lang), f.realism)),
    opt("COLOR GRADING", chipsLabel(o("colorGrading",lang), f.colorGrading)),
    opt("AUTHENTICITY", optLabel(o("authenticity",lang), f.authenticity)),
    f.settingPreset ? `LOCATION: ${settingLabel(f,lang)}${f.settingDetail ? " — " + f.settingDetail : ""}` : opt("LOCATION DETAIL", f.settingDetail),
    f.lightingPreset ? opt("LIGHTING", lightingLabel(f,lang)) : "",
    opt("BACKGROUND ACTIVITY", optLabel(o("bgActivity",lang), f.bgActivity)),
    f.talent ? `TALENT: ${f.talent === "no_talent" ? "No talent — product only" : (talentOpt?.label || "") + (chipsLabel(o("talentStyle",lang), f.talentStyle) ? ", " + chipsLabel(o("talentStyle",lang), f.talentStyle) : "") + (f.talentDetail ? ", " + f.talentDetail : "")}` : "",
    opt("EMOTION", chipsLabel(o("emotion",lang), f.emotion)),
    opt("SHOT TYPE", chipsLabel(o("shotType",lang), f.shotType)),
    opt("CAMERA ANGLE", optLabel(o("cameraAngle",lang), f.cameraAngle)),
    opt("CAMERA MOVEMENT", camOpt?.label),
    opt("HERO ANGLE", heroOpt?.label),
    opt("PRODUCT FRAMING", chipsLabel(o("productFraming",lang), f.productFraming)),
    opt("SUBJECT MOTION", chipsLabel(o("subjectMotion",lang), f.subjectMotion)),
    opt("PRODUCT INTERACTION", chipsLabel(o("productInteraction",lang), f.productInteraction)),
    opt("EMOTIONAL ARC", optLabel(o("emotionalArc",lang), f.emotionalArc)),
    opt("ENDING FRAME", optLabel(o("endingFrame",lang), f.endingFrame)),
    opt("AUDIO", optLabel(o("audioType",lang), f.audioType)),
    f.audioType && f.bgMusic ? opt("MUSIC", optLabel(o("bgMusic",lang), f.bgMusic)) : "",
    f.audioType && f.voLang && f.voLang !== "none" ? opt("VOICEOVER LANGUAGE", optLabel(o("voLang",lang), f.voLang)) : "",
    f.audioType && f.speechType ? opt("SPEECH TYPE", optLabel(o("speechType",lang), f.speechType)) : "",
    f.audioType && f.voTone ? opt("VO TONE", f.voTone) : "",
    opt("FRAME RATE", optLabel(o("frameRate",lang), f.frameRate)),
    opt("RESOLUTION", optLabel(o("resolution",lang), f.resolution)),
    opt("DEPTH OF FIELD", optLabel(o("depthOfField",lang), f.depthOfField)),
    opt("REFERENCE", f.referenceUrl),
    f.brandStyle ? opt("BRAND STYLE", optLabel([{value:"clean_minimal_tech",label:"Clean minimal tech"},{value:"playful_colorful",label:"Playful & colorful"},{value:"serious_corporate",label:"Serious & corporate"},{value:"warm_lifestyle",label:"Warm lifestyle brand"},{value:"premium_luxury",label:"Premium / luxury"}], f.brandStyle)) : "",
    restrictions ? `RESTRICTIONS: ${restrictions}` : "",
    antiHalluc ? `ANTI-HALLUCINATION: ${antiHalluc}` : "",
    opt("ADDITIONAL NOTES", f.extraNotes),
    firstFrameBlock,
    t.promptLangInstruction,
  ].filter(Boolean).join("\n");

  const clips = [];
  for (let i = 0; i < numClips; i++) {
    const clipNum = i + 1;
    const startSec = i * cs;
    const endSec = Math.min((i + 1) * cs, total);
    const actualDur = endSec - startSec;
    const clipRole = getClipRole(clipNum, numClips, lang);
    const rawBeat = storyLines[i] || "";
    // Strip leading number + role tag (e.g. "1. [HOOK] " or "1. [HOOK+CONTENT] ")
    const cleanBeat = rawBeat.replace(/^\d+[.)\s]+\[?[^\]]*\]?\s*/i, "").trim();
    const sceneBeat = cleanBeat ||
      (clipRole.role.includes("HOOK") || clipRole.role.includes("钩子")
        ? `Open on: ${f.problemStatement || "relatable problem — no product yet"}`
        : clipRole.role.includes("CTA")
        ? `Hero product shot + ${ctaLabel || "drive action"}`
        : `Show: ${f.keyBenefit || f.keyFeaturesCustom}`);

    // Build concise funnel directive for this clip's role
    const directives = [];
    if (clipRole.role.includes("HOOK") || clipRole.role.includes("钩子")) {
      directives.push(`HOOK: ${fd.hook}`);
      if (hasFirstFrame) directives.push("Animate naturally from the first frame reference image.");
    }
    if (clipRole.role.includes("CONTENT") || clipRole.role.includes("内容") || clipRole.role.includes("KANDUNGAN")) {
      directives.push(`CONTENT: ${fd.content}`);
    }
    if (clipRole.role.includes("CTA")) {
      directives.push(`CTA: ${fd.cta}`);
      if (heroOpt?.label) directives.push(`End frame: ${heroOpt.label} — product centered.`);
    }
    if (clipNum < numClips) directives.push(`End on a clean frame — will stitch with Clip ${clipNum + 1}.`);

    // Merge agent suggestions — user-filled settings take priority
    const agent = agentClips[i] || {};
    const resolvedShot = chipsLabel(o("shotType",lang), f.shotType) || agent.shot_type || "";
    const resolvedCamera = optLabel(o("cameraMove",lang), f.cameraMove) || agent.camera_movement || "";
    const resolvedLighting = (f.lightingPreset ? lightingLabel(f,lang) : "") || agent.lighting || "";
    const resolvedAudio = (f.audioType ? optLabel(o("audioType",lang), f.audioType) : "") || agent.audio_type || "";
    const resolvedMusic = (f.bgMusic ? optLabel(o("bgMusic",lang), f.bgMusic) : "") || agent.music_mood || "";
    const resolvedVoTone = f.voTone || agent.voiceover_tone || "";
    const resolvedTransition = agent.transition_out || "";

    // Compact context — only essentials, no repetition
    const compactContext = [
      `PRODUCT: ${f.productName}${catLabel ? " — " + catLabel : ""}`,
      `USP: ${f.usp}`,
      `PROBLEM: ${f.problemStatement}`,
      `BENEFIT: ${f.keyBenefit}`,
      f.keyColors ? `COLORS: ${f.keyColors}` : "",
      f.talent === "no_talent" ? "TALENT: Product only — no human talent" : f.talent ? `TALENT: ${talentOpt?.label || f.talent}${f.talentDetail ? ", " + f.talentDetail : ""}` : "",
      settingLabel(f,lang) && f.settingPreset ? `SETTING: ${settingLabel(f,lang)}${f.settingDetail ? " — " + f.settingDetail : ""}` : "",
      lightingLabel(f,lang) && f.lightingPreset ? `LIGHTING: ${lightingLabel(f,lang)}` : "",
      resolvedShot ? `SHOT: ${resolvedShot}` : "",
      resolvedCamera ? `CAMERA: ${resolvedCamera}` : "",
      resolvedLighting ? `LIGHTING: ${resolvedLighting}` : "",
      `TONE: ${toneLabel}`,
      resolvedAudio ? `AUDIO: ${resolvedAudio}${resolvedMusic ? " — " + resolvedMusic : ""}` : "",
      resolvedVoTone ? `VOICEOVER TONE: ${resolvedVoTone}` : "",
      f.audioType && f.voLang && f.voLang !== "none" ? `VOICEOVER LANG: ${optLabel(o("voLang",lang), f.voLang)}${f.customVO ? "\nSCRIPT: " + f.customVO : ""}` : "",
      resolvedTransition ? `TRANSITION OUT: ${resolvedTransition}` : "",
      restrictions ? `RESTRICTIONS: ${restrictions}` : "",
      antiHalluc ? `ANTI-HALLUCINATION: ${antiHalluc}` : "",
      f.extraNotes ? `NOTES: ${f.extraNotes}` : "",
      hasFirstFrame ? "FIRST FRAME: ✅ PROVIDED — start from reference image, match product/talent/setting exactly." : "",
      t.promptLangInstruction,
    ].filter(Boolean).join("\n");

    clips.push({
      label: `CLIP ${clipNum} of ${numClips}`,
      role: clipRole.role, tag: clipRole.tag,
      timing: `${startSec}s – ${endSec}s (${actualDur}s)`,
      prompt: `═══════════════════════════════════
🎬 GROK VIDEO PROMPT — CLIP ${clipNum}/${numClips}
${f.grokPlan === "pro" ? "⭐ Grok Pro" : "🆓 Grok Free"} | ${actualDur}s | ${startSec}s–${endSec}s
${clipRole.tag} ${clipRole.role}
${hasFirstFrame ? "🖼 IMAGE-TO-VIDEO MODE" : "📝 TEXT-ONLY MODE"}
═══════════════════════════════════

${compactContext}

━━━ DIRECTOR'S BRIEF ━━━
SCENE: ${sceneBeat}
${directives.length ? directives.map(d => `• ${d}`).join("\n") : ""}

❗ Authentic, natural, purposeful. Not staged.
═══════════════════════════════════`
    });
  }
  return clips;
};

// ── Creative Director AI call ──────────────────────────────────────────────
const fetchStoryline = async (f, lang, setLoading, setStoryline, setError) => {
  setLoading(true); setError("");
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const numClips = calcClips(f.grokPlan, f.totalDuration);
  const cs = clipSec(f.grokPlan);
  const catLabel = productCatLabel(f, lang);
  const clipRoleMap = Array.from({ length: numClips }, (_, i) => { const r = getClipRole(i + 1, numClips, lang); return `Clip ${i + 1}: [${r.role}] — ${r.desc}`; }).join("\n");
  const funnelGuidance = {
    upper: { hook: "Relatable problem or POV — do NOT mention product.", content: "Soft product discovery — curious tone, no hard sell.", cta: "Soft only — follow, save, comment. No price or urgency." },
    middle: { hook: "Agitate the pain point. Viewer should feel 'yes, that's my problem'.", content: "Show product solving problem. Build trust.", cta: "Mid-strength — link in bio, comment for info." },
    lower: { hook: "Urgency, social proof, or bold claim.", content: "Highlight value — price, offer, transformation.", cta: "Strong and direct — buy now, limited offer." },
  };
  const funnelLabels = { upper: t.funnelUpperLabel, middle: t.funnelMiddleLabel, lower: t.funnelLowerLabel };
  const fg = funnelGuidance[f.funnel] || funnelGuidance.middle;
  try {
    const res = await fetch("/api/storyline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1200,
        system: `You are a Creative Director specialising in short-form TikTok/social video content.
You write punchy, visual, scroll-stopping video storylines structured around Hook → Content → CTA.
STRICT FORMAT: Return ONLY a numbered list. No preamble. No explanation. No intro sentence. Start IMMEDIATELY with "1.".
Each line MUST start with role in brackets: [HOOK], [CONTENT], [CTA], or combined.
Format: "1. [ROLE] <visual scene description>"
Each description: camera angle + what happens visually + emotional beat. Be specific and cinematic.${t.storylineLangInstruction}`,
        messages: [{ role: "user", content: `Generate a ${numClips}-beat storyline with Hook → Content → CTA.
CLIP ROLES:\n${clipRoleMap}
Product: ${f.productName} | Category: ${catLabel}
Features: ${f.keyFeaturesCustom} | USP: ${f.usp}
Problem: ${f.problemStatement} | Benefit: ${f.keyBenefit}
Style: ${f.videoStyle} | Tone: ${chipsLabel(o("tone",lang), f.tone) || "calm, warm"}
Hook: ${chipsLabel(o("hooks",lang), f.hook)} | CTA: ${chipsLabel(o("cta",lang), f.cta)}
Setting: ${settingLabel(f,lang)} | Talent: ${f.talent}
Funnel: ${funnelLabels[f.funnel] || "not specified"}
[HOOK]: ${fg.hook}
[CONTENT]: ${fg.content}
[CTA]: ${fg.cta}
Return exactly ${numClips} lines. Start each with role tag.` }]
      })
    });
    const data = await res.json();
    const rawStoryline = (data.content?.find(b => b.type === "text")?.text || "").trim();
    // Strip any preamble lines — keep only lines that start with a number (e.g. "1.", "2.")
    const cleanedStoryline = rawStoryline
      .split("\n")
      .filter(line => /^\d+[.)\s]/.test(line.trim()))
      .join("\n")
      .trim();
    setStoryline(cleanedStoryline || rawStoryline); // fallback to raw if filter removes everything
    setLoading(false);
  } catch (e) {
    setError("Could not reach AI. Please try again.");
    setLoading(false);
  }
};

// ── Generate first frame via Gemini ───────────────────────────────────────
const generateFirstFrame = async (f, lang, productFile, talentFile, setLoading, setImage, setError) => {
  setLoading(true); setError("");
  try {
    const aspectInfo = PLATFORM_ASPECT[f.platform] || PLATFORM_ASPECT.tiktok;
    const body = { prompt: buildImagePrompt(f, lang), aspectRatio: aspectInfo.gemini };
    if (productFile) body.productImage = await fileToBase64(productFile);
    if (talentFile) body.talentImage = await fileToBase64(talentFile);
        const res = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    let data;
    try { data = await res.json(); } catch { data = {}; }
    if (!res.ok) throw new Error(data.error?.error?.message || data.error || `Server error ${res.status} — image may be too large`);
    setImage({ data: data.imageData, mimeType: data.mimeType });
    setLoading(false);
  } catch (e) {
    setError(e.message || "Could not generate image. Please try again.");
    setLoading(false);
  }
};

// ── History Tab Component ────────────────────────────────────────────────────

export {
  getClipRole,
  clipSec, calcClips,
  settingLabel, lightingLabel,
  optLabel, chipsLabel, productCatOpts, productCatLabel,
  compressImage, fileToBase64,
  buildImagePrompt, buildClipPrompts,
  fetchStoryline,
};
