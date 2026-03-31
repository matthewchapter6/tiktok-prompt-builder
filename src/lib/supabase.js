import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xsigkbqwnvcgjhjjslgs.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzaWdrYnF3bnZjZ2poampzbGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjUyMTUsImV4cCI6MjA4OTI0MTIxNX0.7fxBgQ9TiQ5_-0YXbAAAa2rz0kiJnaWX8ZgpavEXJ04";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ── Usage logging ─────────────────────────────────────────────────────────
export const logUsage = async (userId, action) => {
  try {
    await supabase.from('usage_logs').insert({ user_id: userId, action });
  } catch (e) {
    console.error('Usage log error:', e);
  }
};

// ── Credit costs ──────────────────────────────────────────────────────────
export const CREDIT_COSTS = {
  // Kling v3 Pro image-to-video + audio (~52% margin)
  kling_5s:          20,  // $0.84 API → 20 credits = $2.00
  kling_10s:         40,  // $1.68 API → 40 credits = $4.00
  // Wan 2.6 I2V Flash 720p + audio (~52% margin)
  wan_5s:            10,  // $0.25 API → 10 credits = $1.00
  wan_10s:           20,  // $0.50 API → 20 credits = $2.00
  // Hailuo 2.3 Fast Pro 1080p + audio (~52% margin)
  hailuo_5s:         14,  // $0.28 API → 14 credits = $1.40
  hailuo_10s:        28,  // $0.56 API → 28 credits = $2.80
  // Long Video (18s chain: clip1 ref-to-video + 2x extend)
  longvideo_18s:     28,  // ~$1.44 API → 28 credits = $2.80
  // Other
  regenerate_frame:   2,
  image_gemini:       0,
  prompt_grok:        0,
  storyline:          0,
  grok_storyline:     0,  // free
  grok_prompt:        0,  // free
  // Legacy aliases
  video_5s:          10,
  video_10s:         20,
};

export const getVideoCreditCost = (videoLength, model = 'wan') => {
  const len = String(videoLength);
  if (model === 'kling') {
    return len === '5' ? CREDIT_COSTS.kling_5s : CREDIT_COSTS.kling_10s;
  }
  if (model === 'hailuo') {
    return len === '5' ? CREDIT_COSTS.hailuo_5s : CREDIT_COSTS.hailuo_10s;
  }
  // wan (default)
  return len === '5' ? CREDIT_COSTS.wan_5s : CREDIT_COSTS.wan_10s;
};

// ── Fetch user's current credit balance ──────────────────────────────────
export const fetchCredits = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('credits, total_used')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data?.credits ?? 0;
  } catch (e) {
    console.error('fetchCredits error:', e);
    return 0;
  }
};

// ── Check if user has enough credits ─────────────────────────────────────
export const hasEnoughCredits = async (userId, cost) => {
  if (cost === 0) return true;
  const balance = await fetchCredits(userId);
  return balance >= cost;
};

// ── Deduct credits and log transaction ───────────────────────────────────
// Returns { success: boolean, balance: number, error?: string }
export const deductCredits = async (userId, cost, description) => {
  if (cost === 0) return { success: true, balance: null };
  try {
    const { data: current, error: fetchErr } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('id', userId)
      .single();

    if (fetchErr) throw fetchErr;

    const currentBalance = current?.credits ?? 0;
    if (currentBalance < cost) {
      return { success: false, balance: currentBalance, error: 'insufficient_credits' };
    }

    const newBalance = currentBalance - cost;

    const { error: updateErr } = await supabase
      .from('user_credits')
      .update({
        credits: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateErr) throw updateErr;

    try {
      await supabase.from('credit_transactions').insert({
        user_id: userId,
        action: 'deduct',
        amount: -cost,
        description,
        balance_after: newBalance,
      });
    } catch (_) {}

    return { success: true, balance: newBalance };
  } catch (e) {
    console.error('deductCredits error:', e);
    return { success: false, balance: null, error: e.message };
  }
};
export const getGrokCreditCost = () => CREDIT_COSTS.grok_10s;