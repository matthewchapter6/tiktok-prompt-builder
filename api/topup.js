// api/topup.js
// Merged: create-topup + check-topup
// POST { action: 'create', userId, credits }  → creates Stripe PayNow PaymentIntent
// POST { action: 'check',  userId, paymentIntentId } → checks payment status

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://xsigkbqwnvcgjhjjslgs.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EXPIRY_MINUTES = 10;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action } = req.body;

  // ── CREATE ────────────────────────────────────────────────────────────────
  if (action === 'create') {
    const { userId, credits } = req.body;
    if (!userId || !credits || credits < 10 || credits > 10000) {
      return res.status(400).json({ error: 'Invalid request. credits must be between 10 and 10000.' });
    }
    const amountSgd   = credits / 10;
    const amountCents = Math.round(amountSgd * 100);

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: 'sgd',
        payment_method_types: ['paynow'],
        metadata: { userId, credits: String(credits) },
      });

      const confirmed = await stripe.paymentIntents.confirm(paymentIntent.id, {
        payment_method_data: { type: 'paynow' },
        return_url: 'https://hookgen.app',
      });

      const qrImageUrl = confirmed.next_action?.paynow_display_qr_code?.image_url_png;
      const paynowRef  = confirmed.next_action?.paynow_display_qr_code?.reference;
      const expiresAt  = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000).toISOString();

      await supabase.from('payment_orders').insert({
        user_id:                  userId,
        stripe_payment_intent_id: confirmed.id,
        credits,
        amount_sgd:               amountSgd,
        status:                   'pending',
        qr_image_url:             qrImageUrl,
        paynow_reference:         paynowRef,
        expires_at:               expiresAt,
      }).then(({ error }) => { if (error) console.error('DB insert error:', error); });

      return res.status(200).json({ paymentIntentId: confirmed.id, qrImageUrl, paynowRef, amountSgd, credits, expiresAt });
    } catch (e) {
      console.error('create-topup error:', e);
      return res.status(500).json({ error: e.message || 'Failed to create payment' });
    }
  }

  // ── CHECK ─────────────────────────────────────────────────────────────────
  if (action === 'check') {
    const { paymentIntentId, userId } = req.body;
    if (!paymentIntentId || !userId) {
      return res.status(400).json({ error: 'paymentIntentId and userId are required' });
    }

    try {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      const { data: order } = await supabase
        .from('payment_orders')
        .select('*')
        .eq('stripe_payment_intent_id', paymentIntentId)
        .eq('user_id', userId)
        .single();

      if (!order) return res.status(404).json({ error: 'Order not found' });

      if (pi.status === 'succeeded' && order.status !== 'succeeded') {
        const now = new Date().toISOString();
        const { data: creditRow } = await supabase.from('user_credits').select('credits').eq('id', userId).single();
        const newBalance = (creditRow?.credits ?? 0) + order.credits;

        await supabase.from('user_credits').update({ credits: newBalance, updated_at: now }).eq('id', userId);
        await supabase.from('credit_transactions').insert({
          user_id: userId, action: 'topup', amount: order.credits,
          description: `PayNow top-up: ${order.credits} credits (SGD $${order.amount_sgd})`,
          balance_after: newBalance,
        });
        await supabase.from('payment_orders').update({ status: 'succeeded', paid_at: now, credited_at: now }).eq('id', order.id);

        return res.status(200).json({ status: 'succeeded', newBalance, credits: order.credits });
      }

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

  return res.status(400).json({ error: 'Invalid action' });
}
