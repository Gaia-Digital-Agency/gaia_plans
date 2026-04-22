# Specialty Service Playbook (Brian × Blossom School Catering)

End-to-end reference for how an **Openclaw specialty agent** operates a
vertical business app. Using **Brian** — the WhatsApp ordering assistant
for **Blossom School Catering** (BSC) — as the canonical live example.

This is the pattern to copy when you need to stand up a new
conversational agent that drives a specific product: not a generic
site-wide web-manager (see `openclaw_website_playbook.md`) but a
**domain specialist** with fixed skills, a fixed API, and a fixed user
population.

> **Companion docs**
> - [`openclaw_website_playbook.md`](./openclaw_website_playbook.md) — the
>   generic `/api/web-manager/*` pattern (Victor × templategen).
> - [`figma_to_site_playbook.md`](../rhproperties_react/docs/figma_to_site_playbook.md) —
>   building a VRTPN site from a Figma design.

---

## Table of contents

1. [What makes this "specialty"](#1-what-makes-this-specialty)
2. [The two-box topology](#2-the-two-box-topology)
3. [Prerequisites](#3-prerequisites)
4. [Phase 1 — The Blossom School Catering product](#4-phase-1--the-bsc-product)
5. [Phase 2 — Brian + Orders (the two-agent split)](#5-phase-2--brian--orders)
6. [Phase 3 — `openclaw.json` for a specialty tenant](#6-phase-3--openclawjson)
7. [Phase 4 — The skill catalog (SKILL-BSC-\*)](#7-phase-4--the-skill-catalog)
8. [Phase 5 — The identity + family-context protocol](#8-phase-5--identity--family-context)
9. [Phase 6 — The multi-turn registration flow](#9-phase-6--multi-turn-registration)
10. [Phase 7 — The WhatsApp↔API message loop](#10-phase-7--the-whatsapp-api-loop)
11. [Daily operations cookbook](#11-daily-operations-cookbook)
12. [Onboarding a new specialty agent](#12-onboarding-a-new-specialty-agent)
13. [Gotchas we hit](#13-gotchas-we-hit)
14. [Credentials + secrets map](#14-credentials--secrets-map)
15. [File map](#15-file-map)
16. [Appendix A — Decisions log](#16-appendix-a--decisions-log)

---

## 1. What makes this "specialty"

A **generic** agent (Victor, templategen) takes a sentence and picks a
path. A **specialty** agent (Brian, BSC) takes a sentence and picks a
**skill** from a tight, closed list — because the product only supports a
tight, closed list of verbs.

| | Generic agent (Victor) | Specialty agent (Brian) |
|---|---|---|
| Channel | Telegram + web control UI | WhatsApp only |
| Subagents | 6 (booking, writer, web-manager, copywriter, drive, analyst) | **1** (orders) |
| Skills | Discover / route freely | 8 hand-written SKILL-BSC-\*.md files, one per product verb |
| Target | Any site exposing `/api/web-manager/*` | **One** NestJS API at `schoolcatering.gaiada1.online` |
| User population | Anyone who messages the bot | Registered parents + youngsters at 2 schools |
| Auth model | Bearer secret per site manifest | Admin JWT + sender phone → `family_id` lookup |
| State | Stateless between turns | Stateless **except** registration (file-backed state in `memory/`) |

The design principle: **a specialty agent is thin at the top and
opinionated at the bottom.** Brian himself does nothing except delegate;
Orders has one skill per product verb, and each skill is step-numbered.
The specialization lives in the skills, not in the agent brain.

---

## 2. The two-box topology

| Box | Purpose | Path |
|---|---|---|
| `gda-ai01` (34.143.206.68) | Openclaw runtime — Brian (main) + Orders (sub) + WhatsApp channel | `/opt/.openclaw-bsc/` |
| `gda-ce01` (34.158.47.112) | Production app — Next.js web + NestJS API + Postgres | `/var/www/schoolcatering/` |
| GitHub | Source of truth | `git@github.com-net1io:Gaia-Digital-Agency/blossom_schoolcatering.git` |

**Live URLs:**
- Website — https://blossomcatering.online/ (→ `https://schoolcatering.gaiada1.online`)
- API base — https://schoolcatering.gaiada1.online/api/v1
- Openclaw control UI — https://bsc.gaiada0.online
- WhatsApp sender — **Brian** (the `main` agent's account)

**Runtime ports:**
- `gda-ai01` — Openclaw gateway on `18789` (loopback, token `bsc123abc`)
- `gda-ce01` — `schoolcatering-api` on `3000`, `schoolcatering-web` on `4173`

**Flow (one WhatsApp "order lunch for Elizabeth tomorrow"):**

```
Parent (WhatsApp)
  → Brian (id: main)                  [routing only — no skill execution]
  → sessions_spawn → Orders (id: orders)
    → SKILL-BSC-AUTHENTICATE          [phone → sender + family_id]
    → SKILL-BSC-ORDER                 [parses, picks childUsername, POSTs]
      → POST /auth/login              [admin JWT]
      → POST /order/quick             [the actual order]
  → Orders returns text to Brian
  → Brian sends ONE WhatsApp message back to the parent
```

**Rule:** every arrow that crosses a box is a `curl`. Everything in
Openclaw is plain HTTP to the NestJS API — there's no shared DB, no
message queue, no webhooks going the other direction.

---

## 3. Prerequisites

### To read / operate this system

```bash
ssh gda-ai01   # Brian's runtime box
ssh gda-ce01   # BSC app box
```

Both should work without a password via `~/.ssh/config`.

### On `gda-ai01` (already provisioned)

- Node 22+, Python 3.11+, systemd user services
- The Openclaw runtime, tenant `bsc` at `/opt/.openclaw-bsc/`
- `openclaw-bsc-gateway` user service listening on `127.0.0.1:18789`
- WhatsApp session state in `/opt/.openclaw-bsc/delivery-queue/`
- DeepSeek + Gemini + Anthropic credentials in `credentials/`

### On `gda-ce01` (already provisioned)

- Node 20+, pnpm, PM2, Postgres, nginx
- Repo at `/var/www/schoolcatering/`
- PM2 apps: `schoolcatering-api` (:3000) and `schoolcatering-web` (:4173)
- GCS buckets + Vertex AI (for the product's own AI features — separate
  from Brian)

---

## 4. Phase 1 — The BSC product

Blossom School Catering is a role-based meal-ordering platform for Bali
international schools.

### 4.1 Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js (runs on port 4173) |
| Backend | NestJS (port 3000, all paths under `/api/v1`) |
| DB | PostgreSQL |
| Process manager | PM2 (`ecosystem.config.cjs`) |
| Media | Google Cloud Storage bucket |
| In-app AI | Vertex AI Gemini 2.5 Flash (`asia-southeast1`), rate-limited to 100 requests/day per product config — unrelated to Brian |

### 4.2 Domain model (the parts Brian reaches for)

| Concept | Shape |
|---|---|
| **Roles** | `PARENT`, `YOUNGSTER`, `ADMIN`, `KITCHEN`, `DELIVERY` |
| **Sessions** | `BREAKFAST`, `LUNCH`, `SNACK` |
| **Family** | Canonical key: `family_id` (UUID). `parents[]` + `children[]` both carry `family_id`. **Never** infer membership from surname. |
| **Student username** | `lastname_firstname` (e.g. `syrowatka_elizabeth`) — always look up, never guess |
| **Schools (active)** | `Bali Island School`, `Sanur Independent School` — fetched live, not hardcoded |
| **Service calendar** | No service Saturday/Sunday. No service on school blackout dates. |

### 4.3 API surface Brian uses

```
POST   /auth/login                           admin token
GET    /public/lookup-name?phone=PHONE       sender identity (no auth)
GET    /public/menu?session=LUNCH|SNACK|BREAKFAST   active menu (no auth)
GET    /admin/family-context?phone=PHONE     family roster by phone (admin)
GET    /admin/family-orders?phone=&date=     family's orders on a date (admin)
GET    /admin/orders                         all orders (admin, for favourites)
POST   /order/quick                          place an order (admin)
DELETE /orders/:orderId                      cancel an order (admin)
POST   /auth/register/youngsters             register a family (public)
GET    /auth/register/schools                live school list (public)
POST   /admin/families/merge                 fix split families (admin, rare)
POST   /auth/dev/test-registration           dev-only, admin role
DELETE /auth/dev/test-registration           dev-only cleanup
```

The "everything uses admin JWT" pattern is deliberate: the agent
impersonates the `admin` user for every write, and authorizes the
**requester** itself using the phone → family_id lookup. The API is not
expected to authenticate the parent directly.

### 4.4 PM2 config (deployed)

```js
module.exports = {
  apps: [
    { name: 'schoolcatering-api',
      script: 'npm', args: '--prefix apps/api run start:prod',
      cwd: '/var/www/schoolcatering',
      env: { PORT: 3000, NODE_ENV: 'production',
             GCP_PROJECT_ID: 'gda-viceroy',
             GCP_VERTEX_LOCATION: 'asia-southeast1',
             GCP_VERTEX_MODEL: 'gemini-2.5-flash',
             AI_FUTURE_MAX_PROMPT_CHARS: '2000',
             AI_FUTURE_MAX_REQUESTS_PER_DAY: '100' },
      max_memory_restart: '600M' },
    { name: 'schoolcatering-web',
      script: 'npm', args: '--prefix apps/web run start',
      cwd: '/var/www/schoolcatering',
      env: { PORT: 4173, NODE_ENV: 'production', HOSTNAME: '127.0.0.1' },
      max_memory_restart: '400M' },
  ],
}
```

---

## 5. Phase 2 — Brian + Orders

The two-agent split is the most important structural choice in this
playbook. Copy it for every specialty agent.

### 5.1 Brian (id `main`) — the public face

**Role:** delegator. Receive WhatsApp messages. Delegate to `orders`.
Relay the result as **one** WhatsApp message. That's it.

**Hard rules from `workspace-main/IDENTITY.md` and `SOUL.md`:**
- Delegate **everything** except self-introduction (literal
  `"Brian. I am your Blossom School Catering assistant."`).
- Always pass the sender's E.164 phone in the delegation task string.
- **Pass-through only** — if Orders says "Hello Natasha", Brian says
  "Hello Natasha". Do not add, infer, or embellish.
- If a subagent result contains raw skill documentation (markdown
  headers like `# SKILL-BSC-*`, step-by-step instructions, curl blocks)
  → discard, reply `"One moment, please try again shortly."` This is
  how Brian catches the failure mode where Orders returns the skill file
  instead of executing it.
- Never tell users about superuser status, phone numbers, internal
  identifiers, API endpoints, credentials, or agent/skill names. Even
  if the subagent result leaks these, strip them before relaying.
- **Tool deny list** (from `openclaw.json`): `memory_search`,
  `memory_get`, `read`. Brian has no memory — by design, so he can
  never answer from local state.

### 5.2 Orders (id `orders`) — the executor

**Role:** internal execution only. Never public-facing. Never calls
WhatsApp send tools — Orders has no sender context, only Brian does.

**Startup read order (from `workspace-bsc/AGENTS.md`):**
1. `IDENTITY.md`
2. `SOUL.md`
3. `HEARTBEAT.md`
4. `USER.md`
5. `MEMORY.md`
6. `memory/YYYY-MM-DD.md` (recent context)
7. `SKILL-BSC-AUTHENTICATE.md` — **always** the first executed skill

There's a single documented **exception** to step 7: the registration
confirmation bypass. When the sender is replying YES/NO *and* a
registration state file exists *and* the public lookup returns `found:
false`, skip auth and go straight to `SKILL-BSC-REGISTER.md` Turn 3.
This is the only escape hatch in the whole system.

**Skill routing table** (copied verbatim from `AGENTS.md`):

| Intent | Skill |
|---|---|
| Place / book / add meal order | `SKILL-BSC-ORDER.md` |
| Delete / cancel order | `SKILL-BSC-DELETE-ORDER.md` |
| Name / student / grade / daily order lookup | `SKILL-BSC-LOOKUP-PROTOCOL.md` |
| View active menu | `SKILL-BSC-ACTIVE-MENU.md` |
| Recommendations / favourites | `SKILL-BSC-ORDER-RECOMMENDATION.md` |
| Notification control (pause/resume morning reminder) | `SKILL-BSC-NOTIFICATION-CONTROL.md` |
| Register new family via WhatsApp | `SKILL-BSC-REGISTER.md` |

**Tool deny list:** `memory_search`, `read`. Orders can write but not
read memory — prevents "answer from memory" antipatterns.

### 5.3 Why split into two agents

1. **Context size.** Brian stays tiny — he never loads skill files.
   Orders loads only the one skill it's routing to.
2. **Clean voice.** Brian's `SOUL.md` forbids internal commentary and
   structured reports; Orders often returns structured scratchpads
   (`SENDER_PHONE: +62...` blocks). Brian's pass-through filter means
   the user never sees Orders' raw scratchpad.
3. **Channel isolation.** Brian owns the WhatsApp session. Orders has
   no tool to send messages at all — so no skill can accidentally
   double-send.
4. **Rate limiting.** The WhatsApp channel has
   `debounceMs: 1500` (config). Orders may do 3–5 HTTP calls per turn,
   but only one WhatsApp message ever goes out.

---

## 6. Phase 3 — `openclaw.json` for a specialty tenant

Compare to Victor's `openclaw.json` (`/opt/.openclaw-var`) — the
specialty version is much narrower.

```jsonc
{
  "acp": { "defaultAgent": "main" },
  "agents": {
    "defaults": {
      "model": { "primary": "deepseek/deepseek-chat",
                 "fallbacks": ["google/gemini-2.5-flash"] },
      "workspace": "/opt/.openclaw-bsc/workspace-main",
      "memorySearch": { "enabled": true,
                        "store": { "path": ".../memory/{agentId}.sqlite" } },
      "compaction": { "mode": "safeguard" },
      "maxConcurrent": 4,
      "subagents": { "maxConcurrent": 8 }
    },
    "list": [
      { "id": "main",
        "workspace": "/opt/.openclaw-bsc/workspace-main",
        "identity": { "name": "Brian" },
        "subagents": { "allowAgents": ["orders"] },         // ← only one sub
        "groupChat": { "mentionPatterns":
          ["Brian","@Brian","brian","Gaiada AI Team"] },
        "tools": { "deny": ["memory_search","memory_get","read"] } },
      { "id": "orders",
        "workspace": "/opt/.openclaw-bsc/workspace-bsc",
        "identity": { "name": "Orders" },
        "groupChat": { "mentionPatterns": ["Orders","@Orders","orders"] },
        "tools": { "deny": ["memory_search","read"] } }
    ]
  },

  "broadcast": {
    "*": ["main"],
    "+6281138210188": ["main"]           // superuser is also routed to main
  },

  "channels": {
    "whatsapp": {
      "enabled": true,
      "accounts": { "main": {
        "name": "Brian", "dmPolicy": "open",
        "allowFrom": ["*"], "groupPolicy": "open",
        "debounceMs": 1500 } },
      "mediaMaxMb": 50
    }
  },

  "gateway": {
    "mode": "local",
    "auth": { "mode": "token", "token": "bsc123abc" },
    "controlUi": { "allowedOrigins": ["https://bsc.gaiada0.online"] },
    "trustedProxies": ["127.0.0.1","::1"]
  },

  "plugins": {
    "load": { "paths": [
      "/opt/.openclaw-bsc/plugins/mcp-tools",
      "/opt/.openclaw-bsc/workspace-main",
      "/opt/.openclaw-bsc/workspace-bsc" ] },
    "entries": {
      "acpx": { "enabled": true }, "browser": { "enabled": true },
      "google": { "enabled": true }, "anthropic": { "enabled": true },
      "deepseek": { "enabled": true } }
  }
}
```

**Notable differences vs. Victor:**

| | Victor (`.openclaw-var`) | Brian (`.openclaw-bsc`) |
|---|---|---|
| `agents.list` | 7 agents | **2** (main + one sub) |
| `channels` | Telegram | **WhatsApp** |
| Gateway port | 19289 | **18789** |
| Gateway token | `var123abc` | **`bsc123abc`** |
| `plugins.load.paths` | (default) | **explicitly loads the two workspaces** so skills files are discoverable at runtime |
| `broadcast` | `"*": ["main"]` | `"*": ["main"]` **plus** `"+6281138210188": ["main"]` (superuser re-broadcast) |
| Brian's tool `deny` | — | `memory_search`, `memory_get`, `read` (enforces pass-through) |

---

## 7. Phase 4 — The skill catalog

Eight files in `/opt/.openclaw-bsc/workspace-bsc/`. Each corresponds to a
product verb. Each starts with an authenticate step (except notification
control, which is superuser-only).

| Skill | Verb | Auth path | API calls |
|---|---|---|---|
| `SKILL-BSC-AUTHENTICATE.md` | Resolve sender | public + admin | `/public/lookup-name` + `/auth/login` + `/admin/family-context` |
| `SKILL-BSC-ORDER.md` | Place order(s) | admin | `/auth/login` + `/admin/family-context` + `/order/quick` |
| `SKILL-BSC-DELETE-ORDER.md` | Cancel order | admin + YES confirm | `/auth/login` + `DELETE /orders/:id` |
| `SKILL-BSC-LOOKUP-PROTOCOL.md` | Name / kids / grades / daily order | admin | `/admin/family-context` + `/admin/family-orders` |
| `SKILL-BSC-ACTIVE-MENU.md` | What's for \<session\> | **none** | `/public/menu?session=...` |
| `SKILL-BSC-ORDER-RECOMMENDATION.md` | Top dishes | admin | `/admin/family-context` + `/admin/orders` (client-side filter + tally) |
| `SKILL-BSC-NOTIFICATION-CONTROL.md` | Pause / resume morning notif | file-only | writes `daily_notification_control.json` |
| `SKILL-BSC-REGISTER.md` | Multi-turn WA registration | public + file state | `/auth/register/schools` + `/auth/register/youngsters` + state file I/O |
| `SKILL-BSC-REGISTER-STATE.md` | State schema for registration | — | file I/O only (protocol, not a verb) |

### 7.1 The shape every skill file uses

1. **Trigger phrases** — natural-language clues that pick this skill.
2. **Step 0 — Authenticate** — call `SKILL-BSC-AUTHENTICATE.md` first,
   or document the exception.
3. **Numbered execution steps** — literal `curl` commands. No pseudocode.
4. **Reply format** — exact text templates for success / error / timeout.
5. **Rules** — privacy, retries, fallbacks, "never do X".

This is deliberately prescriptive. The skill file is the spec; Orders
follows it literally. Anywhere a skill says "retry once" means retry
exactly once — not a loop, not an exponential backoff.

### 7.2 Order placement — three-step fallback

`SKILL-BSC-ORDER.md` ships three attempt shapes because `/order/quick`
has drifted across versions:

```
Attempt A — with both fields
POST /order/quick
{ "childUsername":"…","senderPhone":"…","date":"YYYY-MM-DD",
  "session":"LUNCH","dishes":["…"] }

Attempt B — childUsername only (if A fails w/ senderPhone validation error)
POST /order/quick
{ "childUsername":"…","date":"…","session":"…","dishes":["…"] }

Attempt C — senderPhone only (if B also fails)
POST /order/quick
{ "senderPhone":"…","date":"…","session":"…","dishes":["…"] }
```

**Banned payload keys** (drift from early versions): `orderDate`,
`studentUsername`, any nested object for `date`. `date` must be a plain
`YYYY-MM-DD` string in Asia/Makassar local date.

**401 handling:** re-login once, retry once. Never a second retry.

**Multi-date orders** ("order for April"): login **once**, loop through
dates, skip Sat/Sun client-side, collect per-date result, report one
aggregate summary.

### 7.3 Delete has a human-in-the-loop

`SKILL-BSC-DELETE-ORDER.md` is the only destructive verb. Protocol:

1. Ask for `yes` confirmation with a templated prompt.
2. Wait ≤ 60 seconds.
3. If `yes` arrives → `DELETE /orders/:id` with admin token.
4. If anything else arrives, or 60s elapse → abort with fixed reply
   `"Order Deletion aborted due to mo confirmation"` *(yes, the typo is
   in the canonical text — don't "fix" it)*.

### 7.4 Scoping replies to the named student

Lookups and recommendations must **scope to the student the user named**
— not list siblings. From `SKILL-BSC-LOOKUP-PROTOCOL.md`:

- "what's **Natasha's** order today" → show **only** Natasha's order.
- "what are **my orders** today" → show the whole family.
- Ambiguous ("what's my order") + multiple children → ask which.

Don't leak siblings. Privacy trumps completeness.

---

## 8. Phase 5 — Identity + family-context

This is the one protocol every non-public skill shares. Get it right
once and every other skill works.

### 8.1 The four steps

```
Step 1  Extract SENDER_PHONE from sender metadata (E.164, e.g. +628…)
Step 2  If SENDER_PHONE == +6281138210188 → IS_SUPERUSER = true
Step 3  GET /public/lookup-name?phone=SENDER_PHONE
        → SENDER_NAME, SENDER_USERNAME, SENDER_ROLE, SENDER_FIRST_NAME
Step 4  POST /auth/login (admin/Teameditor@123) → TOKEN
        GET /admin/family-context?phone=SENDER_PHONE  [Bearer TOKEN]
        → FAMILY_ID, LINKED_STUDENTS[], LINKED_PARENTS[]
```

Output block (Orders returns this to itself, not to the user):

```text
SENDER_PHONE: +62...
SENDER_NAME: Anthony Syrowatka
SENDER_FIRST_NAME: Anthony
SENDER_USERNAME: syrowatka_dewi
SENDER_ROLE: PARENT | YOUNGSTER
IS_SUPERUSER: true | false
FAMILY_ID: <uuid>
LINKED_STUDENTS_COUNT: n
LINKED_STUDENTS: [{name, firstName, username, phone}, ...]
LINKED_PARENTS:  [{name, phone, username}, ...]
```

### 8.2 The forbidden shortcuts

- **Never** infer family membership from surnames.
- **Never** use `/orders/daily` to figure out who's related — it only
  shows dated orders. Use `/admin/family-context`.
- **Never** pull a name from the phone's contact label. Use the API
  `SENDER_NAME`. Otherwise the bot ends up greeting someone by the name
  their spouse saved them under.
- **Never** tell the user they are a superuser. It's an internal flag.

### 8.3 Three roles, three authorization rules

| Sender role | Can order for | Notes |
|---|---|---|
| `PARENT` (Parent#1 or Parent#2) | Any child in `family.children[]` | Family resolved by `family_id`, not surname. Parent#2 is identified by their phone being on `parent2_*` — treat as first-class. |
| `YOUNGSTER` | Only themselves — `SENDER_USERNAME` is the `childUsername` | Youngster's own phone on their user record |
| `IS_SUPERUSER` (`+6281138210188`) | **Any** student, any order | Still do the lookup for greeting, but skip authorization checks |

### 8.4 Failure path

- `lookup-name` returns `found: false` **and** not superuser →
  `"I could not find your identity in the BSC system."`
- `family-context` returns `found: false` → don't invent family. Use
  whatever identity was resolved and proceed best-effort.

---

## 9. Phase 6 — Multi-turn registration

The one stateful flow. Blossom supports full WhatsApp onboarding without
the web UI — it's a three-turn conversation with a file-backed state
bridge.

### 9.1 Turns

```
Turn 1 — intent detected ("register", "daftar", …)
  • Check /public/lookup-name — if already registered, reply with
    a "you already have an account" message and stop
  • Else reply with the combined welcome + form template
    (the exact markdown in SKILL-BSC-REGISTER.md)

Turn 2 — filled template received
  • Parse fields (Family name, Parent first, Email, Password, Parent Phone,
    1..n Students with name/gender/DOB/school/grade/phone/allergies)
  • GET /auth/register/schools — fetch live list (never hardcode UUIDs)
  • Fuzzy-match typed school name to school id
  • Validate email, password strength (≥6 chars, upper+lower+digit+symbol),
    phone E.164, DOB, gender (M/F→MALE/FEMALE)
  • Write state file registration_{PHONE_DIGITS}.json with 15-min TTL
  • Reply with a confirmation summary (password shown as "set ✓")
    and ask YES/NO

Turn 3 — YES / NO received
  • Bypass SKILL-BSC-AUTHENTICATE (the one documented exception)
  • Read state file. If expired → reply "your registration expired,
    please start again"
  • On YES: POST /auth/register/youngsters with the payload; on success
    delete state file, reply with success + username
  • On NO: delete state file, reply "registration cancelled"
```

### 9.2 State file

Location (gitignored, not served by MCP filesystem):

```
/opt/.openclaw-bsc/memory/registration_{PHONE_DIGITS}.json
```

`PHONE_DIGITS` is the E.164 with the leading `+` stripped
(`+6281…` → `6281…`).

Schema (from `SKILL-BSC-REGISTER-STATE.md`):

```json
{
  "step": "awaiting_confirmation",
  "created_at": "2026-04-21T10:00:00.000Z",
  "expires_at": "2026-04-21T10:30:00.000Z",
  "sender_phone": "+628123456789",
  "payload": {
    "registrantType": "PARENT",
    "parentFirstName": "...", "parentLastName": "...",
    "parentMobileNumber": "+628...", "parentEmail": "...",
    "password": "<actual-value-never-echoed>",
    "students": [{
      "youngsterFirstName": "...",
      "youngsterGender": "MALE",             // normalised from M
      "youngsterDateOfBirth": "YYYY-MM-DD",  // normalised from DD/MM/YYYY
      "youngsterSchoolId": "<uuid>",
      "youngsterGrade": "G9",
      "youngsterPhone": "",                  // omit if blank → API falls back
      "youngsterAllergies": "none"
    }]
  }
}
```

**TTL:** exactly 15 minutes. Past `expires_at` → purge on next turn.

**File I/O rule:** use bash / `python3 -c` to read/write. **Do not** use
MCP filesystem — that path isn't served by it. The docs flag this
explicitly because it's a common wrong turn.

### 9.3 Why file-backed state and not agent memory

1. Brian has **no** memory (tool deny `memory_*`). If state lived in
   memory, only Orders could see it — and registration reply Turn 3
   hits Brian first.
2. The bypass rule ("skip auth if state file exists and sender is not
   registered") is easier to gate on a filesystem check than a memory
   query — `ls` is cheap and deterministic.
3. The file IS the audit trail. `ls memory/registration_*.json` tells
   you exactly who has an abandoned registration in flight.

### 9.4 School resolution is live

Never commit a school UUID into skill files. Fetch at Turn 2:

```bash
curl -s https://schoolcatering.gaiada1.online/api/v1/auth/register/schools
# → [{"id":"<uuid>","name":"Bali Island School","city":"Denpasar"}, ...]
```

Fuzzy match rules (in `SKILL-BSC-REGISTER.md`):
- Case-insensitive, partial match OK
- "BIS" / "bali island" / "bali" → Bali Island School
- "SIS" / "sanur independent" / "sanur" → Sanur Independent School
- Any new school the platform adds matches automatically — no agent
  update required

---

## 10. Phase 7 — The WhatsApp↔API loop

A literal end-to-end trace for "place lunch for Elizabeth on April 24:
beef rice bowl".

### Step 1 — WhatsApp inbound → Brian

Brian's WhatsApp account receives the message. `openclaw.json`
`channels.whatsapp.accounts.main` is the single account; sender context
includes the E.164 phone.

### Step 2 — Brian → Orders (silent delegation)

Brian calls `sessions_spawn` with:
```
agentId: "orders"
task:    "place lunch for Elizabeth on April 24: beef rice bowl. Sender phone number: +628123456789"
```

Brian's text output is empty (SOUL.md forbids delegation chatter).

### Step 3 — Orders boots

Reads IDENTITY → SOUL → HEARTBEAT → USER → MEMORY → today's memory file
→ SKILL-BSC-AUTHENTICATE.

### Step 4 — Authenticate

```bash
# Step 3 — public lookup
curl https://schoolcatering.gaiada1.online/api/v1/public/lookup-name?phone=%2B628123456789
# → { "found": true, "name": "Anthony Syrowatka",
#     "firstName": "Anthony", "username": "syrowatka_dewi",
#     "role": "PARENT" }

# Step 4 — login + family context
curl -sX POST .../auth/login \
  -d '{"username":"admin","password":"Teameditor@123"}'
# → { "accessToken": "eyJ..." }

curl https://schoolcatering.gaiada1.online/api/v1/admin/family-context?phone=%2B628123456789 \
  -H "Authorization: Bearer eyJ..."
# → { "found": true, "family": { "id": "...",
#     "children": [ {"first_name":"Elizabeth","username":"syrowatka_elizabeth","school_grade":"G9",...}, ... ] } }
```

### Step 5 — Route to SKILL-BSC-ORDER

Intent: place order. Parse:
- Child name given = "Elizabeth" → match `family.children[].first_name`
  → `childUsername = syrowatka_elizabeth`
- Date = `"April 24"` → Asia/Makassar local → `2026-04-24`
- Session = `LUNCH`
- Dishes = `["Beef Rice Bowl"]`

### Step 6 — Place order (Attempt A)

```bash
curl -sX POST .../order/quick \
  -H "Content-Type: application/json" -H "Authorization: Bearer eyJ..." \
  -d '{"childUsername":"syrowatka_elizabeth","senderPhone":"+628123456789",
       "date":"2026-04-24","session":"LUNCH","dishes":["Beef Rice Bowl"]}'
# → 201 { "order": { "id": "9986F34E-...", ... } }
```

### Step 7 — Orders returns plain text

```
Order placed for Elizabeth on 24 April (Lunch): Beef Rice Bowl
Order #9986F34E
```

### Step 8 — Brian relays

Brian runs the subagent-result validator (rejects markdown headers,
curl blocks, superuser mentions, agent/skill names) — output passes —
sends one WhatsApp message back to `+628123456789`.

### Step 9 — Done

Total wall time: typically 1.5–3 s, dominated by two `curl`s + one
`/admin/family-context` call. `debounceMs: 1500` on the channel prevents
accidental double-sends.

---

## 11. Daily operations cookbook

### 11.1 Watch the gateway live

```bash
ssh gda-ai01 "journalctl --user -u openclaw-bsc-gateway --since '5 min ago' --no-pager"
```

### 11.2 Gateway health

```bash
ssh gda-ai01 "curl -s http://127.0.0.1:18789/__openclaw__/health"
```

### 11.3 Recent task runs (per-subagent execution history)

```bash
ssh gda-ai01 'python3 -c "
import sqlite3
c = sqlite3.connect(\"/opt/.openclaw-bsc/tasks/runs.sqlite\")
for r in c.execute(\"SELECT task_id,status,substr(progress_summary,1,200) FROM task_runs ORDER BY created_at DESC LIMIT 10\"):
    print(r)
"'
```

### 11.4 Inspect an in-flight registration

```bash
ssh gda-ai01 "ls /opt/.openclaw-bsc/memory/registration_*.json && \
  cat /opt/.openclaw-bsc/memory/registration_628123456789.json | jq ."
```

### 11.5 Force-cancel a stuck registration

```bash
ssh gda-ai01 "rm /opt/.openclaw-bsc/memory/registration_628123456789.json"
```
Next message from that phone will start the flow over.

### 11.6 Pause / resume the morning notification (superuser only)

Send Brian via WhatsApp (from `+6281138210188`):
```
pause daily notification
# or
resume daily notification
# or
daily notification status
```
This writes `/home/azlan/.openclaw/workspace-bsc/daily_notification_control.json`
with `dailyOrderNotifications: "PAUSED" | "ACTIVE"`.

### 11.7 Deploy skill-file changes (zero downtime)

```bash
ssh gda-ai01
cd /opt/.openclaw-bsc
git pull --ff-only origin main
# that's it — skills are read per-request, no restart needed
```

### 11.8 Deploy app-side API changes

```bash
ssh gda-ce01
cd /var/www/schoolcatering
git pull --ff-only origin main
npm -C apps/api run build
pm2 restart schoolcatering-api
# (add apps/web build + pm2 restart schoolcatering-web if web changed)
```

### 11.9 Create a synthetic test registration (clean)

Admin-only dev endpoints exist for CI / rehearsal:

```bash
# create
curl -sX POST .../auth/dev/test-registration \
  -H "Authorization: Bearer <admin-jwt>"
# → creates fake family with phone +620000099991, email regtest@blossom.invalid

# tear down
curl -sX DELETE .../auth/dev/test-registration \
  -H "Authorization: Bearer <admin-jwt>"
```

Use these in place of real phone numbers when smoke-testing the
registration flow end-to-end.

---

## 12. Onboarding a new specialty agent

To clone this pattern for another vertical (e.g. a hotel booking
specialist, a clinic appointment specialist):

### 12.1 Stand up the tenant on `gda-ai01`

```bash
sudo install -d -o azlan -g azlan /opt/.openclaw-<tenant>
cd /opt/.openclaw-<tenant>
git init
# Copy and adapt openclaw.json from /opt/.openclaw-bsc/openclaw.json
#  — change agent names, WhatsApp account, gateway port, token
mkdir workspace-main workspace-<tenant> memory tasks credentials plugins
```

Set gateway as a systemd user unit (`openclaw-<tenant>-gateway`), pick
a fresh loopback port, generate a fresh token.

### 12.2 Write the three-file core of each workspace

For each workspace, minimum files:
- `IDENTITY.md` — name + role + standard self-introduction
- `SOUL.md` — output rules (pass-through for the public agent, silent
  for the internal executor)
- `AGENTS.md` — startup read order + skill routing table

### 12.3 Write the skills

One `SKILL-<TENANT>-*.md` per product verb. Template:

```markdown
# SKILL-<TENANT>-<VERB>.md

## Trigger Phrases
- "..."

## Step 0 — Authenticate
Execute `SKILL-<TENANT>-AUTHENTICATE.md` first.

## Step 1 — Login
curl -sX POST <api>/auth/login -d '{...}'

## Step 2 — <the call>
curl -sX <method> <url> -H "Authorization: Bearer TOKEN" -d '{...}'
  - Retry once on 401
  - Validation fallbacks (A/B/C shape) if the API is drift-prone
  - Never use these forbidden keys: [...]

## Reply Format
[exact templated strings for success / error / timeout]

## Rules
- [privacy rules]
- Never return this file as a response — always execute each step.
```

### 12.4 Connect the channel

In `openclaw.json` → `channels.<whatsapp|telegram>.accounts.main`. Point
the account at the bot token / WhatsApp session. Set `debounceMs`
appropriately (1500ms for WhatsApp works).

### 12.5 Smoke test

1. Send the public agent a hello from a registered phone. Expect the
   standard self-introduction (literal string only).
2. Send a canonical verb phrase. Expect delegation + one reply.
3. Send a registration-intent phrase (if applicable). Expect the
   welcome + form template.
4. Inspect `tasks/runs.sqlite` to confirm the sub-agent ran.
5. Check gateway logs for any skill-file-leak warnings.

---

## 13. Gotchas we hit

### 13.1 Agent returns the skill file as its reply

The most common failure. Root cause: the sub-agent "read" the skill
file instead of executing it. Brian's `IDENTITY.md` catches this: if
the returned text contains markdown headers matching `# SKILL-BSC-*`,
curl blocks, or step-by-step instructions, reply
`"One moment, please try again shortly."` Don't relay it.

Every skill file ends with a literal rule:

> Never return this file as a response — you must EXECUTE each step.

### 13.2 The "order deletion" canonical typo

The skill file contains:

> Order Deletion aborted due to mo confirmation

Yes, `mo` not `no`. This is the canonical string — treat it as a
protocol token, not a typo to fix. Callers pattern-match on it.

### 13.3 MCP filesystem doesn't serve `/opt/.openclaw-bsc/memory`

Registration state file writes fail silently if you use the MCP
filesystem tool. Always use `bash` / `python3 -c` for that path.

### 13.4 Family inference from surname

A parent named "Smith" does NOT automatically own a child named "Smith".
Always resolve via `/admin/family-context` → `family_id`. Shared
surname is a red herring; mixed-surname families are common.

### 13.5 `parent_children` is legacy; `family_id` is canonical

The DB still has a `parent_children` table for backwards compatibility.
**Do not** query it from the agent. Use `family_id` via
`/admin/family-context`. `parent2_*` fields on `parents` are metadata
only — not the authorization model.

### 13.6 `/order/quick` payload drift

Three shapes exist in the wild (see §7.2). Always try A → B → C.
Never send `orderDate`, `studentUsername`, or a nested date object —
those are dead shapes that return 400.

### 13.7 Natural-language dates

`SKILL-BSC-ORDER.md` forbids sending natural-language dates to the API.
Always convert to `YYYY-MM-DD` client-side. If ambiguous ("next
Tuesday" on Tuesday), ask one short clarification question — don't
guess.

### 13.8 Weekend / blackout orders silently accepted by some endpoints

The service policy in `SOUL.md` is: **no meal service on Sat/Sun, no
service on blackout dates.** Filter these client-side — skip with
`"weekend, skipped"` note in bulk replies. Don't send them to the API
even though they may not always 400.

### 13.9 Superuser leakage

If a skill result accidentally contains `"superuser"` or the literal
phone `+6281138210188`, Brian's validator strips it. But the skill
should never produce that text in the first place — `SENDER_NAME` for
greeting, `you/your` for address. Phone numbers never appear in
user-facing text.

### 13.10 One WhatsApp message per turn

The platform sends exactly one WhatsApp message per agent turn. If you
need to send a multi-part reply (welcome guide + form), compose it as
**one** message with visual dividers (`━━━━━━━━━━━━━━━`). Two
`message_send` calls in a turn → the first one gets dropped.

### 13.11 Orders has no `message_send` tool

By design. Orders' output is returned to Brian as plain text; Brian
wraps it in the WhatsApp send. If a future skill adds a `message_send`
call from Orders, WhatsApp will receive zero messages (Orders has no
sender binding). Diagnose: check `tasks/runs.sqlite` — if the run
succeeded but the user saw nothing, this is why.

### 13.12 Skill changes reload per-request

No PM2 restart, no gateway reload. `git pull` is the deploy. Keep this
in mind when editing — a half-written skill file breaks production the
moment it hits disk.

### 13.13 Egress IP for the API allowlist

Brian's egress IP is **`34.143.206.68`** (same VM as Victor). If the
BSC API ever gets an IP allowlist, it must include this. Today it
doesn't — the API trusts the admin JWT instead.

---

## 14. Credentials + secrets map

### 14.1 App side (`schoolcatering`, `gda-ce01`)

| Thing | Where | Value (demo) |
|---|---|---|
| Admin user | BSC API `users` table | `admin` / `Teameditor@123` — **the agent's identity** |
| Superuser phone | Hard-coded in skills | `+6281138210188` |
| Synthetic test phone | Dev endpoint | `+620000099991` |
| Synthetic test email | Dev endpoint | `regtest@blossom.invalid` |
| JWT secrets | `/var/www/schoolcatering/.env` | `AUTH_JWT_SECRET`, `AUTH_JWT_REFRESH_SECRET` |
| Google OAuth | `.env` | `GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID` |
| GCS | `.env` | `GCS_BUCKET`, folder vars, service-account creds |
| Vertex AI (product-side) | `ecosystem.config.cjs` | `GCP_PROJECT_ID=gda-viceroy`, `GCP_VERTEX_MODEL=gemini-2.5-flash` |

### 14.2 Agent side (`gda-ai01:/opt/.openclaw-bsc`)

| Thing | Where | Notes |
|---|---|---|
| Gateway token | `openclaw.json` → `gateway.auth.token` | `bsc123abc` — loopback only |
| Control-UI origin allowlist | `openclaw.json` → `gateway.controlUi.allowedOrigins` | `https://bsc.gaiada0.online` |
| WhatsApp session | `/opt/.openclaw-bsc/delivery-queue/`, `devices/` | Binary session state |
| Model keys (DeepSeek / Google / Anthropic) | `credentials/` | Referenced by `plugins.entries` |
| Admin creds duplicated | `workspace-bsc/TOOLS.md` + `SKILL-BSC-*.md` | `admin` / `Teameditor@123` — keep in sync on rotation |
| Superuser | `workspace-main/AGENTS.md` + all skills | `+6281138210188` — change in **every** file on reassignment |
| Registration state files | `/opt/.openclaw-bsc/memory/registration_*.json` | 15-min TTL, stripped on completion / YES / NO |
| Task run history | `/opt/.openclaw-bsc/tasks/runs.sqlite` | Observability |
| Media symlink | `/opt/.openclaw-bsc/media → /mnt/support_disk/openclaw-media` | Shared with other tenants |

### 14.3 Rotation rules

- **Admin password** — rotate in the BSC API first, then in
  `workspace-bsc/TOOLS.md` and in every `SKILL-BSC-*.md` that contains
  a `-d '{"username":"admin","password":"..."}'` literal. Grep the
  workspace before you commit:
  ```bash
  grep -r 'Teameditor' /opt/.openclaw-bsc/workspace-bsc/
  ```
- **Superuser phone** — rotate in `workspace-main/AGENTS.md`,
  `workspace-main/IDENTITY.md`, `workspace-bsc/IDENTITY.md`, every
  skill that hardcodes it, **and** in `openclaw.json` `broadcast`.
- **Gateway token** — rotate on the gateway systemd unit + anywhere
  operators use it for health checks.

---

## 15. File map

```
# ─── gda-ai01 ────────────────────────────────────────────────────────
/opt/.openclaw-bsc/
├── openclaw.json                         Root — Brian + Orders + WhatsApp channel
├── README.md                             Tenant overview
├── .openclaw/                            Tenant-local Claude config
├── .git/                                 The workspace IS a git repo
├── workspace-main/                       Brian (public WhatsApp face)
│   ├── IDENTITY.md                       Self-introduction + pass-through rules
│   ├── SOUL.md                           Output rules (no chatter, no tags)
│   ├── AGENTS.md                         "delegate to orders, nothing else"
│   ├── USER.md   TOOLS.md   HEARTBEAT.md   MEMORY.md
│   ├── memory/                           Per-agent SQLite (deny-listed anyway)
│   └── state/                            Ephemeral runtime state
├── workspace-bsc/                        Orders (internal executor)
│   ├── IDENTITY.md   SOUL.md   AGENTS.md
│   ├── TOOLS.md                          BSC API reference (endpoints + admin creds)
│   ├── USER.md   MEMORY.md   HEARTBEAT.md
│   ├── SKILL-BSC-AUTHENTICATE.md         ← always executed first
│   ├── SKILL-BSC-ORDER.md                /order/quick with A/B/C fallback
│   ├── SKILL-BSC-DELETE-ORDER.md         DELETE /orders/:id with yes-confirm
│   ├── SKILL-BSC-LOOKUP-PROTOCOL.md      /admin/family-context + /admin/family-orders
│   ├── SKILL-BSC-ACTIVE-MENU.md          /public/menu (no auth)
│   ├── SKILL-BSC-ORDER-RECOMMENDATION.md /admin/orders + client-side tally
│   ├── SKILL-BSC-NOTIFICATION-CONTROL.md file-only: daily_notification_control.json
│   ├── SKILL-BSC-REGISTER.md             3-turn WhatsApp registration
│   ├── SKILL-BSC-REGISTER-STATE.md       state schema + read/write/expire
│   ├── BSC-TEST-SUMMARY-2026-04-09.md    Live-server smoke-test log
│   ├── daily_notification_control.json   Morning-notif gate (ACTIVE | PAUSED)
│   ├── avatars/                          Orders avatar image
│   └── memory/
├── memory/                               Cross-agent memory + registration_*.json
├── tasks/                                runs.sqlite + task lifecycle
├── delivery-queue/                       Outbound WhatsApp queue
├── devices/                              WhatsApp device registration
├── subagents/                            Subagent session state
├── agents/                               Per-agent skill packs
├── credentials/                          API keys (DeepSeek, Google, Anthropic)
├── identity/                             Identity material
├── canvas/   browser/   completions/   flows/   logs/   plugins/   venv/
├── media → /mnt/support_disk/openclaw-media
├── exec-approvals.json                   Approval gate config
└── schema.json                           Openclaw schema snapshot

# ─── gda-ce01 ────────────────────────────────────────────────────────
/var/www/schoolcatering/
├── ecosystem.config.cjs                  PM2: -api :3000, -web :4173
├── README.md                             Product overview + deploy flow
├── apps/
│   ├── api/                              NestJS (all paths under /api/v1)
│   │   └── src/
│   │       ├── main.ts   app.module.ts
│   │       ├── auth/                     /auth/login, /auth/register/*, /public/*
│   │       ├── core/                     orders, menus, admin/family-*, admin/orders
│   │       └── shared/
│   └── web/                              Next.js frontend
├── packages/
│   ├── types/                            Shared TS types
│   └── config/
├── docs/
│   ├── short_guide.md                    User-facing welcome (the one Brian quotes)
│   ├── brian/                            Agent-facing runbooks
│   │   └── brian_whatsapp_notification_runbook.md
│   ├── brian_order_notificatio_brief_scope.md
│   ├── features/                         feature_matrix, button_api, links_api, ...
│   ├── db/                               SQL migrations (baseline, views, perf)
│   ├── specifications/   guides/   ops/   security/   release/   testting/
├── menu/                                 Menu assets
├── multiorders/                          Bulk-order tooling
├── scripts/                              Ops scripts
├── secure/                               Secret material (not committed)
└── database_backup/
```

---

## 16. Appendix A — Decisions log

- **2026-02-24** — BSC project kicks off. Roles fixed: `PARENT`,
  `YOUNGSTER`, `ADMIN`, `KITCHEN`, `DELIVERY`. Sessions fixed:
  `BREAKFAST`, `LUNCH`, `SNACK`.
- **2026-03-24** — Tenant `bsc` stands up at `/opt/.openclaw-bsc` on
  `gda-ai01`. Gateway on `18789` with token `bsc123abc`.
- **2026-04-06** — Two-agent split finalised: Brian (public) +
  Orders (internal). Brian's tool deny list
  (`memory_search`/`memory_get`/`read`) enforces pure pass-through.
- **2026-04-08** — `family_id` becomes canonical family key; surname
  inference and `parent_children`-based resolution are banned.
  `/admin/family-context?phone=...` is the one true lookup.
- **2026-04-09** — `/order/quick` drift documented with A/B/C fallback
  shapes. Banned payload keys (`orderDate`, `studentUsername`, nested
  `date`) frozen. 401 → re-login once, retry once, no loops.
- **2026-04-11** — WhatsApp registration flow (3 turns + 15-min TTL
  state file) goes live. School UUIDs are fetched live, never
  hardcoded. Live schools: Bali Island School, Sanur Independent
  School.
- **2026-04-11** — Dev-only `/auth/dev/test-registration` endpoints
  added (phone `+620000099991`) for rehearsal without real user data.
- **2026-04-14** — Registration confirmation bypass codified as the
  single documented exception to "authenticate first". Triggered only
  when: message is YES/NO *and* state file exists *and* sender is not
  registered.
- **2026-04-16** — `openclaw.json` last touched; no schema changes
  since, only metadata bumps.
- **2026-04-21** — Skill file reloads confirmed zero-downtime
  (`git pull` suffices, no gateway restart). WhatsApp debounce
  standardised at 1500ms per account.
- **2026-04-22** — Canonical string `"Order Deletion aborted due to
  mo confirmation"` (mo, not no) ratified as a protocol token — do
  not "fix" the typo.
