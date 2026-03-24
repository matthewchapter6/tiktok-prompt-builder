# HookGen — Project Context

## Overview
HookGen (hookgen.app) is a Content Creator AI Agent platform for TikTok affiliate marketers and online sellers. It automates product marketing video creation — from story ideation to AI-generated video output.

**Tagline:** Powered by Content Creator AI Agent  
**Target users:** TikTok 带货 creators, affiliate marketers, online sellers  
**Repo:** github.com/matthewchapter6/tiktok-prompt-builder  
**Production URL:** https://hookgen.app  
**Legacy URL:** https://tiktok-prompt-builder.vercel.app  

---

## Tech Stack
- **Frontend:** React (Vite) + Tailwind CSS — `src/App.js` (~3,600 lines)
- **Backend:** Vercel Serverless Functions — `api/` folder
- **Database:** Supabase (PostgreSQL) — `src/lib/supabase.js`
- **Auth:** Supabase Auth + Google OAuth
- **Hosting:** Vercel (auto-deploy from GitHub main branch)
- **Video AI:** fal.ai (Kling v3 Pro, WAN 2.6, Hailuo 2.3)
- **Text AI:** Google Gemini 2.0 Flash, Claude Sonnet 4, Gemini Imagen 3

---

## Key Files

### Frontend
- `src/App.js` — Main React app. Contains all UI, state, and client logic
- `src/lib/supabase.js` — Supabase client, credit functions (fetchCredits, deductCredits, hasEnoughCredits, CREDIT_COSTS, getVideoCreditCost)

### API (Vercel Serverless Functions)
- `api/storyline.js` — Builder tab storyline generation (Gemini Flash)
- `api/generate-storylines.js` — Create Video tab 5 story proposals (Gemini Flash)
- `api/generate-video-prompt.js` — Animation + image prompt writer (Claude Sonnet 4)
- `api/generate-image.js` — First frame image generation (Gemini Imagen 3)
- `api/generate-sora-video.js` — Video job submission to fal.ai
- `api/sora-status.js` — Poll fal.ai queue status
- `api/fal-webhook.js` — Receive fal.ai webhook on video completion
- `api/director-agent.js` — AI Director cinematography suggestions (Gemini Flash)

### Config
- `vercel.json` — Function timeout settings (60s for video, 30s for others)

---

## Supabase Tables

### user_credits
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Matches auth user ID |
| credits | integer | Current balance |
| total_used | integer | Cumulative spent |
| updated_at | timestamp | Last update |

### credit_transactions
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| action | text | 'deduct' or 'topup' |
| amount | integer | Negative for deductions |
| description | text | e.g. 'Kling v3 5s video' |
| balance_after | integer | Balance after transaction |

### sora_generations
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| request_id | text | fal.ai job ID |
| model_id | text | fal.ai model used |
| prompt | text | Animation prompt |
| video_config | jsonb | aspect_ratio, duration etc. |
| product_description | text | For history display |
| status | text | processing / completed / failed |
| video_url | text | Final video URL |
| created_at | timestamp | |
| completed_at | timestamp | |

### profiles
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | Matches auth user ID |
| blocked | boolean | If true, user cannot access app |

### usage_logs
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| action | text | e.g. storyline, kling_video_generated |
| created_at | timestamp | |

---

## Credit System

### Credit Costs (defined in src/lib/supabase.js CREDIT_COSTS)
| Feature | Credits | API Cost (USD) |
|---|---|---|
| Kling v3 Pro 5s (audio on) | 20 | $0.84 |
| Kling v3 Pro 10s (audio on) | 40 | $1.68 |
| WAN 2.6 Flash 5s | 10 | $0.25 |
| WAN 2.6 Flash 10s | 20 | $0.50 |
| Hailuo 2.3 Fast Pro 5s/6s | 14 | $0.28 |
| Hailuo 2.3 Fast Pro 10s | 28 | $0.56 |
| First frame regeneration | 2 | ~$0.02 |
| Storyline / Prompts / First frame | FREE | $0.00 |

**Convention:** 1 credit = SGD $0.10

### Planned Top-Up Packages
| Package | Credits | Price (SGD) |
|---|---|---|
| Starter | 100 | $10 |
| Creator | 300 | $25 |
| Pro | 600 | $45 |

---

## Environment Variables (Vercel)
| Variable | Used By | Purpose |
|---|---|---|
| FAL_API_KEY | generate-sora-video.js, sora-status.js | fal.ai video API |
| GOOGLE_API_KEY | generate-image.js, storyline.js, director-agent.js, generate-storylines.js | Google Gemini + Imagen |
| ANTHROPIC_API_KEY | generate-video-prompt.js | Claude Sonnet 4 |
| VITE_SUPABASE_URL | src/lib/supabase.js | Supabase project URL |
| VITE_SUPABASE_ANON_KEY | src/lib/supabase.js, fal-webhook.js | Supabase anon key |

---

## AI Models Used
| Task | Model | Provider | File |
|---|---|---|---|
| Storyline generation (Builder) | gemini-2.0-flash | Google | storyline.js |
| 5 story proposals (Create Video) | gemini-2.0-flash | Google | generate-storylines.js |
| Animation prompt writing | claude-sonnet-4-20250514 | Anthropic | generate-video-prompt.js |
| First frame image | Gemini Imagen 3 | Google | generate-image.js |
| AI Director cinematography | gemini-2.0-flash | Google | director-agent.js |
| Video generation | Kling v3 Pro / WAN 2.6 / Hailuo 2.3 | fal.ai | generate-sora-video.js |

### fal.ai Model IDs
- Kling: `fal-ai/kling-video/v3/pro/image-to-video`
- WAN: `wan/v2.6/image-to-video/flash`
- Hailuo: `fal-ai/minimax/hailuo-2.3-fast/pro/image-to-video`

---

## Video Generation Flow (Create Video Tab)
1. User uploads product photo + optional character photo
2. Fills product info (description, USP, category, funnel, duration, model)
3. Gemini generates 5 storyline proposals → user picks one
4. Claude writes `animationPrompt` + `imagePrompt` + `videoConfig`
5. Gemini Imagen generates first frame from `imagePrompt`
6. User reviews first frame, can edit animation prompt
7. Credits deducted → job submitted to fal.ai with `webhookUrl`
8. App polls `/api/sora-status` every 4 seconds
9. fal.ai POSTs to `/api/fal-webhook` on completion → video URL saved to Supabase
10. Video displayed in app + History tab

---

## HitPay PayNow Integration (PENDING — to be implemented)

### Goal
Allow users to self-serve top up credits via PayNow through HitPay payment gateway.

### What needs to be built
1. **`api/create-payment.js`** — Create HitPay payment session, return PayNow QR/redirect URL
2. **`api/hitpay-webhook.js`** — Receive HitPay webhook on payment success → add credits to user
3. **Top-up modal UI in `src/App.js`** — Package selector + payment flow
4. **New Supabase table: `topup_requests`** — Track payment status

### topup_requests table (to be created)
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| user_id | uuid (FK) | |
| package_name | text | 'starter' / 'creator' / 'pro' |
| credits | integer | Credits to be added |
| amount_sgd | numeric | SGD amount paid |
| status | text | pending / completed / failed |
| hitpay_payment_id | text | HitPay reference ID |
| created_at | timestamp | |
| completed_at | timestamp | |

### New Environment Variables needed
- `HITPAY_API_KEY` — from HitPay dashboard → Settings → API Keys
- `HITPAY_WEBHOOK_SALT` — from HitPay dashboard → Settings → API Keys (used to verify webhook)

### HitPay API details
- Base URL: `https://api.hit-pay.com/v1/`
- Create payment: `POST /payment-requests`
- Webhook verification: HMAC-SHA256 using webhook salt
- PayNow fee: ~1.5% per transaction
- Docs: https://hit-pay.com/docs

### Credit packages to implement
```javascript
const TOPUP_PACKAGES = [
  { id: 'starter', name: 'Starter', credits: 100, amount: 10, currency: 'SGD' },
  { id: 'creator', name: 'Creator', credits: 300, amount: 25, currency: 'SGD' },
  { id: 'pro',     name: 'Pro',     credits: 600, amount: 45, currency: 'SGD' },
];
```

### UI placement
- "Top Up" button next to credit balance in the app header
- Opens a modal with package selection → PayNow QR → confirmation

---

## External Services Status
| Service | Purpose | Status |
|---|---|---|
| Vercel | Hosting + serverless | ✅ Live |
| Supabase | Database + auth | ✅ Live |
| Google Cloud | OAuth + Gemini + Imagen | ✅ Live |
| Anthropic | Claude Sonnet 4 | ✅ Live |
| fal.ai | Video generation | ✅ Live |
| HitPay | PayNow payments | 🔄 Account pending verification |
| GitHub | Source control + CI/CD | ✅ Live |

---

## Notes for Future Development
- Supabase project ID: `xsigkbqwnvcgjhjjslgs`
- Google OAuth client configured for both hookgen.app and tiktok-prompt-builder.vercel.app
- fal.ai webhook URL uses `req.headers.host` dynamically — works for both domains
- All video generation uses async queue + webhook pattern (not blocking)
- Polling interval: 4 seconds with cache-busting `&t=${Date.now()}`
- WAN model: video URL comes via webhook only (not in status.data)
- Kling model: video URL comes via `fal.queue.result()` fallback after status COMPLETED
