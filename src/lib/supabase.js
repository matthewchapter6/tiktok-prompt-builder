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
// ── Kling 3.0 Pro pricing (fal.ai, audio ON) ──────────────────────────────
// API cost: $0.168/s with audio on
// Formula: (cost × seconds) ÷ $0.10 per credit ÷ 0.35 (65% margin)
// 5s:  $0.84 API → $2.40 charge → 24 credits
// Kling 2.6 Pro image-to-video pricing (65% margin, $0.10/credit)
// Bundled cost: Gemini image gen + Kling video in one charge
// Kling 2.6 Pro: $0.07/sec | Gemini image: ~$0.02
// Formula: (API cost) ÷ 0.35 ÷ $0.10
export const CREDIT_COSTS = {
  video_5s:      12,  // 5s bundle:  $0.37 API → 12 credits = $1.20
  video_10s:     22,  // 10s bundle: $0.72 API → 22 credits = $2.20
  image_gemini:   0,  // Bundled into video cost — not charged separately
  prompt_grok:    0,  // Claude prompt generation = FREE
  storyline:      0,  // Storyline generation = FREE
};

// Helper: get video credit cost by length
export const getVideoCreditCost = (videoLength) => {
  if (videoLength === '5') return CREDIT_COSTS.video_5s;
  return CREDIT_COSTS.video_10s;
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
    // Fetch current balance
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

    // Deduct credits
    const { error: updateErr } = await supabase
      .from('user_credits')
      .update({
        credits: newBalance,
        total_used: supabase.rpc ? undefined : undefined, // handled below
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateErr) throw updateErr;

    // Increment total_used separately
    await supabase.rpc('increment_total_used', { user_id: userId, amount: cost })
      .catch(() => {}); // non-critical if RPC doesn't exist yet

    // Log transaction
    await supabase.from('credit_transactions').insert({
      user_id: userId,
      action: 'deduct',
      amount: -cost,
      description,
      balance_after: newBalance,
    }).catch(() => {}); // non-critical

    return { success: true, balance: newBalance };
  } catch (e) {
    console.error('deductCredits error:', e);
    return { success: false, balance: null, error: e.message };
  }
};
