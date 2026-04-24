# Openclaw → Website Playbook (Victor × templategen)

End-to-end reference for how the **Openclaw** agent runtime (branded "Victor" at
Gaia) manages a Payload + Next.js website — using `templategen.gaiada.online`
as the canonical live integration. Everything here is what's actually wired up
across two VMs (`gda-ai01` for the agents, `gda-s01` for the site), recorded so
the next site can be onboarded without re-deriving the contract.

> **Companion doc:** [`docs/figma_to_site_playbook.md`](../rhproperties_react/docs/figma_to_site_playbook.md)
> is the reference for *building* a 3PRVTN site from a Figma design. This
> document picks up where that one leaves off — how an agent operates that
> site after it's live.

---

## Table of contents

1. [The two-box topology](#1-the-two-box-topology)
2. [Prerequisites — what to install / access](#2-prerequisites)
3. [Phase 1 — What Openclaw actually is](#3-phase-1--what-openclaw-actually-is)
4. [Phase 2 — Victor's agent roster](#4-phase-2--victors-agent-roster)
5. [Phase 3 — The templategen site on `gda-s01`](#5-phase-3--the-templategen-site)
6. [Phase 4 — The `/api/web-manager/*` contract](#6-phase-4--the-api-web-manager-contract)
7. [Phase 5 — Site manifests (the registry)](#7-phase-5--site-manifests)
8. [Phase 6 — The three-layer web-manager client](#8-phase-6--the-three-layer-client)
9. [Phase 7 — Two skill paths: `SKILL-BLOG` vs `SKILL-WEB-MANAGER`](#9-phase-7--two-skill-paths)
10. [Phase 8 — How Victor routes a user request](#10-phase-8--request-routing)
11. [Daily operations cookbook](#11-daily-operations-cookbook)
12. [Onboarding a new website](#12-onboarding-a-new-website)
13. [Gotchas we hit](#13-gotchas-we-hit)
14. [Credentials + secrets map](#14-credentials--secrets-map)
15. [File map — where things live](#15-file-map)
16. [Appendix A — Named decisions log](#16-appendix-a--named-decisions-log)

---

## 1. The two-box topology

Openclaw is a *split* system: the **runtime** (agents, memory, tool configs)
lives on one VM, and the **site** it operates on lives on another. They talk
over HTTP using a narrow, versioned contract.

| Box | Purpose | Path |
|---|---|---|
| `gda-ai01` | Openclaw runtime — Victor + his sub-agents, Telegram bot, Mission Control gateway | `/opt/.openclaw-var/` |
| `gda-s01` | Production site — Next.js + Payload CMS (`templategen`) | `/var/www/templategen/` |
| GitHub | Site source of truth | (site-specific repo) |

**Live URLs:**
- Website frontend — http://templategen.gaiada.online/
- Payload admin — http://templategen.gaiada.online/admin
- Mission Control (Victor UI) — https://var.gaiada0.online/
- Telegram — `@victor_gaiada_bot`

**Site ports on `gda-s01`:**
- `3005` — `templategen-web` (Next.js frontend via `tsx server.ts`)
- `4005` — `templategen-cms` (Payload admin + API)

**Runtime ports on `gda-ai01`:**
- `19289` — Openclaw gateway (loopback-only, token auth, token `var123abc`)
- Tailscale exposure is currently `off`

**Flow (one blog post, end to end):**

```
user (Telegram / Mission Control)
  → Victor (main agent)          [interprets request, picks target]
  → web-manager sub-agent        [authenticates, formats payload]
  → POST /api/web-manager/posts/upsert on templategen
  → Payload writes to Postgres
  → POST /api/web-manager/revalidate
  → user sees the post at /posts/<slug>
```

Everything else in this doc unpacks one of those arrows.

---

## 2. Prerequisites

### On your laptop (to read or operate this system)

```bash
# SSH access to both VMs
ssh gda-ai01   # must work without password (entry in ~/.ssh/config)
ssh gda-s01

# optional but useful
brew install jq curl httpie
```

### On `gda-ai01` (already provisioned for this project)

- Node 22+, pnpm, PM2
- Python 3.11+ (the CLI scripts are plain Python, no deps beyond stdlib)
- The Openclaw runtime itself, installed as `source_base_openclaw` in `/opt/`
  and materialised per-tenant as `.openclaw-<tenant>` directories
  (`-var` is Victor's, `-gda` `-biz` `-bsc` `-hos` `-soc` are the others)

### On `gda-s01` (already provisioned)

- Node 22, pnpm, PM2, Postgres 16, nginx + Let's Encrypt SAN cert
- The templategen repo at `/var/www/templategen/`
- PM2 apps: `templategen-cms` (port 4005) and `templategen-web` (port 3005)

---

## 3. Phase 1 — What Openclaw actually is

**Openclaw** is a multi-agent runtime with a single JSON root at
`/opt/.openclaw-<tenant>/openclaw.json`. The tenant for Gaia's public assistant
is **`var`** (hence `/opt/.openclaw-var`). The assistant's public-facing name
is **Victor**.

### 3.1 The `.openclaw-var` directory

```
/opt/.openclaw-var/
├── openclaw.json              ROOT CONFIG — agents, gateway, plugins, models
├── .claude/                   Claude Code project-local config
├── .git/                      Yes, the whole var dir is a git repo
├── agents/                    Agent SKILL packs (shared skills, per role)
│   ├── main/  booking/  writer/  web-manager/  copywriter/
│   ├── drive-manager/  analyst/  calendar-manager/  email-manager/
├── workspace-main/            Victor (the "main" agent) — IDENTITY.md, SOUL.md, ...
├── workspace-web-manager/     The sub-agent that operates websites
├── workspace-booking/  workspace-writer/  workspace-copywriter/
├── workspace-drive-manager/  workspace-analyst/ ...
├── memory/                    SQLite memory per agent id ({agentId}.sqlite)
├── credentials/               API keys (Google / Anthropic / DeepSeek profiles)
├── delivery-queue/            Outbound message queue (Telegram, email)
├── telegram/                  Telegram session state
├── flows/                     Stored multi-step flows
├── logs/                      Runtime logs
├── tasks/                     Scheduled / in-flight tasks
├── plugins/                   Loaded plugin configs (mcp, telegram, google, ...)
├── devices/                   Device registry
└── update-check.json          Self-update metadata
```

### 3.2 The `openclaw.json` root config — the parts that matter

```jsonc
{
  "agents": {
    "defaults": {
      "model": { "primary": "deepseek/deepseek-chat",
                 "fallbacks": ["google/gemini-2.5-flash"] },
      "workspace": "/opt/.openclaw-var/workspace-main",
      "memorySearch": { "enabled": true,
                        "store": { "path": ".../memory/{agentId}.sqlite" } },
      "maxConcurrent": 4,
      "subagents": { "maxConcurrent": 8 }
    },
    "list": [
      { "id": "main",          "identity": { "name": "Victor" },
        "subagents": { "allowAgents": [
          "booking","writer","web-manager","copywriter",
          "drive-manager","analyst" ]}},
      { "id": "web-manager",   "identity": { "name": "Web Manager" },
        "workspace": "/opt/.openclaw-var/workspace-web-manager" },
      /* ...booking, writer, copywriter, drive-manager, analyst... */
    ]
  },
  "channels": {
    "telegram": { "accounts": { "main": {
      "name": "Victor", "dmPolicy": "open",
      "botToken": "8728810259:AAFC3cVrA5_..." }}}
  },
  "gateway": {
    "port": 19289, "bind": "loopback",
    "auth": { "mode": "token", "token": "var123abc" },
    "controlUi": { "allowedOrigins": ["https://var.gaiada0.online"] }
  },
  "plugins": { "allow": [
    "mcp","telegram","deepseek","google","browser","acpx","anthropic","memory-core"
  ]}
}
```

Three things to absorb from this file:

1. **Victor is the `main` agent.** Everything else is a sub-agent he can spawn
   via `sessions_spawn`.
2. **DeepSeek is the default model** (cheap + fast). Gemini 2.5 Flash is the
   only fallback. Anthropic is available as a provider but not the default.
3. **Gateway is local-only.** The outside world reaches Victor through
   Telegram, the Mission Control web UI at `var.gaiada0.online`, or a
   Tailscale tunnel — never a directly exposed port on the VM.

---

## 4. Phase 2 — Victor's agent roster

Each sub-agent is a **workspace** (directory of markdown files describing
identity + skills) plus an entry in `openclaw.json`'s `agents.list`.

| Agent id | Name | Scope |
|---|---|---|
| `main` | Victor | Routing + self-introduction only. Delegates everything else. |
| `booking` | Booking | Google Calendar, events, Meet links |
| `writer` | Writer | Gmail: send / read / search, letter drafting |
| `web-manager` | Web Manager | **Operating connected websites** (this doc's focus) |
| `copywriter` | Copywriter | Long-form writing, ad copy, SEO content, research |
| `drive-manager` | Drive Manager | Google Drive: upload, download, list, search |
| `analyst` | Analyst | PDF / Excel / Word / image analysis |
| `calendar-manager` | Calendar Manager | (present in `agents/`, not in default list) |
| `email-manager` | Email Manager | (present in `agents/`, not in default list) |

### 4.1 Workspace anatomy (applies to every agent)

```
workspace-<agent>/
├── IDENTITY.md      Who the agent is, what it does, canonical introduction
├── SOUL.md          Tone rules, output-format rules ("never say 'I will...'")
├── USER.md          Who the end user is (the person receiving the output)
├── TOOLS.md         What tool families the agent is allowed to use
├── SKILLS.md        Index of skill files
├── SKILL-*.md       One per high-level capability
├── BOOTSTRAP.md     Startup read-order
├── HEARTBEAT.md     Liveness marker
├── AGENTS.md        Cross-agent contract (routing rules for sub-sub-agents)
└── state/           Ephemeral per-session state
```

The web-manager workspace additionally has `docs/`, `scripts/`, `sites/`, and
`payloads/` subdirectories — see §8.

### 4.2 Victor's routing rules (from `workspace-main/IDENTITY.md`)

When Victor receives a request, he doesn't do the work — he routes:

| Intent | Delegate to |
|---|---|
| Calendar / booking / appointment / Google Meet | `booking` |
| Email / send / check inbox / count | `writer` |
| Letter writing + email delivery | `writer` |
| **Blog post / CMS content / delete blog** | **`web-manager`** |
| Research-then-blog | chain: `copywriter` → `web-manager` |
| Ad copy / article drafting | `copywriter` |
| Google Drive uploads / downloads / search | `drive-manager` |
| PDF / Excel / Word / image analysis | `analyst` |
| Download from Drive → analyse | chain: `drive-manager` → `analyst` |
| Analyse → email result | chain: `analyst` → `writer` |

Rule: Victor uses **`sessions_spawn`** (never `sessions_send`). If spawn
fails, the user-facing reply is: *"One moment, please try again shortly."*

---

## 5. Phase 3 — The templategen site

`templategen` is the reference website that Victor's `web-manager` operates.
It's a textbook 3PRVTN stack (PostgreSQL + Payload Headless CMS + Python + ReactJS + ViteJS + TailwindCSS + NodeJS; ViteJS is replaced with Next.js on templategen).

### 5.1 Filesystem + ports

```
/var/www/templategen/
├── ecosystem.config.cjs     PM2 apps (templategen-cms :4005, templategen-web :3005)
├── packages/
│   ├── cms/                 Payload CMS (Next.js 16 App Router)
│   │   └── src/app/(payload)/api/web-manager/
│   │       ├── auth/verify/
│   │       ├── status/
│   │       ├── content/ (search)
│   │       ├── pages/ (upsert)
│   │       ├── posts/ (upsert)
│   │       ├── globals/ (update)
│   │       ├── media/ (upload)
│   │       ├── approval/
│   │       ├── publish/
│   │       ├── operations/
│   │       └── revalidate/
│   └── web/                 Next.js frontend (SSR + ISR)
├── docs/
│   ├── full_prompt.md       Original build spec
│   └── web-manager-api.md   ← AUTHORITATIVE endpoint reference
├── database_backup/
└── config/tooling/
```

### 5.2 PM2 config (as deployed)

```js
module.exports = {
  apps: [
    { name: 'templategen-cms',
      cwd: './packages/cms',
      script: 'npx', args: 'next start -p 4005',
      env: { NODE_ENV: 'production', NODE_OPTIONS: '--no-deprecation' } },
    { name: 'templategen-web',
      cwd: './packages/web',
      script: 'npx', args: 'tsx server.ts',
      env: {
        PORT: 3005,
        PAYLOAD_URL: 'http://localhost:4005',
        REVALIDATION_SECRET: 'vrtpn-revalidation-secret-2026',
        PREVIEW_SECRET: 'G4iaD4Pr3vi3wS3cr3t2026',
        PORTAL_USERNAME: 'user', PORTAL_PASSWORD: 'Teameditor@123',
        PORTAL_SESSION_SECRET: 'templategen-portal-session',
        PORTAL_EMAIL_FROM: 'ai@gaiada.com',
        PORTAL_SMTP_HOST: 'smtp.gmail.com', PORTAL_SMTP_PORT: '465',
        PORTAL_SMTP_USER: 'ai@gaiada.com', PORTAL_SMTP_PASS: '***'
      } },
  ],
}
```

### 5.3 Payload collections

```
About, Categories, Departments, Media, Pages, Portfolio, Posts,
Services, Team, Users
```

`Posts` + `Pages` are the two collections the web-manager sub-agent writes to
most often. `Categories` is read-only from the agent's POV (IDs are pinned —
see §9.2).

---

## 6. Phase 4 — The `/api/web-manager/*` contract

This is the narrow, versioned HTTP surface the agent uses. It's the single
most important thing in this doc: once your new site exposes this contract,
Victor can operate it without any agent-side changes.

Canonical reference on-disk: [`/var/www/templategen/docs/web-manager-api.md`](#).

### 6.1 Authentication

Every `/api/web-manager/*` route expects one of:

```http
Authorization: Bearer <WEB_MANAGER_API_SECRET>
x-web-manager-secret: <WEB_MANAGER_API_SECRET>
```

Optional IP allowlist via `WEB_MANAGER_ALLOWED_IPS`. The agent's egress IP
for the current bridge is `34.143.206.68` (allowlist this in `.env`).

Environment vars on the site:
- `WEB_MANAGER_API_SECRET` (required)
- `WEB_MANAGER_ALLOWED_IPS` (optional, comma-separated)

### 6.2 Endpoint catalog (V1)

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/web-manager/auth/verify` | Are my creds + IP valid? |
| GET | `/api/web-manager/status` | Site capabilities + collection counts |
| GET | `/api/web-manager/content/search?q=&limit=` | Cross-collection search |
| POST | `/api/web-manager/pages/upsert` | Create/update a page by id or slug |
| POST | `/api/web-manager/posts/upsert` | Create/update a post by id or slug |
| POST | `/api/web-manager/globals/update` | Update `header` / `footer` / `settings` |
| POST | `/api/web-manager/media/upload` | Multipart upload to `media` |
| POST | `/api/web-manager/approval/request` | Is this doc ready to publish? |
| POST | `/api/web-manager/publish` | Publish (requires approval by default) |
| POST | `/api/web-manager/revalidate` | Bust ISR cache by path / slug / tag |
| POST | `/api/web-manager/workflows/publish-bundle` | Approval + publish + revalidate, atomic |
| GET | `/api/web-manager/operations/health` | Operational readiness |
| POST | `/api/web-manager/operations/cache` | Bulk revalidate by paths[] + tags[] |

### 6.3 Canonical request shapes

**Upsert a page:**
```json
POST /api/web-manager/pages/upsert
{
  "title": "About Web Manager",
  "slug": "about-web-manager",
  "status": "draft",
  "hero": { "type": "lowImpact" },
  "layout": [],
  "meta": { "title": "...", "description": "..." }
}
```
Rules: `id` wins over `slug`; both absent = create. Missing `hero` defaults
to `{ type: "lowImpact" }`. Missing `layout` defaults to `[]`.

**Upsert a post:**
```json
POST /api/web-manager/posts/upsert
{
  "title": "Yesterday blog draft",
  "slug": "yesterday-blog-draft",
  "status": "draft",
  "meta": { "title": "...", "description": "..." }
}
```
If `content` is omitted, the API creates a minimal valid Lexical rich-text
body automatically.

**Update a global:**
```json
POST /api/web-manager/globals/update
{ "global": "settings", "data": { "contactEmail": "hello@example.com" } }
```

**Media upload (multipart):**
```bash
curl -X POST "$BASE_URL/api/web-manager/media/upload" \
  -H "Authorization: Bearer $WEB_MANAGER_API_SECRET" \
  -F "file=@./hero.jpg" -F "alt=Homepage hero"
```

**Revalidate:**
```json
POST /api/web-manager/revalidate
{ "slug": "about-web-manager" }   // or { "path": "/x" }, or { "tag": "pages-sitemap" }
```

**Approval check:**
```json
POST /api/web-manager/approval/request
{ "collection": "posts", "slug": "yesterday-blog-draft" }
```
Response carries `readiness` flag + `issues[]` (missing title / slug / body /
collection-specific required fields) + current `status`.

### 6.4 `auth/verify` response (use this to smoke-test a manifest)

```json
{
  "ok": true,
  "authenticated": true,
  "clientIp": "34.143.206.68",
  "scope": ["auth:verify", "status:read", "pages:write", "revalidate:write"]
}
```

`scope` is derived server-side from the calling secret's capability set.
The agent's manifest's `allowed_capabilities` must be a **subset** of what
the server grants — see §7.

---

## 7. Phase 5 — Site manifests

Every site the agent can talk to is described by a JSON manifest in
`/opt/.openclaw-var/workspace-web-manager/sites/`. There are two variants:

| File | Committed? | Contains secrets? |
|---|---|---|
| `<site>.example.json` | ✅ yes | No — `"api_secret": "set-me-in-<site>.local.json"` |
| `<site>.local.json` | ❌ gitignored | Yes — real secret |

The client prefers `.local.json` if present, falls back to `.example.json`.

### 7.1 Canonical fields

```json
{
  "site": "templategda",
  "base_url": "http://34.124.244.233/templategda",
  "api_base_path": "/api/web-manager",
  "api_secret": "26e6a13ce8622aff5f5a93030a0320f43b2c11d5cce8bacff0a9a9151a04d0a5",
  "managed_collections": ["pages", "posts", "services"],
  "allowed_capabilities": [
    "auth:verify", "status:read",
    "pages:write", "posts:write", "services:write",
    "globals:write", "media:write",
    "approval:write", "publish:write",
    "search:read", "revalidate:write",
    "workflows:write", "operations:read", "cache:write"
  ]
}
```

### 7.2 Field semantics

| Field | Role |
|---|---|
| `site` | Short id used on every CLI: `python3 web_manager_cli.py verify <site>` |
| `base_url` | Root of the site (no trailing slash). For templategen either `http://templategen.gaiada.online` or the IP form above. |
| `api_base_path` | Defaults to `/api/web-manager`. Only change if the site is self-hosting a different namespace. |
| `api_secret` | The Bearer token. Matches the site's `WEB_MANAGER_API_SECRET` env var. |
| `managed_collections` | Allow-list of what this agent can touch. Prevents a typo from writing to `Users`. |
| `allowed_capabilities` | Scope the agent self-enforces before calling. Must be ⊆ what the server will actually grant on verify. |
| `transport_aliases` | Optional list of legacy `api_base_path`s to fall back to during migrations. |
| `environment` | `"production"` / `"staging"` — audit-only field. |

### 7.3 Never commit a `.local.json`

`.gitignore` already excludes `sites/*.local.json`. If you need to share a
working manifest with another operator, share the `.example.json` and let
them fill in their own secret.

---

## 8. Phase 6 — The three-layer client

The web-manager workspace ships three Python files, in increasing levels of
abstraction:

```
workspace-web-manager/scripts/
├── web_manager_sites.py   (lib)   low-level HTTP client, manifest loader
├── web_manager_cli.py     (exe)   thin CLI over the client
├── website_manager.py     (lib)   natural-task wrapper over the CLI
└── web_manager.py         (exe)   5-line entry point → website_manager.main()
```

### 8.1 Low-level: `web_manager_sites.py`

Exports:

- `SiteConfig` (dataclass) — typed manifest
- `load_site_config(site)` — prefers `.local.json`, else `.example.json`
- `validate_site_config(cfg)` — returns list of issue strings; empty = good
- `build_site_manifest(...)` + `write_site_manifest(...)` — onboarding helpers
- `WebManagerSiteClient(cfg)` — stdlib-only (urllib) HTTP client with one
  method per endpoint: `.verify()`, `.status()`, `.health()`, `.search()`,
  `.upsert_page()`, `.upsert_post()`, `.update_global()`, `.upload_media()`,
  `.request_approval()`, `.publish()`, `.publish_bundle()`, `.revalidate()`,
  `.cache()`

No third-party deps — works anywhere a Python 3.11+ interpreter runs.

### 8.2 Middle: `web_manager_cli.py`

One subcommand per client method:

```bash
python3 web_manager_cli.py verify <site>
python3 web_manager_cli.py status <site>
python3 web_manager_cli.py health <site>
python3 web_manager_cli.py doctor <site>                  # verify+status+health+manifest lint
python3 web_manager_cli.py search <site> --query <q> [--limit N]
python3 web_manager_cli.py upsert-page  <site> (--json <inline> | --file <path>)
python3 web_manager_cli.py upsert-post  <site> (--json <inline> | --file <path>)
python3 web_manager_cli.py update-global <site> <global_slug> (--json | --file)
python3 web_manager_cli.py approval     <site> <collection> (--id <id> | --slug <slug>)
python3 web_manager_cli.py publish      <site> <collection> (--id | --slug) [--skip-approval]
python3 web_manager_cli.py publish-bundle <site> <collection> (--id | --slug) \
    [--revalidate-path /x] [--revalidate-tag pages-sitemap]
python3 web_manager_cli.py revalidate   <site> [--path | --slug | --tag]
python3 web_manager_cli.py cache        <site> [--paths p1 p2] [--tags t1 t2]
python3 web_manager_cli.py upload-media <site> <file_path> [--alt] [--folder]
python3 web_manager_cli.py onboard      <site> --base-url <url> --api-secret <s> \
    [--local] [--force] [--managed-collections ...] [--allowed-capabilities ...]
```

All output is JSON — pipe into `jq` if you want it pretty.

### 8.3 Top: `web_manager.py` → `website_manager.main()`

Natural-language wrapper. Takes a sentence, inspects key tokens, picks the
right CLI subcommand:

```bash
python3 web_manager.py template "search drafts about the homepage"
python3 web_manager.py template "check approval for yesterday-blog-draft"
python3 web_manager.py template "publish bundle yesterday-blog-draft"
python3 web_manager.py template "create a draft post" --payload-file payloads/post.example.json
```

This is what the LLM-driven agent actually calls. The agent composes the
sentence; the wrapper deterministically resolves which operation to run.

---

## 9. Phase 7 — Two skill paths

The workspace has **two** skill files for writing to the site, and they take
deliberately different paths. Knowing which to use is the single most common
source of confusion.

| | `SKILL-BLOG.md` | `SKILL-WEB-MANAGER.md` |
|---|---|---|
| **Auth** | JWT from `/api/users/login` | `Authorization: Bearer <WEB_MANAGER_API_SECRET>` |
| **Route family** | Payload native — `/api/posts`, `/api/categories`, `/api/media` | Management contract — `/api/web-manager/*` |
| **Credentials** | `demo-author@example.com` / `password` | `api_secret` from site manifest |
| **Scope** | Just blog posts (create / update / list / delete) | Everything — pages, posts, globals, media, approval, publish, revalidate |
| **When to use** | Simple "write a post" asks; user-delegated to Victor | Cross-cutting site ops, bundled publish, staging workflow, cache busting |
| **Transport** | Direct HTTP via `fetch` MCP tool | Python CLI wrappers above |

The `AGENTS.md` decision rule in the workspace:

> - If the task mentions blog, post, article, publish, or CMS content creation → use **SKILL-BLOG.md**
> - If the task mentions site health, search, pages, globals, media, or revalidation → use **SKILL-WEB-MANAGER.md**
> - When in doubt, start with SKILL-BLOG.md — it has direct credentials that work.

### 9.1 `SKILL-BLOG.md` — the four-step dance

1. **Authenticate** — `POST /api/users/login` with the demo-author creds,
   capture `token`.
2. **Create the post** — `POST /api/posts` with `Authorization: JWT <token>`
   and the full Lexical content tree (see §9.3).
3. **Revalidate** — `POST /api/revalidate` with
   `{ "collection": "posts", "slug": "<slug>" }`. If it 404s, **don't
   treat as a blocker** — ISR will catch up.
4. **Confirm** — respond with title + URL (`…/posts/<slug>`) + the returned
   `id`.

### 9.2 Category IDs are fixed

Every post **must** have `categories: [<id>, ...]` with at least one id.
The templategen category table is:

| ID | Name | Use for |
|---|---|---|
| 37 | Technology | AI, software, apps, digital tools, automation |
| 38 | News | Current events, announcements, updates |
| 39 | Finance | Money, markets, business, economics |
| 40 | Design | UI/UX, graphics, branding, visual arts |
| 41 | Software | Programming, dev tools, code, architecture |
| 42 | Engineering | Hardware, infrastructure, systems, ops |

Multiple categories: `"categories": [37, 41]` (AI programming post).

If the user doesn't specify, the skill picks the best fit from content.

### 9.3 Lexical content — the required fields

Payload's rich-text format is **Lexical**, not plain HTML or Markdown.
Every node requires `version`, `format`, `indent`, `direction`. Every text
child additionally requires `mode`, `style`, `detail`, `format`, `version`.
Skipping any of these renders as **"unknown node"** on the frontend and the
post looks broken.

Minimum viable post body:

```json
{
  "root": {
    "type": "root", "format": "", "indent": 0, "version": 1,
    "direction": "ltr",
    "children": [{
      "type": "paragraph", "format": "", "indent": 0, "version": 1,
      "direction": "ltr", "textFormat": 0,
      "children": [{
        "mode": "normal", "style": "", "detail": 0,
        "type": "text", "format": 0, "version": 1,
        "text": "Your paragraph text here."
      }]
    }]
  }
}
```

**Text formatting flags** (bitmask on the text node's `format`):
- `0` — plain
- `1` — **bold**
- `2` — *italic*
- `3` — ***bold + italic***

**Heading:** `{"type":"heading","tag":"h2",...}` (otherwise same shape as paragraph).
**Bullet list:** `{"type":"list","listType":"bullet","tag":"ul","start":1,"children":[{"type":"listitem",...}]}`.

If no image is supplied, set `"heroImage": null`. Do not invent a media
upload; the demo Hero image is only used when the user supplies one.

### 9.4 `SKILL-WEB-MANAGER.md` — the bigger toolkit

Responsibilities:
- verify connectivity + capability status
- search content across connected sites
- create / update pages and posts
- update globals (`header`, `footer`, `settings`)
- upload media
- run approval readiness checks
- publish approved content
- trigger path / tag revalidation

Entry points are all Python CLI (see §8.2). The agent should prefer the
natural wrapper (`web_manager.py template "..."`) and fall back to the
lower-level CLI (`web_manager_cli.py <verb> template ...`) when the task
requires a specific operation.

---

## 10. Phase 8 — Request routing

A concrete end-to-end trace. User sends:

> *"write a short blog post about AI copilots and publish it"*

### Step 1 — Telegram → Victor (main)

Message ingress via `@victor_gaiada_bot`. Victor's routing table matches
`"blog post"` → delegate to `web-manager`. He calls:

```
sessions_spawn(agentId="web-manager", task="write a short blog post about AI copilots and publish it")
```

Victor's reply to the user is **empty** — he's not the one writing. His
SOUL.md forbids delegation chatter.

### Step 2 — `web-manager` wakes up in `workspace-web-manager`

Startup read order (from `AGENTS.md`):
1. `SOUL.md` → output rules (no internal reasoning in output)
2. `USER.md` → who the final reader is
3. `TOOLS.md` → what tools are whitelisted
4. `SKILLS.md` → index
5. **`SKILL-BLOG.md`** (because task mentions "blog") — takes priority over
   `SKILL-WEB-MANAGER.md`

### Step 3 — Draft the content

If body text isn't provided, the skill either writes it directly (short
content) or bounces to `copywriter` (research / long-form). For a 3-paragraph
post, web-manager writes it inline.

### Step 4 — Authenticate

```http
POST http://templategen.gaiada.online/api/users/login
Content-Type: application/json
{ "email": "demo-author@example.com", "password": "password" }
→ { "token": "<jwt>", "user": {...} }
```

### Step 5 — Create the post

```http
POST http://templategen.gaiada.online/api/posts
Authorization: JWT <jwt>
Content-Type: application/json

{
  "title": "AI Copilots: The New Default",
  "categories": [37],
  "content": { "root": {... full Lexical tree ...} },
  "heroImage": null,
  "_status": "published",
  "meta": { "title": "...", "description": "..." }
}
→ 201 { "doc": { "id": 123, "slug": "ai-copilots-the-new-default", ... } }
```

### Step 6 — Revalidate

```http
POST http://templategen.gaiada.online/api/revalidate
Authorization: JWT <jwt>
{ "collection": "posts", "slug": "ai-copilots-the-new-default" }
```

If 404 → skip silently.

### Step 7 — Confirm

web-manager replies (via session_reply, which bubbles back up to Victor's
outbound channel):

> Post published: *AI Copilots: The New Default* —
> http://templategen.gaiada.online/posts/ai-copilots-the-new-default (id 123).

### When the request is "update the homepage CTA" instead

Same routing into `web-manager`, but now `SKILL-WEB-MANAGER.md` wins:

```bash
python3 scripts/web_manager.py template \
  "update page home set hero.cta to 'Start free'" \
  --payload-file payloads/home-cta.json
# → upsert-page → approval → publish-bundle → revalidate
```

---

## 11. Daily operations cookbook

All commands run from inside `/opt/.openclaw-var/workspace-web-manager/` on
`gda-ai01`.

### 11.1 Verify everything is healthy

```bash
python3 scripts/web_manager_cli.py doctor template
# → verify + status + health + manifest lint in one go
```

Expected: `"ok": true`, empty `manifestIssues`, `authenticated: true`.

### 11.2 Search drafts

```bash
python3 scripts/web_manager_cli.py search template --query "homepage" --limit 20
```

### 11.3 Create a draft post from a payload file

```bash
python3 scripts/web_manager_cli.py upsert-post template \
  --file payloads/post.example.json
```

### 11.4 Check approval → publish → revalidate (atomic)

```bash
python3 scripts/web_manager_cli.py publish-bundle template posts \
  --slug yesterday-blog-draft \
  --revalidate-tag posts-sitemap
```

### 11.5 Bust ISR cache for multiple paths

```bash
python3 scripts/web_manager_cli.py cache template \
  --paths / /posts/latest /team \
  --tags  posts-sitemap pages-sitemap
```

### 11.6 Upload a hero image

```bash
python3 scripts/web_manager_cli.py upload-media template ./hero.jpg \
  --alt "Homepage hero" --folder homepage
```

### 11.7 Update the site-wide contact email

```bash
python3 scripts/web_manager_cli.py update-global template settings \
  --json '{"contactEmail":"hello@gaiada.com"}'
```

### 11.8 Re-authenticate when a JWT expires

Tokens from `/api/users/login` are short-lived. On `401`, re-login and retry
— do not treat an expired token as a failure. The `web-manager` script
wrapper does this transparently.

---

## 12. Onboarding a new website

To point Victor at a new 3PRVTN site (e.g. `rhproperties` once it's live):

### 12.1 On the site

1. Implement (or inherit from templategen) the `/api/web-manager/*` routes.
2. Set `WEB_MANAGER_API_SECRET=$(openssl rand -hex 32)` in
   `packages/cms/.env`.
3. Set `WEB_MANAGER_ALLOWED_IPS=34.143.206.68` (the agent egress IP).
4. Restart PM2.

### 12.2 On `gda-ai01`

```bash
cd /opt/.openclaw-var/workspace-web-manager

python3 scripts/web_manager_cli.py onboard rhproperties \
  --base-url https://rhproperties.gaiada.online \
  --api-secret <the-secret-from-step-2> \
  --local

python3 scripts/web_manager_cli.py doctor rhproperties
```

`--local` writes `sites/rhproperties.local.json`. Commit a matching
`sites/rhproperties.example.json` with `"api_secret": "set-me-in-..."` so
future operators know the site exists.

### 12.3 Smoke test

```bash
python3 scripts/web_manager_cli.py verify rhproperties
python3 scripts/web_manager_cli.py status rhproperties
python3 scripts/web_manager_cli.py search rhproperties --query test
```

All three should return `"ok": true`.

### 12.4 Wire into Victor's routing (optional, if you want a custom route)

Edit `workspace-main/IDENTITY.md` to add the new site's brand under the
blog/CMS row, then edit `workspace-web-manager/SKILL-BLOG.md` to list the
new site under "CMS Connection". Without these edits, the agent can still
operate the site via explicit CLI commands — the edits just let natural
language find it.

---

## 13. Gotchas we hit

### 13.1 `.openclaw-var` is tenant-scoped

The directory you want is **`/opt/.openclaw-var`** (no dot before `var`,
dash not period). `/opt/.openclaw.var` doesn't exist. The six tenants on
`gda-ai01` are `biz`, `bsc`, `gda`, `hos`, `soc`, `var`.

### 13.2 SKILL-BLOG wins over SKILL-WEB-MANAGER for blog tasks

Both skills can create a post. The workspace rule is: if the task mentions
blog / post / article / publish / CMS content → **use `SKILL-BLOG.md` first**.
Reason: it has direct working credentials baked in (the demo-author JWT) and
doesn't need a manifest to be set up.

Side effect: new operators often read `SKILL-WEB-MANAGER.md` first (it's
longer, looks more authoritative) and then get stuck trying to configure a
manifest when they could have just used the JWT path. `AGENTS.md` fixes
this — read it first.

### 13.3 Lexical "unknown node" errors

The most common symptom: post publishes successfully but the frontend
renders a big "unknown node" placeholder. Cause: a text node missing
`mode` / `style` / `detail` / `format` / `version`, or a paragraph missing
`version` / `format` / `indent` / `direction`.

Do not use the simplified `{"text": "..."}` shape you'll see in older
Payload docs — templategen uses Lexical (not Slate), and Lexical is strict.
Template from §9.3 and stop worrying about it.

### 13.4 Category is **required**

`POST /api/posts` with no `categories` field → 400. At least one id from
§9.2 must be present.

### 13.5 Egress IP allowlist

The agent's egress IP is currently **`34.143.206.68`**. If the site's
`WEB_MANAGER_ALLOWED_IPS` doesn't include it, every call 403s. Verify the
IP hasn't changed with:

```bash
ssh gda-ai01 "curl -s https://ifconfig.me"
```

Update the site's `.env` and restart PM2 if it drifts.

### 13.6 `/api/revalidate` 404 is not a blocker

Older site versions didn't ship a revalidate route. Agents should **swallow
a 404 from revalidate**, not retry and not escalate. The page will update
on the next ISR interval regardless.

### 13.7 Manifest fallback order matters

`load_site_config()` prefers `.local.json` over `.example.json`. If you
accidentally commit a `.local.json` with a live secret and then a teammate
also creates one locally, the committed one wins and they'll be writing to
the wrong site. Keep `sites/*.local.json` in `.gitignore` and keep it that
way.

### 13.8 `api_base_path` vs the URL

`base_url` is the host, `api_base_path` is the namespace. The final URL
is `base_url + api_base_path + route`. If `base_url` already contains
`/api/web-manager`, strip it — you'll end up calling
`…/api/web-manager/api/web-manager/…`.

### 13.9 Mission Control origin allowlist

The gateway only accepts control-UI calls from `https://var.gaiada0.online`
(see `openclaw.json` `gateway.controlUi.allowedOrigins`). If you fork the
UI to a new domain, add it there or CORS will block it.

### 13.10 DeepSeek-primary means non-reasoning by default

The default model is `deepseek-chat` (non-reasoning). Tasks that need
chain-of-thought (multi-step planning, tricky edits) will underperform
unless you override to `deepseek-reasoner` or an Anthropic model. The
override is per-agent in `agents.list[].model`.

### 13.11 Tables for removed collections linger

Payload's Postgres adapter auto-creates tables but doesn't drop them. If
you remove a collection from a site and wonder why the old table is still
there — it always will be, until manually dropped. Not a correctness
issue, just clutter.

---

## 14. Credentials + secrets map

Two independent credential sets are in play. Don't mix them.

### 14.1 Site-side (templategen)

| Thing | Where it lives | Value (demo) |
|---|---|---|
| Payload admin | `templategen.gaiada.online/admin` | `admin@gaiada.com` / `admin` |
| Demo author (for SKILL-BLOG JWT) | Payload `users` collection | `demo-author@example.com` / `password` |
| Portal basic auth | `packages/web/.env` → PM2 env | `user` / `Teameditor@123` |
| `WEB_MANAGER_API_SECRET` | `packages/cms/.env` | (64-hex from openssl) |
| `WEB_MANAGER_ALLOWED_IPS` | `packages/cms/.env` | `34.143.206.68` |
| `REVALIDATION_SECRET` | `packages/web/.env` | `vrtpn-revalidation-secret-2026` |
| `PREVIEW_SECRET` | `packages/web/.env` | `G4iaD4Pr3vi3wS3cr3t2026` |
| Portal SMTP | `packages/web/.env` | `ai@gaiada.com` / Gmail 465 |

### 14.2 Agent-side (openclaw-var)

| Thing | Where it lives | Notes |
|---|---|---|
| Gateway token | `openclaw.json` `gateway.auth.token` | `var123abc` — loopback only |
| Telegram bot token | `openclaw.json` `channels.telegram.accounts.main.botToken` | `@victor_gaiada_bot` |
| Site manifest secret | `workspace-web-manager/sites/<site>.local.json` → `api_secret` | Matches `WEB_MANAGER_API_SECRET` on the target site |
| Model API keys (Google, Anthropic, DeepSeek) | `/opt/.openclaw-var/credentials/` | Referenced by `openclaw.json` `auth.profiles` |
| Google account for services | `azlan@gaiada.com` | Gmail / Calendar / Drive |
| Agent memory (SQLite) | `/opt/.openclaw-var/memory/{agentId}.sqlite` | One per agent |

### 14.3 Rotation rules

- **`WEB_MANAGER_API_SECRET`** must be rotated on both ends together:
  1. New value into site's `packages/cms/.env` + `pm2 restart templategen-cms`
  2. New value into agent's `sites/<site>.local.json`
  3. `python3 scripts/web_manager_cli.py verify <site>` → expect 200
- **Gateway token** (`var123abc`) — rotate if you ever expose the gateway
  beyond loopback. At present it doesn't matter.
- **Telegram bot token** — if leaked, revoke via BotFather; pasted into
  `openclaw.json` then `pm2 restart` (or the equivalent openclaw reload).

---

## 15. File map

```
# ─── gda-ai01 ────────────────────────────────────────────────────────
/opt/
├── source_base_openclaw/             Upstream openclaw source (read-only ref)
├── .openclaw-var/                    ← Victor's tenant (this doc's focus)
│   ├── openclaw.json                 Root config — agents, models, gateway
│   ├── workspace-main/               Victor
│   │   ├── IDENTITY.md  SOUL.md  USER.md  TOOLS.md  SKILLS.md
│   │   ├── SKILL-RESEARCH-BLOG.md    Research-then-blog chain
│   │   ├── AGENTS.md  BOOTSTRAP.md   Routing + startup
│   │   └── state/
│   ├── workspace-web-manager/        ← the sub-agent this doc is about
│   │   ├── AGENTS.md                 Skill-selection rules (blog vs web-mgr)
│   │   ├── SKILL-BLOG.md             JWT path — /api/posts
│   │   ├── SKILL-WEB-MANAGER.md      Bearer path — /api/web-manager/*
│   │   ├── IDENTITY.md  SOUL.md  TOOLS.md  USER.md  SKILLS.md  BOOTSTRAP.md
│   │   ├── scripts/
│   │   │   ├── web_manager_sites.py  Client lib (stdlib-only)
│   │   │   ├── web_manager_cli.py    CLI wrapper
│   │   │   ├── website_manager.py    Natural-task wrapper (middleware)
│   │   │   └── web_manager.py        Entry point (5 lines)
│   │   ├── sites/
│   │   │   ├── templategda.example.json   Committed template (no secret)
│   │   │   └── templategda.local.json     Gitignored (real secret)
│   │   ├── payloads/
│   │   │   ├── page.example.json
│   │   │   ├── post.example.json
│   │   │   └── settings.example.json
│   │   ├── docs/web-manager/
│   │   │   ├── overview.md           One-page intro
│   │   │   ├── spec.md               Role + scope + architecture
│   │   │   ├── operations.md         Operation catalog (verify, upsert, ...)
│   │   │   ├── sites.md              Manifest schema + onboarding
│   │   │   ├── workflow-layer.md     Workflow wrapper rationale
│   │   │   ├── migration-plan.md     Bridge → Grayson migration
│   │   │   ├── manifest.schema.json  JSON Schema for manifests
│   │   │   └── manifest.example.json Canonical manifest
│   │   ├── ai-dream-state-payload.json  Example payload
│   │   └── create_post.py               Ad-hoc creation script
│   ├── workspace-booking/            Calendar sub-agent
│   ├── workspace-writer/             Email sub-agent
│   ├── workspace-copywriter/         Long-form writing
│   ├── workspace-drive-manager/      Google Drive
│   ├── workspace-analyst/            Doc + image analysis
│   ├── agents/                       Shared skill packs
│   ├── memory/{agentId}.sqlite       Per-agent memory stores
│   ├── credentials/                  API keys (Google, Anthropic, DeepSeek)
│   ├── delivery-queue/               Outbound message queue
│   ├── telegram/                     Session state
│   ├── logs/
│   ├── tasks/
│   ├── flows/
│   ├── plugins/
│   └── update-check.json
└── .openclaw-{biz,bsc,gda,hos,soc}/  Other tenants (same shape)

# ─── gda-s01 ─────────────────────────────────────────────────────────
/var/www/templategen/
├── ecosystem.config.cjs              PM2: -cms :4005, -web :3005
├── packages/
│   ├── cms/                          Payload + Next.js
│   │   └── src/app/(payload)/api/web-manager/
│   │       ├── auth/verify/          ← /api/web-manager/auth/verify
│   │       ├── status/
│   │       ├── content/              search
│   │       ├── pages/                upsert
│   │       ├── posts/                upsert
│   │       ├── globals/              update
│   │       ├── media/                upload
│   │       ├── approval/             request
│   │       ├── publish/
│   │       ├── operations/           health, cache
│   │       ├── revalidate/
│   │       └── workflows/            publish-bundle
│   └── web/                          Next.js + tsx SSR
├── docs/
│   ├── full_prompt.md                Original build spec
│   └── web-manager-api.md            ← authoritative endpoint reference
├── database_backup/
└── config/tooling/
```

---

## 16. Appendix A — Named decisions log

- **2026-04-12** — Openclaw tenant `var` is Victor's. Six tenants on
  `gda-ai01` (`biz`, `bsc`, `gda`, `hos`, `soc`, `var`); each is a full
  sibling install, not a shared kernel.
- **2026-04-12** — Victor's default model is `deepseek/deepseek-chat`,
  fallback `google/gemini-2.5-flash`. Cheaper than Claude for routing; we
  keep Anthropic available for tasks that need it.
- **2026-04-12** — Gateway bound to `loopback` only, Tailscale `off`.
  External channels are Telegram and Mission Control web UI, not raw HTTP.
- **2026-04-12** — `web-manager` is the canonical agent role name for
  website ops. The old `web-manager-bridge` wording is retired.
- **2026-04-12** — Site contract lives at `/api/web-manager/*` (not
  `/api/agent/*`). Any future alias has to keep this as the canonical path.
- **2026-04-12** — Two skill paths on purpose. `SKILL-BLOG.md` uses the
  Payload JWT and needs no manifest; `SKILL-WEB-MANAGER.md` uses the
  bearer-secret contract and covers everything else. `AGENTS.md` decides
  per-task.
- **2026-04-12** — Site manifests split into `.example.json` (committed,
  no secret) and `.local.json` (gitignored, real secret). Never the other
  way around.
- **2026-04-12** — CLI scripts use stdlib-only Python (urllib). No pip
  install step on agent bootstrap.
- **2026-04-12** — Category IDs 37–42 on templategen are considered stable.
  Agents pin to them by id, not by name, to survive label changes.
- **2026-04-16** — `openclaw.json` last touched at 08:15Z; no schema
  changes beyond metadata bumps since.
- **2026-04-22** — Migration plan (Phase 2) to lift the site registry
  into "Grayson"-owned storage with secret references (not raw secrets) is
  still in draft. Current bridge registry under
  `/opt/.openclaw-gda/workspace-web-manager` is treated as transitional.
