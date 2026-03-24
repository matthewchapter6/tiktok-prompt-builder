import { useState, useRef } from "react";
import { OPTS, FUNNEL_OPTIONS } from "./constants/options";
import { init } from "./constants/init";
import { clipSec, calcClips, settingLabel, lightingLabel, buildClipPrompts, fetchStoryline } from "./utils/helpers";

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
  const missingRequired = !f.productName || !f.productCategory || !f.keyFeatures || !f.hook.length || !f.cta.length || !f.funnel;

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
    el.focus(); el.select();
    try { document.execCommand("copy"); } catch {}
    document.body.removeChild(el);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const copyAll = () => copyClip(clips.map(c => c.prompt).join("\n\n"), "all");

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

          {/* Funnel */}
          <Section emoji="🎯" title="Sales Funnel Stage" subtitle="Select your video objective — this shapes the entire storyline and strategy.">
            <div className="space-y-2">
              {FUNNEL_OPTIONS.map(o => (
                <button key={o.value} onClick={() => set("funnel")(o.value)}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                    f.funnel === o.value
                      ? o.color === "blue" ? "border-blue-500 bg-blue-50" : o.color === "yellow" ? "border-yellow-500 bg-yellow-50" : "border-green-500 bg-green-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-gray-800">{o.emoji} {o.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      o.color === "blue" ? "bg-blue-100 text-blue-700" : o.color === "yellow" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                    }`}>{o.tag}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-1">{o.description}</p>
                  <p className="text-xs text-gray-400">📌 {o.objective}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {o.examples.map(e => (
                      <span key={e} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{e}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
            {f.funnel && (
              <div className={`text-xs px-3 py-2 rounded-lg mt-1 ${
                f.funnel === "upper" ? "bg-blue-50 text-blue-700" : f.funnel === "middle" ? "bg-yellow-50 text-yellow-700" : "bg-green-50 text-green-700"
              }`}>
                {f.funnel === "upper" && "✅ Hooks, CTA and storyline will focus on AWARENESS — no hard selling."}
                {f.funnel === "middle" && "✅ Hooks, CTA and storyline will focus on CONSIDERATION — educate and build trust."}
                {f.funnel === "lower" && "✅ Hooks, CTA and storyline will focus on CONVERSION — urgency and purchase intent."}
              </div>
            )}
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
                <button onClick={copyAll}
                  className="w-full mb-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 font-medium transition-all">
                  {copiedIdx === "all" ? "✅ All Copied!" : "📋 Copy All Prompts"}
                </button>
              )}
              {clips.map((clip, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <div>
                      <span className="text-sm font-bold text-gray-800">{clip.label}</span>
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
