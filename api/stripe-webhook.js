// api/stripe-webhook.js
// Receives Stripe webhook events and credits users on successful PayNow payment.
// Must be registered in Stripe Dashboard → Developers → Webhooks

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://xsigkbqwnvcgjhjjslgs.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY  // service role bypasses RLS for server-side writes
);

// Vercel: disable body parsing so we can verify the raw Stripe signature
export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error('Webhook signature verification failed:', e.message);
    return res.status(400).json({ error: `Webhook Error: ${e.message}` });
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const userId  = pi.metadata?.userId;
    const credits = parseInt(pi.metadata?.credits, 10);

    if (!userId || !credits) {
      console.error('Webhook: missing metadata', pi.id);
      return res.status(200).json({ received: true }); // ack so Stripe doesn't retry
    }

    // Idempotency: check if already credited
    const { data: order } = await supabase
      .from('payment_orders')
      .select('id, status')
      .eq('stripe_payment_intent_id', pi.id)
      .single();

    if (!order || order.status === 'succeeded') {
      return res.status(200).json({ received: true }); // already handled
    }

    const now = new Date().toISOString();
    const amountSgd = credits / 10;

    // Credit user
    const { data: creditRow } = await supabase
      .from('user_credits')
      .select('credits')
      .eq('id', userId)
      .single();

    const currentBalance = creditRow?.credits ?? 0;
    const newBalance = currentBalance + credits;

    await supabase.from('user_credits').update({
      credits:    newBalance,
      updated_at: now,
    }).eq('id', userId);

    await supabase.from('credit_transactions').insert({
      user_id:       userId,
      action:        'topup',
      amount:        credits,
      description:   `PayNow top-up: ${credits} credits (SGD $${amountSgd.toFixed(2)})`,
      balance_after: newBalance,
    });

    await supabase.from('payment_orders').update({
      status:      'succeeded',
      paid_at:     now,
      credited_at: now,
    }).eq('id', order.id);

    console.log(`Credited ${credits} credits to user ${userId}. New balance: ${newBalance}`);
  }

  if (event.type === 'payment_intent.payment_failed' || event.type === 'payment_intent.canceled') {
    const pi = event.data.object;
    const newStatus = event.type === 'payment_intent.canceled' ? 'canceled' : 'failed';
    await supabase.from('payment_orders')
      .update({ status: newStatus })
      .eq('stripe_payment_intent_id', pi.id)
      .neq('status', 'succeeded'); // never downgrade a succeeded order
  }

  return res.status(200).json({ received: true });
}
