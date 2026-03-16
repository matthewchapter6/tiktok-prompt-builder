import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xsigkbqwnvcgjhjjslgs.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzaWdrYnF3bnZjZ2poampzbGdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjUyMTUsImV4cCI6MjA4OTI0MTIxNX0.7fxBgQ9TiQ5_-0YXbAAAa2rz0kiJnaWX8ZgpavEXJ04";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const logUsage = async (userId, action) => {
  try {
    await supabase.from('usage_logs').insert({ user_id: userId, action });
  } catch (e) {
    console.error('Usage log error:', e);
  }
};