import React, { useState, useRef } from "react";

// ── Translations ───────────────────────────────────────────────────────────
const TRANSLATIONS = {
  en: {
    // Header
    appTitle: "🎬 TikTok UGC Prompt Builder",
    appSubtitle: "Powered for Grok — any product, any brand",
    tabBuilder: "📝 Builder",
    tabOutput: "📋 Output",

    // Section badges
    basicSettings: "✅ Basic Settings",
    basicSettingsHint: "Required to generate prompts",
    advancedSettings: "⚙️ Advanced Settings",
    advancedSettingsHint: "Optional — fine-tune your output",

    // Section titles & subtitles
    sProject: "Project", sProjectSub: "Optional — helps you organise multiple campaigns.",
    sGrok: "Grok Settings", sGrokSub: "Select your plan — determines how many clips are generated.",
    sFunnel: "Sales Funnel Stage", sFunnelSub: "Select your video objective — shapes the entire storyline and strategy.",
    sProduct: "Product", sProductSub: "Lock down your product — stays consistent across every clip.",
    sStory: "Story & Structure",
    sAdvProduct: "Product Details", sAdvProductSub: "Additional product context.",
    sAdvStory: "Story Details",
    sStyle: "Style & Tone",
    sSetting: "Setting & Environment",
    sTalent: "Talent & Character",
    sCamera: "Camera & Framing",
    sAction: "Action & Motion",
    sAudio: "Audio & Voiceover",
    sTech: "Technical Settings",
    sRef: "References",
    sRestrict: "Restrictions & Guardrails",
    sCreative: "Creative Director", sCreativeSub: "AI generates a structured Hook → Content → CTA storyline based on all your settings above. Edit freely before generating.",

    // Fields
    fCampaign: "Campaign / Project Name",
    fCampaignPh: "e.g. Raya 2025 — Vflow Monitor Launch",
    fGrokPlan: "Grok Plan",
    fDuration: "Total Video Duration (seconds)",
    fPlatform: "Platform",
    fProductName: "Product Name",
    fProductNamePh: "e.g. Vflow Portable Monitor",
    fProductCat: "Product Category",
    fCustomCat: "Custom Category",
    fCustomCatPh: "Describe your product type",
    fFeatures: "Key Features to Highlight",
    fFeaturesPh: "e.g. Ultra-slim 15.6 inch, USB-C plug-and-play, 1080p display, foldable stand",
    fFeaturesHint: "Describe what the video must show",
    fUSP: "USP — Unique Selling Point",
    fUSPPh: "e.g. Thinnest portable monitor that fits in a laptop bag",
    fHook: "Hook Strategy",
    fHookHint: "How does the video open? Pick 1–2",
    fProblem: "Problem Being Solved",
    fProblemPh: "e.g. Laptop screen too small for multi-tasking",
    fBenefit: "Core Benefit to Show",
    fBenefitPh: "e.g. Instant dual-screen setup anywhere in seconds",
    fCTA: "CTA",
    fCTAHint: "Pick 1–2",
    fColors: "Key Colors",
    fColorsHint: "Exact colors — must not change across clips",
    fColorsPh: "e.g. Matte black body, silver stand",
    fAudience: "Target Audience",
    fProductRules: "Product Rules",
    fProductRulesHint: "Visual dos and don'ts",
    fProductRulesPh: "e.g. Always show product screen on\nDo not show product disassembled",
    fEmotionalArc: "Emotional Arc",
    fEndingFrame: "Ending Frame / Last Shot",
    fVideoStyle: "Video Style",
    fTone: "Tone",
    fRealism: "Realism Level",
    fColorGrading: "Color Grading / Mood",
    fAuthenticity: "Authenticity Feel",
    fLocation: "Location",
    fLighting: "Lighting",
    fCustomLocation: "Custom Location",
    fCustomLocationPh: "e.g. Rooftop terrace",
    fCustomLighting: "Custom Lighting",
    fCustomLightingPh: "e.g. Neon-lit night scene",
    fEnvDetail: "Environment Details & Props",
    fEnvDetailPh: "e.g. Desk + laptop + coffee",
    fBgActivity: "Background Activity Level",
    fTalentType: "Talent Type",
    fOutfit: "Outfit Style",
    fAppearance: "Appearance Details",
    fAppearancePh: "e.g. White shirt, dark jeans, hair tied back",
    fEmotion: "Emotion / Facial Expression",
    fShotType: "Shot Type",
    fCamAngle: "Camera Angle",
    fCamMove: "Camera Movement",
    fHeroAngle: "Hero / Product Shot Angle",
    fHeroAngleHint: "Final closing shot",
    fProductFraming: "Product Framing Rules",
    fSubjectMotion: "Subject Motion",
    fProductInteraction: "Product Interaction",
    fAudioType: "Audio Type",
    fBgMusic: "Background Music",
    fVoLang: "Voiceover Language",
    fVoTone: "VO Tone",
    fVoTonePh: "e.g. Friendly, calm",
    fSpeechType: "Speech Type",
    fScript: "Script Guide / Key Lines",
    fScriptPh: "Opening: Hook line\nMiddle: Key benefit\nClose: CTA",
    fFrameRate: "Frame Rate",
    fResolution: "Resolution",
    fDOF: "Focus & Depth of Field",
    fRefUrl: "Reference Image URL / Product Link",
    fRefUrlHint: "Dramatically improves accuracy",
    fRefUrlPh: "e.g. https://yoursite.com/product-image.jpg",
    fBrandStyle: "Brand Style Reference",
    fAntiHalluc: "Anti-Hallucination Rules",
    fRestrictions: "Additional Restrictions",
    fNotes: "Additional Notes",
    fNotesPh: "e.g. Raya season — festive but not loud.",

    // Buttons & actions
    btnGenerateStoryline: "✨ Generate Storyline Idea",
    btnRegenerateStoryline: "🔄 Regenerate Storyline",
    btnThinking: "✨ Thinking...",
    btnGenerateFrame: "🎨 Generate First Frame Image",
    btnRegenerateFrame: "🔄 Regenerate First Frame",
    btnGenerating: "🎨 Generating...",
    btnDownload: "⬇️ Download First Frame Image",
    btnTextOnly: "📝 Text-Only Prompts",
    btnImageVideo: "🖼 Image-to-Video Prompts",
    btnReset: "Reset All",
    btnCopyAll: "📋 Copy All Prompts",
    btnCopied: "✅ All Copied!",
    btnCopy: "📋 Copy",
    btnCopiedOne: "✅ Copied!",
    btnEdit: "← Edit",
    btnBackToBuilder: "← Back to Builder",
    btnCollapseAdvanced: "Collapse Advanced Settings",
    btnShowAdvanced: "Show Advanced Settings",
    btnHideAdvanced: "Hide Advanced Settings",

    // Hints & info
    hintFillProduct: "Fill in Product Name and Key Features first.",
    hintFillProductName: "Fill in Product Name first.",
    hintStorylineField: "Edit freely — one line per clip beat",
    hintUploadProduct: "Upload a photo of your product",
    hintUploadTalent: "Upload a photo of the talent",
    hintClickChange: "Click to change",
    hintUploadProductLabel: "Upload product photo",
    hintUploadTalentLabel: "Upload talent photo",
    hintImageReady: (ratio, platform) => `✅ First frame ready (${ratio}) — Step 2 prompts will be optimised for image-to-video`,
    hintImagePlatform: (ratio, platform) => `📐 Will generate a ${ratio} reference image for ${platform}`,
    hintImageVideoUnlocks: "🖼 Image-to-Video unlocks after Step 1 is complete",
    hintUploadToGrok: "Upload this image to Grok along with the Step 2 prompts below",
    hintAdvancedSub: (n) => `${n} optional sections — Style, Camera, Audio, Technical & more`,
    hintAdvancedCollapse: "Collapse optional settings",
    hintClipsGenerated: (n, cs) => `Each clip = ${cs}s max. Your duration splits into ${n} clip${n > 1 ? "s" : ""}.`,
    hintMultiplePrompts: (n, cs) => `📋 Generates ${n} separate prompts (${cs}s each). Generate each in Grok then stitch or use Extend.`,
    hintOutputInfo: (n, plan, cs, dur) => `${n} clip${n > 1 ? "s" : ""} generated — ${plan} · ${cs}s per clip · ${dur}s total`,
    hintImg2Video: "🖼 Image-to-video mode — upload your first frame image to Grok with each prompt.",
    hintStitchClips: "Paste each prompt into Grok separately. Stitch clips or use Grok's Extend feature.",
    hintEmptyOutput: "Complete the builder and click Generate Prompts.",

    // Step labels
    step1Title: "Generate First Frame",
    step1Optional: "Optional",
    step1Sub: "Use Gemini to create a reference image — then review before generating prompts",
    step2Title: "Generate Prompts",
    step2SubReady: "First frame ready — choose text-only or image-to-video mode",
    step2SubNotReady: "Generate text-only prompts, or complete Step 1 first for image-to-video",

    // Funnel
    funnelUpperLabel: "Upper Funnel", funnelUpperTag: "Awareness", funnelUpperDesc: "Pull traffic & build awareness",
    funnelUpperObj: "Reach out to new customers who don't know your product yet",
    funnelUpperEx: ["Relatable problem", "Storytelling", "Point of view (POV)", "Trending hook"],
    funnelMiddleLabel: "Middle Funnel", funnelMiddleTag: "Consideration", funnelMiddleDesc: "Educate & build trust",
    funnelMiddleObj: "Gain video views, community interaction and warm up leads",
    funnelMiddleEx: ["Review / UGC", "Before & after", "Feature highlight", "Product demo"],
    funnelLowerLabel: "Lower Funnel", funnelLowerTag: "Conversion", funnelLowerDesc: "Drive purchase & close sales",
    funnelLowerObj: "Promotion, lead generation and direct purchase intent",
    funnelLowerEx: ["Limited offer", "CTA to buy", "Testimonial + price", "Urgency / scarcity"],
    funnelUpperConfirm: "✅ Hook→Content→CTA will focus on AWARENESS — no hard selling.",
    funnelMiddleConfirm: "✅ Hook→Content→CTA will focus on CONSIDERATION — educate and build trust.",
    funnelLowerConfirm: "✅ Hook→Content→CTA will focus on CONVERSION — urgency and purchase intent.",

    // Warnings
    warnRequired: "⚠️ Required: Funnel Stage, Product Name, Category, Key Features, USP, Problem, Core Benefit, Hook Strategy, and CTA.",

    // Storyline label
    storylineLabel: (n, cs) => `Storyline (${n} clips × ${cs}s) — Hook → Content → CTA`,

    // Prompt language instruction (injected into AI prompt)
    promptLangInstruction: "",
    storylineLangInstruction: "",
  },

  zh: {
    appTitle: "🎬 TikTok UGC 提示词生成器",
    appSubtitle: "由 Grok 驱动 — 适用于任何产品和品牌",
    tabBuilder: "📝 构建器",
    tabOutput: "📋 输出",

    basicSettings: "✅ 基本设置",
    basicSettingsHint: "生成提示词所需的必填项",
    advancedSettings: "⚙️ 高级设置",
    advancedSettingsHint: "可选 — 进一步优化您的输出",

    sProject: "项目", sProjectSub: "可选 — 帮助您管理多个营销活动。",
    sGrok: "Grok 设置", sGrokSub: "选择您的套餐 — 决定生成的片段数量。",
    sFunnel: "销售漏斗阶段", sFunnelSub: "选择视频目标 — 影响整体故事线和策略。",
    sProduct: "产品", sProductSub: "锁定您的产品 — 在每个片段中保持一致。",
    sStory: "故事结构",
    sAdvProduct: "产品详情", sAdvProductSub: "额外的产品背景信息。",
    sAdvStory: "故事细节",
    sStyle: "风格与基调",
    sSetting: "场景与环境",
    sTalent: "演员与角色",
    sCamera: "镜头与构图",
    sAction: "动作与运动",
    sAudio: "音频与配音",
    sTech: "技术设置",
    sRef: "参考资料",
    sRestrict: "限制与规范",
    sCreative: "创意总监", sCreativeSub: "AI 根据您上方的所有设置，生成结构化的钩子→内容→CTA 故事线。可自由编辑后再生成。",

    fCampaign: "活动 / 项目名称",
    fCampaignPh: "例如：斋戒月 2025 — Vflow 显示器发布",
    fGrokPlan: "Grok 套餐",
    fDuration: "视频总时长（秒）",
    fPlatform: "平台",
    fProductName: "产品名称",
    fProductNamePh: "例如：Vflow 便携显示器",
    fProductCat: "产品类别",
    fCustomCat: "自定义类别",
    fCustomCatPh: "描述您的产品类型",
    fFeatures: "需要突出的主要功能",
    fFeaturesPh: "例如：超薄15.6英寸，USB-C即插即用，1080P显示屏，折叠支架",
    fFeaturesHint: "描述视频必须展示的内容",
    fUSP: "USP — 独特卖点",
    fUSPPh: "例如：能放入笔记本包的最薄便携显示器",
    fHook: "钩子策略",
    fHookHint: "视频如何开场？选择1–2个",
    fProblem: "解决的问题",
    fProblemPh: "例如：笔记本屏幕太小，无法多任务处理",
    fBenefit: "核心展示利益",
    fBenefitPh: "例如：几秒内随时随地实现双屏设置",
    fCTA: "行动号召",
    fCTAHint: "选择1–2个",
    fColors: "主要颜色",
    fColorsHint: "精确颜色 — 各片段之间不得改变",
    fColorsPh: "例如：哑光黑色机身，银色支架",
    fAudience: "目标受众",
    fProductRules: "产品规则",
    fProductRulesHint: "视觉上的注意事项",
    fProductRulesPh: "例如：始终显示产品屏幕\n不要展示产品拆解状态",
    fEmotionalArc: "情感弧线",
    fEndingFrame: "结束帧 / 最后镜头",
    fVideoStyle: "视频风格",
    fTone: "基调",
    fRealism: "真实感级别",
    fColorGrading: "色调 / 氛围",
    fAuthenticity: "真实感",
    fLocation: "拍摄地点",
    fLighting: "灯光",
    fCustomLocation: "自定义地点",
    fCustomLocationPh: "例如：屋顶露台",
    fCustomLighting: "自定义灯光",
    fCustomLightingPh: "例如：霓虹夜景",
    fEnvDetail: "环境细节与道具",
    fEnvDetailPh: "例如：桌子 + 笔记本 + 咖啡",
    fBgActivity: "背景活动程度",
    fTalentType: "演员类型",
    fOutfit: "服装风格",
    fAppearance: "外观细节",
    fAppearancePh: "例如：白衬衫，深色牛仔裤，头发扎起",
    fEmotion: "情绪 / 面部表情",
    fShotType: "镜头类型",
    fCamAngle: "摄像机角度",
    fCamMove: "摄像机运动",
    fHeroAngle: "主角 / 产品镜头角度",
    fHeroAngleHint: "最终收尾镜头",
    fProductFraming: "产品构图规则",
    fSubjectMotion: "主体动作",
    fProductInteraction: "产品互动",
    fAudioType: "音频类型",
    fBgMusic: "背景音乐",
    fVoLang: "配音语言",
    fVoTone: "配音语气",
    fVoTonePh: "例如：友好，平静",
    fSpeechType: "说话类型",
    fScript: "脚本指南 / 关键台词",
    fScriptPh: "开场：钩子台词\n中段：核心利益\n结尾：行动号召",
    fFrameRate: "帧率",
    fResolution: "分辨率",
    fDOF: "焦点与景深",
    fRefUrl: "参考图片链接 / 产品链接",
    fRefUrlHint: "显著提高准确性",
    fRefUrlPh: "例如：https://yoursite.com/product-image.jpg",
    fBrandStyle: "品牌风格参考",
    fAntiHalluc: "防止AI幻觉规则",
    fRestrictions: "附加限制",
    fNotes: "附加说明",
    fNotesPh: "例如：斋戒月季节 — 节日气氛但不要过于喧嚣。",

    btnGenerateStoryline: "✨ 生成故事线",
    btnRegenerateStoryline: "🔄 重新生成故事线",
    btnThinking: "✨ 思考中...",
    btnGenerateFrame: "🎨 生成首帧图像",
    btnRegenerateFrame: "🔄 重新生成首帧",
    btnGenerating: "🎨 生成中...",
    btnDownload: "⬇️ 下载首帧图像",
    btnTextOnly: "📝 纯文字提示词",
    btnImageVideo: "🖼 图像转视频提示词",
    btnReset: "重置全部",
    btnCopyAll: "📋 复制全部提示词",
    btnCopied: "✅ 已全部复制！",
    btnCopy: "📋 复制",
    btnCopiedOne: "✅ 已复制！",
    btnEdit: "← 编辑",
    btnBackToBuilder: "← 返回构建器",
    btnCollapseAdvanced: "收起高级设置",
    btnShowAdvanced: "显示高级设置",
    btnHideAdvanced: "隐藏高级设置",

    hintFillProduct: "请先填写产品名称和主要功能。",
    hintFillProductName: "请先填写产品名称。",
    hintStorylineField: "可自由编辑 — 每行对应一个片段节拍",
    hintUploadProduct: "上传产品照片",
    hintUploadTalent: "上传演员照片",
    hintClickChange: "点击更换",
    hintUploadProductLabel: "上传产品照片",
    hintUploadTalentLabel: "上传演员照片",
    hintImageReady: (ratio) => `✅ 首帧已就绪（${ratio}）— 第2步提示词将针对图像转视频进行优化`,
    hintImagePlatform: (ratio, platform) => `📐 将为 ${platform} 生成 ${ratio} 参考图像`,
    hintImageVideoUnlocks: "🖼 完成第1步后可解锁图像转视频功能",
    hintUploadToGrok: "请将此图像连同第2步提示词一起上传到 Grok",
    hintAdvancedSub: (n) => `${n} 个可选部分 — 风格、镜头、音频、技术等`,
    hintAdvancedCollapse: "收起可选设置",
    hintClipsGenerated: (n, cs) => `每个片段最长 ${cs} 秒。您的时长将分为 ${n} 个片段。`,
    hintMultiplePrompts: (n, cs) => `📋 生成 ${n} 个独立提示词（每个 ${cs} 秒）。在 Grok 中逐一生成后拼接或使用 Extend 功能。`,
    hintOutputInfo: (n, plan, cs, dur) => `已生成 ${n} 个片段 — ${plan} · 每段 ${cs} 秒 · 总时长 ${dur} 秒`,
    hintImg2Video: "🖼 图像转视频模式 — 请将首帧图像与提示词一起上传至 Grok。",
    hintStitchClips: "请将每个提示词分别粘贴到 Grok 中。使用拼接或 Extend 功能合并片段。",
    hintEmptyOutput: "请完成构建器并点击生成提示词。",

    step1Title: "生成首帧",
    step1Optional: "可选",
    step1Sub: "使用 Gemini 创建参考图像 — 审核后再生成提示词",
    step2Title: "生成提示词",
    step2SubReady: "首帧已就绪 — 选择纯文字或图像转视频模式",
    step2SubNotReady: "生成纯文字提示词，或先完成第1步以使用图像转视频",

    funnelUpperLabel: "上漏斗", funnelUpperTag: "认知", funnelUpperDesc: "引流并建立品牌认知",
    funnelUpperObj: "触达尚不了解您产品的新客户",
    funnelUpperEx: ["相关痛点", "故事叙述", "第一视角(POV)", "热门钩子"],
    funnelMiddleLabel: "中漏斗", funnelMiddleTag: "考虑", funnelMiddleDesc: "教育用户并建立信任",
    funnelMiddleObj: "获得视频观看、社区互动并培育潜在客户",
    funnelMiddleEx: ["评测 / UGC", "前后对比", "功能亮点", "产品演示"],
    funnelLowerLabel: "下漏斗", funnelLowerTag: "转化", funnelLowerDesc: "促进购买并完成销售",
    funnelLowerObj: "促销、潜在客户生成和直接购买意图",
    funnelLowerEx: ["限时优惠", "购买CTA", "证言+价格", "紧迫感/稀缺性"],
    funnelUpperConfirm: "✅ 钩子→内容→CTA 将聚焦于品牌认知 — 无强硬推销。",
    funnelMiddleConfirm: "✅ 钩子→内容→CTA 将聚焦于考虑阶段 — 教育并建立信任。",
    funnelLowerConfirm: "✅ 钩子→内容→CTA 将聚焦于转化 — 紧迫感与购买意图。",

    warnRequired: "⚠️ 必填项：漏斗阶段、产品名称、类别、主要功能、独特卖点、痛点、核心利益、钩子策略和行动号召。",
    storylineLabel: (n, cs) => `故事线（${n} 个片段 × ${cs} 秒）— 钩子 → 内容 → CTA`,

    promptLangInstruction: "\n\nIMPORTANT: Generate ALL text content in this prompt in Simplified Chinese (简体中文). All labels, descriptions, scene beats, directions, and voiceover guidance must be written in Simplified Chinese.",
    storylineLangInstruction: " 请用简体中文回复。所有场景描述必须用简体中文写成。",
  },

  bm: {
    appTitle: "🎬 Pembina Prompt UGC TikTok",
    appSubtitle: "Dikuasakan oleh Grok — mana-mana produk, mana-mana jenama",
    tabBuilder: "📝 Pembina",
    tabOutput: "📋 Output",

    basicSettings: "✅ Tetapan Asas",
    basicSettingsHint: "Diperlukan untuk menjana prompt",
    advancedSettings: "⚙️ Tetapan Lanjutan",
    advancedSettingsHint: "Pilihan — laraskan output anda",

    sProject: "Projek", sProjectSub: "Pilihan — membantu anda mengurus pelbagai kempen.",
    sGrok: "Tetapan Grok", sGrokSub: "Pilih pelan anda — menentukan bilangan klip yang dijana.",
    sFunnel: "Peringkat Corong Jualan", sFunnelSub: "Pilih objektif video — membentuk keseluruhan jalan cerita dan strategi.",
    sProduct: "Produk", sProductSub: "Tetapkan produk anda — kekal konsisten dalam setiap klip.",
    sStory: "Cerita & Struktur",
    sAdvProduct: "Butiran Produk", sAdvProductSub: "Maklumat konteks produk tambahan.",
    sAdvStory: "Butiran Cerita",
    sStyle: "Gaya & Nada",
    sSetting: "Latar & Persekitaran",
    sTalent: "Pelakon & Watak",
    sCamera: "Kamera & Framing",
    sAction: "Aksi & Pergerakan",
    sAudio: "Audio & Suara Latar",
    sTech: "Tetapan Teknikal",
    sRef: "Rujukan",
    sRestrict: "Sekatan & Garis Panduan",
    sCreative: "Pengarah Kreatif", sCreativeSub: "AI menjana jalan cerita Hook → Kandungan → CTA berstruktur berdasarkan semua tetapan di atas. Edit dengan bebas sebelum menjana.",

    fCampaign: "Nama Kempen / Projek",
    fCampaignPh: "cth. Raya 2025 — Pelancaran Monitor Vflow",
    fGrokPlan: "Pelan Grok",
    fDuration: "Jumlah Tempoh Video (saat)",
    fPlatform: "Platform",
    fProductName: "Nama Produk",
    fProductNamePh: "cth. Monitor Mudah Alih Vflow",
    fProductCat: "Kategori Produk",
    fCustomCat: "Kategori Tersuai",
    fCustomCatPh: "Huraikan jenis produk anda",
    fFeatures: "Ciri Utama untuk Ditonjolkan",
    fFeaturesPh: "cth. Ultra-nipis 15.6 inci, USB-C plag-dan-guna, paparan 1080p, penyangga boleh dilipat",
    fFeaturesHint: "Huraikan apa yang mesti ditunjukkan dalam video",
    fUSP: "USP — Titik Jualan Unik",
    fUSPPh: "cth. Monitor mudah alih paling nipis yang muat dalam beg laptop",
    fHook: "Strategi Pembuka",
    fHookHint: "Bagaimana video dibuka? Pilih 1–2",
    fProblem: "Masalah yang Diselesaikan",
    fProblemPh: "cth. Skrin laptop terlalu kecil untuk pelbagai tugas",
    fBenefit: "Manfaat Utama untuk Ditunjukkan",
    fBenefitPh: "cth. Persediaan dwi-skrin segera di mana-mana dalam beberapa saat",
    fCTA: "Seruan Tindakan",
    fCTAHint: "Pilih 1–2",
    fColors: "Warna Utama",
    fColorsHint: "Warna tepat — tidak boleh berubah antara klip",
    fColorsPh: "cth. Badan hitam matte, penyangga perak",
    fAudience: "Sasaran Penonton",
    fProductRules: "Peraturan Produk",
    fProductRulesHint: "Panduan visual yang perlu dan tidak perlu",
    fProductRulesPh: "cth. Sentiasa tunjukkan skrin produk menyala\nJangan tunjukkan produk dalam keadaan dibuka",
    fEmotionalArc: "Lengkok Emosi",
    fEndingFrame: "Bingkai Akhir / Tembakan Terakhir",
    fVideoStyle: "Gaya Video",
    fTone: "Nada",
    fRealism: "Tahap Realisme",
    fColorGrading: "Gradasi Warna / Suasana",
    fAuthenticity: "Perasaan Keaslian",
    fLocation: "Lokasi",
    fLighting: "Pencahayaan",
    fCustomLocation: "Lokasi Tersuai",
    fCustomLocationPh: "cth. Teres bumbung",
    fCustomLighting: "Pencahayaan Tersuai",
    fCustomLightingPh: "cth. Pemandangan malam neon",
    fEnvDetail: "Butiran Persekitaran & Prop",
    fEnvDetailPh: "cth. Meja + laptop + kopi",
    fBgActivity: "Tahap Aktiviti Latar Belakang",
    fTalentType: "Jenis Pelakon",
    fOutfit: "Gaya Pakaian",
    fAppearance: "Butiran Penampilan",
    fAppearancePh: "cth. Baju putih, seluar jeans gelap, rambut diikat",
    fEmotion: "Emosi / Ekspresi Muka",
    fShotType: "Jenis Tembakan",
    fCamAngle: "Sudut Kamera",
    fCamMove: "Pergerakan Kamera",
    fHeroAngle: "Sudut Tembakan Hero / Produk",
    fHeroAngleHint: "Tembakan penutup terakhir",
    fProductFraming: "Peraturan Framing Produk",
    fSubjectMotion: "Pergerakan Subjek",
    fProductInteraction: "Interaksi Produk",
    fAudioType: "Jenis Audio",
    fBgMusic: "Muzik Latar",
    fVoLang: "Bahasa Suara Latar",
    fVoTone: "Nada Suara Latar",
    fVoTonePh: "cth. Mesra, tenang",
    fSpeechType: "Jenis Pertuturan",
    fScript: "Panduan Skrip / Baris Utama",
    fScriptPh: "Pembuka: Baris pembuka\nTengah: Manfaat utama\nPenutup: Seruan tindakan",
    fFrameRate: "Kadar Bingkai",
    fResolution: "Resolusi",
    fDOF: "Fokus & Kedalaman Medan",
    fRefUrl: "URL Gambar Rujukan / Pautan Produk",
    fRefUrlHint: "Meningkatkan ketepatan dengan ketara",
    fRefUrlPh: "cth. https://yoursite.com/product-image.jpg",
    fBrandStyle: "Rujukan Gaya Jenama",
    fAntiHalluc: "Peraturan Anti-Halusinasi",
    fRestrictions: "Sekatan Tambahan",
    fNotes: "Nota Tambahan",
    fNotesPh: "cth. Musim Raya — suasana perayaan tapi tidak terlalu meriah.",

    btnGenerateStoryline: "✨ Jana Idea Jalan Cerita",
    btnRegenerateStoryline: "🔄 Jana Semula Jalan Cerita",
    btnThinking: "✨ Sedang berfikir...",
    btnGenerateFrame: "🎨 Jana Imej Bingkai Pertama",
    btnRegenerateFrame: "🔄 Jana Semula Bingkai Pertama",
    btnGenerating: "🎨 Sedang menjana...",
    btnDownload: "⬇️ Muat Turun Imej Bingkai Pertama",
    btnTextOnly: "📝 Prompt Teks Sahaja",
    btnImageVideo: "🖼 Prompt Imej-ke-Video",
    btnReset: "Set Semula Semua",
    btnCopyAll: "📋 Salin Semua Prompt",
    btnCopied: "✅ Semua Disalin!",
    btnCopy: "📋 Salin",
    btnCopiedOne: "✅ Disalin!",
    btnEdit: "← Edit",
    btnBackToBuilder: "← Kembali ke Pembina",
    btnCollapseAdvanced: "Runtuhkan Tetapan Lanjutan",
    btnShowAdvanced: "Tunjukkan Tetapan Lanjutan",
    btnHideAdvanced: "Sembunyikan Tetapan Lanjutan",

    hintFillProduct: "Sila isi Nama Produk dan Ciri Utama dahulu.",
    hintFillProductName: "Sila isi Nama Produk dahulu.",
    hintStorylineField: "Edit dengan bebas — satu baris untuk setiap klip",
    hintUploadProduct: "Muat naik foto produk",
    hintUploadTalent: "Muat naik foto pelakon",
    hintClickChange: "Klik untuk tukar",
    hintUploadProductLabel: "Muat naik foto produk",
    hintUploadTalentLabel: "Muat naik foto pelakon",
    hintImageReady: (ratio) => `✅ Bingkai pertama sedia (${ratio}) — Prompt Langkah 2 akan dioptimumkan untuk imej-ke-video`,
    hintImagePlatform: (ratio, platform) => `📐 Akan menjana imej rujukan ${ratio} untuk ${platform}`,
    hintImageVideoUnlocks: "🖼 Imej-ke-Video boleh digunakan selepas Langkah 1 selesai",
    hintUploadToGrok: "Muat naik imej ini bersama prompt Langkah 2 ke Grok",
    hintAdvancedSub: (n) => `${n} bahagian pilihan — Gaya, Kamera, Audio, Teknikal & lain-lain`,
    hintAdvancedCollapse: "Runtuhkan tetapan pilihan",
    hintClipsGenerated: (n, cs) => `Setiap klip = maks ${cs} saat. Tempoh anda dibahagikan kepada ${n} klip.`,
    hintMultiplePrompts: (n, cs) => `📋 Menjana ${n} prompt berasingan (${cs} saat setiap satu). Jana setiap satu dalam Grok kemudian gabungkan atau gunakan Extend.`,
    hintOutputInfo: (n, plan, cs, dur) => `${n} klip dijana — ${plan} · ${cs} saat setiap klip · ${dur} saat jumlah`,
    hintImg2Video: "🖼 Mod imej-ke-video — muat naik imej bingkai pertama anda ke Grok bersama setiap prompt.",
    hintStitchClips: "Tampal setiap prompt ke dalam Grok secara berasingan. Gabungkan klip atau gunakan ciri Extend Grok.",
    hintEmptyOutput: "Lengkapkan pembina dan klik Jana Prompt.",

    step1Title: "Jana Bingkai Pertama",
    step1Optional: "Pilihan",
    step1Sub: "Gunakan Gemini untuk mencipta imej rujukan — semak sebelum menjana prompt",
    step2Title: "Jana Prompt",
    step2SubReady: "Bingkai pertama sedia — pilih mod teks sahaja atau imej-ke-video",
    step2SubNotReady: "Jana prompt teks sahaja, atau selesaikan Langkah 1 dahulu untuk imej-ke-video",

    funnelUpperLabel: "Corong Atas", funnelUpperTag: "Kesedaran", funnelUpperDesc: "Tarik trafik & bina kesedaran",
    funnelUpperObj: "Hubungi pelanggan baru yang belum mengenali produk anda",
    funnelUpperEx: ["Masalah berkaitan", "Penceritaan", "Sudut pandang (POV)", "Pembuka trending"],
    funnelMiddleLabel: "Corong Tengah", funnelMiddleTag: "Pertimbangan", funnelMiddleDesc: "Didik & bina kepercayaan",
    funnelMiddleObj: "Dapatkan tontonan video, interaksi komuniti dan hangatkan prospek",
    funnelMiddleEx: ["Ulasan / UGC", "Sebelum & selepas", "Sorotan ciri", "Demo produk"],
    funnelLowerLabel: "Corong Bawah", funnelLowerTag: "Penukaran", funnelLowerDesc: "Dorong pembelian & tutup jualan",
    funnelLowerObj: "Promosi, jana prospek dan niat pembelian terus",
    funnelLowerEx: ["Tawaran terhad", "CTA beli", "Testimoni + harga", "Urgensi / kelangkaan"],
    funnelUpperConfirm: "✅ Hook→Kandungan→CTA akan fokus pada KESEDARAN — tiada jualan keras.",
    funnelMiddleConfirm: "✅ Hook→Kandungan→CTA akan fokus pada PERTIMBANGAN — didik dan bina kepercayaan.",
    funnelLowerConfirm: "✅ Hook→Kandungan→CTA akan fokus pada PENUKARAN — urgensi dan niat pembelian.",

    warnRequired: "⚠️ Diperlukan: Peringkat Corong, Nama Produk, Kategori, Ciri Utama, USP, Masalah, Manfaat Utama, Strategi Hook, dan CTA.",
    storylineLabel: (n, cs) => `Jalan Cerita (${n} klip × ${cs} saat) — Hook → Kandungan → CTA`,

    promptLangInstruction: "\n\nIMPORTANT: Generate ALL text content in this prompt in Bahasa Malaysia. All labels, descriptions, scene beats, directions, and voiceover guidance must be written in Bahasa Malaysia.",
    storylineLangInstruction: " Sila balas dalam Bahasa Malaysia. Semua penerangan adegan mesti ditulis dalam Bahasa Malaysia.",
  },
};

// ── Clip role assignment ───────────────────────────────────────────────────
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
const PLATFORM_ASPECT = {
  tiktok: { ratio: "9:16", label: "9:16 vertical", gemini: "9:16" },
  reels: { ratio: "9:16", label: "9:16 vertical", gemini: "9:16" },
  youtube_shorts: { ratio: "9:16", label: "9:16 vertical", gemini: "9:16" },
  youtube_main: { ratio: "16:9", label: "16:9 landscape", gemini: "16:9" },
  feed_square: { ratio: "1:1", label: "1:1 square", gemini: "1:1" },
};

// ── Options (labels stay in English — these are technical terms for Grok) ──
// ── Helper: resolve per-language opts array ────────────────────────────────
// If an OPTS key is a plain array it's language-neutral; if it's an object, pick the right lang.
const o = (key, lang) => {
  const v = OPTS[key];
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return v[lang] || v.en || [];
};

const OPTS = {
  // Platform & plan labels are proper nouns — keep as-is
  platform: [
    { value: "tiktok", label: "TikTok (9:16)" },
    { value: "reels", label: "Instagram Reels (9:16)" },
    { value: "youtube_shorts", label: "YouTube Shorts (9:16)" },
    { value: "youtube_main", label: "YouTube Main (16:9)" },
    { value: "feed_square", label: "Feed Post (1:1)" },
  ],
  grokPlan: {
    en: [
      { value: "free", label: "🆓 Grok Free (6s per clip)" },
      { value: "pro", label: "⭐ Grok Pro (10s per clip)" },
    ],
    zh: [
      { value: "free", label: "🆓 Grok 免费版（每片段6秒）" },
      { value: "pro", label: "⭐ Grok Pro（每片段10秒）" },
    ],
    bm: [
      { value: "free", label: "🆓 Grok Percuma (6s setiap klip)" },
      { value: "pro", label: "⭐ Grok Pro (10s setiap klip)" },
    ],
  },
  productCategory: {
    en: [
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
    zh: [
      { value: "", label: "— 选择类别 —" },
      { value: "tech_gadget", label: "实体 — 科技产品" },
      { value: "consumer_good", label: "实体 — 消费品" },
      { value: "skincare", label: "实体 — 护肤/美妆" },
      { value: "vitamin_health", label: "实体 — 维生素/健康" },
      { value: "apparel", label: "实体 — 服装/时尚" },
      { value: "food_beverage", label: "实体 — 食品&饮料" },
      { value: "home_living", label: "实体 — 家居&生活" },
      { value: "software_app", label: "软件/应用" },
      { value: "service", label: "服务" },
      { value: "event_campaign", label: "活动/营销" },
      { value: "other", label: "其他 — 请在下方填写" },
    ],
    bm: [
      { value: "", label: "— Pilih kategori —" },
      { value: "tech_gadget", label: "Fizikal — alat teknologi" },
      { value: "consumer_good", label: "Fizikal — barangan pengguna" },
      { value: "skincare", label: "Fizikal — penjagaan kulit / kecantikan" },
      { value: "vitamin_health", label: "Fizikal — vitamin / kesihatan" },
      { value: "apparel", label: "Fizikal — pakaian / fesyen" },
      { value: "food_beverage", label: "Fizikal — makanan & minuman" },
      { value: "home_living", label: "Fizikal — rumah & kehidupan" },
      { value: "software_app", label: "Perisian / aplikasi" },
      { value: "service", label: "Perkhidmatan" },
      { value: "event_campaign", label: "Acara / kempen" },
      { value: "other", label: "Lain-lain — taip di bawah" },
    ],
  },
  targetAudience: {
    en: [
      { value: "students", label: "Students" },
      { value: "young_professionals", label: "Young professionals" },
      { value: "remote_workers", label: "Remote workers" },
      { value: "gamers", label: "Gamers" },
      { value: "business_exec", label: "Business users" },
      { value: "homemakers", label: "Homemakers" },
      { value: "parents", label: "Parents" },
      { value: "general", label: "General audience" },
    ],
    zh: [
      { value: "students", label: "学生" },
      { value: "young_professionals", label: "年轻职场人士" },
      { value: "remote_workers", label: "远程工作者" },
      { value: "gamers", label: "游戏玩家" },
      { value: "business_exec", label: "商务用户" },
      { value: "homemakers", label: "家庭主妇/主夫" },
      { value: "parents", label: "父母" },
      { value: "general", label: "大众受众" },
    ],
    bm: [
      { value: "students", label: "Pelajar" },
      { value: "young_professionals", label: "Profesional muda" },
      { value: "remote_workers", label: "Pekerja jauh" },
      { value: "gamers", label: "Gamer" },
      { value: "business_exec", label: "Pengguna perniagaan" },
      { value: "homemakers", label: "Suri rumah" },
      { value: "parents", label: "Ibu bapa" },
      { value: "general", label: "Audiens umum" },
    ],
  },
  videoStyle: {
    en: [
      { value: "ugc", label: "UGC — authentic, shot-on-phone" },
      { value: "commercial", label: "Commercial — polished, studio-lite" },
      { value: "lifestyle", label: "Lifestyle — candid, everyday" },
      { value: "tutorial", label: "Tutorial / How-to" },
      { value: "testimonial", label: "Testimonial — talking to camera" },
      { value: "unboxing", label: "Unboxing — reveal & first impression" },
      { value: "animated", label: "Animated / motion graphic" },
      { value: "minimal_clean", label: "Minimal, clean, modern" },
    ],
    zh: [
      { value: "ugc", label: "UGC — 真实感，手机拍摄" },
      { value: "commercial", label: "商业广告 — 精致，轻商业" },
      { value: "lifestyle", label: "生活方式 — 随性，日常" },
      { value: "tutorial", label: "教程 / 操作说明" },
      { value: "testimonial", label: "见证式 — 对着镜头讲话" },
      { value: "unboxing", label: "开箱 — 揭秘与第一印象" },
      { value: "animated", label: "动画 / 动态图形" },
      { value: "minimal_clean", label: "简洁，干净，现代" },
    ],
    bm: [
      { value: "ugc", label: "UGC — autentik, rakaman telefon" },
      { value: "commercial", label: "Komersial — halus, studio-lite" },
      { value: "lifestyle", label: "Gaya hidup — candid, harian" },
      { value: "tutorial", label: "Tutorial / Cara-cara" },
      { value: "testimonial", label: "Testimoni — bercakap ke kamera" },
      { value: "unboxing", label: "Unboxing — pendedahan & kesan pertama" },
      { value: "animated", label: "Animasi / grafik bergerak" },
      { value: "minimal_clean", label: "Minimalis, bersih, moden" },
    ],
  },
  tone: {
    en: [
      { value: "calm_warm", label: "Calm & warm" },
      { value: "energetic", label: "Energetic & upbeat" },
      { value: "trustworthy", label: "Trustworthy" },
      { value: "friendly", label: "Friendly" },
      { value: "professional", label: "Professional" },
      { value: "fun_playful", label: "Fun & playful" },
      { value: "inspirational", label: "Inspirational" },
      { value: "relatable", label: "Relatable & everyday" },
    ],
    zh: [
      { value: "calm_warm", label: "平静温暖" },
      { value: "energetic", label: "充满活力" },
      { value: "trustworthy", label: "值得信赖" },
      { value: "friendly", label: "亲切友好" },
      { value: "professional", label: "专业" },
      { value: "fun_playful", label: "有趣活泼" },
      { value: "inspirational", label: "励志感人" },
      { value: "relatable", label: "贴近生活" },
    ],
    bm: [
      { value: "calm_warm", label: "Tenang & mesra" },
      { value: "energetic", label: "Bertenaga & ceria" },
      { value: "trustworthy", label: "Boleh dipercayai" },
      { value: "friendly", label: "Mesra" },
      { value: "professional", label: "Profesional" },
      { value: "fun_playful", label: "Seronok & playful" },
      { value: "inspirational", label: "Inspirasi" },
      { value: "relatable", label: "Mudah dikaitkan & harian" },
    ],
  },
  realism: {
    en: [
      { value: "realistic", label: "Realistic live-action" },
      { value: "stylized", label: "Stylized but realistic" },
      { value: "animated", label: "Cartoon / fully animated" },
    ],
    zh: [
      { value: "realistic", label: "写实真人拍摄" },
      { value: "stylized", label: "风格化但写实" },
      { value: "animated", label: "卡通 / 全动画" },
    ],
    bm: [
      { value: "realistic", label: "Aksi sebenar yang realistik" },
      { value: "stylized", label: "Bergaya tetapi realistik" },
      { value: "animated", label: "Kartun / animasi penuh" },
    ],
  },
  colorGrading: {
    en: [
      { value: "warm_golden", label: "Warm / golden hour" },
      { value: "cool_blue", label: "Cool / bluish tech" },
      { value: "neutral_natural", label: "Neutral / natural" },
      { value: "high_contrast", label: "High contrast / punchy" },
      { value: "soft_pastel", label: "Soft / pastel" },
    ],
    zh: [
      { value: "warm_golden", label: "暖色 / 黄金时段" },
      { value: "cool_blue", label: "冷色 / 科技蓝" },
      { value: "neutral_natural", label: "中性 / 自然" },
      { value: "high_contrast", label: "高对比 / 强烈" },
      { value: "soft_pastel", label: "柔和 / 粉彩" },
    ],
    bm: [
      { value: "warm_golden", label: "Hangat / waktu emas" },
      { value: "cool_blue", label: "Sejuk / teknologi kebiruan" },
      { value: "neutral_natural", label: "Neutral / semula jadi" },
      { value: "high_contrast", label: "Kontras tinggi / bertenaga" },
      { value: "soft_pastel", label: "Lembut / pastel" },
    ],
  },
  authenticity: {
    en: [
      { value: "natural_not_staged", label: "Natural, not staged" },
      { value: "real_user_video", label: "Looks like a real user's video" },
      { value: "casual_vlog", label: "Feels like a casual vlog" },
      { value: "polished_professional", label: "Polished and professional" },
    ],
    zh: [
      { value: "natural_not_staged", label: "自然，非刻意摆拍" },
      { value: "real_user_video", label: "看起来像真实用户的视频" },
      { value: "casual_vlog", label: "像随性的Vlog" },
      { value: "polished_professional", label: "精致专业" },
    ],
    bm: [
      { value: "natural_not_staged", label: "Semula jadi, tidak berlakon" },
      { value: "real_user_video", label: "Kelihatan seperti video pengguna sebenar" },
      { value: "casual_vlog", label: "Terasa seperti vlog santai" },
      { value: "polished_professional", label: "Halus dan profesional" },
    ],
  },
  settingPreset: {
    en: [
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
    zh: [
      { value: "", label: "— 选择预设 —" },
      { value: "home_kitchen", label: "家 — 厨房" },
      { value: "home_living", label: "家 — 客厅" },
      { value: "home_bedroom", label: "家 — 卧室" },
      { value: "home_outdoor", label: "家 — 户外/花园" },
      { value: "cafe", label: "咖啡馆" },
      { value: "office", label: "办公室/工作空间" },
      { value: "outdoor_urban", label: "户外 — 城市街道" },
      { value: "outdoor_nature", label: "户外 — 自然/公园" },
      { value: "gym", label: "健身房" },
      { value: "studio_neutral", label: "影棚 — 中性背景" },
      { value: "custom", label: "✏️ 自定义（在下方填写）" },
    ],
    bm: [
      { value: "", label: "— Pilih pratetap —" },
      { value: "home_kitchen", label: "Rumah — dapur" },
      { value: "home_living", label: "Rumah — ruang tamu" },
      { value: "home_bedroom", label: "Rumah — bilik tidur" },
      { value: "home_outdoor", label: "Rumah — luar/taman" },
      { value: "cafe", label: "Kafe / kedai kopi" },
      { value: "office", label: "Pejabat / ruang kerja" },
      { value: "outdoor_urban", label: "Luar — jalan bandar" },
      { value: "outdoor_nature", label: "Luar — alam semula jadi / taman" },
      { value: "gym", label: "Gim / ruang kecergasan" },
      { value: "studio_neutral", label: "Studio — latar belakang neutral" },
      { value: "custom", label: "✏️ Tersuai (taip di bawah)" },
    ],
  },
  lightingPreset: {
    en: [
      { value: "", label: "— Select preset —" },
      { value: "natural_day", label: "Natural daylight (bright, airy)" },
      { value: "golden_hour", label: "Golden hour / warm afternoon" },
      { value: "indoor_warm", label: "Indoor warm artificial light" },
      { value: "indoor_cool", label: "Indoor cool / neutral light" },
      { value: "studio_soft", label: "Studio soft box (clean, even)" },
      { value: "moody_low", label: "Moody low light (dramatic)" },
      { value: "custom", label: "✏️ Custom (type below)" },
    ],
    zh: [
      { value: "", label: "— 选择预设 —" },
      { value: "natural_day", label: "自然日光（明亮通透）" },
      { value: "golden_hour", label: "黄金时段 / 温暖下午" },
      { value: "indoor_warm", label: "室内暖色人工光" },
      { value: "indoor_cool", label: "室内冷色/中性光" },
      { value: "studio_soft", label: "影棚柔光（干净均匀）" },
      { value: "moody_low", label: "低调昏暗光（戏剧感）" },
      { value: "custom", label: "✏️ 自定义（在下方填写）" },
    ],
    bm: [
      { value: "", label: "— Pilih pratetap —" },
      { value: "natural_day", label: "Cahaya siang semula jadi (cerah, lapang)" },
      { value: "golden_hour", label: "Waktu emas / petang hangat" },
      { value: "indoor_warm", label: "Cahaya buatan dalam hangat" },
      { value: "indoor_cool", label: "Cahaya dalam sejuk / neutral" },
      { value: "studio_soft", label: "Soft box studio (bersih, sekata)" },
      { value: "moody_low", label: "Cahaya rendah dramatik" },
      { value: "custom", label: "✏️ Tersuai (taip di bawah)" },
    ],
  },
  bgActivity: {
    en: [
      { value: "calm_still", label: "Calm, almost no movement" },
      { value: "light_activity", label: "Light activity, not distracting" },
      { value: "busy_dynamic", label: "Busy / dynamic background" },
    ],
    zh: [
      { value: "calm_still", label: "平静，几乎没有动作" },
      { value: "light_activity", label: "轻微活动，不分散注意力" },
      { value: "busy_dynamic", label: "繁忙 / 动态背景" },
    ],
    bm: [
      { value: "calm_still", label: "Tenang, hampir tiada pergerakan" },
      { value: "light_activity", label: "Aktiviti ringan, tidak mengganggu" },
      { value: "busy_dynamic", label: "Sibuk / latar belakang dinamik" },
    ],
  },
  talent: {
    en: [
      { value: "solo_female", label: "Solo female (25–35)" },
      { value: "solo_male", label: "Solo male (25–35)" },
      { value: "solo_female_mature", label: "Solo female (40–55)" },
      { value: "solo_male_mature", label: "Solo male (40–55)" },
      { value: "couple", label: "Couple" },
      { value: "group_friends", label: "Group of friends" },
      { value: "family", label: "Family (adult + child)" },
      { value: "no_talent", label: "No talent — product only" },
    ],
    zh: [
      { value: "solo_female", label: "单人女性（25–35岁）" },
      { value: "solo_male", label: "单人男性（25–35岁）" },
      { value: "solo_female_mature", label: "单人女性（40–55岁）" },
      { value: "solo_male_mature", label: "单人男性（40–55岁）" },
      { value: "couple", label: "情侣" },
      { value: "group_friends", label: "朋友群体" },
      { value: "family", label: "家庭（成人+儿童）" },
      { value: "no_talent", label: "无演员 — 仅展示产品" },
    ],
    bm: [
      { value: "solo_female", label: "Perempuan solo (25–35)" },
      { value: "solo_male", label: "Lelaki solo (25–35)" },
      { value: "solo_female_mature", label: "Perempuan solo (40–55)" },
      { value: "solo_male_mature", label: "Lelaki solo (40–55)" },
      { value: "couple", label: "Pasangan" },
      { value: "group_friends", label: "Kumpulan kawan" },
      { value: "family", label: "Keluarga (dewasa + kanak-kanak)" },
      { value: "no_talent", label: "Tiada pelakon — produk sahaja" },
    ],
  },
  talentStyle: {
    en: [
      { value: "casual", label: "Casual" },
      { value: "smart_casual", label: "Smart casual" },
      { value: "modest", label: "Modest / conservative" },
      { value: "sporty", label: "Sporty / activewear" },
      { value: "professional", label: "Professional" },
      { value: "cultural", label: "Cultural / traditional" },
    ],
    zh: [
      { value: "casual", label: "休闲" },
      { value: "smart_casual", label: "时尚休闲" },
      { value: "modest", label: "端庄保守" },
      { value: "sporty", label: "运动风" },
      { value: "professional", label: "职业装" },
      { value: "cultural", label: "民族/传统服饰" },
    ],
    bm: [
      { value: "casual", label: "Kasual" },
      { value: "smart_casual", label: "Smart kasual" },
      { value: "modest", label: "Sopan / konservatif" },
      { value: "sporty", label: "Sukan / pakaian aktif" },
      { value: "professional", label: "Profesional" },
      { value: "cultural", label: "Budaya / tradisional" },
    ],
  },
  emotion: {
    en: [
      { value: "frustrated_stressed", label: "Frustrated / stressed" },
      { value: "focused", label: "Focused / concentrating" },
      { value: "happy_relieved", label: "Happy / relieved" },
      { value: "excited", label: "Excited" },
      { value: "calm_relaxed", label: "Calm / relaxed" },
      { value: "arc_frustrated_relieved", label: "Arc: frustrated → relieved" },
      { value: "arc_curious_impressed", label: "Arc: curious → impressed" },
      { value: "arc_neutral_excited", label: "Arc: neutral → excited" },
    ],
    zh: [
      { value: "frustrated_stressed", label: "沮丧 / 焦虑" },
      { value: "focused", label: "专注 / 集中" },
      { value: "happy_relieved", label: "开心 / 释然" },
      { value: "excited", label: "兴奋" },
      { value: "calm_relaxed", label: "平静 / 放松" },
      { value: "arc_frustrated_relieved", label: "弧线：沮丧 → 释然" },
      { value: "arc_curious_impressed", label: "弧线：好奇 → 印象深刻" },
      { value: "arc_neutral_excited", label: "弧线：平淡 → 兴奋" },
    ],
    bm: [
      { value: "frustrated_stressed", label: "Kecewa / tertekan" },
      { value: "focused", label: "Fokus / menumpukan" },
      { value: "happy_relieved", label: "Gembira / lega" },
      { value: "excited", label: "Teruja" },
      { value: "calm_relaxed", label: "Tenang / relaks" },
      { value: "arc_frustrated_relieved", label: "Lengkok: kecewa → lega" },
      { value: "arc_curious_impressed", label: "Lengkok: ingin tahu → terkesan" },
      { value: "arc_neutral_excited", label: "Lengkok: neutral → teruja" },
    ],
  },
  shotType: {
    en: [
      { value: "close_up", label: "Close-up" },
      { value: "medium_shot", label: "Medium shot (waist up)" },
      { value: "wide_shot", label: "Wide shot (full body + env)" },
      { value: "product_closeup", label: "Product close-up" },
    ],
    zh: [
      { value: "close_up", label: "特写" },
      { value: "medium_shot", label: "中景（腰部以上）" },
      { value: "wide_shot", label: "远景（全身+环境）" },
      { value: "product_closeup", label: "产品特写" },
    ],
    bm: [
      { value: "close_up", label: "Close-up" },
      { value: "medium_shot", label: "Tembakan sederhana (pinggang ke atas)" },
      { value: "wide_shot", label: "Tembakan lebar (seluruh badan + persekitaran)" },
      { value: "product_closeup", label: "Close-up produk" },
    ],
  },
  cameraAngle: {
    en: [
      { value: "eye_level", label: "Eye-level" },
      { value: "slight_high", label: "Slight high angle" },
      { value: "slight_low", label: "Slight low angle" },
      { value: "top_down", label: "Top-down" },
    ],
    zh: [
      { value: "eye_level", label: "平视角" },
      { value: "slight_high", label: "略高俯角" },
      { value: "slight_low", label: "略低仰角" },
      { value: "top_down", label: "俯拍" },
    ],
    bm: [
      { value: "eye_level", label: "Paras mata" },
      { value: "slight_high", label: "Sudut tinggi sedikit" },
      { value: "slight_low", label: "Sudut rendah sedikit" },
      { value: "top_down", label: "Dari atas ke bawah" },
    ],
  },
  cameraMove: {
    en: [
      { value: "static", label: "Mostly static" },
      { value: "gentle_handheld", label: "Gentle handheld" },
      { value: "slow_push_in", label: "Slow push-in" },
      { value: "slow_pull_back", label: "Slow pull-back" },
      { value: "pan_follow", label: "Pan / follow subject" },
      { value: "mixed", label: "Mixed" },
    ],
    zh: [
      { value: "static", label: "基本静止" },
      { value: "gentle_handheld", label: "轻微手持" },
      { value: "slow_push_in", label: "缓慢推进" },
      { value: "slow_pull_back", label: "缓慢后拉" },
      { value: "pan_follow", label: "摇镜/跟拍主体" },
      { value: "mixed", label: "混合" },
    ],
    bm: [
      { value: "static", label: "Kebanyakannya statik" },
      { value: "gentle_handheld", label: "Genggaman tangan lembut" },
      { value: "slow_push_in", label: "Tolak masuk perlahan" },
      { value: "slow_pull_back", label: "Tarik balik perlahan" },
      { value: "pan_follow", label: "Pan / ikut subjek" },
      { value: "mixed", label: "Campuran" },
    ],
  },
  heroAngle: {
    en: [
      { value: "", label: "— Select —" },
      { value: "45_elevated", label: "45° elevated (recommended)" },
      { value: "eye_level", label: "Eye-level straight-on" },
      { value: "top_down", label: "Top-down / flat-lay" },
      { value: "low_angle", label: "Low angle (prestige)" },
      { value: "close_up_detail", label: "Close-up on key detail" },
    ],
    zh: [
      { value: "", label: "— 选择 —" },
      { value: "45_elevated", label: "45°仰角（推荐）" },
      { value: "eye_level", label: "平视正面" },
      { value: "top_down", label: "俯拍 / 平铺" },
      { value: "low_angle", label: "低角度（高级感）" },
      { value: "close_up_detail", label: "关键细节特写" },
    ],
    bm: [
      { value: "", label: "— Pilih —" },
      { value: "45_elevated", label: "45° tinggi (disyorkan)" },
      { value: "eye_level", label: "Paras mata terus" },
      { value: "top_down", label: "Dari atas / flat-lay" },
      { value: "low_angle", label: "Sudut rendah (prestij)" },
      { value: "close_up_detail", label: "Close-up pada butiran utama" },
    ],
  },
  productFraming: {
    en: [
      { value: "fully_visible", label: "Product fully visible" },
      { value: "centered", label: "Product centered" },
      { value: "rule_of_thirds", label: "Rule of thirds" },
      { value: "bg_blurred", label: "Background blurred, product sharp" },
    ],
    zh: [
      { value: "fully_visible", label: "产品完整可见" },
      { value: "centered", label: "产品居中" },
      { value: "rule_of_thirds", label: "三分法构图" },
      { value: "bg_blurred", label: "背景虚化，产品清晰" },
    ],
    bm: [
      { value: "fully_visible", label: "Produk kelihatan sepenuhnya" },
      { value: "centered", label: "Produk di tengah" },
      { value: "rule_of_thirds", label: "Peraturan sepertiga" },
      { value: "bg_blurred", label: "Latar kabur, produk tajam" },
    ],
  },
  subjectMotion: {
    en: [
      { value: "typing_clicking", label: "Typing / clicking" },
      { value: "looking_around", label: "Looking around stressed, then relaxing" },
      { value: "picking_up_product", label: "Picking up & using product" },
      { value: "pointing_at_screen", label: "Pointing at screen" },
      { value: "walking_moving", label: "Walking / moving naturally" },
    ],
    zh: [
      { value: "typing_clicking", label: "打字 / 点击" },
      { value: "looking_around", label: "焦虑地环顾四周，然后放松" },
      { value: "picking_up_product", label: "拿起并使用产品" },
      { value: "pointing_at_screen", label: "指向屏幕" },
      { value: "walking_moving", label: "自然走动" },
    ],
    bm: [
      { value: "typing_clicking", label: "Menaip / mengklik" },
      { value: "looking_around", label: "Melihat sekeliling dengan tekanan, kemudian relaks" },
      { value: "picking_up_product", label: "Mengambil & menggunakan produk" },
      { value: "pointing_at_screen", label: "Menunjuk ke skrin" },
      { value: "walking_moving", label: "Berjalan / bergerak secara semula jadi" },
    ],
  },
  productInteraction: {
    en: [
      { value: "plug_in", label: "Plug into laptop / phone" },
      { value: "turn_on", label: "Turn product on" },
      { value: "drag_windows", label: "Drag apps / windows onto screen" },
      { value: "hold_in_hand", label: "Hold in hand while moving" },
      { value: "unbox_reveal", label: "Unbox / reveal product" },
      { value: "apply_use", label: "Apply / use on skin / body" },
    ],
    zh: [
      { value: "plug_in", label: "插入笔记本/手机" },
      { value: "turn_on", label: "开启产品" },
      { value: "drag_windows", label: "将应用/窗口拖到屏幕上" },
      { value: "hold_in_hand", label: "边走边手持" },
      { value: "unbox_reveal", label: "开箱/揭示产品" },
      { value: "apply_use", label: "涂抹/在皮肤/身体上使用" },
    ],
    bm: [
      { value: "plug_in", label: "Pasang ke laptop / telefon" },
      { value: "turn_on", label: "Hidupkan produk" },
      { value: "drag_windows", label: "Seret apl / tetingkap ke skrin" },
      { value: "hold_in_hand", label: "Pegang di tangan semasa bergerak" },
      { value: "unbox_reveal", label: "Unbox / dedahkan produk" },
      { value: "apply_use", label: "Sapu / guna pada kulit / badan" },
    ],
  },
  emotionalArc: {
    en: [
      { value: "frustrated_relieved", label: "Frustrated → relieved" },
      { value: "curious_impressed", label: "Curious → impressed" },
      { value: "neutral_excited", label: "Neutral → excited" },
      { value: "calm_confident", label: "Calm → confident" },
    ],
    zh: [
      { value: "frustrated_relieved", label: "沮丧 → 释然" },
      { value: "curious_impressed", label: "好奇 → 印象深刻" },
      { value: "neutral_excited", label: "平淡 → 兴奋" },
      { value: "calm_confident", label: "平静 → 自信" },
    ],
    bm: [
      { value: "frustrated_relieved", label: "Kecewa → lega" },
      { value: "curious_impressed", label: "Ingin tahu → terkesan" },
      { value: "neutral_excited", label: "Neutral → teruja" },
      { value: "calm_confident", label: "Tenang → yakin" },
    ],
  },
  endingFrame: {
    en: [
      { value: "hero_product", label: "Hero product shot" },
      { value: "user_happy", label: "User happily using product" },
      { value: "product_branding", label: "Product + subtle branding" },
      { value: "cta_frame", label: "CTA-focused final frame" },
    ],
    zh: [
      { value: "hero_product", label: "产品主镜头" },
      { value: "user_happy", label: "用户愉快使用产品" },
      { value: "product_branding", label: "产品+subtle品牌" },
      { value: "cta_frame", label: "以CTA为重点的最终帧" },
    ],
    bm: [
      { value: "hero_product", label: "Tembakan hero produk" },
      { value: "user_happy", label: "Pengguna gembira menggunakan produk" },
      { value: "product_branding", label: "Produk + jenama halus" },
      { value: "cta_frame", label: "Bingkai akhir berfokus CTA" },
    ],
  },
  hooks: {
    en: [
      { value: "question", label: "Open with a question" },
      { value: "bold_claim", label: "Bold claim / statement" },
      { value: "problem_agitate", label: "Problem → agitate → solve" },
      { value: "reveal", label: "Unexpected reveal" },
      { value: "social_proof", label: "Social proof opener" },
      { value: "before_after", label: "Before & after contrast" },
      { value: "pov", label: "POV (point-of-view) shot" },
    ],
    zh: [
      { value: "question", label: "以问题开场" },
      { value: "bold_claim", label: "大胆声明/陈述" },
      { value: "problem_agitate", label: "问题 → 激化 → 解决" },
      { value: "reveal", label: "意外揭示" },
      { value: "social_proof", label: "社会证明开场" },
      { value: "before_after", label: "前后对比" },
      { value: "pov", label: "第一视角镜头" },
    ],
    bm: [
      { value: "question", label: "Buka dengan soalan" },
      { value: "bold_claim", label: "Dakwaan / kenyataan berani" },
      { value: "problem_agitate", label: "Masalah → galakkan → selesai" },
      { value: "reveal", label: "Pendedahan mengejut" },
      { value: "social_proof", label: "Pembuka bukti sosial" },
      { value: "before_after", label: "Kontras sebelum & selepas" },
      { value: "pov", label: "Tembakan POV (sudut pandang)" },
    ],
  },
  cta: {
    en: [
      { value: "shop_link", label: "Shop via link in bio" },
      { value: "comment", label: "Comment for more info" },
      { value: "follow", label: "Follow for more" },
      { value: "save_post", label: "Save this post" },
      { value: "try_it", label: "Try it yourself" },
      { value: "visit_website", label: "Visit website" },
      { value: "sign_up", label: "Sign up now" },
      { value: "no_cta", label: "No explicit CTA" },
    ],
    zh: [
      { value: "shop_link", label: "通过简介链接购买" },
      { value: "comment", label: "评论获取更多信息" },
      { value: "follow", label: "关注以获取更多" },
      { value: "save_post", label: "收藏此帖子" },
      { value: "try_it", label: "自己试试" },
      { value: "visit_website", label: "访问网站" },
      { value: "sign_up", label: "立即注册" },
      { value: "no_cta", label: "无明确CTA" },
    ],
    bm: [
      { value: "shop_link", label: "Beli melalui pautan di bio" },
      { value: "comment", label: "Komen untuk maklumat lanjut" },
      { value: "follow", label: "Ikuti untuk lebih banyak" },
      { value: "save_post", label: "Simpan siaran ini" },
      { value: "try_it", label: "Cuba sendiri" },
      { value: "visit_website", label: "Lawati laman web" },
      { value: "sign_up", label: "Daftar sekarang" },
      { value: "no_cta", label: "Tiada CTA yang jelas" },
    ],
  },
  audioType: {
    en: [
      { value: "silent", label: "No audio (silent)" },
      { value: "ambient_only", label: "Natural ambient sound only" },
      { value: "vo_only", label: "Voiceover only" },
      { value: "ambient_vo", label: "Ambient + voiceover" },
    ],
    zh: [
      { value: "silent", label: "无音频（静音）" },
      { value: "ambient_only", label: "仅自然环境音" },
      { value: "vo_only", label: "仅配音" },
      { value: "ambient_vo", label: "环境音+配音" },
    ],
    bm: [
      { value: "silent", label: "Tiada audio (senyap)" },
      { value: "ambient_only", label: "Bunyi ambien semula jadi sahaja" },
      { value: "vo_only", label: "Suara latar sahaja" },
      { value: "ambient_vo", label: "Ambien + suara latar" },
    ],
  },
  voLang: {
    en: [
      { value: "", label: "— Select —" },
      { value: "english", label: "English" },
      { value: "bm", label: "Bahasa Malaysia" },
      { value: "mandarin", label: "Mandarin" },
      { value: "tamil", label: "Tamil" },
      { value: "codemix_bm_en", label: "BM + English (code-switch)" },
      { value: "none", label: "No voiceover (visual only)" },
    ],
    zh: [
      { value: "", label: "— 选择 —" },
      { value: "english", label: "英语" },
      { value: "bm", label: "马来语" },
      { value: "mandarin", label: "普通话" },
      { value: "tamil", label: "泰米尔语" },
      { value: "codemix_bm_en", label: "马来语+英语（混搭）" },
      { value: "none", label: "无配音（纯视觉）" },
    ],
    bm: [
      { value: "", label: "— Pilih —" },
      { value: "english", label: "Bahasa Inggeris" },
      { value: "bm", label: "Bahasa Malaysia" },
      { value: "mandarin", label: "Mandarin" },
      { value: "tamil", label: "Tamil" },
      { value: "codemix_bm_en", label: "BM + Inggeris (code-switch)" },
      { value: "none", label: "Tiada suara latar (visual sahaja)" },
    ],
  },
  speechType: {
    en: [
      { value: "no_speech", label: "No one speaking on camera" },
      { value: "on_camera", label: "Subject speaking on camera" },
      { value: "offscreen_vo", label: "Off-screen voiceover only" },
    ],
    zh: [
      { value: "no_speech", label: "镜头前无人说话" },
      { value: "on_camera", label: "主体对着镜头说话" },
      { value: "offscreen_vo", label: "仅画外音配音" },
    ],
    bm: [
      { value: "no_speech", label: "Tiada yang bercakap di kamera" },
      { value: "on_camera", label: "Subjek bercakap di kamera" },
      { value: "offscreen_vo", label: "Suara latar luar skrin sahaja" },
    ],
  },
  bgMusic: {
    en: [
      { value: "no_music", label: "No music" },
      { value: "soft_bg", label: "Soft background music" },
      { value: "upbeat", label: "Upbeat background music" },
      { value: "dramatic", label: "Dramatic / cinematic music" },
    ],
    zh: [
      { value: "no_music", label: "无音乐" },
      { value: "soft_bg", label: "轻柔背景音乐" },
      { value: "upbeat", label: "欢快背景音乐" },
      { value: "dramatic", label: "戏剧性/电影感音乐" },
    ],
    bm: [
      { value: "no_music", label: "Tiada muzik" },
      { value: "soft_bg", label: "Muzik latar lembut" },
      { value: "upbeat", label: "Muzik latar ceria" },
      { value: "dramatic", label: "Muzik dramatik / sinematik" },
    ],
  },
  frameRate: {
    en: [
      { value: "24fps", label: "24fps — cinematic" },
      { value: "30fps", label: "30fps — standard" },
      { value: "60fps", label: "60fps — very smooth" },
    ],
    zh: [
      { value: "24fps", label: "24fps — 电影感" },
      { value: "30fps", label: "30fps — 标准" },
      { value: "60fps", label: "60fps — 非常流畅" },
    ],
    bm: [
      { value: "24fps", label: "24fps — sinematik" },
      { value: "30fps", label: "30fps — standard" },
      { value: "60fps", label: "60fps — sangat lancar" },
    ],
  },
  resolution: {
    en: [
      { value: "1080p", label: "1080p Full HD" },
      { value: "1440p", label: "1440p" },
      { value: "720p", label: "720p" },
      { value: "best", label: "Best quality available" },
    ],
    zh: [
      { value: "1080p", label: "1080p 全高清" },
      { value: "1440p", label: "1440p" },
      { value: "720p", label: "720p" },
      { value: "best", label: "最高可用画质" },
    ],
    bm: [
      { value: "1080p", label: "1080p Full HD" },
      { value: "1440p", label: "1440p" },
      { value: "720p", label: "720p" },
      { value: "best", label: "Kualiti terbaik yang tersedia" },
    ],
  },
  depthOfField: {
    en: [
      { value: "subject_sharp_bg_blur", label: "Subject & product sharp, BG slightly blurred" },
      { value: "everything_sharp", label: "Everything in focus" },
      { value: "product_sharp", label: "Product sharp, BG blurred" },
    ],
    zh: [
      { value: "subject_sharp_bg_blur", label: "主体和产品清晰，背景略微虚化" },
      { value: "everything_sharp", label: "全部清晰对焦" },
      { value: "product_sharp", label: "产品清晰，背景虚化" },
    ],
    bm: [
      { value: "subject_sharp_bg_blur", label: "Subjek & produk tajam, latar sedikit kabur" },
      { value: "everything_sharp", label: "Semua dalam fokus" },
      { value: "product_sharp", label: "Produk tajam, latar kabur" },
    ],
  },
  antiHallucination: {
    en: [
      { value: "no_extra_limbs", label: "No extra limbs / fingers" },
      { value: "no_warped_faces", label: "No warped faces" },
      { value: "no_floating_objects", label: "No floating objects" },
      { value: "no_random_ui", label: "No random UI / screens floating" },
      { value: "no_fictional_features", label: "No fictional product features" },
    ],
    zh: [
      { value: "no_extra_limbs", label: "无多余肢体/手指" },
      { value: "no_warped_faces", label: "无扭曲面孔" },
      { value: "no_floating_objects", label: "无漂浮物体" },
      { value: "no_random_ui", label: "无随机浮动的UI/屏幕" },
      { value: "no_fictional_features", label: "无虚构产品功能" },
    ],
    bm: [
      { value: "no_extra_limbs", label: "Tiada anggota / jari tambahan" },
      { value: "no_warped_faces", label: "Tiada muka yang herot" },
      { value: "no_floating_objects", label: "Tiada objek terapung" },
      { value: "no_random_ui", label: "Tiada UI / skrin terapung rawak" },
      { value: "no_fictional_features", label: "Tiada ciri produk rekaan" },
    ],
  },
  restrictions: {
    en: [
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
    zh: [
      { value: "no_text_overlay", label: "无文字叠加" },
      { value: "no_effects", label: "无人工特效" },
      { value: "no_exaggerated_acting", label: "无夸张表演" },
      { value: "no_influencer_vibe", label: "无网红风格" },
      { value: "no_branded_bg", label: "背景无品牌物品" },
      { value: "no_children", label: "画面中无儿童" },
      { value: "halal_visual", label: "视觉符合清真要求" },
      { value: "no_male_talent", label: "无男性演员" },
      { value: "no_competitor", label: "无竞争对手产品" },
      { value: "match_reference", label: "产品必须与参考图像一致" },
      { value: "no_logo_change", label: "不得更改Logo" },
    ],
    bm: [
      { value: "no_text_overlay", label: "Tiada teks tindanan" },
      { value: "no_effects", label: "Tiada kesan buatan" },
      { value: "no_exaggerated_acting", label: "Tiada lakonan berlebihan" },
      { value: "no_influencer_vibe", label: "Tiada gaya influencer" },
      { value: "no_branded_bg", label: "Tiada item berjenama di latar" },
      { value: "no_children", label: "Tiada kanak-kanak dalam bingkai" },
      { value: "halal_visual", label: "Patuh halal secara visual" },
      { value: "no_male_talent", label: "Tiada pelakon lelaki" },
      { value: "no_competitor", label: "Tiada produk pesaing" },
      { value: "match_reference", label: "Produk mesti sepadan dengan imej rujukan" },
      { value: "no_logo_change", label: "Tiada perubahan pada logo" },
    ],
  },
};

const init = {
  campaignName: "",
  platform: "tiktok", grokPlan: "free", totalDuration: "12",
  funnel: "",
  productName: "", productCategory: "", productCategoryCustom: "",
  keyColors: "", keyFeaturesCustom: "", usp: "", productRules: "",
  targetAudience: [],
  videoStyle: "", tone: [], realism: "", colorGrading: [], authenticity: "",
  settingPreset: "", settingCustom: "", settingDetail: "", bgActivity: "",
  lightingPreset: "", lightingCustom: "",
  talent: "", talentStyle: [], talentDetail: "", emotion: [],
  shotType: [], cameraAngle: "", cameraMove: "", heroAngle: "", productFraming: [],
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
const settingLabel = (f, lang = "en") => { if (f.settingPreset === "custom") return f.settingCustom || "Custom location"; return o("settingPreset", lang).find(x => x.value === f.settingPreset)?.label || "Not specified"; };
const lightingLabel = (f, lang = "en") => { if (f.lightingPreset === "custom") return f.lightingCustom || "Custom lighting"; return o("lightingPreset", lang).find(x => x.value === f.lightingPreset)?.label || "Natural daylight"; };
const optLabel = (opts, val) => (Array.isArray(opts) ? opts : []).find(o => o.value === val)?.label || val || "";
const chipsLabel = (opts, vals) => (Array.isArray(vals) ? vals : []).map(v => optLabel(opts, v)).filter(Boolean).join(", ");
const productCatOpts = (lang) => OPTS.productCategory[lang] || OPTS.productCategory.en;
const productCatLabel = (f, lang) => {
  if (f.productCategory === "other") return f.productCategoryCustom || "";
  return optLabel(productCatOpts(lang), f.productCategory);
};

// ── File → base64 ──────────────────────────────────────────────────────────
const fileToBase64 = file => new Promise((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve({ data: r.result.split(",")[1], mimeType: file.type });
  r.onerror = reject;
  r.readAsDataURL(file);
});

// ── Build Gemini first frame prompt (always English for best image quality) ─
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
const buildClipPrompts = (f, storyline, hasFirstFrame, lang) => {
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
    const cleanBeat = rawBeat.replace(/^\d+\.\s*\[?(HOOK|CONTENT|CTA|钩子|内容|KANDUNGAN)[^\]]*\]?\s*/i, "").trim();
    const sceneBeat = cleanBeat ||
      (clipRole.role.includes("HOOK") || clipRole.role.includes("钩子") || clipRole.role.includes("HOOK") ? `Hook — ${f.problemStatement || "show relatable problem or pattern interrupt"}` :
       (clipRole.role === "CTA" || clipRole.role === "CTA") ? `CTA close — ${ctaLabel || "hero shot of product, drive action"}` :
       `Content — demonstrate: ${f.keyBenefit || f.keyFeaturesCustom}`);

    const hookDir = (clipRole.role.includes("HOOK") || clipRole.role.includes("钩子") || clipRole.role.includes("HOOK"))
      ? `\n🎣 HOOK DIRECTION\n• Hook strategy: ${chipsLabel(o("hooks",lang), f.hook) || "pattern interrupt"}\n• First 1–2 seconds must STOP THE SCROLL — no slow intros\n• ${fd.hook}${hasFirstFrame ? "\n• Animate naturally from your first frame reference image" : ""}` : "";
    const contentDir = (clipRole.role.includes("CONTENT") || clipRole.role.includes("内容") || clipRole.role.includes("KANDUNGAN"))
      ? `\n📖 CONTENT DIRECTION\n• Key benefit to show: ${f.keyBenefit || f.keyFeaturesCustom}\n• ${fd.content}\n• Emotional beat: viewer should feel ${f.funnel === "upper" ? "curious and intrigued" : f.funnel === "middle" ? "understood and convinced" : "excited and ready to buy"}` : "";
    const ctaDir = (clipRole.role === "CTA" || clipRole.role.includes("CTA"))
      ? `\n📢 CTA DIRECTION\n• Action: ${ctaLabel}${heroOpt?.label ? "\n• End on clean hero shot: " + heroOpt.label + " — product centered" : ""}\n• ${fd.cta}\n• Last 1–2 seconds must feel conclusive — not abrupt` : "";

    clips.push({
      label: `CLIP ${clipNum} of ${numClips}`,
      role: clipRole.role, tag: clipRole.tag,
      timing: `${startSec}s – ${endSec}s (${actualDur}s)`,
      prompt: `═══════════════════════════════════
🎬 GROK VIDEO PROMPT — CLIP ${clipNum}/${numClips}
${f.grokPlan === "pro" ? "⭐ Grok Pro" : "🆓 Grok Free"} | ${actualDur}s | Timeline: ${startSec}s–${endSec}s
${clipRole.tag} ROLE: ${clipRole.role}
${clipRole.desc}
${hasFirstFrame ? "🖼 IMAGE-TO-VIDEO MODE — upload first frame image to Grok" : "📝 TEXT-ONLY MODE"}
═══════════════════════════════════

${baseContextLines}

━━━ SCENE BEAT ━━━
${sceneBeat}
${hookDir}${contentDir}${ctaDir}

${f.audioType && f.voLang && f.voLang !== "none" ? `VOICEOVER SCRIPT GUIDE:${f.customVO ? "\n" + f.customVO : " (none provided)"}` : ""}
${clipNum < numClips ? `\n⚡ CONTINUITY: Stitch with Clip ${clipNum + 1}. End on a clean frame — avoid abrupt cuts.` : ""}

❗ OVERALL: Authentic, natural, purposeful. Not staged. Not an ad — even if it is one.
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
STRICT FORMAT: Return ONLY a numbered list. Each line MUST start with role in brackets: [HOOK], [CONTENT], [CTA], or combined.
Format: "1. [ROLE] <visual scene description>"
Each description: camera angle + what happens visually + emotional beat. Be specific.${t.storylineLangInstruction}`,
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
    setStoryline((data.content?.find(b => b.type === "text")?.text || "").trim());
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
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.error?.message || data.error || "Generation failed");
    setImage({ data: data.imageData, mimeType: data.mimeType });
    setLoading(false);
  } catch (e) {
    setError(e.message || "Could not generate image. Please try again.");
    setLoading(false);
  }
};

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [lang, setLang] = useState("en");
  const [f, setF] = useState(init);
  const [tab, setTab] = useState("builder");
  const [clips, setClips] = useState([]);
  const [storyline, setStoryline] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const outputRef = useRef(null);

  const [productFile, setProductFile] = useState(null);
  const [talentFile, setTalentFile] = useState(null);
  const [frameLoading, setFrameLoading] = useState(false);
  const [frameError, setFrameError] = useState("");
  const [generatedImage, setGeneratedImage] = useState(null);

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

  const generate = (withFrame) => {
    const result = buildClipPrompts(f, storyline, withFrame && hasFirstFrame, lang);
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
          <LangSelector lang={lang} setLang={setLang} />
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-gray-200 bg-white px-4">
        {[["builder", t.tabBuilder], ["output", t.tabOutput]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-all ${tab === v ? "border-blue-500 text-blue-600" : "border-transparent text-gray-400"}`}>
            {l}{v === "output" && clips.length > 0 ? ` (${clips.length})` : ""}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
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
              onClick={() => fetchStoryline(f, lang, setAiLoading, setStoryline, setAiError)}
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
                  {frameLoading ? t.btnGenerating : generatedImage ? t.btnRegenerateFrame : t.btnGenerateFrame}
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

            <div className="flex gap-3">
              <button
                onClick={() => generate(false)}
                disabled={missingRequired}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${missingRequired ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600 active:scale-95"}`}>
                {t.btnTextOnly}
              </button>

              <button
                onClick={() => generate(true)}
                disabled={missingRequired || !hasFirstFrame}
                title={!hasFirstFrame ? t.hintImageVideoUnlocks : ""}
                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border-2 ${
                  missingRequired || !hasFirstFrame
                    ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                    : "bg-indigo-500 text-white border-indigo-500 hover:bg-indigo-600 active:scale-95"
                }`}>
                {hasFirstFrame ? `${t.btnImageVideo} ✅` : t.btnImageVideo}
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
