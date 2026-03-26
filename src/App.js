import React, { useState, useRef, useEffect } from "react";
import { supabase, logUsage, fetchCredits, deductCredits, hasEnoughCredits, CREDIT_COSTS, getVideoCreditCost } from "./lib/supabase";
import TRANSLATIONS from "./constants/translations";
import { FUNNEL_OPTIONS, PLATFORM_ASPECT, o, OPTS } from "./constants/options";
import { init, soraInit } from "./constants/init";
import { Section, Field, TextInput, TextArea, Select, Chips, AdvancedToggle, LangSelector } from "./components/ui/primitives";
import LoginScreen from "./components/LoginScreen";
import HistoryTab from "./components/HistoryTab";
import GrokTab from "./components/GrokTab";
import {
  getClipRole, clipSec, calcClips,
  settingLabel, lightingLabel, optLabel, chipsLabel,
  productCatOpts, productCatLabel,
  compressImage, fileToBase64,
  buildImagePrompt, buildClipPrompts, fetchStoryline,
} from "./utils/helpers";

export default function App() {
  const [lang, setLang] = useState("en");
  const [f, setF] = useState(init);
  const [tab, setTab] = useState("sora");
  const [clips, setClips] = useState([]);
  const [storyline, setStoryline] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [aiDirectorOn, setAiDirectorOn] = useState(true);
  const [aiDirectorLoading, setAiDirectorLoading] = useState(false);
  const outputRef = useRef(null);

  const [productFile, setProductFile] = useState(null);
  const [talentFile, setTalentFile] = useState(null);
  const [frameLoading, setFrameLoading] = useState(false);
  const [frameError, setFrameError] = useState("");
  const [generatedImage, setGeneratedImage] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [userCredits, setUserCredits] = useState(null);
  const [creditsLoading, setCreditsLoading] = useState(false);

  // ── Sora tab state ──
  const [sora, setSora] = useState(soraInit);
  const setSoraField = k => v => setSora(p => ({ ...p, [k]: v }));
  const [soraProductFile, setSoraProductFile] = useState(null);
  const [soraCharacterFile, setSoraCharacterFile] = useState(null);
  const [soraStep, setSoraStep] = useState("idle");
  const [soraGeneratedPrompt, setSoraGeneratedPrompt] = useState("");
  const [soraVideoUrl, setSoraVideoUrl] = useState("");
  const [soraError, setSoraError] = useState("");
  const [soraQueuePos, setSoraQueuePos] = useState(null);
  const [soraVideoConfig, setSoraVideoConfig] = useState(null);
  const [soraHistory, setSoraHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [soraDbId, setSoraDbId] = useState(null);
  const soraDbIdRef = useRef(null); // ref so polling closure always has latest value
  // Create Video flow states
  const [soraStorylines, setSoraStorylines] = useState([]);
  const [soraStorylinesLoading, setSoraStorylinesLoading] = useState(false);
  const [soraSelectedStoryline, setSoraSelectedStoryline] = useState(null);
  const [soraFirstFrame, setSoraFirstFrame] = useState(null);
  const [soraFrameLoading, setSoraFrameLoading] = useState(false);
  const [soraAnimationPrompt, setSoraAnimationPrompt] = useState("");
  const [soraShowAdvanced, setSoraShowAdvanced] = useState(false);
  const soraPollingRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserCredits(null);
  };

  const [isBlocked, setIsBlocked] = useState(false);
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('blocked').eq('id', user.id).single()
      .then(({ data }) => { if (data?.blocked) setIsBlocked(true); });
  }, [user]);

  // Load user credits
  const loadCredits = async () => {
    if (!user) return;
    setCreditsLoading(true);
    const bal = await fetchCredits(user.id);
    setUserCredits(bal);
    setCreditsLoading(false);
  };

  // Resume any in-progress polling jobs on login (once only)
  const hasResumedRef = useRef(false);
  useEffect(() => {
    if (!user || hasResumedRef.current) return;
    hasResumedRef.current = true;
    resumeInProgressJobs();
    loadCredits();
  }, [user]);

  // ── Cleanup Sora polling on unmount ──
  useEffect(() => {
    return () => { if (soraPollingRef.current) clearInterval(soraPollingRef.current); };
  }, []);

  // ── Load video generation history from Supabase ──
  const loadSoraHistory = async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('sora_generations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (!error && data) setSoraHistory(data);
    } catch (e) {
      console.error('loadSoraHistory error:', e);
    }
    setHistoryLoading(false);
  };

  // ── Resume polling for any in-progress jobs on page load ──
  const resumeInProgressJobs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('sora_generations')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'processing')
      .order('created_at', { ascending: false })
      .limit(1);

    if (!data || data.length === 0) return;
    const job = data[0];
    const ageMs = Date.now() - new Date(job.created_at).getTime();
    if (ageMs > 10 * 60 * 1000) return; // ignore jobs older than 10 min

    console.log('Resuming polling for job:', job.request_id);
    setSoraDbId(job.id);
    setSoraGeneratedPrompt(job.prompt || '');
    setSoraVideoConfig(job.video_config || null);
    setSoraStep('polling');
    setSoraError('');

    const modelPath = job.model_id || 'fal-ai/kling-video/v2.6/pro/text-to-video';
    soraPollingRef.current = setInterval(async () => {
      try {
        const statusRes = await fetch(`/api/sora-status?requestId=${job.request_id}&modelId=${encodeURIComponent(modelPath)}&t=${Date.now()}`);
        const statusData = await statusRes.json();
        if (statusData.queuePosition != null) setSoraQueuePos(statusData.queuePosition);
        if (statusData.status === 'COMPLETED') {
          let videoUrl = statusData.videoUrl;
          if (!videoUrl) {
            const dbId = soraDbIdRef.current;
            if (dbId) {
              const { data: dbRow } = await supabase
                .from('sora_generations')
                .select('video_url')
                .eq('id', dbId)
                .single();
              videoUrl = dbRow?.video_url || null;
            }
          }
          if (!videoUrl) return; // webhook not fired yet — keep polling
          clearInterval(soraPollingRef.current);
          setSoraVideoUrl(videoUrl);
          setSoraStep('done');
          await supabase.from('sora_generations').update({
            status: 'completed', video_url: videoUrl, completed_at: new Date().toISOString()
          }).eq('id', job.id);
          loadSoraHistory();
          loadCredits();
        } else if (statusData.status === 'FAILED') {
          clearInterval(soraPollingRef.current);
          setSoraError('Video generation failed.');
          setSoraStep('error');
          await supabase.from('sora_generations').update({ status: 'failed' }).eq('id', job.id);
        }
      } catch (e) {
        clearInterval(soraPollingRef.current);
        setSoraError('Polling failed. Please try again.');
        setSoraStep('error');
      }
    }, 4000);
  };

  // ── Step A: Generate AI prompt and show preview for user to review/edit ──

  // ── RESET helper ────────────────────────────────────────────────────────
  const resetCreateVideo = () => {
    setSoraStep("idle");
    setSoraVideoUrl("");
    setSoraFirstFrame(null);
    setSoraAnimationPrompt("");
    setSoraError("");
    setSoraQueuePos(null);
    setSoraVideoConfig(null);
    setSoraDbId(null);
    soraDbIdRef.current = null;
    setSoraStorylines([]);
    setSoraSelectedStoryline(null);
    setSoraStorylinesLoading(false);
    setSoraFrameLoading(false);
  };

  // ── FLOW B: Generate 5 storyline proposals ────────────────────────────
  const handleGenerateStorylines = async () => {
    setSoraStorylinesLoading(true);
    setSoraStorylines([]);
    setSoraSelectedStoryline(null);
    setSoraError("");
    try {
      const res = await fetch("/api/generate-storylines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productDescription: sora.productDescription,
          productUSP: sora.productUSP,
          productCategory: sora.productCategory,
          salesFunnel: sora.salesFunnel,
          videoLength: sora.videoLength,
          hasProductImage: !!soraProductFile,
          hasCharacterImage: !!soraCharacterFile,
          lang, // pass language for localized output
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Storyline generation failed");
      setSoraStorylines(data.storylines || []);
      setSoraStep("pick-storyline");
    } catch (err) {
      setSoraError(err.message || "Could not generate storylines. Please try again.");
    }
    setSoraStorylinesLoading(false);
  };

  // ── FLOW A+B: Generate first frame + prompts ─────────────────────────
  const handleGenerateFrame = async (storylineText) => {
    setSoraFrameLoading(true);
    setSoraFirstFrame(null);
    setSoraAnimationPrompt("");
    setSoraError("");
    setSoraStep("generating-frame");
    try {
      // Step 1: Get image prompt + animation prompt + config (3 parallel API calls)
      const promptRes = await fetch("/api/generate-video-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productDescription: sora.productDescription,
          productUSP: sora.productUSP,
          productCategory: sora.productCategory,
          selectedStoryline: storylineText,
          salesFunnel: sora.salesFunnel,
          videoRatio: sora.videoRatio,
          videoLength: sora.videoLength,
          videoStyle: sora.videoStyle,
          tone: sora.tone,
          cameraMotion: sora.cameraMotion,
          lightingStyle: sora.lightingStyle,
          backgroundSetting: sora.backgroundSetting,
          audienceEmotion: sora.audienceEmotion,
          restrictions: sora.restrictions,
          hasProductImage: !!soraProductFile,
          hasCharacterImage: !!soraCharacterFile,
          lang, // pass language for localized output
          model: sora.videoModel, // pass model for correct reference tags
        }),
      });
      const promptData = await promptRes.json();
      if (!promptRes.ok) throw new Error(promptData.error || "Prompt generation failed");

      setSoraAnimationPrompt(promptData.animationPrompt);
      setSoraVideoConfig(promptData.videoConfig || null);

      // Step 2: Generate first frame image
      const imageBody = {
        prompt: promptData.imagePrompt,
        aspectRatio: sora.videoRatio === "9_16" ? "9:16" : "16:9",
      };
            if (soraProductFile) imageBody.productImage = await compressImage(soraProductFile);
      if (soraCharacterFile) imageBody.talentImage = await compressImage(soraCharacterFile);

      const imageRes = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(imageBody),
      });
      let imageData;
      try { imageData = await imageRes.json(); } catch { imageData = {}; }
      if (!imageRes.ok) throw new Error(imageData.error?.error?.message || imageData.error || `Server error ${imageRes.status} — image may be too large`);

      setSoraFirstFrame({ data: imageData.imageData, mimeType: imageData.mimeType });
      setSoraStep("review-frame");
    } catch (err) {
      setSoraError(err.message || "Could not generate first frame. Please try again.");
      setSoraStep(soraSelectedStoryline ? "pick-storyline" : "idle");
    }
    setSoraFrameLoading(false);
  };

  // ── Regenerate first frame (costs 2 credits) ─────────────────────────
  const handleRegenerateFrame = async () => {
    const enough = await hasEnoughCredits(user.id, CREDIT_COSTS.regenerate_frame);
    if (!enough) {
      setSoraError(`Insufficient credits. Regenerating costs ${CREDIT_COSTS.regenerate_frame} credits.`);
      return;
    }
    const deduct = await deductCredits(user.id, CREDIT_COSTS.regenerate_frame, "First frame regeneration");
    if (deduct.success) setUserCredits(deduct.balance);
    const storyline = sora.aiDecideStoryline ? soraSelectedStoryline?.description : sora.userStoryline;
    await handleGenerateFrame(storyline);
  };

  // ── Generate video from first frame ──────────────────────────────────
  const handleGenerateVideo = async () => {
    if (!soraFirstFrame) return;
    setSoraError("");
    setSoraVideoUrl("");
    setSoraQueuePos(null);
    try {
      const videoCost = getVideoCreditCost(sora.videoLength, sora.videoModel);
      const enough = await hasEnoughCredits(user.id, videoCost);
      if (!enough) {
        setSoraError(`Insufficient credits. You need ${videoCost} credits. Please contact admin to top up.`);
        return;
      }
      setSoraStep("generating-video");

      // Encode product + character as reference elements for Kling
      let productImageBase64 = null, productImageMime = null;
      let characterImageBase64 = null, characterImageMime = null;
      if (soraProductFile) {
        const enc = await fileToBase64(soraProductFile);
        productImageBase64 = enc.data; productImageMime = enc.mimeType;
      }
      if (soraCharacterFile) {
        const enc = await fileToBase64(soraCharacterFile);
        characterImageBase64 = enc.data; characterImageMime = enc.mimeType;
      }

      const videoRes = await fetch("/api/generate-sora-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: soraAnimationPrompt,
          videoConfig: soraVideoConfig,
          firstFrameBase64: soraFirstFrame.data,
          firstFrameMime: soraFirstFrame.mimeType,
          productImageBase64,
          productImageMime,
          characterImageBase64,
          characterImageMime,
          model: sora.videoModel,
        }),
      });
      const videoData = await videoRes.json();
      if (!videoRes.ok) throw new Error(videoData.error || videoData.details || "Video submission failed");
      if (!videoData.requestId) throw new Error("No requestId returned from video API — check Vercel logs");

      // Deduct credits
      const deduct = await deductCredits(user.id, videoCost, `Kling ${sora.videoLength}s video`);
      if (deduct.success) setUserCredits(deduct.balance);

      // Save to Supabase
      const modelPath = videoData.modelId || "fal-ai/kling-video/v3/pro/image-to-video";
      const { data: dbRow } = await supabase.from("sora_generations").insert({
        user_id: user.id,
        request_id: videoData.requestId,
        model_id: modelPath,
        prompt: soraAnimationPrompt,
        video_config: soraVideoConfig,
        product_description: sora.productDescription,
        status: "processing",
      }).select().single();
      if (dbRow) { setSoraDbId(dbRow.id); soraDbIdRef.current = dbRow.id; }

      setSoraStep("polling");
      soraPollingRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/sora-status?requestId=${videoData.requestId}&modelId=${encodeURIComponent(modelPath)}&t=${Date.now()}`);
          const statusData = await statusRes.json();
          if (statusData.queuePosition != null) setSoraQueuePos(statusData.queuePosition);
          if (statusData.status === "COMPLETED") {
            let videoUrl = statusData.videoUrl;
            if (!videoUrl) {
              const dbId = soraDbIdRef.current;
              if (dbId) {
                const { data: dbRow } = await supabase
                  .from("sora_generations")
                  .select("video_url")
                  .eq("id", dbId)
                  .single();
                videoUrl = dbRow?.video_url || null;
              }
            }
            if (!videoUrl) return; // webhook not fired yet — keep polling
            clearInterval(soraPollingRef.current);
            setSoraVideoUrl(videoUrl);
            setSoraStep("done");
            logUsage(user.id, "kling_video_generated");
            const dbId = soraDbIdRef.current;
            if (dbId) await supabase.from("sora_generations").update({ status: "completed", video_url: videoUrl, completed_at: new Date().toISOString() }).eq("id", dbId);
            loadSoraHistory();
            loadCredits(); // refresh credit balance in header
          } else if (statusData.status === "FAILED") {
            clearInterval(soraPollingRef.current);
            setSoraError(statusData.error || "Video generation failed.");
            setSoraStep("review-frame");
            const dbId = soraDbIdRef.current;
            if (dbId) await supabase.from("sora_generations").update({ status: "failed" }).eq("id", dbId);
          }
        } catch (e) {
          clearInterval(soraPollingRef.current);
          setSoraError(e.message || "Polling failed.");
          setSoraStep("review-frame");
        }
      }, 4000);
    } catch (err) {
      setSoraError(err.message || "Something went wrong.");
      setSoraStep("review-frame");
    }
  };


  if (authLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  );
  if (!user) return <LoginScreen />;
  if (isBlocked) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-sm text-center">
        <p className="text-4xl mb-3">🚫</p>
        <h2 className="font-bold text-gray-900 mb-2">Account Suspended</h2>
        <p className="text-sm text-gray-500">Your account has been suspended. Please contact support.</p>
      </div>
    </div>
  );

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const set = k => v => setF(p => ({ ...p, [k]: v }));
  const numClips = calcClips(f.grokPlan, f.totalDuration);
  const cs = clipSec(f.grokPlan);
  const missingRequired = !f.productName || !f.productCategory || !f.keyFeaturesCustom || !f.usp || !f.problemStatement || !f.keyBenefit || !f.hook.length || !f.cta.length || !f.funnel;
  const hasFirstFrame = !!generatedImage;

  const FUNNEL_OPTIONS = [
    { value: "upper", emoji: "🔺", label: t.funnelUpperLabel, tag: t.funnelUpperTag, description: t.funnelUpperDesc, objective: t.funnelUpperObj, examples: t.funnelUpperEx, color: "blue" },
    { value: "middle", emoji: "🔶", label: t.funnelMiddleLabel, tag: t.funnelMiddleTag, description: t.funnelMiddleDesc, objective: t.funnelMiddleObj, examples: t.funnelMiddleEx, color: "yellow" },
    { value: "lower", emoji: "🔻", label: t.funnelLowerLabel, tag: t.funnelLowerTag, description: t.funnelLowerDesc, objective: t.funnelLowerObj, examples: t.funnelLowerEx, color: "green" },
  ];

  const generate = async (withFrame) => {
    let agentClips = [];
    if (aiDirectorOn && storyline) {
      setAiDirectorLoading(true);
      try {
        const numClips = calcClips(f.grokPlan, f.totalDuration);
        const cs = clipSec(f.grokPlan);
        const agentRes = await fetch("/api/director-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storyline,
            productName: f.productName,
            productCategory: productCatLabel(f, lang),
            keyFeatures: f.keyFeaturesCustom,
            usp: f.usp,
            problem: f.problemStatement,
            benefit: f.keyBenefit,
            funnel: f.funnel,
            tone: chipsLabel(o("tone", lang), f.tone),
            platform: optLabel(OPTS.platform, f.platform),
            numClips,
            clipDuration: cs,
            talent: f.talent,
            talentDetail: f.talentDetail,
          }),
        });
        const agentData = await agentRes.json();
        agentClips = agentData.clips || [];
        console.log("[director-agent] Applied", agentClips.length, "clip suggestions");
      } catch (e) {
        console.error("[director-agent] Failed, continuing without:", e.message);
      }
      setAiDirectorLoading(false);
    }
    const result = buildClipPrompts(f, storyline, withFrame && hasFirstFrame, lang, agentClips);
    setClips(result);
    setTab("output");
    logUsage(user.id, withFrame ? "prompt_image_video" : "prompt_text_only");
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

  const downloadImage = () => {
    if (!generatedImage) return;
    const a = document.createElement("a");
    a.href = `data:${generatedImage.mimeType};base64,${generatedImage.data}`;
    a.download = `first-frame-${f.productName || "video"}.png`;
    a.click();
  };

  const aspectInfo = PLATFORM_ASPECT[f.platform] || PLATFORM_ASPECT.tiktok;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div>
            <h1 className="text-base font-bold text-gray-900">{t.appTitle}</h1>
            <p className="text-xs text-gray-500">{t.appSubtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* ── Help button ── */}
            <button onClick={() => setTab("help")}
              className={`text-base px-2 py-1 rounded-lg transition-all ${tab === "help" ? "bg-indigo-50 text-indigo-600" : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"}`}
              title="Help">
              ❓
            </button>
            <LangSelector lang={lang} setLang={setLang} />
            {/* ── Credit balance ── */}
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1">
              <span className="text-sm">⚡</span>
              {creditsLoading ? (
                <span className="text-xs text-amber-500">…</span>
              ) : (
                <span className="text-xs font-bold text-amber-700">
                  {userCredits ?? 0}
                </span>
              )}
              <span className="text-xs text-amber-500">credits</span>
            </div>
            <div className="flex items-center gap-2 ml-1 pl-2 border-l border-gray-200">
              {user.user_metadata?.avatar_url && (
                <img src={user.user_metadata.avatar_url} alt="avatar"
                  className="w-7 h-7 rounded-full border border-gray-200" />
              )}
              <button onClick={handleSignOut}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs (center aligned, no Help tab) ── */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex justify-center overflow-x-auto scrollbar-hide" style={{scrollbarWidth:'none',msOverflowStyle:'none'}}>
          {[["sora", t.tabSora], ["history", "🎞️ History"], ["grok", "🎥 Grok"], ["builder", t.tabBuilder], ["output", t.tabOutput]].map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)}
              className={`flex-shrink-0 px-4 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${tab === v ? "border-blue-500 text-blue-600" : "border-transparent text-gray-400"}`}>
              {l}{v === "output" && clips.length > 0 ? ` (${clips.length})` : ""}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* ── SORA TAB ── */}
        {tab === "sora" && (
          <div className="pb-8 space-y-4">

            {/* Error banner */}
            {soraError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 flex items-start gap-2">
                <span className="flex-shrink-0 mt-0.5">❌</span>
                <div className="flex-1">{soraError}</div>
                <button onClick={() => setSoraError("")} className="text-red-400 hover:text-red-600 flex-shrink-0">✕</button>
              </div>
            )}

            {/* ── STEP: DONE ── */}
            {soraStep === "done" && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-semibold text-center">✅ Video generated!</div>
                <video src={soraVideoUrl} controls loop playsInline className="w-full rounded-xl border border-gray-100 shadow-sm" />
                <div className="flex gap-2">
                  <a href={soraVideoUrl} download target="_blank" rel="noreferrer"
                    className="flex-1 py-3 rounded-xl bg-green-500 text-white text-sm font-bold text-center hover:bg-green-600 active:scale-95 transition-all">
                    ⬇️ Download
                  </a>
                  <button onClick={resetCreateVideo}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-all">
                    🔄 Create Another
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP: POLLING ── */}
            {(soraStep === "polling" || soraStep === "generating-video") && (
              <div className="text-center py-10 space-y-4">
                <svg className="animate-spin w-10 h-10 text-indigo-500 mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {soraStep === "generating-video" ? (sora.videoModel === "kling" ? "Submitting to Kling AI…" : sora.videoModel === "hailuo" ? "Submitting to Hailuo AI…" : "Submitting to Wan AI…") : `Generating video…${soraQueuePos != null ? ` (#${soraQueuePos} in queue)` : ""}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">{t.cvSafeClose || "Takes 30–90 seconds. You can safely close — check History tab later."}</p>
                </div>
                {soraFirstFrame && (
                  <div>
                    <p className="text-xs text-gray-400 mb-2">Animating from:</p>
                    <img src={`data:${soraFirstFrame.mimeType};base64,${soraFirstFrame.data}`}
                      className="w-40 mx-auto rounded-xl border border-gray-200 shadow-sm" alt="First frame" />
                  </div>
                )}
              </div>
            )}

            {/* ── STEP: GENERATING FRAME ── */}
            {soraStep === "generating-frame" && (
              <div className="text-center py-10 space-y-3">
                <svg className="animate-spin w-10 h-10 text-indigo-500 mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                <p className="text-sm font-semibold text-gray-800">Generating first frame…</p>
                <p className="text-xs text-gray-400">{t.cvGeneratingFrameSubtitle || "Creating your opening scene with Gemini AI"}</p>
              </div>
            )}

            {/* ── STEP: REVIEW FRAME ── */}
            {soraStep === "review-frame" && soraFirstFrame && (
              <div className="space-y-4">
                {/* Header */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                  <p className="text-sm font-bold text-blue-800">Step 3 — Review First Frame</p>
                  <p className="text-xs text-blue-600 mt-0.5">Check the opening image. Edit the animation prompt if needed, then generate your video.</p>
                </div>

                {/* First frame */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-gray-700">🖼️ First frame (Kling animates from this)</p>
                    <button onClick={handleRegenerateFrame}
                      disabled={soraFrameLoading}
                      className="text-xs text-amber-600 border border-amber-200 bg-amber-50 rounded-lg px-2.5 py-1 hover:bg-amber-100 transition-all disabled:opacity-50">
                      🔄 Regenerate ({CREDIT_COSTS.regenerate_frame} credits)
                    </button>
                  </div>
                  <img src={`data:${soraFirstFrame.mimeType};base64,${soraFirstFrame.data}`}
                    className="w-full rounded-xl border border-gray-200 shadow-sm" alt="Generated first frame" />
                </div>

                {/* Animation prompt */}
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-1.5">🎬 Animation prompt</p>
                  <p className="text-xs text-gray-400 mb-2">This tells Kling how to animate the frame. You can edit it.</p>
                  <textarea value={soraAnimationPrompt} onChange={e => setSoraAnimationPrompt(e.target.value)}
                    rows={6} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-700 focus:outline-none focus:border-blue-400 leading-relaxed resize-none" />
                </div>

                {/* Generate button */}
                <div>
                  <div className="flex items-center justify-between mb-2 px-0.5">
                    <p className="text-xs text-gray-400">
                    {sora.videoModel === "kling" ? "🏆 Kling v3 Pro · 1080p · Ref Images" : sora.videoModel === "hailuo" ? "🎯 Hailuo 2.3 Fast Pro · 1080p" : "⚡ Wan 2.6 Flash · 720p"}
                  </p>
                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
                      <span className="text-xs font-bold text-amber-700">{getVideoCreditCost(sora.videoLength, sora.videoModel)}</span>
                      <span className="text-xs text-amber-500">credits</span>
                    </div>
                  </div>
                  {userCredits !== null && userCredits < getVideoCreditCost(sora.videoLength, sora.videoModel) && (
                    <div className="mb-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600 text-center">
                      ⚠️ You have <strong>{userCredits}</strong> credits but need <strong>{getVideoCreditCost(sora.videoLength, sora.videoModel)}</strong>. Contact admin to top up.
                    </div>
                  )}
                  <button onClick={handleGenerateVideo}
                    disabled={!soraAnimationPrompt}
                    className={`w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${!soraAnimationPrompt ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-indigo-500 text-white hover:bg-indigo-600 active:scale-95"}`}>
                    🎬 Generate Video
                    <span className="bg-white bg-opacity-20 text-white text-xs font-bold px-2 py-0.5 rounded-full">{getVideoCreditCost(sora.videoLength, sora.videoModel)} credits</span>
                  </button>
                  <button onClick={() => setSoraStep(sora.aiDecideStoryline ? "pick-storyline" : "idle")}
                    className="w-full mt-2 py-2 rounded-xl border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-all">
                    ← Back
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP: PICK STORYLINE (Flow B) ── */}
            {soraStep === "pick-storyline" && (
              <div className="space-y-4">
                <div className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-3">
                  <p className="text-sm font-bold text-purple-800">Step 2 — Choose Your Storyline</p>
                  <p className="text-xs text-purple-600 mt-0.5">Pick the concept that best fits your vision. AI will generate the first frame based on your choice.</p>
                </div>

                {soraStorylinesLoading ? (
                  <div className="text-center py-8 space-y-3">
                    <svg className="animate-spin w-8 h-8 text-purple-500 mx-auto" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    <p className="text-sm text-gray-500">Generating 5 storyline ideas…</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {soraStorylines.map((s) => (
                      <button key={s.id} onClick={() => {
                        setSoraSelectedStoryline(s);
                        handleGenerateFrame(s.description);
                      }}
                        className={`w-full text-left border-2 rounded-xl p-4 transition-all hover:border-indigo-400 hover:bg-indigo-50 active:scale-98 ${soraSelectedStoryline?.id === s.id ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white"}`}>
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex items-center justify-center mt-0.5">{s.id}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">{s.title}</p>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{s.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{s.emotion}</span>
                              <span className="text-xs text-gray-400 italic">"{s.hook}"</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                    <div className="flex gap-2 pt-1">
                      <button onClick={handleGenerateStorylines}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-all">
                        🔄 Regenerate ideas (free)
                      </button>
                      <button onClick={() => setSoraStep("idle")}
                        className="py-2.5 px-4 rounded-xl border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-all">
                        ← Back
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP: IDLE (input form) ── */}
            {soraStep === "idle" && (
              <div className="space-y-5">

                {/* Progress steps */}
                <div className="flex items-center gap-1 text-xs">
                  {[t.cvStep1||"Upload & Info", t.cvStep2||"Storyline", t.cvStep3||"First Frame", t.cvStep4||"Generate Video"].map((label, i) => (
                    <React.Fragment key={i}>
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
                        <span className="text-indigo-700 font-medium hidden sm:block">{label}</span>
                      </div>
                      {i < 3 && <span className="text-gray-300 flex-shrink-0">→</span>}
                    </React.Fragment>
                  ))}
                </div>

                {/* Upload photos */}
                <Section emoji="📸" title={t.cvUploadPhotos || "Upload Photos"} subtitle={t.cvUploadSubtitle || "Product photo required · Character optional"}>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { file: soraProductFile, setFile: setSoraProductFile, label: t.cvProductPhoto || "Product photo *", emoji: "📦", required: true },
                      { file: soraCharacterFile, setFile: setSoraCharacterFile, label: t.cvCharacterPhoto || "Character (optional)", emoji: "🧑", required: false },
                    ].map(({ file, setFile, label, emoji, required }) => (
                      <Field key={label} label={label}>
                        <label className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-all ${file ? "border-indigo-300 bg-indigo-50" : "border-gray-200 bg-gray-50 hover:border-indigo-300 hover:bg-indigo-50"}`}>
                          {file ? (
                            <div className="text-center px-2">
                              <p className="text-xl">✅</p>
                              <p className="text-xs font-medium text-indigo-600 truncate max-w-full px-1 mt-0.5">{file.name}</p>
                              <p className="text-xs text-gray-400">Tap to change</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <p className="text-2xl">{emoji}</p>
                              <p className="text-xs text-gray-500 mt-1">{required ? (t.cvRequired||"Required") : (t.cvOptional||"Optional")}</p>
                            </div>
                          )}
                          <input type="file" accept="image/*" className="hidden"
                            onChange={e => { if (e.target.files[0]) setFile(e.target.files[0]); }} />
                        </label>
                      </Field>
                    ))}
                  </div>
                </Section>

                {/* Product info */}
                <Section emoji="📝" title={t.cvProductInfo || "Product Info"} subtitle={t.cvProductInfoSubtitle || "More detail = better video"}>
                  <Field label={t.cvCategory || "Category"}>
                    <select value={sora.productCategory} onChange={e => setSoraField("productCategory")(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white">
                      <option value="">{lang === "zh" ? "— 选择类别 —" : lang === "bm" ? "— Pilih kategori —" : "— Select category —"}</option>
                      <option value="tech_gadget">{lang === "zh" ? "科技产品/电子产品" : lang === "bm" ? "Alat teknologi / elektronik" : "Tech gadget / electronics"}</option>
                      <option value="consumer_good">{lang === "zh" ? "消费品/家居用品" : lang === "bm" ? "Barangan pengguna / rumah" : "Consumer good / household"}</option>
                      <option value="skincare">{lang === "zh" ? "护肤/美妆" : lang === "bm" ? "Penjagaan kulit / kecantikan" : "Skincare / beauty"}</option>
                      <option value="vitamin_health">{lang === "zh" ? "维生素/保健品" : lang === "bm" ? "Vitamin / suplemen kesihatan" : "Vitamin / health supplement"}</option>
                      <option value="apparel">{lang === "zh" ? "服装/时尚" : lang === "bm" ? "Pakaian / fesyen" : "Apparel / fashion"}</option>
                      <option value="sports_fitness">{lang === "zh" ? "体育/健身器材" : lang === "bm" ? "Sukan / peralatan kecergasan" : "Sports / fitness equipment"}</option>
                      <option value="food_beverage">{lang === "zh" ? "食品饮料" : lang === "bm" ? "Makanan & minuman" : "Food & beverage"}</option>
                      <option value="home_living">{lang === "zh" ? "家居生活" : lang === "bm" ? "Rumah & kehidupan" : "Home & living"}</option>
                      <option value="jewellery_accessories">{lang === "zh" ? "珠宝/配饰" : lang === "bm" ? "Barang kemas / aksesori" : "Jewellery / accessories"}</option>
                      <option value="software_app">{lang === "zh" ? "软件/应用" : lang === "bm" ? "Perisian / aplikasi" : "Software / app"}</option>
                      <option value="service">{lang === "zh" ? "服务" : lang === "bm" ? "Perkhidmatan" : "Service"}</option>
                    </select>
                  </Field>
                  <Field label={t.cvProductDesc || "Product description *"}>
                    <TextInput value={sora.productDescription} onChange={setSoraField("productDescription")}
                      placeholder="e.g. Felet Silver 5000 badminton shoes — ultra-lightweight with silver metallic finish" />
                  </Field>
                  <Field label={t.cvUSP || "USP *"}>
                    <TextInput value={sora.productUSP} onChange={setSoraField("productUSP")}
                      placeholder="e.g. Limited edition — only 2000 pairs in Malaysia" />
                  </Field>
                </Section>

                {/* Video settings */}
                <Section emoji="🎬" title={t.cvVideoSettings || "Video Settings"}>
                  {/* ── Model selector ── */}
                  <Field label="AI Model">
                    <div className="flex gap-2">
                      {[
                        { v: "wan",    l: "Wan 2.6 Flash",       badge: "⚡ Cheapest", sub: "720p · Audio",        credits: "10 / 20 credits" },
                        { v: "hailuo", l: "Hailuo 2.3 Fast Pro", badge: "🎯 UGC Best",  sub: "1080p · Audio",       credits: "14 / 28 credits" },
                        { v: "kling",  l: "Kling v3 Pro",         badge: "🏆 Premium",  sub: "1080p · Ref Images",  credits: "20 / 40 credits" },
                      ].map(({ v, l, badge, sub, credits }) => (
                        <button key={v} onClick={() => setSoraField("videoModel")(v)}
                          className={`flex-1 border-2 rounded-xl px-3 py-2.5 text-left transition-all ${sora.videoModel === v ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}>
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-bold text-gray-800">{l}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${v === "wan" ? "bg-green-100 text-green-700" : v === "hailuo" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>{badge}</span>
                          </div>
                          <p className="text-xs text-gray-400">{sub}</p>
                          <p className="text-xs font-semibold text-amber-600 mt-1">{credits} (5s / 10s)</p>
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label={t.cvSalesFunnel}>
                    <Chips value={sora.salesFunnel} onChange={setSoraField("salesFunnel")} single
                      options={[{value:"upper",label:"Awareness"},{value:"middle",label:"Consideration"},{value:"lower",label:"Conversion"}]} />
                  </Field>
                  <Field label={t.cvRatio}>
                    <Chips value={sora.videoRatio} onChange={setSoraField("videoRatio")} single
                      options={[{value:"9_16",label:"9:16 Portrait"},{value:"16_9",label:"16:9 Landscape"}]} />
                  </Field>
                  <Field label={t.cvDuration}>
                    <Chips value={sora.videoLength} onChange={setSoraField("videoLength")} single
                      options={[{value:"5",label:"5 sec"},{value:"10",label:"10 sec"}]} />
                  </Field>
                </Section>

                {/* Storyline */}
                <Section emoji="✍️" title={t.cvStoryline}>
                  <Field label={t.cvStorylineQuestion}>
                    <div className="flex gap-2">
                      {[{v:true,l:t.cvAIDecides||"🤖 AI proposes 5 ideas"},{v:false,l:t.cvUserWrites||"✍️ I'll write my own"}].map(({v,l}) => (
                        <button key={String(v)} onClick={() => setSoraField("aiDecideStoryline")(v)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-medium border-2 transition-all ${sora.aiDecideStoryline === v ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-500"}`}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </Field>
                  {!sora.aiDecideStoryline && (
                    <Field label={t.cvYourStoryline}>
                      <textarea value={sora.userStoryline} onChange={e => setSoraField("userStoryline")(e.target.value)}
                        rows={3} placeholder="Describe your video idea… e.g. A player loses a match due to poor shoes, discovers Felet Silver 5000, wins the next game."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none" />
                    </Field>
                  )}
                </Section>

                {/* Advanced settings toggle */}
                <button onClick={() => setSoraShowAdvanced(!soraShowAdvanced)}
                  className="w-full flex items-center justify-between px-4 py-3 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-all">
                  <span>⚙️ Advanced settings (optional)</span>
                  <span className="text-gray-400">{soraShowAdvanced ? "▲" : "▼"}</span>
                </button>

                {soraShowAdvanced && (
                  <div className="space-y-3 border border-gray-200 rounded-xl p-4 bg-gray-50">
                    {[
                      {field:"tone", label:t.cvTone, placeholder:"e.g. premium, playful, emotional"},
                      {field:"cameraMotion", label:t.cvCamera, placeholder:"e.g. slow dolly in, handheld tracking"},
                      {field:"lightingStyle", label:t.cvLighting, placeholder:"e.g. golden hour, studio rim lighting"},
                      {field:"backgroundSetting", label:t.cvBackground, placeholder:"e.g. minimalist studio, outdoor court"},
                      {field:"audienceEmotion", label:t.cvEmotion, placeholder:"e.g. desire, aspiration, urgency"},
                      {field:"restrictions", label:t.cvRestrictions, placeholder:"e.g. no text overlays, no close-ups of face"},
                    ].map(({field, label, placeholder}) => (
                      <Field key={field} label={label}>
                        <TextInput value={sora[field]} onChange={setSoraField(field)} placeholder={placeholder} />
                      </Field>
                    ))}
                  </div>
                )}

                {/* CTA Button */}
                <div>
                  <button
                    onClick={() => {
                      if (sora.aiDecideStoryline) {
                        handleGenerateStorylines();
                      } else {
                        handleGenerateFrame(sora.userStoryline || sora.productDescription);
                      }
                    }}
                    disabled={!sora.productDescription || !sora.productUSP || !soraProductFile}
                    className={`w-full py-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${!sora.productDescription || !sora.productUSP || !soraProductFile ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-indigo-500 text-white hover:bg-indigo-600 active:scale-95"}`}>
                    {sora.aiDecideStoryline ? t.cvGenerate5 || "Generate 5 Storyline Ideas" : t.cvGenerateFrame || "Generate First Frame"}
                  </button>
                  {(!soraProductFile || !sora.productDescription || !sora.productUSP) && (
                    <p className="text-xs text-gray-400 text-center mt-2">
                      {!soraProductFile ? (t.cvNeedProduct || "Upload a product photo to continue") : (t.cvNeedInfo || "Fill in product description and USP to continue")}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 text-center mt-2">
                    {t.cvFrameFree} {getVideoCreditCost(sora.videoLength, sora.videoModel)} {t.cvCredits}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

                {/* ── GROK TAB ── */}
        {tab === "grok" && (
          <GrokTab
            user={user}
            userCredits={userCredits}
            setUserCredits={setUserCredits}
          />
        )}

                {/* ── HISTORY TAB ── */}
        {tab === "history" && (
          <HistoryTab
            soraHistory={soraHistory}
            historyLoading={historyLoading}
            loadSoraHistory={loadSoraHistory}
            setTab={setTab}
            setSoraAnimationPrompt={setSoraAnimationPrompt}
            setSoraStep={setSoraStep}
            setSoraVideoConfig={setSoraVideoConfig}
            resumeInProgressJobs={resumeInProgressJobs}
            t={t}
            lang={lang}
          />
        )}


        {/* ── HELP TAB ── */}
        {tab === "help" && (
          <div className="pb-8">
            {/* Header */}
            <div className="text-center py-6">
              <p className="text-3xl mb-3">👋</p>
              <h2 className="text-base font-bold text-gray-800">Need help?</h2>
              <p className="text-sm text-gray-400 mt-1">We're here to assist you</p>
            </div>

            {/* Topics */}
            <div className="space-y-3 mb-8">
              {[
                { emoji: "🔐", title: "How to register", desc: "Sign up using your Google account." },
                { emoji: "⚡", title: "How to top up credits", desc: "Contact us directly to purchase credits." },
                { emoji: "🎬", title: "How to generate a video", desc: "Use the Create Video tab to generate your first AI video." },
                { emoji: "📝", title: "How to use the Builder", desc: "Enter your product details and let our AI content creator generate Grok prompts for UGC (User-Generated Content) videos." },
                { emoji: "🎞️", title: "Video history & downloads", desc: "Access and download any videos generated within the past 30 days." },
                { emoji: "💬", title: "Other questions", desc: "Have more questions? Message us directly via WhatsApp." },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">{item.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* WhatsApp CTA */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
              <p className="text-sm text-gray-600 mb-1">Have a question about any of the above?</p>
              <p className="text-sm font-semibold text-gray-800 mb-5">Chat with us directly on WhatsApp</p>
              <a
                href="https://wa.me/6591012572"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 bg-green-500 hover:bg-green-600 active:scale-95 transition-all text-white font-bold text-sm px-6 py-3.5 rounded-2xl"
              >
                {/* WhatsApp SVG logo */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp Us
              </a>
              <p className="text-xs text-gray-400 mt-4">+65 9101 2572 · Typically replies within a few hours</p>
            </div>
          </div>
        )}

        {tab === "builder" && (<>

          {/* Basic Settings badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">{t.basicSettings}</span>
            <span className="text-xs text-gray-400">{t.basicSettingsHint}</span>
          </div>

          {/* Project */}
          <Section emoji="📁" title={t.sProject} subtitle={t.sProjectSub}>
            <Field label={t.fCampaign}>
              <TextInput value={f.campaignName} onChange={set("campaignName")} placeholder={t.fCampaignPh} />
            </Field>
          </Section>

          {/* Grok Settings */}
          <Section emoji="⚙️" title={t.sGrok} subtitle={t.sGrokSub}>
            <Field label={t.fGrokPlan}>
              <div className="flex gap-3">
                {o("grokPlan", lang).map(o => (
                  <button key={o.value} onClick={() => set("grokPlan")(o.value)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${f.grokPlan === o.value ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label={t.fDuration} hint={t.hintClipsGenerated(numClips, cs)}>
              <TextInput value={f.totalDuration} onChange={set("totalDuration")} placeholder={`e.g. ${cs * 2}`} />
            </Field>
            {numClips > 1 && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
                {t.hintMultiplePrompts(numClips, cs)}
              </div>
            )}
            <Field label={t.fPlatform}>
              <Chips value={f.platform} onChange={set("platform")} options={OPTS.platform} single />
            </Field>
          </Section>

          {/* Sales Funnel */}
          <Section emoji="🎯" title={t.sFunnel} subtitle={t.sFunnelSub}>
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
                {f.funnel === "upper" && t.funnelUpperConfirm}
                {f.funnel === "middle" && t.funnelMiddleConfirm}
                {f.funnel === "lower" && t.funnelLowerConfirm}
              </div>
            )}
          </Section>

          {/* Product */}
          <Section emoji="📦" title={t.sProduct} subtitle={t.sProductSub}>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t.fProductName} required>
                <TextInput value={f.productName} onChange={set("productName")} placeholder={t.fProductNamePh} />
              </Field>
              <Field label={t.fProductCat} required>
                <Select value={f.productCategory} onChange={set("productCategory")} options={productCatOpts(lang)} />
              </Field>
            </div>
            {f.productCategory === "other" && (
              <Field label={t.fCustomCat} required>
                <TextInput value={f.productCategoryCustom} onChange={set("productCategoryCustom")} placeholder={t.fCustomCatPh} />
              </Field>
            )}
            <Field label={t.fFeatures} required hint={t.fFeaturesHint}>
              <TextArea value={f.keyFeaturesCustom} onChange={set("keyFeaturesCustom")} placeholder={t.fFeaturesPh} rows={2} />
            </Field>
            <Field label={t.fUSP} required>
              <TextInput value={f.usp} onChange={set("usp")} placeholder={t.fUSPPh} />
            </Field>
          </Section>

          {/* Story & Structure */}
          <Section emoji="📖" title={t.sStory}>
            <Field label={t.fHook} required hint={t.fHookHint}>
              <Chips value={f.hook} onChange={set("hook")} options={o("hooks", lang)} />
            </Field>
            <Field label={t.fProblem} required>
              <TextInput value={f.problemStatement} onChange={set("problemStatement")} placeholder={t.fProblemPh} />
            </Field>
            <Field label={t.fBenefit} required>
              <TextInput value={f.keyBenefit} onChange={set("keyBenefit")} placeholder={t.fBenefitPh} />
            </Field>
            <Field label={t.fCTA} required hint={t.fCTAHint}>
              <Chips value={f.cta} onChange={set("cta")} options={o("cta", lang)} />
            </Field>
          </Section>

          {/* Advanced Settings */}
          <div className="flex items-center gap-2 mb-4 mt-2">
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500 bg-gray-100 border border-gray-200 px-3 py-1 rounded-full">{t.advancedSettings}</span>
            <span className="text-xs text-gray-400">{t.advancedSettingsHint}</span>
          </div>

          <AdvancedToggle isOpen={advancedOpen} onToggle={() => setAdvancedOpen(o => !o)} t={t} sectionCount={9} />

          {advancedOpen && (
            <div className="space-y-0">
              <Section emoji="📦" title={t.sAdvProduct} subtitle={t.sAdvProductSub}>
                <Field label={t.fColors} hint={t.fColorsHint}>
                  <TextInput value={f.keyColors} onChange={set("keyColors")} placeholder={t.fColorsPh} />
                </Field>
                <Field label={t.fAudience}>
                  <Chips value={f.targetAudience} onChange={set("targetAudience")} options={o("targetAudience", lang)} />
                </Field>
                <Field label={t.fProductRules} hint={t.fProductRulesHint}>
                  <TextArea value={f.productRules} onChange={set("productRules")} placeholder={t.fProductRulesPh} rows={2} />
                </Field>
              </Section>

              <Section emoji="📖" title={t.sAdvStory}>
                <Field label={t.fEmotionalArc}><Chips value={f.emotionalArc} onChange={set("emotionalArc")} options={o("emotionalArc", lang)} single /></Field>
                <Field label={t.fEndingFrame}><Chips value={f.endingFrame} onChange={set("endingFrame")} options={o("endingFrame", lang)} single /></Field>
              </Section>

              <Section emoji="🎨" title={t.sStyle}>
                <Field label={t.fVideoStyle}><Chips value={f.videoStyle} onChange={set("videoStyle")} options={o("videoStyle", lang)} single /></Field>
                <Field label={t.fTone}><Chips value={f.tone} onChange={set("tone")} options={o("tone", lang)} /></Field>
                <Field label={t.fRealism}><Chips value={f.realism} onChange={set("realism")} options={o("realism", lang)} single /></Field>
                <Field label={t.fColorGrading}><Chips value={f.colorGrading} onChange={set("colorGrading")} options={o("colorGrading", lang)} /></Field>
                <Field label={t.fAuthenticity}><Chips value={f.authenticity} onChange={set("authenticity")} options={o("authenticity", lang)} single /></Field>
              </Section>

              <Section emoji="🏠" title={t.sSetting}>
                <div className="grid grid-cols-2 gap-3">
                  <Field label={t.fLocation}><Select value={f.settingPreset} onChange={set("settingPreset")} options={o("settingPreset", lang)} /></Field>
                  <Field label={t.fLighting}><Select value={f.lightingPreset} onChange={set("lightingPreset")} options={o("lightingPreset", lang)} /></Field>
                </div>
                {f.settingPreset === "custom" && <Field label={t.fCustomLocation}><TextInput value={f.settingCustom} onChange={set("settingCustom")} placeholder={t.fCustomLocationPh} /></Field>}
                {f.lightingPreset === "custom" && <Field label={t.fCustomLighting}><TextInput value={f.lightingCustom} onChange={set("lightingCustom")} placeholder={t.fCustomLightingPh} /></Field>}
                <Field label={t.fEnvDetail}><TextInput value={f.settingDetail} onChange={set("settingDetail")} placeholder={t.fEnvDetailPh} /></Field>
                <Field label={t.fBgActivity}><Chips value={f.bgActivity} onChange={set("bgActivity")} options={o("bgActivity", lang)} single /></Field>
              </Section>

              <Section emoji="👤" title={t.sTalent}>
                <Field label={t.fTalentType}><Chips value={f.talent} onChange={set("talent")} options={o("talent", lang)} single /></Field>
                {f.talent && f.talent !== "no_talent" && (<>
                  <Field label={t.fOutfit}><Chips value={f.talentStyle} onChange={set("talentStyle")} options={o("talentStyle", lang)} /></Field>
                  <Field label={t.fAppearance}><TextInput value={f.talentDetail} onChange={set("talentDetail")} placeholder={t.fAppearancePh} /></Field>
                  <Field label={t.fEmotion}><Chips value={f.emotion} onChange={set("emotion")} options={o("emotion", lang)} /></Field>
                </>)}
              </Section>

              <Section emoji="🎥" title={t.sCamera}>
                <Field label={t.fShotType}><Chips value={f.shotType} onChange={set("shotType")} options={o("shotType", lang)} /></Field>
                <Field label={t.fCamAngle}><Chips value={f.cameraAngle} onChange={set("cameraAngle")} options={o("cameraAngle", lang)} single /></Field>
                <Field label={t.fCamMove}><Chips value={f.cameraMove} onChange={set("cameraMove")} options={o("cameraMove", lang)} single /></Field>
                <Field label={t.fHeroAngle} hint={t.fHeroAngleHint}><Select value={f.heroAngle} onChange={set("heroAngle")} options={o("heroAngle", lang)} /></Field>
                <Field label={t.fProductFraming}><Chips value={f.productFraming} onChange={set("productFraming")} options={o("productFraming", lang)} /></Field>
              </Section>

              <Section emoji="🎬" title={t.sAction}>
                <Field label={t.fSubjectMotion}><Chips value={f.subjectMotion} onChange={set("subjectMotion")} options={o("subjectMotion", lang)} /></Field>
                <Field label={t.fProductInteraction}><Chips value={f.productInteraction} onChange={set("productInteraction")} options={o("productInteraction", lang)} /></Field>
              </Section>

              <Section emoji="🎙" title={t.sAudio}>
                <Field label={t.fAudioType}><Chips value={f.audioType} onChange={set("audioType")} options={o("audioType", lang)} single /></Field>
                <Field label={t.fBgMusic}><Chips value={f.bgMusic} onChange={set("bgMusic")} options={o("bgMusic", lang)} single /></Field>
                {f.audioType !== "silent" && f.audioType !== "ambient_only" && (<>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label={t.fVoLang}><Select value={f.voLang} onChange={set("voLang")} options={o("voLang", lang)} /></Field>
                    <Field label={t.fVoTone}><TextInput value={f.voTone} onChange={set("voTone")} placeholder={t.fVoTonePh} /></Field>
                  </div>
                  <Field label={t.fSpeechType}><Chips value={f.speechType} onChange={set("speechType")} options={o("speechType", lang)} single /></Field>
                  <Field label={t.fScript}><TextArea value={f.customVO} onChange={set("customVO")} placeholder={t.fScriptPh} rows={3} /></Field>
                </>)}
              </Section>

              <Section emoji="⚡" title={t.sTech}>
                <Field label={t.fFrameRate}><Chips value={f.frameRate} onChange={set("frameRate")} options={o("frameRate", lang)} single /></Field>
                <Field label={t.fResolution}><Chips value={f.resolution} onChange={set("resolution")} options={o("resolution", lang)} single /></Field>
                <Field label={t.fDOF}><Chips value={f.depthOfField} onChange={set("depthOfField")} options={o("depthOfField", lang)} single /></Field>
              </Section>

              <Section emoji="🖼" title={t.sRef}>
                <Field label={t.fRefUrl} hint={t.fRefUrlHint}>
                  <TextInput value={f.referenceUrl} onChange={set("referenceUrl")} placeholder={t.fRefUrlPh} />
                </Field>
                <Field label={t.fBrandStyle}>
                  <Chips value={f.brandStyle} onChange={set("brandStyle")} options={[
                    { value: "clean_minimal_tech", label: "Clean minimal tech" },
                    { value: "playful_colorful", label: "Playful & colorful" },
                    { value: "serious_corporate", label: "Serious & corporate" },
                    { value: "warm_lifestyle", label: "Warm lifestyle brand" },
                    { value: "premium_luxury", label: "Premium / luxury" },
                  ]} single />
                </Field>
              </Section>

              <Section emoji="❗" title={t.sRestrict}>
                <Field label={t.fAntiHalluc}><Chips value={f.antiHallucination} onChange={set("antiHallucination")} options={o("antiHallucination", lang)} /></Field>
                <Field label={t.fRestrictions}><Chips value={f.restrictions} onChange={set("restrictions")} options={o("restrictions", lang)} /></Field>
                <Field label={t.fNotes}><TextArea value={f.extraNotes} onChange={set("extraNotes")} placeholder={t.fNotesPh} rows={2} /></Field>
              </Section>

              <button onClick={() => setAdvancedOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50 transition-all text-sm text-gray-500 hover:text-blue-600 mb-5">
                🔼 <span className="font-medium">{t.btnCollapseAdvanced}</span>
              </button>
            </div>
          )}

          {/* Creative Director */}
          <Section emoji="🎭" title={t.sCreative} subtitle={t.sCreativeSub}>
            <button
              onClick={() => { fetchStoryline(f, lang, setAiLoading, setStoryline, setAiError); logUsage(user.id, "storyline"); }}
              disabled={aiLoading || !f.productName || !f.keyFeaturesCustom}
              className={`w-full py-2 rounded-lg text-sm font-medium border transition-all ${aiLoading || !f.productName || !f.keyFeaturesCustom ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : "bg-purple-500 text-white border-purple-500 hover:bg-purple-600 active:scale-95"}`}>
              {aiLoading ? t.btnThinking : storyline ? t.btnRegenerateStoryline : t.btnGenerateStoryline}
            </button>
            {(!f.productName || !f.keyFeaturesCustom) && <p className="text-xs text-gray-400">{t.hintFillProduct}</p>}
            {aiError && <p className="text-xs text-red-400">{aiError}</p>}
            {storyline && (
              <Field label={t.storylineLabel(numClips, cs)} hint={t.hintStorylineField}>
                <TextArea value={storyline} onChange={setStoryline} rows={6} placeholder="One line per clip..." />
              </Field>
            )}
          </Section>

          {/* Required warning */}
          {missingRequired && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-xs text-amber-700">
              {t.warnRequired}
            </div>
          )}

          {/* Step 1 — First Frame */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold flex-shrink-0">1</span>
              <div>
                <p className="text-sm font-bold text-gray-700">{t.step1Title} <span className="text-xs font-normal text-gray-400 ml-1">{t.step1Optional}</span></p>
                <p className="text-xs text-gray-400">{t.step1Sub}</p>
              </div>
            </div>

            <div className="border-2 border-dashed border-indigo-200 rounded-xl overflow-hidden">
              <div className="p-4 space-y-3">
                <div className={`text-xs px-3 py-2 rounded-lg ${hasFirstFrame ? "bg-green-50 text-green-700" : "bg-indigo-50 text-indigo-700"}`}>
                  {hasFirstFrame
                    ? t.hintImageReady(aspectInfo.ratio, optLabel(OPTS.platform, f.platform))
                    : t.hintImagePlatform(aspectInfo.ratio, optLabel(OPTS.platform, f.platform))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label={t.hintUploadProduct} hint={t.hintUploadProduct}>
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                      {productFile ? (
                        <div className="text-center px-2">
                          <p className="text-xs font-medium text-indigo-600 truncate w-full max-w-full">{productFile.name}</p>
                          <p className="text-xs text-gray-400 mt-1">{t.hintClickChange}</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-2xl mb-1">📦</p>
                          <p className="text-xs text-gray-400">{t.hintUploadProductLabel}</p>
                        </div>
                      )}
                      <input type="file" accept="image/*" className="hidden"
                        onChange={e => { setProductFile(e.target.files[0] || null); setGeneratedImage(null); }} />
                    </label>
                  </Field>

                  <Field label={t.hintUploadTalent} hint={t.hintUploadTalent}>
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-all">
                      {talentFile ? (
                        <div className="text-center px-2">
                          <p className="text-xs font-medium text-indigo-600 truncate w-full max-w-full">{talentFile.name}</p>
                          <p className="text-xs text-gray-400 mt-1">{t.hintClickChange}</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <p className="text-2xl mb-1">👤</p>
                          <p className="text-xs text-gray-400">{t.hintUploadTalentLabel}</p>
                        </div>
                      )}
                      <input type="file" accept="image/*" className="hidden"
                        onChange={e => { setTalentFile(e.target.files[0] || null); setGeneratedImage(null); }} />
                    </label>
                  </Field>
                </div>

                <button
                  onClick={() => generateFirstFrame(f, lang, productFile, talentFile, setFrameLoading, setGeneratedImage, setFrameError)}
                  disabled={frameLoading || !f.productName}
                  className={`w-full py-2 rounded-lg text-sm font-medium border transition-all ${frameLoading || !f.productName ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : "bg-indigo-500 text-white border-indigo-500 hover:bg-indigo-600 active:scale-95"}`}>
                  <span className="flex items-center gap-2">
                    {frameLoading ? t.btnGenerating : generatedImage ? t.btnRegenerateFrame : t.btnGenerateFrame}
                    {!frameLoading && CREDIT_COSTS.image_gemini > 0 && (
                      <span className="bg-white bg-opacity-20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {CREDIT_COSTS.image_gemini} credits
                      </span>
                    )}
                  </span>
                </button>

                {!f.productName && <p className="text-xs text-gray-400">{t.hintFillProductName}</p>}
                {frameError && <p className="text-xs text-red-400">{frameError}</p>}

                {generatedImage && (
                  <div className="space-y-2">
                    <img src={`data:${generatedImage.mimeType};base64,${generatedImage.data}`}
                      alt="Generated first frame" className="w-full rounded-lg border border-gray-200" />
                    <button onClick={downloadImage}
                      className="w-full py-2 rounded-lg bg-green-500 text-white text-sm font-medium hover:bg-green-600 active:scale-95 transition-all">
                      {t.btnDownload}
                    </button>
                    <p className="text-xs text-gray-500 text-center">{t.hintUploadToGrok}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 2 — Generate Prompts */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex-shrink-0">2</span>
              <div>
                <p className="text-sm font-bold text-gray-700">{t.step2Title}</p>
                <p className="text-xs text-gray-400">
                  {hasFirstFrame ? t.step2SubReady : t.step2SubNotReady}
                </p>
              </div>
            </div>

            {/* AI Director Toggle */}
            <button
              onClick={() => setAiDirectorOn(x => !x)}
              className={`w-full mb-3 flex items-center justify-between px-4 py-2.5 rounded-xl border-2 transition-all ${aiDirectorOn ? "border-purple-500 bg-purple-50" : "border-gray-200 bg-white hover:border-purple-300"}`}>
              <div className="flex items-center gap-2">
                <span className="text-base">🎬</span>
                <div className="text-left">
                  <p className={`text-xs font-bold ${aiDirectorOn ? "text-purple-700" : "text-gray-600"}`}>AI Director Agent</p>
                  <p className="text-xs text-gray-400">Auto-suggests shot type, camera, lighting & audio based on your storyline</p>
                </div>
              </div>
              <div className={`flex-shrink-0 w-10 h-5 rounded-full transition-all relative ${aiDirectorOn ? "bg-purple-500" : "bg-gray-200"}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${aiDirectorOn ? "left-5" : "left-0.5"}`} />
              </div>
            </button>

            <div className="flex gap-3">
              <button
                onClick={() => generate(false)}
                disabled={missingRequired || aiDirectorLoading}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${missingRequired || aiDirectorLoading ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600 active:scale-95"}`}>
                {aiDirectorLoading ? "🎬 Directing..." : t.btnTextOnly}
              </button>

              <button
                onClick={() => generate(true)}
                disabled={missingRequired || !hasFirstFrame || aiDirectorLoading}
                title={!hasFirstFrame ? t.hintImageVideoUnlocks : ""}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                  missingRequired || !hasFirstFrame || aiDirectorLoading
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-indigo-500 text-white border-indigo-500 hover:bg-indigo-600 active:scale-95"
                }`}>
                {aiDirectorLoading ? "🎬 Directing..." : hasFirstFrame ? `${t.btnImageVideo} ✅` : t.btnImageVideo}
              </button>
            </div>

            {!hasFirstFrame && !missingRequired && (
              <p className="text-xs text-gray-400 text-center mt-2">{t.hintImageVideoUnlocks}</p>
            )}

            <button
              onClick={() => { setF(init); setClips([]); setStoryline(""); setTab("builder"); setGeneratedImage(null); setProductFile(null); setTalentFile(null); }}
              className="w-full mt-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-100 transition-all">
              {t.btnReset}
            </button>
          </div>

        </>)}

        {tab === "output" && (
          <div ref={outputRef}>
            {clips.length > 0 ? (<>
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-xs text-blue-800">
                <strong>{t.hintOutputInfo(clips.length, f.grokPlan === "pro" ? "⭐ Grok Pro" : "🆓 Grok Free", cs, f.totalDuration)}</strong>
                {hasFirstFrame && <span className="block mt-1 text-indigo-600">{t.hintImg2Video}</span>}
                {clips.length > 1 && <span className="block mt-1 text-blue-600">{t.hintStitchClips}</span>}
              </div>
              {clips.length > 1 && (
                <button onClick={copyAll} className="w-full mb-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 font-medium transition-all">
                  {copiedIdx === "all" ? t.btnCopied : t.btnCopyAll}
                </button>
              )}
              {clips.map((clip, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <div>
                      <span className="text-sm font-bold text-gray-800">{clip.label}</span>
                      <span className="ml-2 text-xs font-medium text-purple-600">{clip.tag} {clip.role}</span>
                      <span className="ml-2 text-xs text-gray-400">{clip.timing}</span>
                      {hasFirstFrame && <span className="ml-2 text-xs text-indigo-500">🖼 img2vid</span>}
                    </div>
                    <button onClick={() => copyClip(clip.prompt, i)}
                      className="px-3 py-1 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 active:scale-95 transition-all">
                      {copiedIdx === i ? t.btnCopiedOne : t.btnCopy}
                    </button>
                  </div>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed font-mono p-4">{clip.prompt}</pre>
                </div>
              ))}
              <div className="flex gap-3 pb-8">
                <button onClick={copyAll} className="flex-1 py-3 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 active:scale-95 transition-all">
                  {copiedIdx === "all" ? t.btnCopied : t.btnCopyAll}
                </button>
                <button onClick={() => setTab("builder")} className="px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-100">{t.btnEdit}</button>
              </div>
            </>) : (
              <div className="text-center py-16 text-gray-400">
                <p className="text-4xl mb-3">📝</p>
                <p className="text-sm">{t.hintEmptyOutput}</p>
                <button onClick={() => setTab("builder")} className="mt-4 px-4 py-2 rounded-lg bg-blue-50 text-blue-500 text-sm font-medium">{t.btnBackToBuilder}</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

