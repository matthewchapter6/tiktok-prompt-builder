import React, { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { compressImage } from "../utils/helpers";
import { deductCredits, hasEnoughCredits, CREDIT_COSTS } from "../lib/supabase";
import TRANSLATIONS from "../constants/translations";

// ── Mode selector ──────────────────────────────────────────────────────────
const MODE_VALUES = ["text", "image", "reference"];
const MODE_EMOJIS = { text: "📝", image: "🖼️", reference: "🎯" };

const FUNNELS = [
  { value: "upper",  emoji: "🔺", color: "blue" },
  { value: "middle", emoji: "🔶", color: "yellow" },
  { value: "lower",  emoji: "🔻", color: "green" },
];

const RATIOS = [
  { value: "9:16", label: "9:16 — TikTok / Reels" },
  { value: "16:9", label: "16:9 — YouTube" },
  { value: "1:1",  label: "1:1 — Feed Post" },
];

// ── Image upload box ───────────────────────────────────────────────────────
const ImageUploadBox = ({ label, hint, file, onFile, required, clickToUpload }) => {
  const ref = useRef();
  const preview = file ? URL.createObjectURL(file) : null;
  return (
    <div>
      <p className="text-xs font-semibold text-gray-600 mb-1">{label} {required && <span className="text-red-400">*</span>}</p>
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
            <p className="text-xs">{clickToUpload || "Click to upload"}</p>
          </div>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={e => e.target.files[0] && onFile(e.target.files[0])} />
    </div>
  );
};

// ── Storyline card ─────────────────────────────────────────────────────────
const StorylineCard = ({ story, selected, onSelect, onSave, saving, t }) => (
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
          {saving === story.id ? "✅" : (t.grokCardSave || "💾 Save")}
        </button>
      </div>
    </div>
    <div className="space-y-1.5 text-xs text-gray-600">
      <div>
        <p className="font-medium text-indigo-600 mb-0.5">Hook (0-3s)</p>
        {story.hook_script && <p className="italic text-gray-500">"{story.hook_script}"</p>}
        {story.hook_visual && <p className="text-gray-400">{story.hook_visual}</p>}
        {!story.hook_script && !story.hook_visual && <p>{story.hook}</p>}
      </div>
      <div>
        <p className="font-medium text-gray-500 mb-0.5">Content (3-8s)</p>
        {story.content_script && <p className="italic text-gray-500">"{story.content_script}"</p>}
        {story.content_visual && <p className="text-gray-400">{story.content_visual}</p>}
        {!story.content_script && !story.content_visual && <p>{story.content}</p>}
      </div>
      <div>
        <p className="font-medium text-green-600 mb-0.5">CTA (8-10s)</p>
        {story.cta_script && <p className="italic text-gray-500">"{story.cta_script}"</p>}
        {story.cta_visual && <p className="text-gray-400">{story.cta_visual}</p>}
        {!story.cta_script && !story.cta_visual && <p>{story.cta}</p>}
      </div>
    </div>
    <div className="flex items-center gap-2 mt-2">
      {story.host && <span className="text-xs text-gray-400">👤 {story.host}</span>}
      <span className="text-xs text-gray-400">🎭 {story.emotion}</span>
      {selected && <span className="text-xs text-indigo-600 font-medium ml-auto">{t.grokCardSelected || "✓ Selected"}</span>}
    </div>
  </div>
);

// ── Library modal ──────────────────────────────────────────────────────────
const LibraryModal = ({ type, userId, onSelect, onClose, t }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");

  const table = type === "storyline" ? "grok_storyline_library" : "grok_prompt_library";

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    const { data } = await supabase
      .from(table)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  const deleteItem = async (id) => {
    await supabase.from(table).delete().eq("id", id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const saveEdit = async (id) => {
    await supabase.from(table).update({ content: editContent }).eq("id", id);
    setItems(prev => prev.map(i => i.id === id ? { ...i, content: editContent } : i));
    setEditingId(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden shadow-xl">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">
            {type === "storyline" ? (t.grokLibStorylineTitle || "📚 Storyline Library") : (t.grokLibPromptTitle || "📋 Prompt Library")}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {loading && <p className="text-center text-gray-400 text-sm py-8">{t.grokLibLoading || "Loading..."}</p>}
          {!loading && items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm text-gray-500">
                {type === "storyline" ? (t.grokLibEmptyStoryline || "No saved storylines yet") : (t.grokLibEmptyPrompt || "No saved prompts yet")}
              </p>
            </div>
          )}
          {items.map(item => (
            <div key={item.id} className="border border-gray-200 rounded-xl p-3">
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className="text-xs font-semibold text-gray-700 truncate">{item.title}</p>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => { setEditingId(item.id); setEditContent(item.content); }}
                    className="text-xs text-gray-400 hover:text-indigo-500 px-1">✏️</button>
                  <button onClick={() => deleteItem(item.id)}
                    className="text-xs text-gray-400 hover:text-red-500 px-1">🗑️</button>
                </div>
              </div>
              {editingId === item.id ? (
                <div>
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    className="w-full border border-indigo-300 rounded-lg px-2 py-1.5 text-xs resize-none focus:outline-none"
                    rows={4} />
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => saveEdit(item.id)}
                      className="text-xs px-2 py-1 bg-indigo-500 text-white rounded-lg">{t.grokLibSave || "Save"}</button>
                    <button onClick={() => setEditingId(null)}
                      className="text-xs px-2 py-1 border border-gray-200 rounded-lg text-gray-500">{t.grokLibCancel || "Cancel"}</button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 line-clamp-3">{item.content}</p>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">
                  {new Date(item.created_at).toLocaleDateString()}
                  {item.mode && ` · ${item.mode}`}
                </span>
                <button
                  onClick={() => { onSelect(item); onClose(); }}
                  className="text-xs px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all">
                  {t.grokLibUse || "Use this"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Main GrokTab component ─────────────────────────────────────────────────
const GrokTab = ({ user, userCredits, setUserCredits, lang, onInsufficientCredits }) => {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  // ── Mode & basic settings ──
  const [mode, setMode] = useState("text");
  const [videoRatio, setVideoRatio] = useState("9:16");
  const [productDescription, setProductDescription] = useState("");
  const [productUSP, setProductUSP] = useState("");
  const [funnel, setFunnel] = useState("");

  // ── Images ──
  const [firstFrameFile, setFirstFrameFile] = useState(null);
  const [referenceFiles, setReferenceFiles] = useState([]);

  // ── Storyline ──
  const [storylines, setStorylines] = useState([]);
  const [storylinesLoading, setStorylinesLoading] = useState(false);
  const [storylinesError, setStorylinesError] = useState("");
  const [selectedStoryline, setSelectedStoryline] = useState(null);
  const [confirmedStoryline, setConfirmedStoryline] = useState("");
  const [savingStoryline, setSavingStoryline] = useState(null);
  const [showStorylineLibrary, setShowStorylineLibrary] = useState(false);

  // ── Prompt ──
  const [prompt, setPrompt] = useState("");
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptError, setPromptError] = useState("");
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [promptSaved, setPromptSaved] = useState(false);

  // ── Video generation ──
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState("idle");
  const [genError, setGenError] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [queuePos, setQueuePos] = useState(null);
  const pollingRef = useRef(null);
  const [currentRequestId, setCurrentRequestId] = useState(null);
  const [currentModelId, setCurrentModelId] = useState(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  // ── Reset when mode changes ──
  const handleModeChange = (newMode) => {
    setMode(newMode);
    setStorylines([]);
    setSelectedStoryline(null);
    setConfirmedStoryline("");
    setPrompt("");
    setFirstFrameFile(null);
    setReferenceFiles([]);
    setVideoUrl("");
    setGenStep("idle");
    setGenError("");
  };

  // ── Add reference image ──
  const addReferenceFile = (file) => {
    if (referenceFiles.length >= 7) return;
    setReferenceFiles(prev => [...prev, file]);
  };

  const removeReferenceFile = (idx) => {
    setReferenceFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // ── Generate 5 storylines ──────────────────────────────────────────────
  const generateStorylines = async () => {
    if (!productDescription) {
      setStorylinesError(t.grokErrNeedProduct || "Please fill in the Product Description first.");
      return;
    }
    if (mode === "image" && !firstFrameFile) {
      setStorylinesError(t.grokErrNeedFirstFrame || "Please upload a first frame image first.");
      return;
    }
    if (mode === "reference" && referenceFiles.length === 0) {
      setStorylinesError(t.grokErrNeedRef || "Please upload at least one reference image.");
      return;
    }

    setStorylinesLoading(true);
    setStorylinesError("");
    setStorylines([]);
    setSelectedStoryline(null);

    try {
      // Compress and encode images if needed
      let images = [];
      if (mode === "image" && firstFrameFile) {
        const compressed = await compressImage(firstFrameFile);
        images = [{ data: compressed.data, mimeType: compressed.mimeType }];
      } else if (mode === "reference" && referenceFiles.length > 0) {
        images = await Promise.all(
          referenceFiles.map(async f => {
            const compressed = await compressImage(f);
            return { data: compressed.data, mimeType: compressed.mimeType };
          })
        );
      }

      const res = await fetch("/api/grok-generate-storylines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode, productDescription, productUSP, funnel, images, lang }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate storylines");
      setStorylines(data.storylines || []);
    } catch (e) {
      setStorylinesError(e.message || "Something went wrong. Please try again.");
    }
    setStorylinesLoading(false);
  };

  // ── Save storyline to library ──────────────────────────────────────────
  const saveStorylineToLibrary = async (story) => {
    setSavingStoryline(story.id);
    const content = story.hook_script
      ? `Hook: ${story.hook_script}\nContent: ${story.content_script}\nCTA: ${story.cta_script}\nEmotion: ${story.emotion}\nStyle: ${story.style}`
      : `Hook: ${story.hook}\nContent: ${story.content}\nCTA: ${story.cta}\nEmotion: ${story.emotion}\nStyle: ${story.style}`;
    await supabase.from("grok_storyline_library").insert({
      user_id: user.id,
      title: story.title,
      content,
      mode,
      funnel,
    });
    setTimeout(() => setSavingStoryline(null), 1500);
  };

  // ── Select storyline ──────────────────────────────────────────────────
  const selectStoryline = async (story) => {
    setSelectedStoryline(story);
    const content = story.hook_script
      ? `Hook: ${story.hook_script}\nVisual: ${story.hook_visual}\n\nContent: ${story.content_script}\nVisual: ${story.content_visual}\n\nCTA: ${story.cta_script}\nVisual: ${story.cta_visual}\n\nEmotion: ${story.emotion}`
      : `Hook: ${story.hook}\nContent: ${story.content}\nCTA: ${story.cta}\nEmotion: ${story.emotion}\nStyle: ${story.style}`;
    setConfirmedStoryline(content);
    // Auto-save to library
    await saveStorylineToLibrary(story);
  };

  // ── Generate prompt ───────────────────────────────────────────────────
  const generatePrompt = async () => {
    if (!selectedStoryline && !confirmedStoryline) {
      setPromptError(t.grokErrNeedStoryline || "Please select or write a storyline first.");
      return;
    }
    setPromptLoading(true);
    setPromptError("");
    setPrompt("");
    setPromptSaved(false);

    try {
      const storylineObj = selectedStoryline || {
        title: confirmedStoryline.substring(0, 40),
        hook: confirmedStoryline,
        content: "",
        cta: "",
        emotion: "",
        style: "cinematic",
      };

      const res = await fetch("/api/grok-generate-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          storyline: storylineObj,
          productDescription,
          productUSP,
          funnel,
          videoRatio,
          referenceCount: referenceFiles.length,
          lang,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate prompt");
      setPrompt(data.prompt || "");
    } catch (e) {
      setPromptError(e.message || "Something went wrong. Please try again.");
    }
    setPromptLoading(false);
  };

  // ── Save prompt to library ─────────────────────────────────────────────
  const savePromptToLibrary = async () => {
    if (!prompt) return;
    setSavingPrompt(true);
    const title = prompt.substring(0, 60) + "…";
    await supabase.from("grok_prompt_library").insert({
      user_id: user.id,
      title,
      content: prompt,
      mode,
    });
    setSavingPrompt(false);
    setPromptSaved(true);
    setTimeout(() => setPromptSaved(false), 2000);
  };

  // ── Generate video ─────────────────────────────────────────────────────
  const generateVideo = async () => {
    if (!prompt) { setGenError(t.grokErrNeedPrompt || "Please generate or write a prompt first."); return; }

    // Credit check
    const cost = CREDIT_COSTS.grok_10s;
    const enough = await hasEnoughCredits(user.id, cost);
    if (!enough) {
      setGenError(t.grokErrCredits ? t.grokErrCredits(cost) : `Insufficient credits. You need ${cost} credits.`);
      if (onInsufficientCredits) onInsufficientCredits();
      return;
    }

    setGenerating(true);
    setGenError("");
    setVideoUrl("");
    setQueuePos(null);
    setGenStep("uploading");

    try {
      // Encode images
      let firstFrameBase64 = null, firstFrameMime = null;
      let referenceImages = [];

      if (mode === "image" && firstFrameFile) {
        const compressed = await compressImage(firstFrameFile);
        firstFrameBase64 = compressed.data;
        firstFrameMime = compressed.mimeType;
      }
      if (mode === "reference" && referenceFiles.length > 0) {
        referenceImages = await Promise.all(
          referenceFiles.map(async f => {
            const compressed = await compressImage(f);
            return { data: compressed.data, mimeType: compressed.mimeType };
          })
        );
      }

      setGenStep("submitting");
      const res = await fetch("/api/grok-generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode, prompt, videoRatio,
          firstFrameBase64, firstFrameMime,
          referenceImages,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Video submission failed");

      // Deduct credits
      const deductResult = await deductCredits(user.id, cost, `Grok 10s video generation`);
      if (deductResult.success) setUserCredits(deductResult.balance);

      // Save to Supabase
      await supabase.from("grok_generations").insert({
        user_id: user.id,
        request_id: data.requestId,
        model_id: data.modelId,
        mode,
        prompt,
        product_description: productDescription,
        status: "processing",
      });

      setCurrentRequestId(data.requestId);
      setCurrentModelId(data.modelId);
      setGenStep("polling");

      // Start polling
      pollingRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(
            `/api/grok-status?requestId=${data.requestId}&modelId=${encodeURIComponent(data.modelId)}`
          );
          const statusData = await statusRes.json();
          if (statusData.queuePosition != null) setQueuePos(statusData.queuePosition);

          if (statusData.status === "COMPLETED") {
            clearInterval(pollingRef.current);
            setVideoUrl(statusData.videoUrl);
            setGenStep("done");
            setGenerating(false);
            // Update Supabase
            await supabase.from("grok_generations")
              .update({ status: "completed", video_url: statusData.videoUrl, completed_at: new Date().toISOString() })
              .eq("request_id", data.requestId);
          } else if (statusData.status === "FAILED") {
            clearInterval(pollingRef.current);
            setGenError("Video generation failed. Please try again.");
            setGenStep("error");
            setGenerating(false);
            await supabase.from("grok_generations")
              .update({ status: "failed" })
              .eq("request_id", data.requestId);
          }
        } catch (e) {
          clearInterval(pollingRef.current);
          setGenError("Polling failed. Please try again.");
          setGenStep("error");
          setGenerating(false);
        }
      }, 4000);

    } catch (err) {
      setGenError(err.message || "Something went wrong.");
      setGenStep("error");
      setGenerating(false);
    }
  };

  const resetAll = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setMode("text"); setVideoRatio("9:16");
    setProductDescription(""); setProductUSP(""); setFunnel("");
    setFirstFrameFile(null); setReferenceFiles([]);
    setStorylines([]); setSelectedStoryline(null); setConfirmedStoryline("");
    setPrompt(""); setVideoUrl("");
    setGenStep("idle"); setGenError("");
    setStorylinesError(""); setPromptError("");
  };

  const creditCost = CREDIT_COSTS.grok_10s;

  return (
    <div className="pb-12">

      {/* ── Mode selector ── */}
      <div className="mb-5">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">{t.grokModeTitle || "Generation Mode"}</p>
        <div className="grid grid-cols-3 gap-2">
          {MODE_VALUES.map(v => (
            <button key={v} onClick={() => handleModeChange(v)}
              className={`p-3 rounded-xl border-2 text-left transition-all ${mode === v ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white hover:border-indigo-300"}`}>
              <p className="text-lg mb-1">{MODE_EMOJIS[v]}</p>
              <p className="text-xs font-bold text-gray-800">{t[`grokMode_${v}_label`] || v}</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-tight">{t[`grokMode_${v}_desc`] || ""}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Image uploads ── */}
      {mode === "image" && (
        <div className="mb-5 border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h2 className="font-bold text-gray-800 text-sm">{t.grokFirstFrameTitle || "🖼️ First Frame Image"}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{t.grokFirstFrameSub || "Upload the image Grok will animate from"}</p>
          </div>
          <div className="p-4">
            <ImageUploadBox
              label={t.grokFirstFrameLabel || "First Frame"} required
              hint={t.grokFirstFrameHint || "This exact image will be the opening frame of your video"}
              file={firstFrameFile}
              onFile={setFirstFrameFile}
              clickToUpload={t.grokClickUpload} />
          </div>
        </div>
      )}

      {mode === "reference" && (
        <div className="mb-5 border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h2 className="font-bold text-gray-800 text-sm">{t.grokRefTitle || "🎯 Reference Images"}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{t.grokRefSub || "Upload up to 7 images — each becomes @Image1, @Image2, etc."}</p>
          </div>
          <div className="p-4 space-y-3">
            {referenceFiles.map((f, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <img src={URL.createObjectURL(f)} alt={`ref${idx+1}`}
                  className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-indigo-600">@Image{idx + 1}</p>
                  <p className="text-xs text-gray-400 truncate">{f.name}</p>
                </div>
                <button onClick={() => removeReferenceFile(idx)}
                  className="text-xs text-red-400 hover:text-red-600 flex-shrink-0">{t.grokRemove || "Remove"}</button>
              </div>
            ))}
            {referenceFiles.length < 7 && (
              <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-indigo-400 transition-all">
                <span className="text-2xl">➕</span>
                <div>
                  <p className="text-xs font-semibold text-gray-700">{t.grokAddRef || "Add reference image"}</p>
                  <p className="text-xs text-gray-400">@Image{referenceFiles.length + 1} · {t.grokSlotsLeft ? t.grokSlotsLeft(7 - referenceFiles.length) : `${7 - referenceFiles.length} slots remaining`}</p>
                </div>
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files[0] && addReferenceFile(e.target.files[0])} />
              </label>
            )}
          </div>
        </div>
      )}

      {/* ── Video settings ── */}
      <div className="mb-5 border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h2 className="font-bold text-gray-800 text-sm">{t.grokVideoSettingsTitle || "⚙️ Video Settings"}</h2>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">{t.grokRatioLabel || "Video Ratio"}</p>
            <div className="flex gap-2">
              {RATIOS.map(r => (
                <button key={r.value} onClick={() => setVideoRatio(r.value)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${videoRatio === r.value ? "bg-indigo-500 text-white border-indigo-500" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"}`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">
              {t.grokProdDescLabel || "Product Description"} <span className="text-red-400">*</span>
            </p>
            <p className="text-xs text-gray-400 mb-1">{t.grokProdDescHint || "Include shape, size, color and material for best results"}</p>
            <textarea
              value={productDescription}
              onChange={e => setProductDescription(e.target.value)}
              placeholder={t.grokProdDescPh || "e.g. Matte black cylindrical portable blender, 500ml, 18cm tall, USB-C rechargeable"}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-none" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">{t.grokUSPLabel || "Unique Selling Point (optional)"}</p>
            <input
              value={productUSP}
              onChange={e => setProductUSP(e.target.value)}
              placeholder={t.grokUSPPh || "e.g. Blends a smoothie in 30 seconds anywhere — no power outlet needed"}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400" />
          </div>
        </div>
      </div>

      {/* ── Funnel selection ── */}
      <div className="mb-5 border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h2 className="font-bold text-gray-800 text-sm">{t.grokFunnelTitle || "🎯 Sales Funnel Stage"}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{t.grokFunnelSub || "Shapes the storyline strategy and CTA"}</p>
        </div>
        <div className="p-4 space-y-2">
          {FUNNELS.map(f => (
            <button key={f.value} onClick={() => setFunnel(f.value)}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${funnel === f.value
                ? f.color === "blue" ? "border-blue-500 bg-blue-50"
                : f.color === "yellow" ? "border-yellow-500 bg-yellow-50"
                : "border-green-500 bg-green-50"
                : "border-gray-200 bg-white hover:border-gray-300"}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-800">{f.emoji} {t[`grokFunnel_${f.value}`] || f.value}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  f.color === "blue" ? "bg-blue-100 text-blue-700"
                  : f.color === "yellow" ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700"}`}>{t[`grokFunnel_${f.value}_tag`] || f.value}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Storyline section ── */}
      <div className="mb-5 border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h2 className="font-bold text-gray-800 text-sm">{t.grokStorylineTitle || "📖 Storyline"}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{t.grokStorylineSub || "AI generates 5 ideas — pick one or load from your library"}</p>
        </div>
        <div className="p-4 space-y-3">

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={generateStorylines}
              disabled={storylinesLoading || !productDescription}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${storylinesLoading || !productDescription
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-indigo-500 text-white hover:bg-indigo-600 active:scale-95"}`}>
              {storylinesLoading ? (t.grokGenerating5 || "✨ Generating ideas…") : storylines.length > 0 ? (t.grokRegenerate5 || "🔄 Regenerate 5 Ideas") : (t.grokGenerate5 || "✨ Generate 5 Ideas")}
            </button>
            <button
              onClick={() => setShowStorylineLibrary(true)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all">
              {t.grokLibraryBtn || "📚 Library"}
            </button>
          </div>

          {storylinesError && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{storylinesError}</p>
          )}

          {/* 5 storyline cards */}
          {storylines.length > 0 && (
            <div className="space-y-3">
              {storylines.map(story => (
                <StorylineCard
                  key={story.id}
                  story={story}
                  selected={selectedStoryline?.id === story.id}
                  onSelect={selectStoryline}
                  onSave={saveStorylineToLibrary}
                  saving={savingStoryline}
                  t={t} />
              ))}
            </div>
          )}

          {/* Editable confirmed storyline */}
          {(selectedStoryline || confirmedStoryline) && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-1">
                {t.grokStorylineEditLabel || "✏️ Your Storyline — edit freely before generating prompt"}
              </p>
              <textarea
                value={confirmedStoryline}
                onChange={e => setConfirmedStoryline(e.target.value)}
                rows={5}
                className="w-full border border-indigo-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 resize-none" />
            </div>
          )}
        </div>
      </div>

      {/* ── Prompt section ── */}
      <div className="mb-5 border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h2 className="font-bold text-gray-800 text-sm">{t.grokPromptTitle || "🎬 Grok Prompt"}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{t.grokPromptSub || "Expert-crafted prompt for Grok AI — review and edit before generating"}</p>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={generatePrompt}
              disabled={promptLoading || (!selectedStoryline && !confirmedStoryline)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${promptLoading || (!selectedStoryline && !confirmedStoryline)
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-purple-500 text-white hover:bg-purple-600 active:scale-95"}`}>
              {promptLoading ? (t.grokWritingPrompt || "✨ Writing prompt…") : prompt ? (t.grokRegeneratePrompt || "🔄 Regenerate Prompt") : (t.grokGeneratePrompt || "✨ Generate Prompt")}
            </button>
            <button
              onClick={() => setShowPromptLibrary(true)}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all">
              {t.grokPromptLibraryBtn || "📋 Library"}
            </button>
          </div>

          {promptError && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{promptError}</p>
          )}

          {prompt && (
            <div>
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={8}
                className="w-full border border-purple-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400 resize-none font-mono leading-relaxed" />
              <button
                onClick={savePromptToLibrary}
                disabled={savingPrompt}
                className="mt-2 text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-all">
                {promptSaved ? (t.grokSavedLib || "✅ Saved!") : savingPrompt ? (t.grokSavingLib || "Saving…") : (t.grokSaveToLib || "💾 Save to Library")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Generation status banner ── */}
      {genStep !== "idle" && genStep !== "error" && (
        <div className={`flex items-center gap-3 rounded-xl px-4 py-3 mb-4 text-sm font-medium ${
          genStep === "done"
            ? "bg-green-50 border border-green-200 text-green-700"
            : "bg-indigo-50 border border-indigo-200 text-indigo-700"}`}>
          {genStep !== "done" && (
            <svg className="animate-spin w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          )}
          <span>
            {genStep === "uploading"  && (t.grokGenUploading || "📤 Uploading images…")}
            {genStep === "submitting" && (t.grokGenSubmitting || "🎬 Submitting to Grok AI…")}
            {genStep === "polling"    && t.grokGenPolling ? t.grokGenPolling(queuePos) : `⏳ Generating your video…${queuePos != null ? ` (Queue: ${queuePos})` : ""}`}
            {genStep === "done"       && (t.grokGenDone || "✅ Your Grok video is ready!")}
          </span>
        </div>
      )}

      {/* ── Error ── */}
      {genStep === "error" && genError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-xs text-red-700">
          ❌ {genError}
        </div>
      )}

      {/* ── Video result ── */}
      {genStep === "done" && videoUrl && (
        <div className="mb-5 border border-green-200 rounded-xl overflow-hidden">
          <div className="bg-green-50 px-4 py-3 border-b border-green-100">
            <p className="text-sm font-bold text-green-700">{t.grokVideoTitle || "✅ Grok Video Generated!"}</p>
            <p className="text-xs text-green-500 mt-0.5">{t.grokVideoSub ? t.grokVideoSub(videoRatio) : `10s · 720p · ${videoRatio} · with audio`}</p>
          </div>
          <div className="p-4 space-y-3">
            <video src={videoUrl} controls className="w-full rounded-xl" style={{ maxHeight: 400 }} />
            <div className="flex gap-2">
              <a href={videoUrl} download
                className="flex-1 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium text-center hover:bg-indigo-600 transition-all">
                {t.grokBtnDownload || "⬇️ Download Video"}
              </a>
              <button
                onClick={() => { setGenStep("idle"); setVideoUrl(""); setGenerating(false); }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">
                {t.grokBtnNewVideo || "🔄 New Video"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Generate video button ── */}
      {genStep !== "done" && (
        <div className="space-y-3">
          <button
            onClick={generateVideo}
            disabled={generating || !prompt}
            className={`w-full py-4 rounded-xl font-bold text-sm transition-all ${generating || !prompt
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 active:scale-95"}`}>
            {generating ? (t.grokBtnGenerating || "⏳ Generating…") : t.grokBtnGenVideo ? t.grokBtnGenVideo(creditCost) : `🎬 Generate Grok Video · ${creditCost} credits`}
          </button>
          <button onClick={resetAll}
            className="w-full py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-all">
            {t.grokResetAll || "Reset All"}
          </button>
        </div>
      )}

      {/* ── Library modals ── */}
      {showStorylineLibrary && (
        <LibraryModal
          type="storyline"
          userId={user.id}
          onSelect={item => {
            setConfirmedStoryline(item.content);
            setSelectedStoryline({ title: item.title, hook: "", content: item.content, cta: "", emotion: "", style: "" });
          }}
          onClose={() => setShowStorylineLibrary(false)}
          t={t} />
      )}
      {showPromptLibrary && (
        <LibraryModal
          type="prompt"
          userId={user.id}
          onSelect={item => setPrompt(item.content)}
          onClose={() => setShowPromptLibrary(false)}
          t={t} />
      )}
    </div>
  );
};

export default GrokTab;