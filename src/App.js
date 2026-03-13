import React, { useState, useRef } from "react";

// ── Clip role assignment ───────────────────────────────────────────────────
const getClipRole = (clipNum, numClips) => {
  if (numClips === 1) return { role: "HOOK + CONTENT + CTA", tag: "🎣📖📢", desc: "Single clip — open with hook, show product benefit, end with CTA" };
  if (numClips === 2) {
    if (clipNum === 1) return { role: "HOOK + CONTENT", tag: "🎣📖", desc: "Open with hook, introduce problem and product" };
    return { role: "CONTENT + CTA", tag: "📖📢", desc: "Demonstrate key benefit, end with strong CTA" };
  }
  if (clipNum === 1) return { role: "HOOK", tag: "🎣", desc: "Stop the scroll — grab attention in first 1–2 seconds. Do NOT show product prominently yet." };
  if (clipNum === numClips) return { role: "CTA", tag: "📢", desc: "Drive action — hero product shot, clear reason to act now." };
  return { role: "CONTENT", tag: "📖", desc: "Demonstrate the product — show the problem being solved or benefit delivered." };
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

// ── Funnel ─────────────────────────────────────────────────────────────────
const FUNNEL_OPTIONS = [
  { value: "upper", emoji: "🔺", label: "Upper Funnel", tag: "Awareness", description: "Pull traffic & build awareness", objective: "Reach out to new customers who don't know your product yet", examples: ["Relatable problem", "Storytelling", "Point of view (POV)", "Trending hook"], color: "blue" },
  { value: "middle", emoji: "🔶", label: "Middle Funnel", tag: "Consideration", description: "Educate & build trust", objective: "Gain video views, community interaction and warm up leads", examples: ["Review / UGC", "Before & after", "Feature highlight", "Product demo"], color: "yellow" },
  { value: "lower", emoji: "🔻", label: "Lower Funnel", tag: "Conversion", description: "Drive purchase & close sales", objective: "Promotion, lead generation and direct purchase intent", examples: ["Limited offer", "CTA to buy", "Testimonial + price", "Urgency / scarcity"], color: "green" },
];

// ── Options ────────────────────────────────────────────────────────────────
const OPTS = {
  platform: [
    { value: "tiktok", label: "TikTok (9:16)" },
    { value: "reels", label: "Instagram Reels (9:16)" },
    { value: "youtube_shorts", label: "YouTube Shorts (9:16)" },
    { value: "youtube_main", label: "YouTube Main (16:9)" },
    { value: "feed_square", label: "Feed Post (1:1)" },
  ],
  grokPlan: [
    { value: "free", label: "🆓 Grok Free (6s per clip)" },
    { value: "pro", label: "⭐ Grok Pro (10s per clip)" },
  ],
  productCategory: [
    { value: "", label: "— Select category —" },
    { value: "tech_gadget", label: "Physical — tech gadget" },
    { value: "consumer_good", label: "Physical — consumer good" },
    { value: "skincare", label: "Physical — skincare / beauty" },
    { value: "vitamin_health", label: "Physical — vitamin / health" },
    { value: "apparel", label: "Physical — apparel / fashion" },
    { value: "food_beverage", label: "Physical — food & beverage" },
    { value: "home_living", label: "Physical — home & living" },
    { value: "software_app", label: "Software / app" },
    { value: "service", label: "Service" },
    { value: "event_campaign", label: "Event / campaign" },
    { value: "other", label: "Other — type below" },
  ],
  targetAudience: [
    { value: "students", label: "Students" },
    { value: "young_professionals", label: "Young professionals" },
    { value: "remote_workers", label: "Remote workers" },
    { value: "gamers", label: "Gamers" },
    { value: "business_exec", label: "Business users" },
    { value: "homemakers", label: "Homemakers" },
    { value: "parents", label: "Parents" },
    { value: "general", label: "General audience" },
  ],
  videoStyle: [
    { value: "ugc", label: "UGC — authentic, shot-on-phone" },
    { value: "commercial", label: "Commercial — polished, studio-lite" },
    { value: "lifestyle", label: "Lifestyle — candid, everyday" },
    { value: "tutorial", label: "Tutorial / How-to" },
    { value: "testimonial", label: "Testimonial — talking to camera" },
    { value: "unboxing", label: "Unboxing — reveal & first impression" },
    { value: "animated", label: "Animated / motion graphic" },
    { value: "minimal_clean", label: "Minimal, clean, modern" },
  ],
  tone: [
    { value: "calm_warm", label: "Calm & warm" },
    { value: "energetic", label: "Energetic & upbeat" },
    { value: "trustworthy", label: "Trustworthy" },
    { value: "friendly", label: "Friendly" },
    { value: "professional", label: "Professional" },
    { value: "fun_playful", label: "Fun & playful" },
    { value: "inspirational", label: "Inspirational" },
    { value: "relatable", label: "Relatable & everyday" },
  ],
  realism: [
    { value: "realistic", label: "Realistic live-action" },
    { value: "stylized", label: "Stylized but realistic" },
    { value: "animated", label: "Cartoon / fully animated" },
  ],
  colorGrading: [
    { value: "warm_golden", label: "Warm / golden hour" },
    { value: "cool_blue", label: "Cool / bluish tech" },
    { value: "neutral_natural", label: "Neutral / natural" },
    { value: "high_contrast", label: "High contrast / punchy" },
    { value: "soft_pastel", label: "Soft / pastel" },
  ],
  authenticity: [
    { value: "natural_not_staged", label: "Natural, not staged" },
    { value: "real_user_video", label: "Looks like a real user's video" },
    { value: "casual_vlog", label: "Feels like a casual vlog" },
    { value: "polished_professional", label: "Polished and professional" },
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
  bgActivity: [
    { value: "calm_still", label: "Calm, almost no movement" },
    { value: "light_activity", label: "Light activity, not distracting" },
    { value: "busy_dynamic", label: "Busy / dynamic background" },
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
  emotion: [
    { value: "frustrated_stressed", label: "Frustrated / stressed" },
    { value: "focused", label: "Focused / concentrating" },
    { value: "happy_relieved", label: "Happy / relieved" },
    { value: "excited", label: "Excited" },
    { value: "calm_relaxed", label: "Calm / relaxed" },
    { value: "arc_frustrated_relieved", label: "Arc: frustrated → relieved" },
    { value: "arc_curious_impressed", label: "Arc: curious → impressed" },
    { value: "arc_neutral_excited", label: "Arc: neutral → excited" },
  ],
  shotType: [
    { value: "close_up", label: "Close-up" },
    { value: "medium_shot", label: "Medium shot (waist up)" },
    { value: "wide_shot", label: "Wide shot (full body + env)" },
    { value: "product_closeup", label: "Product close-up" },
  ],
  cameraAngle: [
    { value: "eye_level", label: "Eye-level" },
    { value: "slight_high", label: "Slight high angle" },
    { value: "slight_low", label: "Slight low angle" },
    { value: "top_down", label: "Top-down" },
  ],
  cameraMove: [
    { value: "static", label: "Mostly static" },
    { value: "gentle_handheld", label: "Gentle handheld" },
    { value: "slow_push_in", label: "Slow push-in" },
    { value: "slow_pull_back", label: "Slow pull-back" },
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
  productFraming: [
    { value: "fully_visible", label: "Product fully visible" },
    { value: "centered", label: "Product centered" },
    { value: "rule_of_thirds", label: "Rule of thirds" },
    { value: "bg_blurred", label: "Background blurred, product sharp" },
  ],
  subjectMotion: [
    { value: "typing_clicking", label: "Typing / clicking" },
    { value: "looking_around", label: "Looking around stressed, then relaxing" },
    { value: "picking_up_product", label: "Picking up & using product" },
    { value: "pointing_at_screen", label: "Pointing at screen" },
    { value: "walking_moving", label: "Walking / moving naturally" },
  ],
  productInteraction: [
    { value: "plug_in", label: "Plug into laptop / phone" },
    { value: "turn_on", label: "Turn product on" },
    { value: "drag_windows", label: "Drag apps / windows onto screen" },
    { value: "hold_in_hand", label: "Hold in hand while moving" },
    { value: "unbox_reveal", label: "Unbox / reveal product" },
    { value: "apply_use", label: "Apply / use on skin / body" },
  ],
  emotionalArc: [
    { value: "frustrated_relieved", label: "Frustrated → relieved" },
    { value: "curious_impressed", label: "Curious → impressed" },
    { value: "neutral_excited", label: "Neutral → excited" },
    { value: "calm_confident", label: "Calm → confident" },
  ],
  endingFrame: [
    { value: "hero_product", label: "Hero product shot" },
    { value: "user_happy", label: "User happily using product" },
    { value: "product_branding", label: "Product + subtle branding" },
    { value: "cta_frame", label: "CTA-focused final frame" },
  ],
  hooks: [
    { value: "question", label: "Open with a question" },
    { value: "bold_claim", label: "Bold claim / statement" },
    { value: "problem_agitate", label: "Problem → agitate → solve" },
    { value: "reveal", label: "Unexpected reveal" },
    { value: "social_proof", label: "Social proof opener" },
    { value: "before_after", label: "Before & after contrast" },
    { value: "pov", label: "POV (point-of-view) shot" },
  ],
  cta: [
    { value: "shop_link", label: "Shop via link in bio" },
    { value: "comment", label: "Comment for more info" },
    { value: "follow", label: "Follow for more" },
    { value: "save_post", label: "Save this post" },
    { value: "try_it", label: "Try it yourself" },
    { value: "visit_website", label: "Visit website" },
    { value: "sign_up", label: "Sign up now" },
    { value: "no_cta", label: "No explicit CTA" },
  ],
  audioType: [
    { value: "silent", label: "No audio (silent)" },
    { value: "ambient_only", label: "Natural ambient sound only" },
    { value: "vo_only", label: "Voiceover only" },
    { value: "ambient_vo", label: "Ambient + voiceover" },
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
  speechType: [
    { value: "no_speech", label: "No one speaking on camera" },
    { value: "on_camera", label: "Subject speaking on camera" },
    { value: "offscreen_vo", label: "Off-screen voiceover only" },
  ],
  bgMusic: [
    { value: "no_music", label: "No music" },
    { value: "soft_bg", label: "Soft background music" },
    { value: "upbeat", label: "Upbeat background music" },
    { value: "dramatic", label: "Dramatic / cinematic music" },
  ],
  frameRate: [
    { value: "24fps", label: "24fps — cinematic" },
    { value: "30fps", label: "30fps — standard" },
    { value: "60fps", label: "60fps — very smooth" },
  ],
  resolution: [
    { value: "1080p", label: "1080p Full HD" },
    { value: "1440p", label: "1440p" },
    { value: "720p", label: "720p" },
    { value: "best", label: "Best quality available" },
  ],
  depthOfField: [
    { value: "subject_sharp_bg_blur", label: "Subject & product sharp, BG slightly blurred" },
    { value: "everything_sharp", label: "Everything in focus" },
    { value: "product_sharp", label: "Product sharp, BG blurred" },
  ],
  antiHallucination: [
    { value: "no_extra_limbs", label: "No extra limbs / fingers" },
    { value: "no_warped_faces", label: "No warped faces" },
    { value: "no_floating_objects", label: "No floating objects" },
    { value: "no_random_ui", label: "No random UI / screens floating" },
    { value: "no_fictional_features", label: "No fictional product features" },
  ],
  restrictions: [
    { value: "no_text_overlay", label: "No text overlay" },
    { value: "no_effects", label: "No artificial effects" },
    { value: "no_exaggerated_acting", label: "No exaggerated acting" },
    { value: "no_influencer_vibe", label: "No influencer vibe" },
    { value: "no_branded_bg", label: "No branded items in BG" },
    { value: "no_children", label: "No children in frame" },
    { value: "halal_visual", label: "Visually halal-compliant" },
    { value: "no_male_talent", label: "No male talent" },
    { value: "no_competitor", label: "No competitor products" },
    { value: "match_reference", label: "Product must match reference image" },
    { value: "no_logo_change", label: "No changes to logo" },
  ],
};

const init = {
  campaignName: "",
  platform: "tiktok", grokPlan: "free", totalDuration: "12",
  funnel: "",
  productName: "", productCategory: "", productCategoryCustom: "",
  keyColors: "", keyFeaturesCustom: "", usp: "", productRules: "",
  targetAudience: [],
  videoStyle: "ugc", tone: [], realism: "", colorGrading: [], authenticity: [],
  settingPreset: "", settingCustom: "", settingDetail: "", bgActivity: "",
  lightingPreset: "", lightingCustom: "",
  talent: "solo_female", talentStyle: [], talentDetail: "", emotion: [],
  shotType: [], cameraAngle: "", cameraMove: "gentle_handheld", heroAngle: "", productFraming: [],
  subjectMotion: [], productInteraction: [],
  hook: [], problemStatement: "", keyBenefit: "", emotionalArc: "", endingFrame: "", cta: [],
  audioType: "", voLang: "", voTone: "", speechType: "", bgMusic: "", customVO: "",
  frameRate: "", resolution: "", depthOfField: "",
  referenceUrl: "", brandStyle: "",
  antiHallucination: [], restrictions: [], extraNotes: "",
  storyline: "",
};

// ── Helpers ────────────────────────────────────────────────────────────────
const clipSec = plan => plan === "pro" ? 10 : 6;
const calcClips = (plan, dur) => { const cs = clipSec(plan); const total = parseInt(dur) || cs; return Math.ceil(total / cs); };
const settingLabel = f => { if (f.settingPreset === "custom") return f.settingCustom || "Custom location"; return OPTS.settingPreset.find(o => o.value === f.settingPreset)?.label || "Not specified"; };
const lightingLabel = f => { if (f.lightingPreset === "custom") return f.lightingCustom || "Custom lighting"; return OPTS.lightingPreset.find(o => o.value === f.lightingPreset)?.label || "Natural daylight"; };

// ── SAFE helpers — never crash on wrong type ───────────────────────────────
const optLabel = (opts, val) => (Array.isArray(opts) ? opts : []).find(o => o.value === val)?.label || val || "";
const chipsLabel = (opts, vals) => (Array.isArray(vals) ? vals : []).map(v => optLabel(opts, v)).filter(Boolean).join(", ");

// ── Prompt generator ───────────────────────────────────────────────────────
const buildClipPrompts = (f, storyline) => {
  const cs = clipSec(f.grokPlan);
  const total = parseInt(f.totalDuration) || cs;
  const numClips = Math.ceil(total / cs);
  const funnelOpt = FUNNEL_OPTIONS.find(o => o.value === f.funnel);
  const toneLabel = chipsLabel(OPTS.tone, f.tone) || "calm & warm";
  const camOpt = OPTS.cameraMove.find(o => o.value === f.cameraMove);
  const heroOpt = OPTS.heroAngle.find(o => o.value === f.heroAngle);
  const talentOpt = OPTS.talent.find(o => o.value === f.talent);
  const styleOpt = OPTS.videoStyle.find(o => o.value === f.videoStyle);
  const ctaLabel = chipsLabel(OPTS.cta, f.cta);
  const catLabel = f.productCategory === "other" ? (f.productCategoryCustom || "") : optLabel(OPTS.productCategory, f.productCategory);
  const restrictions = (Array.isArray(f.restrictions) ? f.restrictions : []).map(r => `❌ ${optLabel(OPTS.restrictions, r)}`).join("  ");
  const antiHalluc = (Array.isArray(f.antiHallucination) ? f.antiHallucination : []).map(r => `❌ ${optLabel(OPTS.antiHallucination, r)}`).join("  ");
  const storyLines = storyline ? storyline.split("\n").filter(l => l.trim()) : [];

  const funnelDir = {
    upper: { hook: "Open with relatable problem or POV. Do NOT mention the product yet. Make viewer say 'that's so me'.", content: "Introduce product naturally as a discovery. Soft curious tone — not a hard sell.", cta: "Soft CTA only — follow, save, or comment. No price, no urgency." },
    middle: { hook: "Agitate the pain point clearly. Viewer should feel 'yes, that's my problem'.", content: "Show product solving the problem with clear before/after or feature demo. Build trust.", cta: "Mid-strength CTA — link in bio, comment for info. Can mention price." },
    lower: { hook: "Open with urgency, social proof, or bold claim. Viewer should feel they're missing out.", content: "Highlight key value — price, offer, or transformation. Create strong desire.", cta: "Strong direct CTA — buy now, limited offer, link in bio. Urgency or scarcity." },
  };
  const fd = funnelDir[f.funnel] || funnelDir.middle;

const baseContext = `
CAMPAIGN: ${f.campaignName || "Untitled"}
PLATFORM: ${optLabel(OPTS.platform, f.platform)}
PRODUCT: ${f.productName} | ${catLabel}
COLORS: ${f.keyColors || "as per product"}
KEY FEATURES: ${f.keyFeaturesCustom || "as specified"}
USP: ${f.usp || f.keyBenefit || "as specified"}
TARGET AUDIENCE: ${chipsLabel(OPTS.targetAudience, f.targetAudience) || "general audience"}
SALES FUNNEL: ${funnelOpt?.label || ""} (${funnelOpt?.tag || ""})
FUNNEL OBJECTIVE: ${funnelOpt?.objective || ""}
STYLE: ${styleOpt?.label || ""} | TONE: ${toneLabel}
REALISM: ${optLabel(OPTS.realism, f.realism) || "realistic live-action"}
COLOR GRADING: ${chipsLabel(OPTS.colorGrading, f.colorGrading) || "natural"}
AUTHENTICITY: ${optLabel(OPTS.authenticity, f.authenticity) || "natural, not staged"}
LOCATION: ${settingLabel(f)}${f.settingDetail ? ` — ${f.settingDetail}` : ""}
LIGHTING: ${lightingLabel(f)}
BACKGROUND ACTIVITY: ${optLabel(OPTS.bgActivity, f.bgActivity) || "calm"}
TALENT: ${f.talent !== "no_talent" ? `${talentOpt?.label || ""}${chipsLabel(OPTS.talentStyle, f.talentStyle) ? ", " + chipsLabel(OPTS.talentStyle, f.talentStyle) : ""}${f.talentDetail ? ", " + f.talentDetail : ""}` : "No talent — product only"}
EMOTION: ${chipsLabel(OPTS.emotion, f.emotion) || "natural"}
SHOT TYPE: ${chipsLabel(OPTS.shotType, f.shotType) || "medium shot"}
CAMERA ANGLE: ${optLabel(OPTS.cameraAngle, f.cameraAngle) || "eye-level"}
CAMERA MOVEMENT: ${camOpt?.label || "gentle handheld"}
HERO ANGLE: ${heroOpt?.label || "45° elevated"}
PRODUCT FRAMING: ${chipsLabel(OPTS.productFraming, f.productFraming) || "product fully visible, centered"}
SUBJECT MOTION: ${chipsLabel(OPTS.subjectMotion, f.subjectMotion) || "natural movement"}
PRODUCT INTERACTION: ${chipsLabel(OPTS.productInteraction, f.productInteraction) || "natural use"}
EMOTIONAL ARC: ${optLabel(OPTS.emotionalArc, f.emotionalArc) || "natural progression"}
ENDING FRAME: ${optLabel(OPTS.endingFrame, f.endingFrame) || "hero product shot"}
PROBLEM BEING SOLVED: ${f.problemStatement || "not specified"}
HOOK STRATEGY: ${chipsLabel(OPTS.hooks, f.hook) || "pattern interrupt"}
CTA: ${ctaLabel || "not specified"}
AUDIO: ${optLabel(OPTS.audioType, f.audioType) || "natural ambient"}${f.bgMusic ? ` | Music: ${optLabel(OPTS.bgMusic, f.bgMusic)}` : ""}
FRAME RATE: ${optLabel(OPTS.frameRate, f.frameRate) || "30fps"}
RESOLUTION: ${optLabel(OPTS.resolution, f.resolution) || "1080p"}
DEPTH OF FIELD: ${optLabel(OPTS.depthOfField, f.depthOfField) || "subject sharp, background slightly blurred"}
${f.referenceUrl ? `REFERENCE: ${f.referenceUrl}` : ""}
${f.brandStyle ? `BRAND STYLE: ${optLabel([{value:"clean_minimal_tech",label:"Clean minimal tech"},{value:"playful_colorful",label:"Playful & colorful"},{value:"serious_corporate",label:"Serious & corporate"},{value:"warm_lifestyle",label:"Warm lifestyle brand"},{value:"premium_luxury",label:"Premium / luxury"}], f.brandStyle)}` : ""}
${restrictions ? `RESTRICTIONS: ${restrictions}` : ""}
${antiHalluc ? `ANTI-HALLUCINATION: ${antiHalluc}` : ""}
${f.extraNotes ? `ADDITIONAL NOTES: ${f.extraNotes}` : ""}`.trim();

  const clips = [];
  for (let i = 0; i < numClips; i++) {
    const clipNum = i + 1;
    const startSec = i * cs;
    const endSec = Math.min((i + 1) * cs, total);
    const actualDur = endSec - startSec;
    const clipRole = getClipRole(clipNum, numClips);
    const rawBeat = storyLines[i] || "";
    const cleanBeat = rawBeat.replace(/^\d+\.\s*\[?(HOOK|CONTENT|CTA)[^\]]*\]?\s*/i, "").trim();
    const sceneBeat = cleanBeat ||
      (clipRole.role.includes("HOOK") ? `Hook — ${f.problemStatement || "show relatable problem or pattern interrupt"}` :
       clipRole.role === "CTA" ? `CTA close — ${ctaLabel || "hero shot of product, drive action"}` :
       `Content — demonstrate: ${f.keyBenefit || f.keyFeaturesCustom}`);

    const hookDir = clipRole.role.includes("HOOK") ? `\n🎣 HOOK DIRECTION\n• Hook strategy: ${chipsLabel(OPTS.hooks, f.hook) || "pattern interrupt"}\n• First 1–2 seconds must STOP THE SCROLL — no slow intros\n• ${fd.hook}` : "";
    const contentDir = clipRole.role.includes("CONTENT") ? `\n📖 CONTENT DIRECTION\n• Key benefit to show: ${f.keyBenefit || f.keyFeaturesCustom}\n• ${fd.content}\n• Emotional beat: viewer should feel ${f.funnel === "upper" ? "curious and intrigued" : f.funnel === "middle" ? "understood and convinced" : "excited and ready to buy"}` : "";
    const ctaDir = clipRole.role.includes("CTA") ? `\n📢 CTA DIRECTION\n• Action: ${ctaLabel}\n• End on clean hero shot — ${heroOpt?.label || "45° elevated"} — product centered\n• ${fd.cta}\n• Last 1–2 seconds must feel conclusive — not abrupt` : "";

    clips.push({
      label: `CLIP ${clipNum} of ${numClips}`,
      role: clipRole.role, tag: clipRole.tag,
      timing: `${startSec}s – ${endSec}s (${actualDur}s)`,
      prompt: `═══════════════════════════════════
🎬 GROK VIDEO PROMPT — CLIP ${clipNum}/${numClips}
${f.grokPlan === "pro" ? "⭐ Grok Pro" : "🆓 Grok Free"} | ${actualDur}s | Timeline: ${startSec}s–${endSec}s
${clipRole.tag} ROLE: ${clipRole.role}
${clipRole.desc}
═══════════════════════════════════

${baseContext}

━━━ SCENE BEAT ━━━
${sceneBeat}
${hookDir}${contentDir}${ctaDir}
${f.productRules ? `\nPRODUCT RULES:\n${f.productRules.split("\n").map(l => "• " + l).join("\n")}` : ""}
${f.voLang && f.voLang !== "none" ? `\nVOICEOVER: Language: ${optLabel(OPTS.voLang, f.voLang)} | Type: ${optLabel(OPTS.speechType, f.speechType)} | Tone: ${f.voTone || "conversational, not scripted"}${f.customVO ? `\nVO SCRIPT GUIDE:\n${f.customVO}` : ""}` : ""}
${clipNum < numClips ? `\n⚡ CONTINUITY: Stitch with Clip ${clipNum + 1}. End on a clean frame — avoid abrupt cuts.` : ""}

❗ OVERALL: Authentic, natural, purposeful. Not staged. Not an ad — even if it is one.
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
  const catLabel = f.productCategory === "other" ? (f.productCategoryCustom || "") : optLabel(OPTS.productCategory, f.productCategory);

  const clipRoleMap = Array.from({ length: numClips }, (_, i) => {
    const r = getClipRole(i + 1, numClips);
    return `Clip ${i + 1}: [${r.role}] — ${r.desc}`;
  }).join("\n");

  const funnelGuidance = {
    upper: { hook: "Relatable problem or POV — do NOT mention product. Make viewer say 'that's so me'.", content: "Soft product discovery — curious tone, no hard sell.", cta: "Soft only — follow, save, comment. No price or urgency." },
    middle: { hook: "Agitate the pain point clearly. Viewer should feel 'yes, that's my problem'.", content: "Show product solving problem with before/after or feature demo. Build trust.", cta: "Mid-strength — link in bio, comment for info. Can mention price." },
    lower: { hook: "Urgency, social proof, or bold claim. Viewer should feel they're missing out.", content: "Highlight value — price, offer, transformation. Create strong desire.", cta: "Strong and direct — buy now, limited offer, link in bio. Urgency or scarcity." },
  };
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

STRICT OUTPUT FORMAT:
- Return ONLY a numbered list, one line per clip
- Each line MUST start with the clip role in brackets: [HOOK], [CONTENT], [CTA], or combined e.g. [HOOK + CONTENT]
- No extra commentary, no markdown, no preamble
- Format: "1. [ROLE] <visual scene description>"
Each description must include: camera angle + what happens visually + emotional beat. Be specific.`,
        messages: [{
          role: "user",
          content: `Generate a ${numClips}-beat video storyline with Hook → Content → CTA structure.

CLIP ROLE ASSIGNMENTS:
${clipRoleMap}

PRODUCT BRIEF:
Product: ${f.productName || "unnamed"} | Category: ${catLabel}
Features: ${f.keyFeaturesCustom || "not specified"} | USP: ${f.usp || "not specified"}
Audience: ${chipsLabel(OPTS.targetAudience, f.targetAudience) || "general"}
Problem: ${f.problemStatement || "not specified"} | Benefit: ${f.keyBenefit || "not specified"}
Style: ${f.videoStyle} | Tone: ${chipsLabel(OPTS.tone, f.tone) || "calm, warm"}
Hook: ${chipsLabel(OPTS.hooks, f.hook) || "pattern interrupt"} | CTA: ${chipsLabel(OPTS.cta, f.cta) || "link in bio"}
Setting: ${settingLabel(f)} | Talent: ${f.talent}
Emotion: ${chipsLabel(OPTS.emotion, f.emotion) || "natural"}
Emotional arc: ${optLabel(OPTS.emotionalArc, f.emotionalArc) || "natural"}
Ending frame: ${optLabel(OPTS.endingFrame, f.endingFrame) || "hero product shot"}
Sales Funnel: ${FUNNEL_OPTIONS.find(o => o.value === f.funnel)?.label || "not specified"}

FUNNEL DIRECTION PER ROLE:
[HOOK]: ${fg.hook}
[CONTENT]: ${fg.content}
[CTA]: ${fg.cta}

RULES: Each clip = ${cs}s. HOOK = tease problem, not product. CONTENT = show solution. CTA = drive action.
Return exactly ${numClips} lines. Start each with role tag in brackets.`
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

// ── Main App ───────────────────────────────────────────────────────────────
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
  const missingRequired = !f.productName || !f.productCategory || !f.keyFeaturesCustom || !f.hook.length || !f.cta.length || !f.funnel;

  const generate = () => {
    const result = buildClipPrompts(f, storyline);
    setClips(result);
    setTab("output");
    setTimeout(() => outputRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const copyClip = (text, idx) => {
    const el = document.createElement("textarea");
    el.value = text; el.style.position = "fixed"; el.style.opacity = "0";
    document.body.appendChild(el); el.focus(); el.select();
    try { document.execCommand("copy"); } catch {}
    document.body.removeChild(el);
    setCopiedIdx(idx); setTimeout(() => setCopiedIdx(null), 2000);
  };

  const copyAll = () => copyClip(clips.map(c => c.prompt).join("\n\n"), "all");

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <h1 className="text-base font-bold text-gray-900">🎬 TikTok UGC Prompt Builder</h1>
        <p className="text-xs text-gray-500">Powered for Grok — any product, any brand</p>
      </div>
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

          <Section emoji="📁" title="Project" subtitle="Optional — helps you organise multiple campaigns.">
            <Field label="Campaign / Project Name">
              <TextInput value={f.campaignName} onChange={set("campaignName")} placeholder="e.g. Raya 2025 — Vflow Monitor Launch" />
            </Field>
          </Section>

          <Section emoji="⚙️" title="Grok Settings" subtitle="Select your plan — determines how many clips are generated.">
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
            <Field label="Total Video Duration (seconds)" hint={`Each clip = ${cs}s max. Your duration splits into ${numClips} clip${numClips > 1 ? "s" : ""}.`}>
              <TextInput value={f.totalDuration} onChange={set("totalDuration")} placeholder={`e.g. ${cs * 2}`} />
            </Field>
            {numClips > 1 && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
                📋 Generates <strong>{numClips} separate prompts</strong> ({cs}s each). Generate each in Grok then stitch or use Extend.
              </div>
            )}
            <Field label="Platform">
              <Chips value={f.platform} onChange={set("platform")} options={OPTS.platform} single />
            </Field>
          </Section>

          <Section emoji="🎯" title="Sales Funnel Stage" subtitle="Select your video objective — shapes the entire storyline and strategy.">
            <div className="space-y-2">
              {FUNNEL_OPTIONS.map(o => (
                <button key={o.value} onClick={() => set("funnel")(o.value)}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all ${f.funnel === o.value ? o.color === "blue" ? "border-blue-500 bg-blue-50" : o.color === "yellow" ? "border-yellow-500 bg-yellow-50" : "border-green-500 bg-green-50" : "border-gray-200 bg-white hover:border-gray-300"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-gray-800">{o.emoji} {o.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.color === "blue" ? "bg-blue-100 text-blue-700" : o.color === "yellow" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>{o.tag}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{o.description}</p>
                  <p className="text-xs text-gray-400">📌 {o.objective}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {o.examples.map(e => <span key={e} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{e}</span>)}
                  </div>
                </button>
              ))}
            </div>
            {f.funnel && (
              <div className={`text-xs px-3 py-2 rounded-lg mt-1 ${f.funnel === "upper" ? "bg-blue-50 text-blue-700" : f.funnel === "middle" ? "bg-yellow-50 text-yellow-700" : "bg-green-50 text-green-700"}`}>
                {f.funnel === "upper" && "✅ Hook→Content→CTA will focus on AWARENESS — no hard selling."}
                {f.funnel === "middle" && "✅ Hook→Content→CTA will focus on CONSIDERATION — educate and build trust."}
                {f.funnel === "lower" && "✅ Hook→Content→CTA will focus on CONVERSION — urgency and purchase intent."}
              </div>
            )}
          </Section>

          <Section emoji="📦" title="Product" subtitle="Lock down your product — stays consistent across every clip.">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Product Name" required>
                <TextInput value={f.productName} onChange={set("productName")} placeholder="e.g. Vflow Portable Monitor" />
              </Field>
              <Field label="Product Category" required>
                <Select value={f.productCategory} onChange={set("productCategory")} options={OPTS.productCategory} />
              </Field>
            </div>
            {f.productCategory === "other" && (
              <Field label="Custom Category">
                <TextInput value={f.productCategoryCustom} onChange={set("productCategoryCustom")} placeholder="Describe your product type" />
              </Field>
            )}
            <Field label="Key Colors" hint="Exact colors — must not change across clips">
              <TextInput value={f.keyColors} onChange={set("keyColors")} placeholder="e.g. Matte black body, silver stand" />
            </Field>
            <Field label="Key Features to Highlight" required hint="Describe what the video must show">
              <TextArea value={f.keyFeaturesCustom} onChange={set("keyFeaturesCustom")} placeholder="e.g. Ultra-slim 15.6 inch, USB-C plug-and-play, 1080p display, foldable stand" rows={2} />
            </Field>
            <Field label="USP — Unique Selling Point">
              <TextInput value={f.usp} onChange={set("usp")} placeholder="e.g. Thinnest portable monitor that fits in a laptop bag" />
            </Field>
            <Field label="Target Audience (pick all that apply)">
              <Chips value={f.targetAudience} onChange={set("targetAudience")} options={OPTS.targetAudience} />
            </Field>
            <Field label="Product Rules" hint="Visual dos and don'ts (optional)">
              <TextArea value={f.productRules} onChange={set("productRules")} placeholder={"e.g. Always show product screen on\nDo not show product disassembled"} rows={2} />
            </Field>
          </Section>

          <Section emoji="🎨" title="Style & Tone">
            <Field label="Video Style">
              <Chips value={f.videoStyle} onChange={set("videoStyle")} options={OPTS.videoStyle} single />
            </Field>
            <Field label="Tone (pick all that apply)">
              <Chips value={f.tone} onChange={set("tone")} options={OPTS.tone} />
            </Field>
            <Field label="Realism Level">
              <Chips value={f.realism} onChange={set("realism")} options={OPTS.realism} single />
            </Field>
            <Field label="Color Grading / Mood">
              <Chips value={f.colorGrading} onChange={set("colorGrading")} options={OPTS.colorGrading} />
            </Field>
            <Field label="Authenticity Feel">
              <Chips value={f.authenticity} onChange={set("authenticity")} options={OPTS.authenticity} single />
            </Field>
          </Section>

          <Section emoji="🏠" title="Setting & Environment">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Location">
                <Select value={f.settingPreset} onChange={set("settingPreset")} options={OPTS.settingPreset} />
              </Field>
              <Field label="Lighting">
                <Select value={f.lightingPreset} onChange={set("lightingPreset")} options={OPTS.lightingPreset} />
              </Field>
            </div>
            {f.settingPreset === "custom" && <Field label="Custom Location"><TextInput value={f.settingCustom} onChange={set("settingCustom")} placeholder="e.g. Rooftop terrace, urban skyline at dusk" /></Field>}
            {f.lightingPreset === "custom" && <Field label="Custom Lighting"><TextInput value={f.lightingCustom} onChange={set("lightingCustom")} placeholder="e.g. Neon-lit night scene, pink accent from left" /></Field>}
            <Field label="Environment Details & Props">
              <TextInput value={f.settingDetail} onChange={set("settingDetail")} placeholder="e.g. Desk + laptop + coffee, minimal props, clean workspace" />
            </Field>
            <Field label="Background Activity Level">
              <Chips value={f.bgActivity} onChange={set("bgActivity")} options={OPTS.bgActivity} single />
            </Field>
          </Section>

          <Section emoji="👤" title="Talent & Character">
            <Field label="Talent Type">
              <Chips value={f.talent} onChange={set("talent")} options={OPTS.talent} single />
            </Field>
            {f.talent !== "no_talent" && (<>
              <Field label="Outfit Style"><Chips value={f.talentStyle} onChange={set("talentStyle")} options={OPTS.talentStyle} /></Field>
              <Field label="Appearance Details" hint="Outfit color, hair style — keeps character consistent">
                <TextInput value={f.talentDetail} onChange={set("talentDetail")} placeholder="e.g. White shirt, dark jeans, hair tied back" />
              </Field>
              <Field label="Emotion / Facial Expression">
                <Chips value={f.emotion} onChange={set("emotion")} options={OPTS.emotion} />
              </Field>
            </>)}
          </Section>

          <Section emoji="🎥" title="Camera & Framing">
            <Field label="Shot Type (pick all that apply)"><Chips value={f.shotType} onChange={set("shotType")} options={OPTS.shotType} /></Field>
            <Field label="Camera Angle"><Chips value={f.cameraAngle} onChange={set("cameraAngle")} options={OPTS.cameraAngle} single /></Field>
            <Field label="Camera Movement"><Chips value={f.cameraMove} onChange={set("cameraMove")} options={OPTS.cameraMove} single /></Field>
            <Field label="Hero / Product Shot Angle" hint="Final closing shot">
              <Select value={f.heroAngle} onChange={set("heroAngle")} options={OPTS.heroAngle} />
            </Field>
            <Field label="Product Framing Rules"><Chips value={f.productFraming} onChange={set("productFraming")} options={OPTS.productFraming} /></Field>
          </Section>

          <Section emoji="🎬" title="Action & Motion">
            <Field label="Subject Motion (pick all that apply)"><Chips value={f.subjectMotion} onChange={set("subjectMotion")} options={OPTS.subjectMotion} /></Field>
            <Field label="Product Interaction (pick all that apply)"><Chips value={f.productInteraction} onChange={set("productInteraction")} options={OPTS.productInteraction} /></Field>
          </Section>

          <Section emoji="📖" title="Story & Structure">
            <Field label="Hook Strategy" required hint="How does the video open? Pick 1–2">
              <Chips value={f.hook} onChange={set("hook")} options={OPTS.hooks} />
            </Field>
            <Field label="Problem Being Solved">
              <TextInput value={f.problemStatement} onChange={set("problemStatement")} placeholder="e.g. Laptop screen too small for multi-tasking" />
            </Field>
            <Field label="Core Benefit to Show">
              <TextInput value={f.keyBenefit} onChange={set("keyBenefit")} placeholder="e.g. Instant dual-screen setup anywhere in seconds" />
            </Field>
            <Field label="Emotional Arc"><Chips value={f.emotionalArc} onChange={set("emotionalArc")} options={OPTS.emotionalArc} single /></Field>
            <Field label="Ending Frame / Last Shot"><Chips value={f.endingFrame} onChange={set("endingFrame")} options={OPTS.endingFrame} single /></Field>
            <Field label="CTA" required hint="Pick 1–2"><Chips value={f.cta} onChange={set("cta")} options={OPTS.cta} /></Field>
          </Section>

          <Section emoji="🎭" title="Creative Director" subtitle="AI generates a structured Hook → Content → CTA storyline. Edit freely before generating.">
            <button
              onClick={() => fetchStoryline(f, setAiLoading, setStoryline, setAiError)}
              disabled={aiLoading || !f.productName || !f.keyFeaturesCustom}
              className={`w-full py-2 rounded-lg text-sm font-medium border transition-all ${aiLoading || !f.productName || !f.keyFeaturesCustom ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : "bg-purple-500 text-white border-purple-500 hover:bg-purple-600 active:scale-95"}`}>
              {aiLoading ? "✨ Thinking..." : storyline ? "🔄 Regenerate Idea" : "✨ Generate Storyline Idea"}
            </button>
            {(!f.productName || !f.keyFeaturesCustom) && <p className="text-xs text-gray-400">Fill in Product Name and Key Features first.</p>}
            {aiError && <p className="text-xs text-red-400">{aiError}</p>}
            {storyline && (
              <Field label={`Storyline (${numClips} clips × ${cs}s) — Hook → Content → CTA`} hint="Edit freely — one line per clip beat">
                <TextArea value={storyline} onChange={setStoryline} rows={6} placeholder="One line per clip..." />
              </Field>
            )}
          </Section>

          <Section emoji="🎙" title="Audio & Voiceover">
            <Field label="Audio Type"><Chips value={f.audioType} onChange={set("audioType")} options={OPTS.audioType} single /></Field>
            <Field label="Background Music"><Chips value={f.bgMusic} onChange={set("bgMusic")} options={OPTS.bgMusic} single /></Field>
            {f.audioType !== "silent" && f.audioType !== "ambient_only" && (<>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Voiceover Language"><Select value={f.voLang} onChange={set("voLang")} options={OPTS.voLang} /></Field>
                <Field label="VO Tone"><TextInput value={f.voTone} onChange={set("voTone")} placeholder="e.g. Friendly, calm" /></Field>
              </div>
              <Field label="Speech Type"><Chips value={f.speechType} onChange={set("speechType")} options={OPTS.speechType} single /></Field>
              <Field label="Script Guide / Key Lines" hint="Optional talking points">
                <TextArea value={f.customVO} onChange={set("customVO")} placeholder={"Opening: Hook line\nMiddle: Key benefit\nClose: CTA"} rows={3} />
              </Field>
            </>)}
          </Section>

          <Section emoji="⚡" title="Technical Settings">
            <Field label="Frame Rate"><Chips value={f.frameRate} onChange={set("frameRate")} options={OPTS.frameRate} single /></Field>
            <Field label="Resolution"><Chips value={f.resolution} onChange={set("resolution")} options={OPTS.resolution} single /></Field>
            <Field label="Focus & Depth of Field"><Chips value={f.depthOfField} onChange={set("depthOfField")} options={OPTS.depthOfField} single /></Field>
          </Section>

          <Section emoji="🖼" title="References">
            <Field label="Reference Image URL / Product Link" hint="Dramatically improves accuracy">
              <TextInput value={f.referenceUrl} onChange={set("referenceUrl")} placeholder="e.g. https://yoursite.com/product-image.jpg" />
            </Field>
            <Field label="Brand Style Reference">
              <Chips value={f.brandStyle} onChange={set("brandStyle")} options={[
                { value: "clean_minimal_tech", label: "Clean minimal tech" },
                { value: "playful_colorful", label: "Playful & colorful" },
                { value: "serious_corporate", label: "Serious & corporate" },
                { value: "warm_lifestyle", label: "Warm lifestyle brand" },
                { value: "premium_luxury", label: "Premium / luxury" },
              ]} single />
            </Field>
          </Section>

          <Section emoji="❗" title="Restrictions & Guardrails">
            <Field label="Anti-Hallucination Rules" hint="Prevents common AI video artifacts">
              <Chips value={f.antiHallucination} onChange={set("antiHallucination")} options={OPTS.antiHallucination} />
            </Field>
            <Field label="Additional Restrictions">
              <Chips value={f.restrictions} onChange={set("restrictions")} options={OPTS.restrictions} />
            </Field>
            <Field label="Additional Notes">
              <TextArea value={f.extraNotes} onChange={set("extraNotes")} placeholder="e.g. Raya season — festive but not loud." rows={2} />
            </Field>
          </Section>

          {missingRequired && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-xs text-amber-700">
              ⚠️ <strong>Required:</strong> Funnel Stage, Product Name, Category, Key Features, Hook Strategy, and CTA.
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
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-xs text-blue-800">
                <strong>{clips.length} clip{clips.length > 1 ? "s" : ""} generated</strong> — {f.grokPlan === "pro" ? "⭐ Grok Pro" : "🆓 Grok Free"} · {cs}s per clip · {f.totalDuration}s total
                {clips.length > 1 && <span className="block mt-1 text-blue-600">Paste each prompt into Grok separately. Stitch clips or use Grok's Extend feature.</span>}
              </div>
              {clips.length > 1 && (
                <button onClick={copyAll} className="w-full mb-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 font-medium transition-all">
                  {copiedIdx === "all" ? "✅ All Copied!" : "📋 Copy All Prompts"}
                </button>
              )}
              {clips.map((clip, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <div>
                      <span className="text-sm font-bold text-gray-800">{clip.label}</span>
                      <span className="ml-2 text-xs font-medium text-purple-600">{clip.tag} {clip.role}</span>
                      <span className="ml-2 text-xs text-gray-400">{clip.timing}</span>
                    </div>
                    <button onClick={() => copyClip(clip.prompt, i)}
                      className="px-3 py-1 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 active:scale-95 transition-all">
                      {copiedIdx === i ? "✅ Copied!" : "📋 Copy"}
                    </button>
                  </div>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed font-mono p-4">{clip.prompt}</pre>
                </div>
              ))}
              <div className="flex gap-3 pb-8">
                <button onClick={copyAll} className="flex-1 py-3 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 active:scale-95 transition-all">
                  {copiedIdx === "all" ? "✅ All Copied!" : "📋 Copy All Prompts"}
                </button>
                <button onClick={() => setTab("builder")} className="px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-100">← Edit</button>
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
