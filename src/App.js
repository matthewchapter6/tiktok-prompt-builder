import React, { useState, useRef } from "react";

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
  <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
    value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} />
);

const Select = ({ value, onChange, options }) => (
  <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
    value={value} onChange={e => onChange(e.target.value)}>
    {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);

const Chips = ({ value, onChange, options }) => {
  const toggle = v => onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => (
        <button key={o.value} onClick={() => toggle(o.value)}
          className={`px-3 py-1 rounded-full text-xs border transition-all ${value.includes(o.value) ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
};

// ── Options ────────────────────────────────────────────────────────────────
const OPTS = {
  platform: [
    { value: "tiktok", label: "TikTok (9:16)" },
    { value: "reels", label: "Instagram Reels (9:16)" },
    { value: "youtube_shorts", label: "YouTube Shorts (9:16)" },
    { value: "feed_square", label: "Feed Post (1:1)" },
  ],
  grokPlan: [
    { value: "free", label: "🆓 Grok Free (6s per clip)" },
    { value: "pro", label: "⭐ Grok Pro (10s per clip)" },
  ],
  videoStyle: [
    { value: "ugc", label: "UGC — authentic, shot-on-phone" },
    { value: "commercial", label: "Commercial — polished, studio-lite" },
    { value: "lifestyle", label: "Lifestyle — candid, everyday" },
    { value: "tutorial", label: "Tutorial / How-to" },
    { value: "testimonial", label: "Testimonial — talking to camera" },
    { value: "unboxing", label: "Unboxing — reveal & first impression" },
  ],
  tone: [
    { value: "calm_warm", label: "Calm & warm" },
    { value: "energetic", label: "Energetic & upbeat" },
    { value: "trustworthy", label: "Trustworthy & informative" },
    { value: "fun_playful", label: "Fun & playful" },
    { value: "premium", label: "Premium & aspirational" },
    { value: "relatable", label: "Relatable & everyday" },
  ],
  settingPreset: [
    { value: "", label: "— Select preset —" },
    { value: "home_kitchen", label: "Home — kitchen" },
    { value: "home_living", label: "Home — living room" },
    { value: "home_bedroom", label: "Home — bedroom" },
    { value: "home_outdoor", label: "Home — outdoor / garden" },
    { value: "cafe", label: "Café / coffee shop" },
    { value: "office", label: "Office / workspace" },
    { value: "outdoor_urban", label: "Outdoor — urban street" },
    { value: "outdoor_nature", label: "Outdoor — nature / park" },
    { value: "gym", label: "Gym / fitness space" },
    { value: "studio_neutral", label: "Studio — neutral background" },
    { value: "custom", label: "✏️ Custom (type below)" },
  ],
  lightingPreset: [
    { value: "", label: "— Select preset —" },
    { value: "natural_day", label: "Natural daylight (bright, airy)" },
    { value: "golden_hour", label: "Golden hour / warm afternoon" },
    { value: "indoor_warm", label: "Indoor warm artificial light" },
    { value: "indoor_cool", label: "Indoor cool / neutral light" },
    { value: "studio_soft", label: "Studio soft box (clean, even)" },
    { value: "moody_low", label: "Moody low light (dramatic)" },
    { value: "custom", label: "✏️ Custom (type below)" },
  ],
  talent: [
    { value: "solo_female", label: "Solo female (25–35)" },
    { value: "solo_male", label: "Solo male (25–35)" },
    { value: "solo_female_mature", label: "Solo female (40–55)" },
    { value: "solo_male_mature", label: "Solo male (40–55)" },
    { value: "couple", label: "Couple" },
    { value: "group_friends", label: "Group of friends" },
    { value: "family", label: "Family (adult + child)" },
    { value: "no_talent", label: "No talent — product only" },
  ],
  talentStyle: [
    { value: "casual", label: "Casual" },
    { value: "smart_casual", label: "Smart casual" },
    { value: "modest", label: "Modest / conservative" },
    { value: "sporty", label: "Sporty / activewear" },
    { value: "professional", label: "Professional" },
    { value: "cultural", label: "Cultural / traditional" },
  ],
  cameraMove: [
    { value: "static", label: "Mostly static" },
    { value: "gentle_handheld", label: "Gentle handheld" },
    { value: "slow_push_in", label: "Slow push-in" },
    { value: "pan_follow", label: "Pan / follow subject" },
    { value: "mixed", label: "Mixed" },
  ],
  heroAngle: [
    { value: "", label: "— Select —" },
    { value: "45_elevated", label: "45° elevated (recommended)" },
    { value: "eye_level", label: "Eye-level straight-on" },
    { value: "top_down", label: "Top-down / flat-lay" },
    { value: "low_angle", label: "Low angle (prestige)" },
    { value: "close_up_detail", label: "Close-up on key detail" },
  ],
  hooks: [
    { value: "question", label: "Open with a question" },
    { value: "bold_claim", label: "Bold claim / statement" },
    { value: "problem_agitate", label: "Problem → agitate → solve" },
    { value: "reveal", label: "Unexpected reveal" },
    { value: "social_proof", label: "Social proof opener" },
    { value: "before_after", label: "Before & after contrast" },
  ],
  cta: [
    { value: "shop_link", label: "Shop via link in bio" },
    { value: "comment", label: "Comment for more info" },
    { value: "follow", label: "Follow for more" },
    { value: "save_post", label: "Save this post" },
    { value: "try_it", label: "Try it yourself" },
    { value: "no_cta", label: "No explicit CTA" },
  ],
  voLang: [
    { value: "", label: "— Select —" },
    { value: "english", label: "English" },
    { value: "bm", label: "Bahasa Malaysia" },
    { value: "mandarin", label: "Mandarin" },
    { value: "tamil", label: "Tamil" },
    { value: "codemix_bm_en", label: "BM + English (code-switch)" },
    { value: "none", label: "No voiceover (visual only)" },
  ],
  restrictions: [
    { value: "no_text_overlay", label: "No text overlay" },
    { value: "no_effects", label: "No artificial effects" },
    { value: "no_music", label: "No background music" },
    { value: "no_exaggerated_acting", label: "No exaggerated acting" },
    { value: "no_influencer_vibe", label: "No influencer vibe" },
    { value: "no_branded_bg", label: "No branded items in BG" },
    { value: "no_children", label: "No children in frame" },
    { value: "halal_visual", label: "Visually halal-compliant" },
    { value: "no_male_talent", label: "No male talent" },
    { value: "no_competitor", label: "No competitor products" },
  ],
};

const init = {
  platform: "tiktok", grokPlan: "free", totalDuration: "12",
  productName: "", productCategory: "", keyColors: "", keyFeatures: "", usp: "", productRules: "",
  videoStyle: "ugc", tone: [],
  settingPreset: "", settingCustom: "", settingDetail: "",
  lightingPreset: "", lightingCustom: "",
  talent: "solo_female", talentStyle: [], talentDetail: "",
  cameraMove: "gentle_handheld", heroAngle: "",
  hook: [], problemStatement: "", keyBenefit: "", cta: [],
  voLang: "", voTone: "", customVO: "",
  restrictions: [], extraNotes: "",
  storyline: "",
};

// ── Helpers ────────────────────────────────────────────────────────────────
const clipSec = plan => plan === "pro" ? 10 : 6;

const calcClips = (plan, dur) => {
  const cs = clipSec(plan);
  const total = parseInt(dur) || cs;
  return Math.ceil(total / cs);
};

const settingLabel = f => {
  if (f.settingPreset === "custom") return f.settingCustom || "Custom location";
  return OPTS.settingPreset.find(o => o.value === f.settingPreset)?.label || "Not specified";
};
const lightingLabel = f => {
  if (f.lightingPreset === "custom") return f.lightingCustom || "Custom lighting";
  return OPTS.lightingPreset.find(o => o.value === f.lightingPreset)?.label || "Natural daylight";
};

// ── Prompt generator ───────────────────────────────────────────────────────
const buildClipPrompts = (f, storyline) => {
  const cs = clipSec(f.grokPlan);
  const total = parseInt(f.totalDuration) || cs;
  const numClips = Math.ceil(total / cs);
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
STYLE: ${styleOpt?.label} | TONE: ${toneLabel}
LOCATION: ${settingLabel(f)}${f.settingDetail ? ` — ${f.settingDetail}` : ""}
LIGHTING: ${lightingLabel(f)}
TALENT: ${f.talent !== "no_talent" ? `${talentOpt?.label}${f.talentStyle.length ? ", " + f.talentStyle.join(", ") : ""}${f.talentDetail ? ", " + f.talentDetail : ""}` : "No talent — product only"}
CAMERA: ${camOpt?.label} | HERO ANGLE: ${heroOpt?.label || "45° elevated"}
${restrictions ? `RESTRICTIONS: ${restrictions}` : ""}`.trim();

  // Split storyline into clip beats
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

// ── Creative Director AI call ──────────────────────────────────────────────
const fetchStoryline = async (f, setLoading, setStoryline, setError) => {
  setLoading(true); setError("");
  const numClips = calcClips(f.grokPlan, f.totalDuration);
  const cs = clipSec(f.grokPlan);
  try {
    const res = await fetch("https://nodehq2chtxe-u4h3--3000--3b7d1e54.local-corp.webcontainer.io/api/storyline", {
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

Return exactly ${numClips} lines. One line per clip. Each line = what happens visually in that ${cs}-second clip.`
        }]
      })
    });
    const data = await res.json();
    const text = data.content?.find(b => b.type === "text")?.text || "";
    setStoryline(text.trim());
    setLoading(false);
  } catch (e) {
    setError("Could not reach AI. Please try again.");
    setLoading(false);
  }
};

// ── Main ───────────────────────────────────────────────────────────────────
export default function App() {
  const [f, setF] = useState(init);
  const [tab, setTab] = useState("builder");
  const [clips, setClips] = useState([]);
  const [storyline, setStoryline] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [copiedIdx, setCopiedIdx] = useState(null);
  const outputRef = useRef(null);

  const set = k => v => setF(p => ({ ...p, [k]: v }));

  const numClips = calcClips(f.grokPlan, f.totalDuration);
  const cs = clipSec(f.grokPlan);

  const missingRequired = !f.productName || !f.productCategory || !f.keyFeatures || !f.hook.length || !f.cta.length;

  const generate = () => {
    const result = buildClipPrompts(f, storyline);
    setClips(result);
    setTab("output");
    setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const copyClip = (text, idx) => {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    try { document.execCommand("copy"); } catch {}
    document.body.removeChild(el);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const copyAll = () => {
    const all = clips.map(c => c.prompt).join("\n\n");
    copyClip(all, "all");
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <h1 className="text-base font-bold text-gray-900">🎬 TikTok UGC Prompt Builder</h1>
        <p className="text-xs text-gray-500">Powered for Grok — any product, any brand</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-4">
        {[["builder","📝 Builder"],["output","📋 Output"]].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${tab === v ? "border-blue-500 text-blue-600" : "border-transparent text-gray-400"}`}>
            {l}{v === "output" && clips.length > 0 ? ` (${clips.length})` : ""}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {tab === "builder" && (<>

          {/* Grok Plan */}
          <Section emoji="⚙️" title="Grok Settings" subtitle="Select your Grok plan — this determines how many clips will be generated.">
            <Field label="Grok Plan">
              <div className="flex gap-3">
                {OPTS.grokPlan.map(o => (
                  <button key={o.value} onClick={() => set("grokPlan")(o.value)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${f.grokPlan === o.value ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Total Video Duration (seconds)" hint={`Each Grok ${f.grokPlan === "pro" ? "Pro" : "Free"} clip = ${cs}s max. Your duration will be split into ${numClips} clip${numClips > 1 ? "s" : ""}.`}>
              <TextInput value={f.totalDuration} onChange={set("totalDuration")} placeholder={`e.g. ${cs * 2}`} />
            </Field>
            {numClips > 1 && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
                📋 This will generate <strong>{numClips} separate prompts</strong> ({cs}s each). Generate each in Grok individually, then stitch or use Extend.
              </div>
            )}
            <Field label="Platform">
              <div className="flex flex-wrap gap-2">
                {OPTS.platform.map(o => (
                  <button key={o.value} onClick={() => set("platform")(o.value)}
                    className={`px-3 py-1 rounded-full text-xs border transition-all ${f.platform === o.value ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </Field>
          </Section>

          {/* Product */}
          <Section emoji="📦" title="Product" subtitle="Lock down your product — stays consistent across every clip.">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Product Name" required>
                <TextInput value={f.productName} onChange={set("productName")} placeholder="e.g. AirFlow Portable Fan" />
              </Field>
              <Field label="Product Category" required>
                <TextInput value={f.productCategory} onChange={set("productCategory")} placeholder="e.g. Home appliance / Skincare" />
              </Field>
            </div>
            <Field label="Key Colors" hint="Exact colors — must not change across clips">
              <TextInput value={f.keyColors} onChange={set("keyColors")} placeholder="e.g. Matte white body, rose gold buttons" />
            </Field>
            <Field label="Key Features" required>
              <TextArea value={f.keyFeatures} onChange={set("keyFeatures")} placeholder="e.g. Ultra-quiet motor, 3 speed settings, USB-C rechargeable, foldable design" rows={2} />
            </Field>
            <Field label="USP — Unique Selling Point" hint="The one thing that makes this product different">
              <TextInput value={f.usp} onChange={set("usp")} placeholder="e.g. Only portable fan that folds flat to fit in a handbag" />
            </Field>
            <Field label="Product Rules" hint="Visual dos and don'ts (optional)">
              <TextArea value={f.productRules} onChange={set("productRules")} placeholder={"e.g. Always show product upright\nDo not disassemble on camera"} rows={2} />
            </Field>
          </Section>

          {/* Style */}
          <Section emoji="🎨" title="Video Style & Tone">
            <Field label="Video Style">
              <div className="flex flex-wrap gap-2">
                {OPTS.videoStyle.map(o => (
                  <button key={o.value} onClick={() => set("videoStyle")(o.value)}
                    className={`px-3 py-1 rounded-full text-xs border transition-all ${f.videoStyle === o.value ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Tone (pick all that apply)">
              <Chips value={f.tone} onChange={set("tone")} options={OPTS.tone} />
            </Field>
          </Section>

          {/* Setting */}
          <Section emoji="🏠" title="Setting & Environment">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Location">
                <Select value={f.settingPreset} onChange={set("settingPreset")} options={OPTS.settingPreset} />
              </Field>
              <Field label="Lighting">
                <Select value={f.lightingPreset} onChange={set("lightingPreset")} options={OPTS.lightingPreset} />
              </Field>
            </div>
            {f.settingPreset === "custom" && (
              <Field label="Custom Location">
                <TextInput value={f.settingCustom} onChange={set("settingCustom")} placeholder="e.g. Rooftop terrace, sunset view, urban skyline" />
              </Field>
            )}
            {f.lightingPreset === "custom" && (
              <Field label="Custom Lighting">
                <TextInput value={f.lightingCustom} onChange={set("lightingCustom")} placeholder="e.g. Neon-lit night scene, pink accent light from left" />
              </Field>
            )}
            <Field label="Setting Details" hint="Describe props, furniture, color palette, mood (optional)">
              <TextInput value={f.settingDetail} onChange={set("settingDetail")} placeholder="e.g. Minimalist white kitchen, marble counter, clean and airy" />
            </Field>
          </Section>

          {/* Talent */}
          <Section emoji="👤" title="Talent & Character">
            <Field label="Talent Type">
              <div className="flex flex-wrap gap-2">
                {OPTS.talent.map(o => (
                  <button key={o.value} onClick={() => set("talent")(o.value)}
                    className={`px-3 py-1 rounded-full text-xs border transition-all ${f.talent === o.value ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </Field>
            {f.talent !== "no_talent" && (<>
              <Field label="Outfit Style">
                <Chips value={f.talentStyle} onChange={set("talentStyle")} options={OPTS.talentStyle} />
              </Field>
              <Field label="Appearance Details" hint="Outfit color, hair — keeps character consistent across clips">
                <TextInput value={f.talentDetail} onChange={set("talentDetail")} placeholder="e.g. Light blue linen shirt, hair tied back neatly" />
              </Field>
            </>)}
          </Section>

          {/* Camera */}
          <Section emoji="🎥" title="Camera & Visual Direction">
            <Field label="Camera Movement">
              <div className="flex flex-wrap gap-2">
                {OPTS.cameraMove.map(o => (
                  <button key={o.value} onClick={() => set("cameraMove")(o.value)}
                    className={`px-3 py-1 rounded-full text-xs border transition-all ${f.cameraMove === o.value ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Hero Shot Angle" hint="Final closing shot angle">
              <Select value={f.heroAngle} onChange={set("heroAngle")} options={OPTS.heroAngle} />
            </Field>
          </Section>

          {/* Story */}
          <Section emoji="📖" title="Story & Structure">
            <Field label="Hook Strategy" required hint="How does the video open? Pick 1–2">
              <Chips value={f.hook} onChange={set("hook")} options={OPTS.hooks} />
            </Field>
            <Field label="Problem Being Solved">
              <TextInput value={f.problemStatement} onChange={set("problemStatement")} placeholder="e.g. Struggling to stay cool outdoors in humid weather" />
            </Field>
            <Field label="Core Benefit to Show">
              <TextInput value={f.keyBenefit} onChange={set("keyBenefit")} placeholder="e.g. Instant cooling relief that fits in your bag" />
            </Field>
            <Field label="CTA" required hint="Pick 1–2">
              <Chips value={f.cta} onChange={set("cta")} options={OPTS.cta} />
            </Field>
          </Section>

          {/* Creative Director */}
          <Section emoji="🎭" title="Creative Director" subtitle="AI-generated storyline based on your product and goals. Use it as-is or edit freely.">
            <div className="flex gap-2">
              <button
                onClick={() => fetchStoryline(f, setAiLoading, setStoryline, setAiError)}
                disabled={aiLoading || !f.productName || !f.keyFeatures}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                  aiLoading || !f.productName || !f.keyFeatures
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-purple-500 text-white border-purple-500 hover:bg-purple-600 active:scale-95"
                }`}>
                {aiLoading ? "✨ Thinking..." : storyline ? "🔄 Regenerate Idea" : "✨ Generate Storyline Idea"}
              </button>
            </div>
            {!f.productName && <p className="text-xs text-gray-400">Fill in Product Name and Key Features first.</p>}
            {aiError && <p className="text-xs text-red-400">{aiError}</p>}
            {storyline && (
              <Field label={`Storyline (${numClips} clips × ${cs}s each)`} hint="Edit freely — one line per clip beat">
                <TextArea value={storyline} onChange={setStoryline} rows={numClips + 1} placeholder="One line per clip..." />
              </Field>
            )}
          </Section>

          {/* Voiceover */}
          <Section emoji="🎙" title="Voiceover / Audio">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Language">
                <Select value={f.voLang} onChange={set("voLang")} options={OPTS.voLang} />
              </Field>
              <Field label="VO Tone">
                <TextInput value={f.voTone} onChange={set("voTone")} placeholder="e.g. Friendly, natural" />
              </Field>
            </div>
            {f.voLang && f.voLang !== "none" && (
              <Field label="Script Guide / Key Lines" hint="Optional talking points or full script">
                <TextArea value={f.customVO} onChange={set("customVO")} placeholder={"Opening: Hook line\nMiddle: Key benefit line\nClose: CTA line"} rows={3} />
              </Field>
            )}
          </Section>

          {/* Restrictions */}
          <Section emoji="❗" title="Restrictions & Guardrails">
            <Field label="Apply these restrictions">
              <Chips value={f.restrictions} onChange={set("restrictions")} options={OPTS.restrictions} />
            </Field>
            <Field label="Additional Notes">
              <TextArea value={f.extraNotes} onChange={set("extraNotes")} placeholder="e.g. Raya season setting — festive but not loud." rows={2} />
            </Field>
          </Section>

          {missingRequired && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-xs text-amber-700">
              ⚠️ <strong>Required:</strong> Product Name, Category, Key Features, Hook Strategy, and CTA.
            </div>
          )}

          <div className="flex gap-3 pb-8">
            <button onClick={generate} disabled={missingRequired}
              className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${missingRequired ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600 active:scale-95"}`}>
              Generate {numClips} Prompt{numClips > 1 ? "s" : ""} →
            </button>
            <button onClick={() => { setF(init); setClips([]); setStoryline(""); setTab("builder"); }}
              className="px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-100">
              Reset
            </button>
          </div>
        </>)}

        {tab === "output" && (
          <div ref={outputRef}>
            {clips.length > 0 ? (<>
              {/* Summary bar */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-xs text-blue-800">
                <strong>{clips.length} clip{clips.length > 1 ? "s" : ""} generated</strong> — {f.grokPlan === "pro" ? "⭐ Grok Pro" : "🆓 Grok Free"} · {cs}s per clip · {f.totalDuration}s total
                {clips.length > 1 && <span className="block mt-1 text-blue-600">Paste each prompt into Grok separately. Stitch clips or use Grok's Extend feature.</span>}
              </div>

              {/* Copy all */}
              {clips.length > 1 && (
                <button onClick={copyAll}
                  className="w-full mb-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 font-medium transition-all">
                  {copiedIdx === "all" ? "✅ All Copied!" : "📋 Copy All Prompts"}
                </button>
              )}

              {/* Clip cards */}
              {clips.map((clip, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <div>
                      <span className="text-sm font-bold text-gray-800">{clip.label}</span>
                      <span className="ml-2 text-xs text-gray-400">{clip.timing}</span>
                    </div>
                    <button
                      onClick={() => copyClip(clip.prompt, i)}
                      className="px-3 py-1 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 active:scale-95 transition-all">
                      {copiedIdx === i ? "✅ Copied!" : "📋 Copy"}
                    </button>
                  </div>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed font-mono p-4">{clip.prompt}</pre>
                </div>
              ))}

              <div className="flex gap-3 pb-8">
                <button onClick={copyAll}
                  className="flex-1 py-3 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 active:scale-95 transition-all">
                  {copiedIdx === "all" ? "✅ All Copied!" : "📋 Copy All Prompts"}
                </button>
                <button onClick={() => setTab("builder")}
                  className="px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-100">
                  ← Edit
                </button>
              </div>
            </>) : (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">📝</p>
                <p className="text-sm">Complete the builder and click <strong>Generate Prompts</strong>.</p>
                <button onClick={() => setTab("builder")} className="mt-4 px-4 py-2 rounded-lg bg-blue-50 text-blue-500 text-sm font-medium">← Back to Builder</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}