const fs = require('fs');

const newHistoryTab = `import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const HistoryTab = ({
  soraHistory, historyLoading, loadSoraHistory,
  setTab, setSoraGeneratedPrompt, setSoraStep, setSoraVideoConfig,
  resumeInProgressJobs, t, user,
}) => {
  const [grokHistory, setGrokHistory] = useState([]);
  const [grokLoading, setGrokLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    loadSoraHistory();
    loadGrokHistory();
  }, []);

  const loadGrokHistory = async () => {
    if (!user) return;
    setGrokLoading(true);
    const { data } = await supabase
      .from("grok_generations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setGrokHistory(data || []);
    setGrokLoading(false);
  };

  const handleRefresh = () => {
    loadSoraHistory();
    loadGrokHistory();
  };

  // Merge and sort all videos by date
  const allVideos = [
    ...(soraHistory || []).map(v => ({ ...v, source: "sora" })),
    ...(grokHistory || []).map(v => ({ ...v, source: "grok" })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const filteredVideos = activeFilter === "all" ? allVideos
    : activeFilter === "grok" ? allVideos.filter(v => v.source === "grok")
    : allVideos.filter(v => v.source === "sora");

  const isLoading = historyLoading || grokLoading;

  return (
    <div className="pb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-bold text-gray-800">Generated Videos</h2>
          <p className="text-xs text-gray-400 mt-0.5">All your AI-generated videos</p>
        </div>
        <button onClick={handleRefresh}
          className="text-xs text-indigo-500 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50 transition-all">
          🔄 Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {[["all", "All Videos"], ["sora", "🎬 Create Video"], ["grok", "🎥 Grok"]].map(([val, label]) => (
          <button key={val} onClick={() => setActiveFilter(val)}
            className={\`px-3 py-1.5 rounded-lg text-xs font-medium transition-all \${activeFilter === val
              ? "bg-indigo-500 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"}\`}>
            {label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="text-center py-8 text-gray-400 text-sm flex items-center justify-center gap-2">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          Loading history…
        </div>
      )}

      {!isLoading && filteredVideos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-3xl mb-3">🎬</p>
          <p className="text-sm text-gray-500">No videos generated yet</p>
          <p className="text-xs text-gray-400 mt-1">Your generated videos will appear here</p>
          <button onClick={() => setTab("sora")}
            className="mt-4 px-4 py-2 rounded-lg bg-indigo-50 text-indigo-500 text-sm font-medium hover:bg-indigo-100 transition-all">
            Generate your first video →
          </button>
        </div>
      )}

      {!isLoading && filteredVideos.length > 0 && (
        <div className="space-y-4">
          {filteredVideos.map(item => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <div className="min-w-0 flex-1 mr-3">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={\`text-xs px-2 py-0.5 rounded-full font-medium \${item.source === "grok"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-indigo-100 text-indigo-700"}\`}>
                      {item.source === "grok" ? "🎥 Grok" : "🎬 Create Video"}
                    </span>
                    {item.source === "grok" && item.mode && (
                      <span className="text-xs text-gray-400">{item.mode}</span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-gray-700 truncate">
                    {item.product_description?.substring(0, 50) || "Video generation"}
                    {(item.product_description?.length || 0) > 50 ? "…" : ""}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(item.created_at).toLocaleDateString()} · {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <span className={\`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 \${
                  item.status === "completed" ? "bg-green-100 text-green-700" :
                  item.status === "failed" ? "bg-red-100 text-red-700" :
                  "bg-yellow-100 text-yellow-700"
                }\`}>
                  {item.status === "completed" ? "✅ Done" :
                   item.status === "failed" ? "❌ Failed" : "⏳ Processing"}
                </span>
              </div>

              {/* Completed video */}
              {item.status === "completed" && item.video_url && (
                <div className="p-4 space-y-3">
                  <video src={item.video_url} controls
                    className="w-full rounded-lg" style={{ maxHeight: 300 }} />
                  <div className="flex gap-2">
                    <a href={item.video_url} download
                      className="flex-1 py-2 rounded-lg bg-indigo-500 text-white text-xs font-medium text-center hover:bg-indigo-600 transition-all">
                      ⬇️ Download
                    </a>
                    {item.source === "sora" && (
                      <button onClick={() => {
                        setSoraGeneratedPrompt(item.prompt || "");
                        setSoraVideoConfig(item.video_config || null);
                        setSoraStep("prompt-ready");
                        setTab("sora");
                      }}
                        className="flex-1 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-all">
                        🔄 New Video
                      </button>
                    )}
                    {item.source === "grok" && (
                      <button onClick={() => setTab("grok")}
                        className="flex-1 py-2 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-all">
                        🔄 New Grok Video
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Processing */}
              {item.status === "processing" && (
                <div className="p-4">
                  <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                    <svg className="animate-spin w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-blue-700">Video still generating…</p>
                      <p className="text-xs text-blue-500 mt-0.5">
                        Started {Math.round((Date.now() - new Date(item.created_at).getTime()) / 60000)} min ago
                      </p>
                    </div>
                    {item.source === "sora" && (
                      <button onClick={() => { setSoraStep("idle"); resumeInProgressJobs(); setTab("sora"); }}
                        className="text-xs text-blue-600 border border-blue-200 rounded-lg px-2 py-1 hover:bg-blue-100 transition-all flex-shrink-0">
                        Resume
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Failed */}
              {item.status === "failed" && (
                <div className="p-4 space-y-2">
                  <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                    ❌ Generation failed.
                  </p>
                  {item.source === "sora" && (
                    <button onClick={() => {
                      setSoraGeneratedPrompt(item.prompt || "");
                      setSoraVideoConfig(item.video_config || null);
                      setSoraStep("prompt-ready");
                      setTab("sora");
                    }}
                      className="w-full py-2 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-all">
                      🔄 Try Again with Same Prompt
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryTab;
`;

fs.writeFileSync('src/components/HistoryTab.js', newHistoryTab, 'utf8');
console.log('Written: src/components/HistoryTab.js');
console.log('Lines:', newHistoryTab.split('\n').length);