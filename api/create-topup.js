// api/create-topup.js
// Creates a Stripe PayNow PaymentIntent and returns the QR code for the user to scan.
// 10 credits = SGD $1.00

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://xsigkbqwnvcgjhjjslgs.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY  // service role bypasses RLS for server-side writes
);

const EXPIRY_MINUTES = 10;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, credits } = req.body;

  if (!userId || !credits || credits < 10 || credits > 10000) {
    return res.status(400).json({ error: 'Invalid request. credits must be between 10 and 10000.' });
  }

  const amountSgd = credits / 10;           // 10 credits = $1 SGD
  const amountCents = Math.round(amountSgd * 100); // Stripe uses cents

  try {
    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'sgd',
      payment_method_types: ['paynow'],
      metadata: { userId, credits: String(credits) },
    });

    // Confirm to get the PayNow QR code
    const confirmed = await stripe.paymentIntents.confirm(paymentIntent.id, {
      payment_method: { type: 'paynow' },
      return_url: 'https://hookgen.app',
    });

    const qrImageUrl = confirmed.next_action?.paynow_display_qr_code?.image_url_png;
    const paynowRef  = confirmed.next_action?.paynow_display_qr_code?.reference;

    const expiresAt = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000).toISOString();

    // Store order in Supabase (using service role to bypass RLS)
    const { error: dbErr } = await supabase.from('payment_orders').insert({
      user_id:                  userId,
      stripe_payment_intent_id: confirmed.id,
      credits,
      amount_sgd:               amountSgd,
      status:                   'pending',
      qr_image_url:             qrImageUrl,
      paynow_reference:         paynowRef,
      expires_at:               expiresAt,
    });

    if (dbErr) {
      console.error('DB insert error:', dbErr);
      // Non-fatal — QR is still valid, just not persisted. Log and continue.
    }

    return res.status(200).json({
      paymentIntentId: confirmed.id,
      qrImageUrl,
      paynowRef,
      amountSgd,
      credits,
      expiresAt,
    });
  } catch (e) {
    console.error('create-topup error:', e);
    return res.status(500).json({ error: e.message || 'Failed to create payment' });
  }
}
