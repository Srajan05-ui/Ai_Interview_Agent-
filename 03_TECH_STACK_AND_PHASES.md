# Tech Stack & Phase-by-Phase Build Plan
## AI Interview Agent

---

## 1. Frontend Stack (Amrita)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14** (App Router) + TypeScript | SSR for landing/SEO, file-based routing, strong ecosystem |
| Styling | **Tailwind CSS** + **shadcn/ui** | Fast, professional, consistent components — avoids "generic AI app" look |
| Animation | **Framer Motion** | Smooth transitions for interview room, progress maps |
| Auth SDK | **Firebase Auth (client SDK)** | One SDK for Google + GitHub + Phone OTP |
| State | **Zustand** (lightweight) or React Context | Session/user state, interview live state |
| Data fetching | **TanStack Query (React Query)** | Caching, retries, loading states for REST calls |
| WebSocket | Native `WebSocket` API wrapped in a custom hook `useInterviewSocket` | Matches Design Doc §6 contract |
| Code editor (coding interview) | **Monaco Editor** (`@monaco-editor/react`) | Same engine as VS Code, multi-language syntax |
| Charts (history trends) | **Recharts** | Score-over-time visualization |
| Speech (browser) | **Web Speech API** (`SpeechRecognition`, `SpeechSynthesis`) as baseline; feature-detect and fall back to backend-streamed audio (see backend TTS/STT) when unsupported | Handles Chrome-first limitation per PRD §4.8 |
| Deployment | **Vercel** | Zero-config Next.js hosting |

---

## 2. Backend Stack (Srajan)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Python + FastAPI** | Async, native WebSocket support, best ecosystem for LLM/RAG/AI work |
| Database | **PostgreSQL** (via Supabase or Neon) | Relational data: users, sessions, scorecards |
| ORM | **SQLAlchemy 2.0 (async)** + **Alembic** for migrations | |
| Vector DB | **Qdrant** (or Pinecone if you want managed) | Question bank embeddings, resume/JD embeddings for RAG |
| LLM orchestration | **LangChain** or **LlamaIndex** (pick one, don't mix) | RAG pipeline, prompt templates, agentic follow-up logic |
| LLM provider | **Multi-provider fallback chain** — Gemini API (primary) → Groq (fallback) → OpenRouter `:free` models (last resort) → cached question bank (final degrade) | No single provider has a large enough $0 quota alone; the chain is what makes the product not "stop suddenly." Full design in Design Doc §13 |
| STT (speech-to-text) | **Web Speech API** (`SpeechRecognition`, browser-native) as the **only** engine for $0 build | Not metered — nothing to run out of, ever. Deepgram/AssemblyAI are one-time credit trials, not real free tiers — add later once there's budget (see §6a) |
| TTS (text-to-speech) | **Web Speech API** (`SpeechSynthesis`, browser-native) as the **only** engine for $0 build | Same reasoning — ElevenLabs free is only 10,000 characters/month (~10 min audio), which one active day of interviews can exhaust. Not viable as the sole engine at $0 budget |
| Resume parsing | **PyMuPDF** (PDF) + **python-docx** (DOCX) + LLM extraction pass | |
| Code execution (coding interview) | **Judge0 API** (self-hosted or hosted) or a sandboxed **Docker**-based runner | Never `eval()` untrusted code directly |
| Background jobs | **Celery + Redis** or FastAPI `BackgroundTasks` for lighter loads | Resume parsing, roadmap generation |
| Cache/session store | **Redis** | Concept graph live state, WebSocket session recovery |
| File storage | **AWS S3** (or Cloudinary for simpler setup) | Resume files |
| Auth verification | **Firebase Admin SDK** | Verifies ID tokens sent from frontend |
| Deployment | **Render** or **Railway** (simplest for a 2-person team); AWS if more control needed | |
| API docs | FastAPI's built-in **OpenAPI/Swagger** (`/docs`) | Must match Design Doc §5 exactly — treat Design Doc as source of truth, Swagger as verification |

---

## 2a. $0-Budget Reliability Stack (must-follow for a real product at zero budget)

The project must run continuously with **no budget at all**. Free tiers are rate-limited by design, so reliability comes from **fallback chains + graceful degradation**, not from any single "unlimited free" service (that doesn't exist). Lock in exactly this:

| Layer | $0 choice | Why it won't suddenly stop |
|---|---|---|
| LLM | **Gemini API** (primary) → **Groq** (fallback) → **OpenRouter `:free`** (last resort, ~50 req/day cap) → pre-cached question bank (final degrade, no LLM call at all) | Renewing daily quotas, not draining one-time credits; a full outage still lets the interview finish on cached questions instead of crashing |
| Voice | **Web Speech API only** (browser-native STT + TTS) | Zero metering — not a service that can run out |
| Auth | **Firebase Auth — Google + GitHub only.** Phone OTP is **cut from MVP** | Phone OTP bills per verification past a tiny free quota — the single easiest way to get silently rate-limited or billed. Add back once there's budget |
| Database | **Supabase free Postgres** + a free uptime pinger (**cron-job.org**, free) hitting a `/health` endpoint every few days | Free Postgres auto-pauses after ~7 days of no activity; the pinger prevents that, and real daily users make it moot anyway |
| Vector DB | **Qdrant Cloud free tier** (1GB) | Free forever at MVP question-bank size |
| Backend hosting | **Render free web service** + the same pinger hitting it every ~10 min | Prevents the 30–50s cold-start delay after idle from looking like a crash |
| Frontend hosting | **Vercel free tier** | Generous, no practical $0 issue |
| File storage | **Cloudinary free tier** (25GB) | No card, no expiry |
| Code execution | **Self-hosted Judge0** (Docker, on the same free Render instance) | The public Judge0 free API is rate-limited to a handful of requests/day; self-hosting removes that ceiling |

**Resilience pattern to build into the backend from Phase 0, not bolted on later:**
1. Every metered call (LLM, in future STT/TTS) goes through a **router with automatic fallback** on 429/error — never surface a raw provider failure to the candidate.
2. **Exponential backoff + client-side request queueing** so bursts don't trip a limit in the first place.
3. **Graceful degradation, not hard failure** — if the entire LLM chain is exhausted mid-interview, fall back to the cached question bank so the session still completes instead of dying.
4. **Keep-alive pings** on anything that pauses/cold-starts (Render, Supabase) so it's never cold when a real candidate arrives.

> Honest scaling note: this stack is genuinely stable for early real users, but it is capacity-limited (Gemini's free RPM, Render's free CPU, etc.). The first thing worth paying for later, if usage grows, is Render's paid tier (~$7/mo) to remove the cold-start ceiling — everything else can stay free longer.

---

## 3. Shared/Cross-cutting

| Concern | Choice |
|---|---|
| Auth | **Firebase Authentication** (Google, GitHub, Phone) — single provider used by both sides |
| Env management | `.env` files, never committed; a shared `ENV_CONTRACT.md` (below) lists every variable name both sides must agree on |
| API contract source of truth | `02_DESIGN_DOC.md` — if code and doc disagree, **doc wins**, fix the code |
| Version control | GitHub, two repos (`interview-agent-frontend`, `interview-agent-backend`) OR one monorepo with `/frontend` and `/backend` — monorepo recommended for a 2-person hackathon team (simpler to keep in sync) |
| CI (optional but recommended) | GitHub Actions — lint + basic smoke test on push |

---

## 4. Environment Variable Contract

**Backend `.env`:**
```
DATABASE_URL=
REDIS_URL=
FIREBASE_ADMIN_CREDENTIALS_JSON=
ANTHROPIC_API_KEY=
QDRANT_URL=
QDRANT_API_KEY=
DEEPGRAM_API_KEY=
ELEVENLABS_API_KEY=
AWS_S3_BUCKET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
JUDGE0_API_URL=
CHEAT_WARNING_THRESHOLD=1
```

**Frontend `.env.local`:**
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_API_BASE_URL=          # e.g. https://api.yourapp.com/api/v1
NEXT_PUBLIC_WS_BASE_URL=           # e.g. wss://api.yourapp.com/ws
```

---

## 5. Folder Structure

**Backend**
```
backend/
  app/
    main.py
    api/v1/          # routers: auth.py, resume.py, interview.py, scorecard.py, history.py
    ws/               # websocket handlers
    models/           # SQLAlchemy models
    schemas/          # Pydantic request/response schemas (mirror Design Doc §5/§6 exactly)
    services/         # resume_parser.py, ats_scorer.py, adaptive_engine.py, rubric_scorer.py, roadmap_gen.py, tts_stt.py, translator.py, anti_cheat.py, llm_router.py (Gemini → Groq → OpenRouter fallback chain, §2a)
    db/               # session, migrations
  tests/
  .env.example
```

**Frontend**
```
frontend/
  app/                # Next.js App Router pages per Design Doc §9 component map
  components/
  hooks/              # useInterviewSocket.ts, useAuth.ts
  lib/                # api-client.ts (typed wrapper matching Design Doc §5 exactly), firebase.ts
  types/              # TypeScript interfaces matching Design Doc schemas exactly
  .env.example
```

---

## 6. Phase-by-Phase Plan (each phase = one prompt session with your LLM, each must be tested before moving on)

> **Prompting instruction for both developers:** at the start of each phase, paste all three docs, then say:
> *"I am [Srajan/Amrita], I own [backend/frontend]. We are on Phase N: [phase name]. Build only this phase, following the schemas/endpoints in the Design Doc exactly. Do not invent new field names or endpoints. Stop and give me a testable checkpoint before continuing."*

### Phase 0 — Foundation (both)
- Backend: FastAPI skeleton, DB connection, Firebase Admin token verification middleware, `/api/v1/auth/me`, **`llm_router.py` with the Gemini → Groq → OpenRouter fallback chain (§2a) built and unit-tested in isolation** (force a fake 429 on the primary and confirm it falls through correctly) before it's wired into any real feature.
- Frontend: Next.js skeleton, Firebase client setup, login page (Srajan builds this per PRD §2) with **Google + GitHub only** (Phone OTP deferred, §2a), protected route wrapper.
- **Test checkpoint:** Login → token sent to backend → `/auth/me` returns correct user JSON matching Design Doc §3. Separately, confirm the LLM router correctly falls back when the primary provider is forced to fail. Both sides screen-share/verify together.

### Phase 1 — Resume Upload + ATS Score
- Backend: `/resume/upload` endpoint, PDF/DOCX parsing, LLM skill extraction, ATS scoring logic.
- Frontend: `ResumeUploadPage`, upload UI, ATS score + suggestions display.
- **Test checkpoint:** Upload a real resume PDF → response matches exact schema in Design Doc §5 → suggestions render correctly in UI, not just raw JSON dump.

### Phase 2 — Question Bank + Adaptive Engine (text-only, no voice yet)
- Backend: Qdrant setup, seed question bank (tagged by topic/difficulty), adaptive engine logic, concept graph, `/interview/start`, text-based turn handling over WebSocket (skip audio for now — just `text_answer`).
- Frontend: `InterviewSetupPage`, `InterviewRoomPage` in text-input mode, `TopicProgressMap`, `AdaptiveReasonBadge`.
- **Test checkpoint:** Full text-based interview runs end-to-end, 5+ turns, visibly adapts difficulty/topic based on answer quality, concept graph updates shown live.

### Phase 3 — Voice Pipeline + Media Permissions + Anti-cheat
- Backend: Deepgram STT streaming integration, ElevenLabs TTS streaming, dedup logic on transcript chunks.
- Frontend: mic/camera/screen-share permission flow, `MediaControls`, tab-switch/fullscreen-exit detection wired to `/interview/:id/flag`.
- **Test checkpoint:** Speak an answer → see live deduped transcript → hear streamed AI voice response with no long silent wait. Switch tabs once → warning modal appears. Switch again → session terminates and scorecard (partial) generates.

### Phase 4 — Coding Interview Mode
- Backend: Judge0/sandbox integration, code evaluation prompt (correctness + complexity), `code_submission` WS event handling.
- Frontend: `CodeEditorPanel` (Monaco), language selector, run/submit buttons.
- **Test checkpoint:** Submit working and broken code for a sample problem → both give distinct, correct-seeming AI evaluation.

### Phase 5 — Evaluation Engine + Scorecard + Roadmap
- Backend: rubric scorer (per-topic criteria, not vague), scorecard generation on session end, `/roadmap/generate`.
- Frontend: `ScorecardPage` (fused technical + communication view), `RoadmapPage`.
- **Test checkpoint:** Complete a full interview → scorecard shows specific cited feedback (not generic) → clicking "Generate Roadmap" on a weak area produces a structured topic list with resources.

### Phase 6 — History + Multi-language
- Backend: `/history` endpoint, translation layer wrapping question/answer I/O.
- Frontend: `HistoryPage` with trend chart, language selector in `InterviewSetupPage`.
- **Test checkpoint:** Run interview in a non-English language end-to-end (question shown translated, voice in that language if TTS supports it, evaluation still accurate). Past sessions list correctly with working trend chart.

### Phase 7 — Polish, Landing/B2B pages, Deployment
- Frontend: `LandingPage` (problem → comparison table → demo), `B2BPage`.
- Both: deploy frontend to Vercel, backend to Render/Railway, connect real env vars, full smoke test in production URLs.
- **Test checkpoint:** A fresh browser, no dev tools, full flow works on the live deployed URL: signup → resume → interview → scorecard → roadmap → history.

---

## 7. Preventing Cross-LLM Mismatch — Practical Rules

1. **Design Doc is law.** Any time ChatGPT (Srajan) or Gemini (Amrita) generates a field name, endpoint, or event name that isn't in `02_DESIGN_DOC.md`, stop and correct it before continuing — don't let two different "creative" LLM outputs drift apart.
2. **Generate a shared TypeScript types file + Pydantic schemas from the same source.** Recommend: Srajan defines Pydantic schemas first (Phase 0/1), exports them as a JSON Schema, Amrita's LLM is given that JSON Schema to generate matching TS interfaces — not re-invented from prose.
3. **Test against real network calls, not mocks, from Phase 1 onward.** Mocked frontend data hides contract drift until integration — avoid it once Phase 1 backend is live.
4. **Weekly (or per-phase) sync**: both paste their current `schemas/` (backend) and `types/` (frontend) files to each other and diff manually — takes 5 minutes, prevents hours of debugging later.
5. **One person owns deployment config** (recommend Srajan, since he owns backend infra) so env var names never diverge between local and deployed.
