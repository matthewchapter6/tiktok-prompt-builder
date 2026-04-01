// api/check-topup.js
// Polls the status of a PayNow payment intent.
// Frontend calls this every 5s as a fallback in case the webhook is delayed.

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://xsigkbqwnvcgjhjjslgs.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY  // service role bypasses RLS for server-side writes
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { paymentIntentId, userId } = req.body;
  if (!paymentIntentId || !userId) {
    return res.status(400).json({ error: 'paymentIntentId and userId are required' });
  }

  try {
    // Fetch latest status from Stripe
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Fetch our DB record
    const { data: order } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .eq('user_id', userId)
      .single();

    if (!order) return res.status(404).json({ error: 'Order not found' });

    // If Stripe says succeeded but we haven't credited yet, do it now (webhook fallback)
    if (pi.status === 'succeeded' && order.status !== 'succeeded') {
      const now = new Date().toISOString();

      // Fetch current balance
      const { data: creditRow } = await supabase
        .from('user_credits')
        .select('credits')
        .eq('id', userId)
        .single();

      const currentBalance = creditRow?.credits ?? 0;
      const newBalance = currentBalance + order.credits;

      await supabase.from('user_credits').update({
        credits: newBalance,
        updated_at: now,
      }).eq('id', userId);

      await supabase.from('credit_transactions').insert({
        user_id:       userId,
        action:        'topup',
        amount:        order.credits,
        description:   `PayNow top-up: ${order.credits} credits (SGD $${order.amount_sgd})`,
        balance_after: newBalance,
      });

      await supabase.from('payment_orders').update({
        status:      'succeeded',
        paid_at:     now,
        credited_at: now,
      }).eq('id', order.id);

      return res.status(200).json({ status: 'succeeded', newBalance, credits: order.credits });
    }

    // Handle expired orders
    if (order.status === 'pending' && new Date() > new Date(order.expires_at)) {
      await stripe.paymentIntents.cancel(paymentIntentId).catch(() => {});
      await supabase.from('payment_orders').update({ status: 'expired' }).eq('id', order.id);
      return res.status(200).json({ status: 'expired' });
    }

    return res.status(200).json({ status: order.status });
  } catch (e) {
    console.error('check-topup error:', e);
    return res.status(500).json({ error: e.message });
  }
}
