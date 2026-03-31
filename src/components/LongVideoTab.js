import React, { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { deductCredits, hasEnoughCredits, CREDIT_COSTS } from "../lib/supabase";
import { compressImage } from "../utils/helpers";
import TRANSLATIONS from "../constants/translations";

// ── Constants ───────────────────────────────────────────────────────────────

const FUNNELS = [
  { value: "upper",  emoji: "🔺", label: "Upper Funnel",  color: "blue" },
  { value: "middle", emoji: "🔶", label: "Mid Funnel",    color: "yellow" },
  { value: "lower",  emoji: "🔻", label: "Lower Funnel",  color: "green" },
];

const RATIOS = [
  { value: "9:16", label: "9:16", sub: "TikTok / Reels" },
  { value: "16:9", label: "16:9", sub: "YouTube / Web" },
  { value: "1:1",  label: "1:1",  sub: "Feed Post" },
];

const SHAPES = [
  { value: "cube",        label: "Cube",       symbol: "⬛" },
  { value: "rectangular", label: "Rectangle",  symbol: "▬" },
  { value: "sphere",      label: "Sphere",     symbol: "⬤" },
  { value: "cylinder",    label: "Cylinder",   symbol: "⏺" },
  { value: "cone",        label: "Cone",       symbol: "🔺" },
  { value: "pyramid",     label: "Pyramid",    symbol: "△" },
  { value: "other",       label: "Other",      symbol: "✦" },
];

const EXTEND_MODEL_ID = "xai/grok-imagine-video/extend-video";
const CLIP1_MODEL_ID  = "xai/grok-imagine-video/reference-to-video";

// ── Small reusable components ────────────────────────────────────────────────

const ImageUploadBox = ({ label, hint, file, onFile, required }) => {
  const ref = useRef();
  const preview = file ? URL.createObjectURL(file) : null;
  return (
    <div>
      <p className="text-xs font-semibold text-gray-600 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </p>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      <div
        onClick={() => ref.current.click()}
        className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-indigo-400 transition-all"
        style={{ minHeight: 100 }}>
        {preview ? (
          <img src={preview} alt="upload" className="w-full object-cover" style={{ maxHeight: 180 }} />
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <p className="text-2xl mb-1">📷</p>
            <p className="text-xs">Click to upload</p>
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
    </div>
  );
};

const StoryCard = ({ story, selected, onSelect, onSave, saving, t }) => (
  <div
    onClick={() => onSelect(story)}
    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${selected ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white hover:border-indigo-300"}`}>
    <div className="flex items-start justify-between gap-2 mb-2">
      <p className="text-sm font-bold text-gray-800">{story.title}</p>
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{story.style}</span>
        <button
          onClick={e => { e.stopPropagation(); onSave(story); }}
          className="text-xs px-2 py-0.5 rounded-full border border-gray-200 text-gray-500 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600 transition-all">
          {saving === story.id ? "✅" : (t.lvSave || "💾 Save")}
        </button>
      </div>
    </div>
    <div className="space-y-1 text-xs text-gray-600">
      <p><span className="font-medium text-indigo-600">Hook (0-6s):</span> {story.hook}</p>
      <p><span className="font-medium text-gray-500">Content (6-12s):</span> {story.content}</p>
      <p><span className="font-medium text-green-600">CTA (12-18s):</span> {story.cta}</p>
    </div>
    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-400">
      {story.host && <span>👤 {story.host}</span>}
      {story.scene && <span>📍 {story.scene}</span>}
      {story.emotion && <span>🎭 {story.emotion}</span>}
      {selected && <span className="text-indigo-600 font-medium ml-auto">{t.lvSelected || "✓ Selected"}</span>}
    </div>
  </div>
);

const StepBadge = ({ step, label, active, done }) => (
  <div className={`flex items-center gap-2 text-xs ${done ? "text-green-600" : active ? "text-indigo-600 font-semibold" : "text-gray-400"}`}>
    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
      ${done ? "bg-green-100 text-green-600" : active ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-400"}`}>
      {done ? "✓" : step}
    </span>
    {label}
  </div>
);

const LibraryModal = ({ userId, onSelect, onClose, t }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("grok_storyline_library")
      .select("*")
      .eq("user_id", userId)
      .eq("mode", "longvideo")
      .order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  const deleteItem = async (id) => {
    await supabase.from("grok_storyline_library").delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleSelect = (item) => {
    try {
      const parsed = JSON.parse(item.content);
      onSelect(parsed);
    } catch {
      onSelect({ title: item.title, hook: item.content, content: "", cta: "" });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">📚 {t.lvLibTitle || "Saved Stories"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {loading && <p className="text-center text-gray-400 text-sm py-8">Loading...</p>}
          {!loading && items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm text-gray-500">{t.lvLibEmpty || "No saved stories yet"}</p>
            </div>
          )}
          {items.map(item => {
            let story = null;
            try { story = JSON.parse(item.content); } catch { story = null; }
            return (
              <div key={item.id} className="border border-gray-200 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-xs font-semibold text-gray-700">{item.title}</p>
                  <button onClick={() => deleteItem(item.id)}
                    className="text-xs text-gray-400 hover:text-red-500 px-1">🗑️</button>
                </div>
                {story && (
                  <div className="space-y-0.5 text-xs text-gray-500">
                    <p><span className="text-indigo-500 font-medium">Hook:</span> {story.hook?.substring(0, 80)}...</p>
                    <p><span className="text-gray-400 font-medium">Content:</span> {story.content?.substring(0, 80)}...</p>
                  </div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
                  <button onClick={() => handleSelect(item)}
                    className="text-xs px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">
                    {t.lvLibUse || "Use this"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Main LongVideoTab ────────────────────────────────────────────────────────

const LongVideoTab = ({ user, userCredits, setUserCredits, lang }) => {
  const t = (TRANSLATIONS[lang] || TRANSLATIONS.en);

  // ── Form fields ──
  const [productFile, setProductFile]       = useState(null);
  const [productDesc, setProductDesc]       = useState("");
  const [productUSP, setProductUSP]         = useState("");
  const [funnel, setFunnel]                 = useState("");
  const [videoRatio, setVideoRatio]         = useState("9:16");
  const [shape, setShape]                   = useState("");
  const [dimH, setDimH]                     = useState("");
  const [dimW, setDimW]                     = useState("");
  const [dimD, setDimD]                     = useState("");

  // ── Storyline ──
  const [storylines, setStorylines]             = useState([]);
  const [ideasLoading, setIdeasLoading]         = useState(false);
  const [ideasError, setIdeasError]             = useState("");
  const [selectedStory, setSelectedStory]       = useState(null);
  const [savingStory, setSavingStory]           = useState(null);
  const [showLibrary, setShowLibrary]           = useState(false);

  // ── Prompts ──
  const [prompts, setPrompts]                   = useState({ p1: "", p2: "", p3: "" });
  const [promptsLoading, setPromptsLoading]     = useState(false);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [promptError, setPromptError]           = useState("");

  // ── Generation ──
  const [genStep, setGenStep]         = useState("idle");
  // idle | ideas | story-select | generating-prompts | prompt-review | clip1 | clip2 | clip3 | done | error
  const [genError, setGenError]       = useState("");
  const [clip1Url, setClip1Url]       = useState(null);
  const [clip2Url, setClip2Url]       = useState(null);
  const [finalVideoUrl, setFinalVideoUrl] = useState(null);
  const [queuePos, setQueuePos]       = useState(null);
  const pollingRef = useRef(null);
  const activeRequestRef = useRef(null);
  const activeModelRef = useRef(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  const stopPolling = () => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  };

  // ── Reset ──
  const handleReset = () => {
    stopPolling();
    setStorylines([]);
    setSelectedStory(null);
    setPrompts({ p1: "", p2: "", p3: "" });
    setGenStep("idle");
    setGenError("");
    setIdeasError("");
    setPromptError("");
    setClip1Url(null);
    setClip2Url(null);
    setFinalVideoUrl(null);
    setQueuePos(null);
    activeRequestRef.current = null;
    activeModelRef.current = null;
  };

  // ── Step 1: Generate story ideas ──────────────────────────────────────────
  const handleGenerateIdeas = async () => {
    if (!productDesc.trim()) { setIdeasError(t.lvErrNoDesc || "Please enter a product description."); return; }
    if (!funnel) { setIdeasError(t.lvErrNoFunnel || "Please select a funnel stage."); return; }

    setIdeasLoading(true);
    setIdeasError("");
    setStorylines([]);
    setSelectedStory(null);

    try {
      let productImage = null;
      if (productFile) productImage = await compressImage(productFile);

      const res = await fetch("/api/longvideo-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "storylines",
          productDescription: productDesc,
          productUSP,
          funnel,
          shape: shape || undefined,
          dimensions: (dimH || dimW || dimD) ? { height: dimH, width: dimW, depth: dimD } : undefined,
          productImage,
          lang,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate ideas");
      setStorylines(data.storylines || []);
      setGenStep("story-select");
    } catch (err) {
      setIdeasError(err.message || "Could not generate story ideas. Please try again.");
      setGenStep("idle");
    }
    setIdeasLoading(false);
  };

  // ── Save story to library ─────────────────────────────────────────────────
  const handleSaveStory = async (story) => {
    setSavingStory(story.id);
    try {
      await supabase.from("grok_storyline_library").insert({
        user_id: user.id,
        title: story.title,
        content: JSON.stringify(story),
        mode: "longvideo",
      });
    } catch (e) {
      console.error("Save story error:", e);
    }
    setTimeout(() => setSavingStory(null), 1500);
  };

  // ── Load story from library ───────────────────────────────────────────────
  const handleLoadStory = (story) => {
    setSelectedStory(story);
    setGenStep("story-select");
  };

  // ── Step 2: Generate 3 prompts ────────────────────────────────────────────
  const handleGeneratePrompts = async (story) => {
    setPromptsLoading(true);
    setPromptError("");
    setGenStep("generating-prompts");
    try {
      const res = await fetch("/api/longvideo-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "prompts",
          storyline: story,
          productDescription: productDesc,
          productUSP,
          funnel,
          videoRatio,
          shape: shape || undefined,
          dimensions: (dimH || dimW || dimD) ? { height: dimH, width: dimW, depth: dimD } : undefined,
          lang,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate prompts");
      setPrompts({ p1: data.prompt1, p2: data.prompt2, p3: data.prompt3 });
      setGenStep(showPromptEditor ? "prompt-review" : "ready-to-generate");
    } catch (err) {
      setPromptError(err.message || "Could not generate prompts. Please try again.");
      setGenStep("story-select");
    }
    setPromptsLoading(false);
  };

  // ── Step 3: Start video generation chain ─────────────────────────────────
  const handleStartGeneration = async () => {
    if (!productFile) { setGenError(t.lvErrNoImage || "Please upload a product photo."); return; }

    const cost = CREDIT_COSTS.longvideo_18s || 28;
    const enough = await hasEnoughCredits(user.id, cost);
    if (!enough) {
      setGenError(`Insufficient credits. You need ${cost} credits for an 18s video. Please contact admin to top up.`);
      return;
    }

    const deduct = await deductCredits(user.id, cost, "Long Video 18s (3-clip chain)");
    if (!deduct.success) {
      setGenError("Failed to deduct credits. Please try again.");
      return;
    }
    if (deduct.balance !== null) setUserCredits(deduct.balance);

    setGenError("");
    setClip1Url(null);
    setClip2Url(null);
    setFinalVideoUrl(null);
    setQueuePos(null);

    await generateClip1();
  };

  // ── Clip 1: reference-to-video (6s) ──────────────────────────────────────
  const generateClip1 = async () => {
    setGenStep("clip1");
    try {
      const productImage = await compressImage(productFile);

      const res = await fetch("/api/longvideo-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "clip1",
          prompt: prompts.p1,
          videoRatio,
          productImageBase64: productImage.data,
          productImageMime: productImage.mimeType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Clip 1 submission failed");

      activeRequestRef.current = data.requestId;
      activeModelRef.current = CLIP1_MODEL_ID;
      startPolling("clip1");
    } catch (err) {
      setGenError(err.message || "Clip 1 generation failed.");
      setGenStep("error");
    }
  };

  // ── Clip 2: extend-video (→12s combined) ─────────────────────────────────
  const generateClip2 = async (video1Url) => {
    setGenStep("clip2");
    setClip1Url(video1Url);
    setQueuePos(null);
    try {
      const res = await fetch("/api/longvideo-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "extend",
          videoUrl: video1Url,
          prompt: prompts.p2,
          clipNumber: 2,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Clip 2 extension failed");

      activeRequestRef.current = data.requestId;
      activeModelRef.current = EXTEND_MODEL_ID;
      startPolling("clip2");
    } catch (err) {
      setGenError(err.message || "Clip 2 extension failed.");
      setGenStep("error");
    }
  };

  // ── Clip 3: extend-video (→18s combined) ─────────────────────────────────
  const generateClip3 = async (video2Url) => {
    setGenStep("clip3");
    setClip2Url(video2Url);
    setQueuePos(null);
    try {
      const res = await fetch("/api/longvideo-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "extend",
          videoUrl: video2Url,
          prompt: prompts.p3,
          clipNumber: 3,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Clip 3 extension failed");

      activeRequestRef.current = data.requestId;
      activeModelRef.current = EXTEND_MODEL_ID;
      startPolling("clip3");
    } catch (err) {
      setGenError(err.message || "Clip 3 extension failed.");
      setGenStep("error");
    }
  };

  // ── Polling ───────────────────────────────────────────────────────────────
  const startPolling = (phase) => {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const requestId = activeRequestRef.current;
        const modelId   = activeModelRef.current;
        if (!requestId) return;

        const statusRes = await fetch(
          `/api/grok-status?requestId=${requestId}&modelId=${encodeURIComponent(modelId)}&t=${Date.now()}`
        );
        const statusData = await statusRes.json();

        if (statusData.queuePosition != null) setQueuePos(statusData.queuePosition);

        if (statusData.status === "COMPLETED") {
          stopPolling();
          const videoUrl = statusData.videoUrl;
          if (!videoUrl) {
            setGenError("Video completed but no URL returned. Please try again.");
            setGenStep("error");
            return;
          }
          if (phase === "clip1") {
            await generateClip2(videoUrl);
          } else if (phase === "clip2") {
            await generateClip3(videoUrl);
          } else if (phase === "clip3") {
            setFinalVideoUrl(videoUrl);
            setGenStep("done");
            await saveToHistory(videoUrl);
          }
        } else if (statusData.status === "FAILED") {
          stopPolling();
          setGenError(`${phase === "clip1" ? "Clip 1" : phase === "clip2" ? "Clip 2" : "Clip 3"} generation failed. Please try again.`);
          setGenStep("error");
        }
      } catch (e) {
        stopPolling();
        setGenError("Polling error: " + (e.message || "unknown"));
        setGenStep("error");
      }
    }, 4000);
  };

  // ── Save final video to Supabase ──────────────────────────────────────────
  const saveToHistory = async (videoUrl) => {
    try {
      await supabase.from("grok_generations").insert({
        user_id: user.id,
        request_id: "longvideo-" + Date.now(),
        model_id: "longvideo-18s-chain",
        prompt: prompts.p1,
        product_description: productDesc,
        video_url: videoUrl,
        status: "completed",
        completed_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error("saveToHistory error:", e);
    }
  };

  // ── Download video ────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!finalVideoUrl) return;
    try {
      const response = await fetch(finalVideoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `hookgen-18s-${Date.now()}.mp4`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(finalVideoUrl, "_blank");
    }
  };

  // ── Progress label helper ─────────────────────────────────────────────────
  const progressLabel = () => {
    if (genStep === "clip1") return t.lvGenClip1 || "Generating clip 1/3 (Hook 0-6s)...";
    if (genStep === "clip2") return t.lvGenClip2 || "Extending clip 2/3 (Content 6-12s)...";
    if (genStep === "clip3") return t.lvGenClip3 || "Extending clip 3/3 (CTA 12-18s)...";
    return "";
  };

  const isGenerating = ["clip1", "clip2", "clip3"].includes(genStep);
  const canGenerateIdeas = !!productDesc.trim() && !!funnel;
  const canProceedToVideo = !!selectedStory && !!productFile;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="pb-8 space-y-4">

      {/* ── Error banner ── */}
      {(genError || ideasError) && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-start gap-2">
          <span className="flex-shrink-0 mt-0.5">❌</span>
          <div className="flex-1">{genError || ideasError}</div>
          <button onClick={() => { setGenError(""); setIdeasError(""); }} className="text-red-400 hover:text-red-600 flex-shrink-0">✕</button>
        </div>
      )}

      {/* ── DONE state ── */}
      {genStep === "done" && finalVideoUrl && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 flex items-center gap-2">
            <span>✅</span>
            <span className="font-semibold">{t.lvDoneTitle || "Your 18s video is ready!"}</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <video
              src={finalVideoUrl}
              controls
              autoPlay
              loop
              className="w-full"
              style={{ maxHeight: 480 }}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleDownload}
              className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-all">
              ⬇️ {t.lvDownload || "Download Video"}
            </button>
            <button onClick={handleReset}
              className="py-2.5 px-4 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-all">
              {t.lvNewVideo || "New Video"}
            </button>
          </div>
        </div>
      )}

      {/* ── GENERATING state ── */}
      {isGenerating && (
        <div className="bg-white border border-indigo-200 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-gray-800">{t.lvGenerating || "Generating your 18s video"}</h3>

          {/* Step progress */}
          <div className="space-y-2">
            <StepBadge step="1" label={t.lvStepClip1 || "Generating Clip 1 — Hook (0-6s)"} active={genStep === "clip1"} done={!!clip1Url || genStep === "clip2" || genStep === "clip3" || genStep === "done"} />
            <StepBadge step="2" label={t.lvStepClip2 || "Extending to Clip 2 — Content (6-12s)"} active={genStep === "clip2"} done={!!clip2Url || genStep === "clip3" || genStep === "done"} />
            <StepBadge step="3" label={t.lvStepClip3 || "Extending to Clip 3 — CTA (12-18s)"} active={genStep === "clip3"} done={genStep === "done"} />
          </div>

          {/* Spinner + label */}
          <div className="flex items-center gap-3 bg-indigo-50 rounded-xl px-4 py-3">
            <svg className="animate-spin h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <div>
              <p className="text-sm font-medium text-indigo-700">{progressLabel()}</p>
              {queuePos != null && (
                <p className="text-xs text-indigo-500">{t.lvQueuePos || "Queue position:"} {queuePos}</p>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center">{t.lvGeneratingHint || "Each clip takes 60-120s. Total time: ~5-6 minutes."}</p>
        </div>
      )}

      {/* ── PROMPT REVIEW state ── */}
      {genStep === "prompt-review" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-800">📝 {t.lvPromptReviewTitle || "Review & Edit Prompts"}</h3>
            <button onClick={() => setGenStep("story-select")} className="text-xs text-gray-400 hover:text-gray-600">← Back</button>
          </div>
          <p className="text-xs text-gray-500">{t.lvPromptReviewHint || "Clip 1 is the full prompt. Clips 2 & 3 are action-only continuations — keep them short."}</p>

          {[
            { key: "p1", label: t.lvPrompt1Label || "Clip 1 — Hook (0-6s) · Full Brief" },
            { key: "p2", label: t.lvPrompt2Label || "Clip 2 — Content (6-12s) · Action Only" },
            { key: "p3", label: t.lvPrompt3Label || "Clip 3 — CTA (12-18s) · Action Only" },
          ].map(({ key, label }) => (
            <div key={key}>
              <p className="text-xs font-semibold text-gray-600 mb-1">{label}</p>
              <textarea
                value={prompts[key]}
                onChange={e => setPrompts(prev => ({ ...prev, [key]: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-700 focus:outline-none focus:border-indigo-400 resize-none"
                rows={key === "p1" ? 8 : 4}
              />
            </div>
          ))}

          <button
            onClick={handleStartGeneration}
            disabled={!prompts.p1 || !prompts.p2 || !prompts.p3}
            className="w-full py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-40">
            🎬 {t.lvStartGen || `Generate 18s Video · ${CREDIT_COSTS.longvideo_18s || 28} credits`}
          </button>
        </div>
      )}

      {/* ── GENERATING-PROMPTS state ── */}
      {genStep === "generating-prompts" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
          <svg className="animate-spin h-6 w-6 text-indigo-500 mx-auto mb-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p className="text-sm text-gray-600">{t.lvGeneratingPrompts || "Writing your 3-part video prompts..."}</p>
        </div>
      )}

      {promptError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          ❌ {promptError}
        </div>
      )}

      {/* ── MAIN FORM (shown in idle + story-select + ready-to-generate) ── */}
      {["idle", "story-select", "ready-to-generate", "error"].includes(genStep) && (
        <div className="space-y-4">

          {/* ── Section 1: Product Setup ── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
            <h2 className="text-sm font-bold text-gray-800">📦 {t.lvSectionProduct || "Product Setup"}</h2>

            <ImageUploadBox
              label={t.lvProductPhoto || "Product Photo"}
              hint={t.lvProductPhotoHint || "Used as reference in Clip 1 — host will hold and showcase this product"}
              file={productFile}
              onFile={setProductFile}
              required
            />

            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">{t.lvProductDesc || "Product Description"} <span className="text-red-400">*</span></p>
              <textarea
                value={productDesc}
                onChange={e => setProductDesc(e.target.value)}
                placeholder={t.lvProductDescPh || "e.g. A sleek portable 15.6\" USB-C monitor that fits in a laptop bag, perfect for remote workers and gamers"}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 resize-none"
                rows={3}
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">{t.lvUSP || "USP — Unique Selling Point"} <span className="text-gray-400 font-normal">(optional)</span></p>
              <input
                value={productUSP}
                onChange={e => setProductUSP(e.target.value)}
                placeholder={t.lvUSPPh || "e.g. The only monitor that fits flat in a laptop sleeve"}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>

            {/* ── Funnel ── */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">{t.lvFunnel || "Campaign Objective"} <span className="text-red-400">*</span></p>
              <div className="grid grid-cols-3 gap-2">
                {FUNNELS.map(f => (
                  <button key={f.value} onClick={() => setFunnel(f.value)}
                    className={`py-2 px-3 rounded-xl border-2 text-xs font-medium transition-all text-center
                      ${funnel === f.value
                        ? f.color === "blue"   ? "border-blue-500 bg-blue-50 text-blue-700"
                        : f.color === "yellow" ? "border-yellow-500 bg-yellow-50 text-yellow-700"
                        :                        "border-green-500 bg-green-50 text-green-700"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                    {f.emoji} {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Video ratio ── */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">{t.lvRatio || "Video Ratio"}</p>
              <div className="flex gap-2">
                {RATIOS.map(r => (
                  <button key={r.value} onClick={() => setVideoRatio(r.value)}
                    className={`flex-1 py-2 rounded-xl border-2 text-center transition-all
                      ${videoRatio === r.value ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}>
                    <p className={`text-xs font-bold ${videoRatio === r.value ? "text-indigo-700" : "text-gray-700"}`}>{r.label}</p>
                    <p className="text-xs text-gray-400">{r.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Shape ── */}
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">
                {t.lvShape || "Product Shape"} <span className="text-gray-400 font-normal">(optional)</span>
              </p>
              <p className="text-xs text-gray-400 mb-2">{t.lvShapeHint || "Helps AI generate realistic host interactions with correct grip and size"}</p>
              <div className="flex flex-wrap gap-2">
                {SHAPES.map(s => (
                  <button key={s.value} onClick={() => setShape(shape === s.value ? "" : s.value)}
                    className={`px-3 py-1.5 rounded-xl border-2 text-xs font-medium transition-all flex items-center gap-1
                      ${shape === s.value ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                    <span>{s.symbol}</span> {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Dimensions ── */}
            {shape && (
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">{t.lvDimensions || "Dimensions (cm)"} <span className="text-gray-400 font-normal">(optional)</span></p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: dimH, set: setDimH, ph: "Height" },
                    { val: dimW, set: setDimW, ph: "Width" },
                    { val: dimD, set: setDimD, ph: "Depth" },
                  ].map(({ val, set, ph }) => (
                    <div key={ph}>
                      <p className="text-xs text-gray-400 mb-1">{ph}</p>
                      <input
                        type="number"
                        value={val}
                        onChange={e => set(e.target.value)}
                        placeholder="cm"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:border-indigo-400"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Section 2: Story Ideas ── */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-800">💡 {t.lvSectionIdeas || "Story Ideas"}</h2>
              {user && (
                <button onClick={() => setShowLibrary(true)}
                  className="text-xs text-indigo-600 hover:underline">
                  📚 {t.lvMyStories || "My Stories"}
                </button>
              )}
            </div>

            {ideasLoading ? (
              <div className="flex items-center gap-3 py-4">
                <svg className="animate-spin h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <p className="text-sm text-gray-500">{t.lvGeneratingIdeas || "Generating 5 story ideas..."}</p>
              </div>
            ) : storylines.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-3xl mb-2">🎬</p>
                <p className="text-sm text-gray-500 mb-1">{t.lvIdeasEmpty || "Generate 5 story ideas for your 18s video"}</p>
                <p className="text-xs text-gray-400">{t.lvIdeasEmptyHint || "Fill in product description and objective above first"}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {storylines.map(story => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    selected={selectedStory?.id === story.id}
                    onSelect={setSelectedStory}
                    onSave={handleSaveStory}
                    saving={savingStory}
                    t={t}
                  />
                ))}
              </div>
            )}

            <button
              onClick={handleGenerateIdeas}
              disabled={ideasLoading || !canGenerateIdeas}
              className="w-full py-2.5 bg-gray-800 text-white text-sm font-semibold rounded-xl hover:bg-gray-900 transition-all disabled:opacity-40">
              {ideasLoading
                ? (t.lvGeneratingIdeas || "Generating...")
                : storylines.length > 0
                ? (t.lvRegenerateIdeas || "↻ Regenerate Ideas")
                : (t.lvGenerateIdeas || "💡 Generate Story Ideas")}
            </button>
          </div>

          {/* ── Section 3: Generate Video ── */}
          {selectedStory && (
            <div className="bg-white border border-indigo-200 rounded-2xl p-4 space-y-3">
              <h2 className="text-sm font-bold text-gray-800">🎬 {t.lvSectionGenerate || "Generate 18s Video"}</h2>

              <div className="bg-indigo-50 rounded-xl p-3 text-xs text-indigo-700 space-y-1">
                <p className="font-semibold">"{selectedStory.title}"</p>
                <p><span className="font-medium">Hook:</span> {selectedStory.hook?.substring(0, 80)}...</p>
              </div>

              {!productFile && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
                  ⚠️ {t.lvNeedPhoto || "Please upload a product photo above to continue."}
                </p>
              )}

              {/* Show-prompt toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPromptEditor}
                  onChange={e => setShowPromptEditor(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span className="text-xs text-gray-600">{t.lvShowPromptToggle || "Review & edit prompts before generating"}</span>
              </label>

              <button
                onClick={async () => {
                  if (!canProceedToVideo) return;
                  if (showPromptEditor || genStep === "story-select") {
                    // Generate prompts first, then show editor or go straight to generation
                    await handleGeneratePrompts(selectedStory);
                  } else {
                    await handleGeneratePrompts(selectedStory);
                  }
                }}
                disabled={!canProceedToVideo || promptsLoading}
                className="w-full py-3 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                {promptsLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    {t.lvGeneratingPrompts || "Preparing prompts..."}
                  </>
                ) : showPromptEditor ? (
                  <>📝 {t.lvReviewPrompts || "Review Prompts"}</>
                ) : (
                  <>🎬 {t.lvGenerateVideo || `Generate 18s Video · ${CREDIT_COSTS.longvideo_18s || 28} credits`}</>
                )}
              </button>

              <p className="text-xs text-center text-gray-400">
                {t.lvCostNote || `Costs ${CREDIT_COSTS.longvideo_18s || 28} credits · ~5-6 min generation time`}
              </p>
            </div>
          )}

        </div>
      )}

      {/* ── ready-to-generate: prompt generated, no review, auto-start ── */}
      {genStep === "ready-to-generate" && (
        <ReadyAutoStart onStart={handleStartGeneration} />
      )}

      {/* ── Library modal ── */}
      {showLibrary && (
        <LibraryModal
          userId={user.id}
          onSelect={handleLoadStory}
          onClose={() => setShowLibrary(false)}
          t={t}
        />
      )}
    </div>
  );
};

// Auto-trigger generation once prompts are ready (no review mode)
const ReadyAutoStart = ({ onStart }) => {
  const hasRun = useRef(false);
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    onStart();
  }, []);
  return (
    <div className="text-center py-8 text-sm text-gray-400">
      <svg className="animate-spin h-5 w-5 text-indigo-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      Starting generation...
    </div>
  );
};

export default LongVideoTab;
