import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";

const PACKAGES = [
  { credits: 20,  label: "Starter",  price: "$2",  desc: "20 credits" },
  { credits: 50,  label: "Standard", price: "$5",  desc: "50 credits" },
  { credits: 100, label: "Popular",  price: "$10", desc: "110 credits", bonus: 10, badge: "Best Value" },
];

const EXPIRY_MINUTES = 10;

function formatSGD(amount) {
  return `SGD $${Number(amount).toFixed(2)}`;
}

function formatDate(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-SG", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function TopupPage({ user, userCredits, setUserCredits }) {
  const [selectedCredits, setSelectedCredits] = useState(50);
  const [customCredits, setCustomCredits] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // QR payment state
  const [qrData, setQrData] = useState(null); // { paymentIntentId, qrImageUrl, amountSgd, credits, expiresAt }
  const [qrStatus, setQrStatus] = useState("idle"); // idle | pending | succeeded | failed | expired
  const [timeLeft, setTimeLeft] = useState(0);
  const [newBalance, setNewBalance] = useState(null);

  // History
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const pollRef = useRef(null);
  const countdownRef = useRef(null);

  const effectiveCredits = isCustom
    ? Math.max(10, Math.round((parseFloat(customCredits) || 0) / 1) * 10)
    : selectedCredits;

  // Bonus credits for 100-credit package
  const bonusCredits = effectiveCredits === 100 ? 10 : 0;
  const totalCredits = effectiveCredits + bonusCredits;
  const priceSgd = effectiveCredits / 10;

  // ── Load history ────────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    const { data } = await supabase
      .from("payment_orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    setHistory(data || []);
    setHistoryLoading(false);
  }, [user]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // ── Countdown timer ──────────────────────────────────────────────────────
  const startCountdown = useCallback((expiresAt) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      const secs = Math.max(0, Math.floor((new Date(expiresAt) - Date.now()) / 1000));
      setTimeLeft(secs);
      if (secs === 0) {
        clearInterval(countdownRef.current);
        setQrStatus("expired");
        stopPolling();
      }
    }, 1000);
  }, []);

  const stopPolling = () => {
    if (pollRef.current) clearInterval(pollRef.current);
  };

  // ── Poll payment status every 5s ─────────────────────────────────────────
  const startPolling = useCallback((paymentIntentId) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch("/api/topup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "check", paymentIntentId, userId: user.id }),
        });
        const data = await res.json();
        if (data.status === "succeeded") {
          setQrStatus("succeeded");
          setNewBalance(data.newBalance);
          if (data.newBalance !== null) setUserCredits(data.newBalance);
          stopPolling();
          if (countdownRef.current) clearInterval(countdownRef.current);
          loadHistory();
        } else if (data.status === "expired" || data.status === "canceled" || data.status === "failed") {
          setQrStatus(data.status);
          stopPolling();
          if (countdownRef.current) clearInterval(countdownRef.current);
        }
      } catch (e) {
        console.error("poll error:", e);
      }
    }, 5000);
  }, [user, setUserCredits, loadHistory]);

  useEffect(() => {
    return () => { stopPolling(); if (countdownRef.current) clearInterval(countdownRef.current); };
  }, []);

  // ── Generate QR ──────────────────────────────────────────────────────────
  const generateQR = async () => {
    const credits = effectiveCredits;
    if (credits < 10) { setError("Minimum top-up is 10 credits (SGD $1)."); return; }
    if (credits > 10000) { setError("Maximum top-up is 10,000 credits (SGD $1,000)."); return; }

    setLoading(true);
    setError("");
    setQrData(null);
    setQrStatus("idle");

    try {
      const res = await fetch("/api/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", userId: user.id, credits }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create payment");

      setQrData(data);
      setQrStatus("pending");
      setTimeLeft(EXPIRY_MINUTES * 60);
      startCountdown(data.expiresAt);
      startPolling(data.paymentIntentId);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    stopPolling();
    if (countdownRef.current) clearInterval(countdownRef.current);
    setQrData(null);
    setQrStatus("idle");
    setError("");
    setNewBalance(null);
  };

  const handlePrintReceipt = (order) => {
    const w = window.open("", "_blank");
    w.document.write(`
      <html><head><title>Receipt - hookgen.app</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 480px; margin: 40px auto; color: #111; }
        h2 { color: #1d4ed8; } .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .label { color: #666; } .status { color: #16a34a; font-weight: bold; }
        .footer { margin-top: 32px; font-size: 12px; color: #999; text-align: center; }
      </style></head><body>
      <h2>⚡ hookgen.app — Credit Top-Up Receipt</h2>
      <div class="row"><span class="label">Date</span><span>${formatDate(order.paid_at || order.created_at)}</span></div>
      <div class="row"><span class="label">Reference</span><span>${order.stripe_payment_intent_id?.slice(-12)?.toUpperCase()}</span></div>
      <div class="row"><span class="label">Payment Method</span><span>PayNow</span></div>
      <div class="row"><span class="label">Amount Paid</span><span>${formatSGD(order.amount_sgd)}</span></div>
      <div class="row"><span class="label">Credits Added</span><span>${order.credits} credits</span></div>
      <div class="row"><span class="label">Status</span><span class="status">Paid</span></div>
      <div class="footer">Thank you for your purchase · hookgen.app</div>
      <script>window.print();</script>
      </body></html>
    `);
    w.document.close();
  };

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

      {/* ── Header ── */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Top Up Credits</h2>
        <p className="text-sm text-gray-500 mt-1">
          Current balance: <span className="font-bold text-amber-600">⚡ {userCredits ?? 0} credits</span>
          &nbsp;· 10 credits = SGD $1.00
        </p>
      </div>

      {/* ── QR Success State ── */}
      {qrStatus === "succeeded" && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-3">
          <div className="text-5xl">🎉</div>
          <h3 className="text-lg font-bold text-green-800">Payment Successful!</h3>
          <p className="text-sm text-green-700">
            <strong>{qrData?.credits + (qrData?.credits === 100 ? 10 : 0)} credits</strong> have been added to your account.
          </p>
          <p className="text-sm text-green-700">
            New balance: <strong>⚡ {newBalance ?? userCredits} credits</strong>
          </p>
          <button onClick={handleReset}
            className="mt-2 px-5 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
            Top Up Again
          </button>
        </div>
      )}

      {/* ── QR Pending State ── */}
      {qrStatus === "pending" && qrData && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <div className="text-center space-y-1">
            <h3 className="font-bold text-gray-900">Scan to Pay via PayNow</h3>
            <p className="text-sm text-gray-500">
              {formatSGD(qrData.amountSgd)} · {totalCredits} credits
            </p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            {qrData.qrImageUrl ? (
              <img src={qrData.qrImageUrl} alt="PayNow QR Code"
                className="w-56 h-56 border border-gray-200 rounded-xl" />
            ) : (
              <div className="w-56 h-56 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 text-sm">
                QR unavailable — use PayNow ref below
              </div>
            )}
          </div>

          {qrData.paynowRef && (
            <p className="text-center text-xs text-gray-500">
              PayNow Ref: <span className="font-mono font-bold">{qrData.paynowRef}</span>
            </p>
          )}

          {/* Countdown */}
          <div className="flex items-center justify-center gap-2">
            <div className={`text-2xl font-mono font-bold ${timeLeft < 60 ? "text-red-500" : "text-amber-600"}`}>
              {mins}:{secs}
            </div>
            <span className="text-xs text-gray-400">remaining</span>
          </div>

          <p className="text-center text-xs text-gray-400">
            Waiting for payment confirmation…
            <span className="ml-1 animate-pulse">●</span>
          </p>

          <button onClick={handleReset}
            className="w-full py-2 border border-gray-200 text-gray-500 rounded-xl text-sm hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      )}

      {/* ── QR Expired / Failed State ── */}
      {(qrStatus === "expired" || qrStatus === "failed" || qrStatus === "canceled") && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center space-y-3">
          <div className="text-3xl">{qrStatus === "expired" ? "⏰" : "❌"}</div>
          <h3 className="font-bold text-red-800">
            {qrStatus === "expired" ? "QR Code Expired" : "Payment Failed"}
          </h3>
          <p className="text-sm text-red-600">
            {qrStatus === "expired"
              ? "The QR code has expired. Please generate a new one."
              : "The payment was not completed. Please try again."}
          </p>
          <button onClick={handleReset}
            className="px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors">
            Try Again
          </button>
        </div>
      )}

      {/* ── Package selector (hidden while QR is shown) ── */}
      {qrStatus === "idle" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-gray-800 text-sm">Select Amount</h3>

          <div className="grid grid-cols-3 gap-3">
            {PACKAGES.map(pkg => (
              <button key={pkg.credits}
                onClick={() => { setSelectedCredits(pkg.credits); setIsCustom(false); setError(""); }}
                className={`relative rounded-xl border-2 p-3 text-center transition-all ${
                  !isCustom && selectedCredits === pkg.credits
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}>
                {pkg.badge && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                    {pkg.badge}
                  </span>
                )}
                <div className="font-bold text-gray-900 text-sm mt-1">{pkg.price}</div>
                <div className="text-xs text-gray-500 mt-0.5">{pkg.desc}</div>
                {pkg.bonus && (
                  <div className="text-[10px] text-green-600 font-semibold mt-0.5">+{pkg.bonus} free</div>
                )}
              </button>
            ))}
          </div>

          {/* Custom option */}
          <button
            onClick={() => { setIsCustom(true); setError(""); }}
            className={`w-full rounded-xl border-2 p-3 text-center transition-all ${
              isCustom ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"
            }`}>
            <span className="text-sm font-medium text-gray-700">✏️ Custom amount</span>
          </button>

          {isCustom && (
            <div className="space-y-1">
              <label className="text-xs text-gray-500">Enter amount in SGD (min $1)</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium">SGD $</span>
                <input
                  type="number" min="1" max="1000" step="1"
                  value={customCredits}
                  onChange={e => { setCustomCredits(e.target.value); setError(""); }}
                  placeholder="e.g. 15"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              {customCredits && parseFloat(customCredits) >= 1 && (
                <p className="text-xs text-blue-600">= {Math.round(parseFloat(customCredits)) * 10} credits</p>
              )}
            </div>
          )}

          {/* Summary */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-amber-700">You get</span>
            <span className="font-bold text-amber-800">
              ⚡ {totalCredits} credits
              {bonusCredits > 0 && <span className="text-green-600 text-xs ml-1">(+{bonusCredits} bonus)</span>}
            </span>
            <span className="font-bold text-gray-800">{formatSGD(priceSgd)}</span>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            onClick={generateQR}
            disabled={loading || (isCustom && (!customCredits || parseFloat(customCredits) < 1))}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {loading ? "Generating QR…" : `Generate PayNow QR · ${formatSGD(priceSgd)}`}
          </button>
        </div>
      )}

      {/* ── Top-up History ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
        <h3 className="font-semibold text-gray-800 text-sm">Top-Up History</h3>
        {historyLoading ? (
          <p className="text-xs text-gray-400 text-center py-4">Loading…</p>
        ) : history.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No top-ups yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map(order => (
              <div key={order.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      order.status === "succeeded" ? "bg-green-100 text-green-700"
                      : order.status === "pending"  ? "bg-amber-100 text-amber-700"
                      : "bg-red-100 text-red-600"
                    }`}>
                      {order.status === "succeeded" ? "Paid" : order.status === "pending" ? "Pending" : order.status}
                    </span>
                    <span className="text-xs font-semibold text-gray-800">⚡ +{order.credits} credits</span>
                    <span className="text-xs text-gray-500">{formatSGD(order.amount_sgd)}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{formatDate(order.created_at)}</div>
                </div>
                {order.status === "succeeded" && (
                  <button
                    onClick={() => handlePrintReceipt(order)}
                    className="flex-shrink-0 text-[11px] text-blue-500 hover:text-blue-700 underline">
                    Receipt
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
