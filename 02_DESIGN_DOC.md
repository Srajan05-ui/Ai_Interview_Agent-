# Design Document
## AI Interview Agent — System Architecture & Frontend-Backend Contract

**This is the single most important file in this project.** Srajan (backend, on ChatGPT) and Amrita (frontend, on Gemini) must both treat every schema, endpoint, and naming convention below as **fixed law** — not a suggestion. If an LLM proposes a different field name or endpoint shape while generating code, reject it and re-paste this doc.

---

## 1. High-Level Architecture

```
┌──────────────────────┐        HTTPS/REST + WebSocket        ┌──────────────────────┐
│   FRONTEND (Amrita)  │ ────────────────────────────────────▶│   BACKEND (Srajan)   │
│  Next.js + TS        │◀──────────────────────────────────── │  FastAPI (Python)    │
└──────────────────────┘                                       └──────────────────────┘
                                                                        │
                     ┌──────────────────────────────────────────────────┼──────────────────────┐
                     ▼                                ▼                 ▼                       ▼
             PostgreSQL (users,               Vector DB (question    LLM Provider          File Storage
             sessions, scores)                bank, resume embeds)   (Claude/GPT API)       (resumes, S3)
                                                       │
                                              STT/TTS Provider
                                              (voice pipeline)
```

- All client-server communication is **JSON over REST** for standard CRUD, and **WebSocket** for the live interview (streaming transcript + streaming AI audio/text).
- Auth is via **Firebase Authentication** — frontend gets a Firebase ID token, sends it on every request; backend verifies it with Firebase Admin SDK. Neither side builds custom OAuth. **MVP ships Google + GitHub only** — Phone OTP is deferred (Firebase bills per verification past a small free quota, which conflicts with the $0-budget requirement; see Tech Stack doc §2a). Re-add once there's budget, no schema change needed since `authProvider` is already a string enum.

---

## 2. Naming Conventions (non-negotiable)

- REST endpoints: `kebab-case`, prefixed `/api/v1/...`
- JSON fields: `camelCase` everywhere (both request and response bodies) — this avoids the classic Python-`snake_case`-vs-JS-`camelCase` mismatch. Backend converts internally.
- WebSocket event names: `snake_case` strings, e.g. `"question_generated"`, `"transcript_chunk"`.
- IDs: all entity IDs are strings (UUID v4), never rely on integer auto-increment in API responses.
- Timestamps: ISO 8601 strings, UTC, e.g. `"2026-08-16T10:32:00Z"`.

---

## 3. Auth Contract

**Frontend → Backend:** every authenticated request includes header:
```
Authorization: Bearer <firebase_id_token>
```

**Backend → Frontend (on any `/api/v1/auth/me` call or after login):**
```json
{
  "userId": "uuid-string",
  "email": "user@example.com",
  "displayName": "Srajan Kumar",
  "authProvider": "google | github",
  "profileComplete": true,
  "targetRole": "AI Engineer",
  "experienceLevel": "fresher | 1-3yrs | 3+yrs",
  "createdAt": "2026-08-16T10:32:00Z"
}
```
Amrita's screens (dashboard, header, etc.) only ever read this exact shape — Srajan's login page is the only place that talks to Firebase directly.

---

## 4. Core Data Models (PostgreSQL)

### `users`
| field | type |
|---|---|
| id (uuid, pk) | |
| email | text |
| display_name | text |
| auth_provider | text |
| target_role | text nullable |
| experience_level | text nullable |
| created_at | timestamptz |

### `resumes`
| field | type |
|---|---|
| id (uuid, pk) | |
| user_id (fk) | |
| file_url | text |
| parsed_skills | jsonb (array of strings) |
| parsed_experience | jsonb |
| ats_score | int |
| ats_subscores | jsonb `{formatting, keywordMatch, structure, impactQuantification}` |
| suggestions | jsonb (array of `{section, issue, suggestion}`) |
| created_at | timestamptz |

### `interview_sessions`
| field | type |
|---|---|
| id (uuid, pk) | |
| user_id (fk) | |
| resume_id (fk, nullable) | |
| interview_type | text: `"technical" \| "coding"` |
| company_style | text nullable |
| language | text (ISO code, e.g. `"en"`, `"hi"`) |
| status | text: `"in_progress" \| "completed" \| "terminated_cheat" \| "abandoned"` |
| started_at | timestamptz |
| ended_at | timestamptz nullable |
| concept_graph_snapshot | jsonb (final topic mastery map) |

### `interview_turns`
| field | type |
|---|---|
| id (uuid, pk) | |
| session_id (fk) | |
| turn_index | int |
| question_text | text |
| question_topic | text |
| question_difficulty | text: `"easy" \| "medium" \| "hard"` |
| adaptive_reason | text (the "why this question next" string) |
| candidate_answer_text | text |
| candidate_code | text nullable (coding mode) |
| turn_score | int nullable |
| turn_feedback | text nullable |
| created_at | timestamptz |

### `scorecards`
| field | type |
|---|---|
| id (uuid, pk) | |
| session_id (fk, unique) | |
| overall_score | int |
| technical_score | int |
| communication_score | int |
| topic_breakdown | jsonb (array of `{topic, score, verdict: "strong"\|"weak"}`) |
| strong_areas | jsonb (array of strings) |
| weak_areas | jsonb (array of strings) |
| detailed_feedback | jsonb (array of `{momentRef, comment}`) |
| created_at | timestamptz |

### `roadmaps`
| field | type |
|---|---|
| id (uuid, pk) | |
| scorecard_id (fk) | |
| topics | jsonb (array of `{topic, resources: [{title, url, type}], order}`) |
| created_at | timestamptz |

---

## 5. REST API Contract (Srajan implements exactly these; Amrita calls exactly these)

### Auth
- `GET /api/v1/auth/me` → returns user object (§3)
- `PUT /api/v1/auth/profile` → body `{targetRole, experienceLevel}` → returns updated user object

### Resume
- `POST /api/v1/resume/upload` → multipart form, field `file`; optional field `jobDescription` (text)
  → response:
  ```json
  {
    "resumeId": "uuid",
    "atsScore": 78,
    "atsSubscores": {"formatting": 80, "keywordMatch": 70, "structure": 85, "impactQuantification": 65},
    "suggestions": [
      {"section": "Experience", "issue": "Bullet lacks metrics", "suggestion": "Add measurable impact, e.g. 'reduced latency by 30%'"}
    ],
    "parsedSkills": ["Python", "RAG", "FastAPI", "PostgreSQL"]
  }
  ```
- `GET /api/v1/resume/:resumeId` → same shape as above

### Interview Session
- `POST /api/v1/interview/start` → body:
  ```json
  {"resumeId": "uuid|null", "interviewType": "technical|coding", "companyStyle": "google|amazon|startup|generic", "language": "en"}
  ```
  → response: `{"sessionId": "uuid", "wsUrl": "wss://.../ws/interview/{sessionId}"}`
- `POST /api/v1/interview/:sessionId/end` → body `{"reason": "completed|cheat_detected|user_ended"}` → response `{"status": "ok", "scorecardId": "uuid|null"}`
- `GET /api/v1/interview/:sessionId` → full session + all turns (for review/history detail view)

### Scorecard & Roadmap
- `GET /api/v1/scorecard/:sessionId` → returns scorecard object (§4 shape)
- `POST /api/v1/roadmap/generate` → body `{"scorecardId": "uuid"}` → returns roadmap object

### History
- `GET /api/v1/history?userId=...&page=1&limit=10` → paginated list of past sessions with summary fields (id, date, type, overallScore, companyStyle)

### Anti-cheat event
- `POST /api/v1/interview/:sessionId/flag` → body `{"eventType": "tab_switch|screen_share_stopped|fullscreen_exit", "timestamp": "..."}` → response `{"warningsCount": 1, "action": "warn|terminate"}`

---

## 6. WebSocket Contract — Live Interview (`wss://.../ws/interview/{sessionId}`)

**Client → Server events:**
- `{"type": "audio_chunk", "data": "<base64 pcm chunk>"}`
- `{"type": "text_answer", "data": "candidate typed answer"}` (fallback if voice unsupported)
- `{"type": "code_submission", "data": {"language": "python", "code": "..."}}`
- `{"type": "end_turn"}` — candidate finished speaking/typing

**Server → Client events:**
- `{"type": "transcript_partial", "data": "live partial transcript text"}` (deduped — server owns dedup logic, never re-sends an already-finalized chunk)
- `{"type": "transcript_final", "data": "final transcript for the turn"}`
- `{"type": "question_generated", "data": {"questionText": "...", "topic": "vector_databases", "difficulty": "medium", "adaptiveReason": "Following up because your last answer on chunking was incomplete"}}`
- `{"type": "ai_audio_chunk", "data": "<base64 audio chunk>"}` (streamed TTS, sent progressively — do not wait for full audio)
- `{"type": "concept_graph_update", "data": {"ragBasics": "strong", "vectorDbs": "weak", "agenticAi": "not_covered"}}`
- `{"type": "session_terminated", "data": {"reason": "cheat_detected"}}`

---

## 7. Anti-Cheat / Copy Detection Design

- Frontend listens to: `document.visibilitychange` (tab switch/minimize), screen-share `track.onended` (share stopped), Fullscreen API `fullscreenchange` (exited fullscreen if enforced).
- On any violation: frontend immediately calls `POST /api/v1/interview/:sessionId/flag`.
- Backend policy: **1st violation → warning returned to frontend (show modal, resume allowed)**; **2nd violation → `action: "terminate"`** → frontend ends session, calls `/end` with `reason: "cheat_detected"`, and a scorecard is still generated from partial data (marked as incomplete).
- This threshold (1 warning, then terminate) is configurable server-side via an env var, not hardcoded, so it can be tuned without a redeploy of frontend.

---

## 8. Adaptive Engine / Concept Graph (Backend internal design, exposed via WS)

- Maintain an in-memory (Redis-backed for persistence across reconnects) map per session: `{topic: masteryScore}`.
- After each turn: LLM call evaluates the answer against a rubric for that topic → updates `masteryScore` → this updated map is what's sent as `concept_graph_update`.
- Next question selection: weighted toward topics with `masteryScore` in an "uncertain" band (not too high, not too low) — this is what produces meaningful adaptive follow-ups instead of random branching.
- Question generation is **grounded**: pull from the tagged question bank (topic + difficulty) stored in the vector DB first; LLM personalizes phrasing and generates the specific follow-up wording, but the underlying fact/concept must trace back to a verified bank entry for technical-fact questions (anti-hallucination requirement from PRD §4.4).

---

## 9. Frontend Component Map (Amrita)

- `LandingPage` — problem statement, comparison table, demo CTA
- `AuthProvider` (consumes Srajan's login page output — reads Firebase auth state)
- `DashboardPage` — resume status, quick-start interview, recent scores
- `ResumeUploadPage` — upload UI, ATS score display, suggestions list
- `InterviewSetupPage` — type/company/language selection, permission requests (mic/cam/screen)
- `InterviewRoomPage` — the core live UI:
  - `TranscriptPanel` (live, deduped)
  - `TopicProgressMap` (curriculum-aware visual)
  - `AdaptiveReasonBadge` ("why this question next")
  - `CodeEditorPanel` (coding mode only)
  - `MediaControls` (mic/cam/screen toggle, cheat-warning modal)
- `ScorecardPage` — fused technical + communication report, strong/weak areas, "Generate Roadmap" button
- `RoadmapPage` — structured topic list with resources
- `HistoryPage` — list + trend chart of past sessions
- `B2BPage` — static marketing page

---

## 10. Sequence: Resume Upload → ATS Score
1. Amrita's `ResumeUploadPage` → `POST /api/v1/resume/upload` (multipart)
2. Backend: extract text (PDF/DOCX parser) → LLM call for skill/experience extraction → rule+LLM hybrid ATS scoring → store in `resumes` table
3. Response returned synchronously (target < 8s); frontend shows loading state with the exact loading copy pattern already used elsewhere in the app

## 11. Sequence: Live Interview Turn
1. Frontend opens WebSocket on session start
2. Backend sends first `question_generated`
3. Candidate speaks → frontend streams `audio_chunk` events → backend streams `transcript_partial` → on silence-detection or manual "done", backend sends `transcript_final`
4. Backend scores turn, updates concept graph, sends `concept_graph_update`, generates next `question_generated` (with `adaptiveReason`)
5. Repeat until interview end condition (time limit, topic coverage, or manual end) → backend triggers scorecard generation → frontend redirected to `ScorecardPage`

---

## 11a. LLM Router — $0-Budget Fallback Chain (Backend internal, `services/llm_router.py`)

This project runs on zero budget, so no single LLM provider's free quota is trusted alone. Every LLM call in the backend (question generation, answer evaluation, resume parsing, roadmap generation) must go through one function, not call a provider SDK directly:

```python
async def generate(prompt: str, response_schema: dict | None = None) -> LLMResult:
    # tries providers in order, returns on first success
```

**Fallback order and why:**
1. **Gemini API** (primary) — largest genuinely-renewing free daily quota of the three.
2. **Groq** (fallback) — fast inference, generous free tier, used automatically on Gemini 429/5xx.
3. **OpenRouter `:free` models** (last resort) — capped at ~20 req/min and ~50 req/day on an unfunded account, so this exists only to absorb rare simultaneous rate-limit hits on the two above, never as a volume path. Model ID list must be an array, not a single hardcoded ID, since `:free` models rotate out without notice — the router should try the next ID in the list on a 404/model-removed error.
4. **Final degrade — no LLM call.** If all three providers fail in the same request, the adaptive engine falls back to pulling the next question directly from the pre-tagged question bank (topic + difficulty match, no personalized phrasing) so the interview session **completes instead of crashing**. This is the one behavior every developer must preserve: an LLM outage is never allowed to end a candidate's session.

**Retry policy:** exponential backoff (1s → 2s → 4s) within a single provider before moving to the next provider in the chain; total time budget per call capped (e.g. 8s) so the WebSocket turn doesn't stall indefinitely — if the budget is exceeded, go straight to step 4.

**Contract note:** `generate()` returns the same `LLMResult` shape regardless of which provider actually served the request — callers (question generation, scoring, etc.) never need to know or care which provider answered. This keeps Design Doc §5/§6 response schemas stable no matter which link in the chain fired.

---

## 12. Multi-language Layer
- Backend stores questions/answers internally in English (canonical) for consistent evaluation.
- A translation step wraps both directions: `question_generated.questionText` is translated to `session.language` before sending; candidate's `transcript_final` is translated back to English before scoring if `language != "en"`.
- This keeps the rubric/scoring logic single-language internally — translation is a pure I/O boundary layer, not baked into the scoring prompts.
