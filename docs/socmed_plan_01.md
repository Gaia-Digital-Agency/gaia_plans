# GDA Social Media Automation System (SOMA) — Architecture Plan

## Context

Gaia Digital Agency (GDA) is building an AI Business Unit under the **Venturi Model** — compressing complex, labor-heavy social media management through an AI orchestration core to produce consistent, high-velocity outputs without growing headcount. Victor (OpenClaw framework) is the existing multi-agent MVP. This plan extends that architecture into Social Media Automation across 5 platforms: Instagram, Facebook, YouTube, X (Twitter), and TikTok.

**Core workflow constraint:** GDA team retains human approval over all AI-generated content before publishing. OpenClaw executes the actual push to platforms — never direct from AI.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    INTAKE LAYER                         │
│  Client Brief · Brand Voice · Content Calendar          │
│  GDA Creative Assets (images, video) uploaded here      │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              VENTURI THROAT — AI ORCHESTRATION          │
│                  (OpenClaw Framework)                   │
│                                                         │
│  ┌─────────────────┐    ┌──────────────────────────┐    │
│  │  Content Agent  │    │   Interaction Agent      │    │
│  │  (Claude API)   │    │   (Claude API)           │    │
│  │                 │    │                          │    │
│  │ - Posts/captions│    │ - Comment replies        │    │
│  │ - Long articles │    │ - DM responses           │    │
│  │ - Platform-tuned│    │ - Mention responses      │    │
│  │   copy          │    │ - Sentiment routing      │    │
│  └────────┬────────┘    └─────────────┬────────────┘    │
│           │                           │                 │
│  ┌────────▼───────────────────────────▼────────────┐    │
│  │           Content Queue (PostgreSQL)            │    │
│  │  status: draft → pending_review → approved      │    │
│  │           → scheduled → published               │    │
│  └─────────────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              GDA REVIEW & APPROVAL PORTAL               │
│                  (Next.js Dashboard)                    │
│                                                         │
│  - View AI-drafted content + attached media             │
│  - Approve / Edit / Reject each item                    │
│  - Bulk approval for batch content                      │
│  - Schedule picker (date/time per platform)             │
│  - Brand compliance flags (Claude pre-check)            │
│  - Role-based: Reviewer → Approver → Supervisor         │
└──────────────────────┬──────────────────────────────────┘
                       │ (approved + scheduled)
┌──────────────────────▼──────────────────────────────────┐
│              OPENCLAW PUBLISHER AGENT                   │
│                                                         │
│  Platform Dispatcher — routes to correct API adapter    │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌───┐ ┌───────┐   │
│  │Instagram │ │Facebook  │ │YouTube │ │ X │ │TikTok │   │
│  │Graph API │ │Graph API │ │Data API│ │API│ │Content│   │
│  │          │ │          │ │v3      │ │v2 │ │Posting│   │
│  └──────────┘ └──────────┘ └────────┘ └───┘ └───────┘   │
│                                                         │
│  Capabilities per platform:                             │
│  - Text post / caption push                             │
│  - Image upload + attach                                │
│  - Video upload + metadata                              │
│  - Story / Reel / Short posting where supported         │
│  - Reply to comments/DMs                                │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│              MONITORING & ANALYTICS LAYER               │
│                                                         │
│  - Post performance ingestion (likes, reach, CTR)       │
│  - New comments/replies surfaced for AI response        │
│  - Error handling + retry logic for failed pushes       │
│  - GDA Mission Control dashboard (Telegram + Web)       │
│  - Audit log: who approved what, when, which platform   │
└─────────────────────────────────────────────────────────┘
```

## System Components

### 1. AI Content Generation (Claude as Primary Engine)

**Claude claude-sonnet-4-6** handles all generative tasks via Anthropic API:

| Agent | Task | Prompt Strategy |
|---|---|---|
| Content Agent | Post captions, articles, platform copy | Brand voice system prompt + client brief context |
| Interaction Agent | Reply to comments, DMs, mentions | Sentiment analysis → tone calibration → reply draft |
| Brand Compliance Checker | Pre-review check before queuing for GDA | Rule-based + Claude self-review pass |
| Content Planner | Suggest content calendar slots | Client niche + platform trend awareness |

**Prompt caching** (Anthropic API) should be applied to brand voice and client brief system prompts — these are large, static, reused every generation. This significantly cuts token cost at volume.

### 2. OpenClaw Agent Layer (Existing Framework)

Extend Victor's existing OpenClaw multi-agent architecture with dedicated Social Media specialist agents:

```
OpenClaw Orchestrator
  ├── SocialContentAgent      → generates, queues content
  ├── SocialInteractionAgent  → monitors + drafts replies
  ├── SocialPublisherAgent    → executes posting after approval
  │     ├── InstagramAdapter
  │     ├── FacebookAdapter
  │     ├── YouTubeAdapter
  │     ├── XAdapter
  │     └── TikTokAdapter
  └── SocialMonitorAgent      → ingests performance + new interactions
```

Each adapter wraps the platform's official API and normalizes the interface so OpenClaw sends one standardized publish command regardless of platform.

### 3. GDA Review & Approval Portal (Next.js + NestJS)

Consistent with existing GDA SaaS stack: **NextJS + NestJS + PostgreSQL + Tailwind + JWT + Drizzle**

**Key screens:**
- **Content Queue** — cards showing draft content + attached media, platform tag, scheduled time, AI confidence score
- **Approval Flow** — Approve / Edit inline / Reject with reason
- **Media Library** — GDA team uploads images/videos here; AI agent attaches assets to relevant posts
- **Content Calendar** — visual week/month view of scheduled + published content per platform
- **Interaction Inbox** — AI-drafted replies to comments/DMs awaiting GDA approval
- **Mission Control** — real-time feed of posts published, errors, performance snapshots

**User roles:**
- `content_creator` — GDA team member, uploads media, views drafts
- `reviewer` — can approve/reject/edit content
- `supervisor` — bulk approve, override scheduling, access analytics

### 4. Data Layer (PostgreSQL)

Core tables:
```
clients            — brand voice, niche, platform accounts
content_items      — AI draft, status, platform, scheduled_at, approved_by
media_assets       — images/videos uploaded by GDA team
platform_accounts  — OAuth tokens per platform per client
interactions       — comments/DMs surfaced for reply
reply_drafts       — AI-generated replies pending approval
publish_log        — audit trail of all published actions
analytics_snapshots — performance data ingested from platforms
```

Content status state machine:
```
draft → brand_check → pending_review → approved → scheduled → publishing → published
                                    ↘ rejected
```

### 5. Platform API Integration

| Platform | API | Auth | Key Capabilities |
|---|---|---|---|
| Instagram | Graph API v18+ | OAuth2 (Business account) | Feed posts, Stories, Reels, DM, comment reply |
| Facebook | Graph API v18+ | OAuth2 (Page token) | Page posts, Stories, comment reply |
| YouTube | Data API v3 | OAuth2 | Video upload, description, community post, comment reply |
| X (Twitter) | API v2 | OAuth2 + Bearer | Tweet, thread, media upload, reply |
| TikTok | Content Posting API | OAuth2 | Video upload, caption, comment reply |

**Key constraint:** Instagram + TikTok require video as file upload (not URL), YouTube has async processing. Publisher Agent must handle async callbacks and update `publish_log` on completion.

### 6. Media Handling (GDA Creative Assets)

GDA team creates images/videos externally, then uploads to the Media Library in the portal. Flow:

```
GDA designer uploads → GCS bucket (GCP) → media_assets record created
AI Content Agent tags/links media to content_item during generation
GDA reviewer sees content + asset together in approval view
On approval → OpenClaw Publisher Agent streams/uploads media to platform API
```

For **video** (YouTube, TikTok, Reels): large file upload via resumable upload APIs. Publisher Agent manages chunked upload with progress tracking.

### 7. Interaction & Reply Loop

```
SocialMonitorAgent polls platforms every N minutes (or via webhook where available)
  → new comments/DMs ingested → stored in interactions table
  → SocialInteractionAgent (Claude) drafts replies with brand voice
  → reply_drafts queued in Interaction Inbox
  → GDA reviewer approves/edits reply
  → OpenClaw Publisher Agent posts reply via platform API
```

### 8. Infrastructure (GCP)

Consistent with business plan Chapter 10:
- **GCP Cloud Run** — OpenClaw agent workers (containerized, auto-scaling)
- **GCP Cloud SQL (PostgreSQL)** — primary data layer
- **GCP Cloud Storage (GCS)** — media asset storage
- **GCP Cloud Scheduler** — trigger scheduled posts, monitoring polls
- **GCP Secret Manager** — platform OAuth tokens, Anthropic API keys
- **GCP Pub/Sub** — event bus between OpenClaw agents (content queued → publisher triggered)

## Human-in-the-Loop Design (Critical)

The human approval gate is enforced at the **data layer**, not just the UI:

- OpenClaw Publisher Agent only processes items with `status = 'approved'` AND `approved_by IS NOT NULL`
- Approval records include: `approver_id`, `approved_at`, `approval_notes`
- No bypass path exists — approval is required even for scheduled content
- Supervisors can set "trusted client" mode for bulk-approval of templated content only

## Implementation Phases

### Phase 1 — Foundation (Weeks 1–4)
- Set up PostgreSQL schema (content_items, media_assets, platform_accounts)
- Build GDA Review Portal core (Next.js): content queue, approval flow, media library
- Implement Claude Content Agent (basic post generation, brand voice system prompt)
- Build Instagram + Facebook adapters in OpenClaw (simplest APIs, highest priority clients)
- End-to-end test: Claude drafts → GDA approves → OpenClaw posts to IG/FB

### Phase 2 — Expand Platforms + Interaction (Weeks 5–8)
- Add X, YouTube, TikTok adapters
- Build Interaction Agent (comment/DM monitoring + reply drafting)
- Interaction Inbox in Review Portal
- Prompt caching for brand voice system prompts (cost control)
- Content Calendar view in portal

### Phase 3 — Intelligence + Scale (Weeks 9–12)
- Brand Compliance Checker (pre-review Claude pass)
- Analytics ingestion + Mission Control dashboard
- Content Planner agent (schedule suggestions)
- Performance-driven content tuning (high-performing post patterns fed back to Content Agent)
- White-label packaging for client-facing delivery

## Technology Stack Summary

| Layer | Technology |
|---|---|
| AI Engine | Anthropic Claude API (claude-sonnet-4-6), Prompt Caching |
| Orchestration | OpenClaw (existing Victor framework) |
| Backend API | NestJS + TypeScript |
| Frontend Portal | Next.js + Tailwind + TypeScript |
| Database | PostgreSQL (Drizzle ORM) |
| Auth | JWT + PassportJS |
| Media Storage | GCP Cloud Storage |
| Infra | GCP Cloud Run, Cloud Scheduler, Pub/Sub, Secret Manager |
| Platform APIs | Instagram/FB Graph API, YouTube Data API v3, X API v2, TikTok Content API |

## Key Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Platform API rate limits | Per-platform queue with backoff + retry; schedule posts to spread load |
| TikTok/YouTube video upload timeouts | Resumable upload with progress tracking; async callback on completion |
| OAuth token expiry | Token refresh service in NestJS; alerts when refresh fails |
| AI content off-brand | Brand compliance pre-check before GDA queue; Claude self-review pass |
| Approval bottleneck at GDA | Bulk approval for templated/scheduled content series; supervisor override |
| Platform policy violations | Banned-content keyword filter pre-Claude; compliance system prompt layer |

## Change Management & Team Allocation

### Context: 20 → 25 People, Whole of GDA

The business plan's **No-Manpower-Growth principle** is clear: the 30-person equivalent becomes a 25-person AI-enabled team. GDA currently has 20 — meaning up to 5 new hires are possible, but only where AI cannot close the gap. SOMA is the proof point: the same or better social media output with a leaner, elevated team.

**The core message to the team: no one is replaced. Every role is elevated from producer to orchestrator.**

### Current 20-Person Team (Estimated Role Distribution)

| Role | Headcount |
|---|---|
| Graphic Designer | 3 |
| Video Creator | 2 |
| Copywriter | 3 |
| Branding Specialist | 2 |
| SEO Specialist | 2 |
| Advertising Specialist | 2 |
| Social Media Platform Manager | 2 |
| Client Representative | 2 |
| Management / Leadership | 2 |
| **Total** | **20** |


### GDA Team Allocation at 25 (Post-SOMA)

**SOMA Dedicated Team: 6 people**

| New Role | Headcount | Sourced From | What Changed |
|---|---|---|---|
| Social Media Operations Lead | 1 | Sr. Social Media Platform Manager | Manual posting → owns SOMA pipeline, content strategy, client delivery |
| AI Content Editor / Reviewer | 2 | Copywriters (2 of 3) | Writing from scratch → prompt engineering, reviewing and editing AI drafts, brand voice custodianship |
| Creative Asset Producer — Graphics | 1 | Graphic Designer (1 of 3) | All-purpose design → focused social asset creation + reusable templates for AI attachment |
| Creative Asset Producer — Video | 1 | Video Creator (1 of 2) | All video work → short-form social video (Reels, Shorts, TikTok) |
| SOMA Systems Specialist | 1 | Redeployed (tech-adjacent, e.g. 2nd Social Media Manager) | Manages OpenClaw, portal admin, platform OAuth, monitoring |

**Rest of GDA: 19 people (existing 14 redeployed + 5 new hires)**

| Function | Headcount | Notes |
|---|---|---|
| Web Development | 5 | +2 new hires (TypeScript/NestJS/Next.js for SOMA build + client sites) |
| Branding & Identity | 2 | Existing branding specialists, now AI-assisted |
| SEO | 2 | Existing, now using Claude for content optimization |
| Advertising / Paid Media | 2 | Existing, ad copy goes through SOMA pipeline |
| Client Success Management | 2 | Existing Client Reps, now portal-empowered with data |
| Business Development | 2 | +1 new hire for SOMA commercial sales |
| AI Operations (shared) | 1 | New hire — AI prompt/workflow ops across all GDA units |
| Operations / Leadership | 3 | Existing management, +1 AI Business Unit Lead new hire |
| **Total GDA** | **25** | **At capacity ceiling** |


### Role Transformation Map

| Old Role | Old Output | New Role | New Output |
|---|---|---|---|
| Social Media Platform Manager | Manually posts to 5 platforms | Social Media Ops Lead | Manages SOMA queue, approves schedule, owns client delivery |
| Social Media Platform Manager #2 | Monitors comments, replies manually | SOMA Systems Specialist | Manages OpenClaw health, platform API accounts, monitoring alerts |
| Copywriter (×3) | Writes all captions, articles from scratch | AI Content Editor (×2) + redeployed to SEO/web content | Prompt engineering, review + edit AI drafts, reject off-brand content |
| Graphic Designer #1 | General agency design work | Creative Asset Producer — Graphics | Social-format images, templates, brand asset library for SOMA |
| Graphic Designer #2, #3 | General agency design work | Stay in GDA design (branding + web) | Now AI-assisted for mood boards, concept ideation |
| Video Creator #1 | General video production | Creative Asset Producer — Video | Short-form social video: Reels, Shorts, TikTok formats |
| Video Creator #2 | General video production | Stay in GDA video (client projects) | Now AI-assisted for scripting, storyboarding |
| Branding Specialist (×2) | Brand guidelines, identity | Brand custodian role absorbed into AI Content Editors | Brand voice documents become Claude system prompts |
| SEO Specialist (×2) | Manual keyword research, content audits | AI-assisted SEO | Claude handles drafts, team handles strategy + approval |
| Advertising Specialist (×2) | Manual ad copy creation | AI-assisted Ad Creative | Ad copy through SOMA pipeline; team optimises and A/B tests |
| Client Representative (×2) | Manual reporting, status calls | Client Success Manager | Portal analytics → client dashboard; data-driven review calls |

### Change Management Program

#### Phase 0 — Leadership Alignment (Week 0, before any announcement)
- Management aligns on role map and no-redundancy commitment
- Confirm which 5 new hires are needed and when
- Identify the 1–2 team members who need the most transition support

#### Phase 1 — Vision Announcement (Week 1)
- All-hands: present the Venturi Model in plain language
  - *"We're not replacing you with AI. We're making each of you 3× more capable."*
- Show the before/after role map — every person sees where they land
- Commit publicly: no role eliminations from this transition
- Introduce SOMA as the first proof point

#### Phase 2 — Role Reclassification (Weeks 2–3)
- One-on-one sessions: each team member maps to their new role
- Updated job descriptions: language shifts from "creates" to "orchestrates", "produces" to "directs"
- Salary review: orchestrator roles should carry equal or higher comp than producer roles
- Address the 3rd copywriter: redeployment to web content/SEO (where Claude also assists — not a downgrade)

#### Phase 3 — Skills Upskilling (Weeks 2–8, parallel to Phase 1 build)

| Training Module | Who | Format | When |
|---|---|---|---|
| AI Literacy & Claude 101 | All 20 team members | 1-day workshop | Week 2 |
| Prompt Engineering for Content | AI Content Editors, Copywriters | 2-day intensive | Week 3 |
| SOMA Portal Operations | All SOMA team | Hands-on training session | Week 5 (when portal MVP is live) |
| Brand Voice Prompt Writing | AI Content Editors | Workshop with branding team | Week 4 |
| OpenClaw & Platform API Operations | SOMA Systems Specialist | Paired with dev team | Weeks 4–6 |
| Analytics & Reporting for Clients | Client Success Managers | 1-day workshop | Week 6 |
| Short-form Video Strategy (Reels/TikTok) | Video Creator | Online course + internal workshop | Weeks 3–4 |

#### Phase 4 — Parallel Running (Weeks 5–8)
- SOMA runs alongside the old manual process for all clients
- SOMA output compared to manual: speed, consistency, engagement rate
- Team builds confidence; catches edge cases before full cutover
- Target: SOMA handles at least 60% of total post volume by Week 8

#### Phase 5 — Full Cutover (Week 9+)
- Manual posting workflow retired
- SOMA is the sole publishing mechanism
- Old social media scheduling tools (Buffer, Hootsuite, etc.) cancelled
- Client-facing reporting shifts to portal analytics dashboard

#### Governance During Transition
- Weekly Change Pulse: short team survey — confidence, blockers, concerns
- SOMA Champion: one team member (suggested: AI Content Editor) acts as internal advocate and first point of contact for questions
- Escalation path: any team member can raise a role or workflow concern directly to Unit Lead, non-anonymously

## Exact Tooling Stack

### MCP Servers (OpenClaw Integration Layer)

| MCP Server | Purpose | Source |
|---|---|---|
| `mcp-instagram-facebook` | Meta Graph API v18+ — post, story, reel, comment reply, DM | Custom-built adapter |
| `mcp-youtube` | YouTube Data API v3 — video upload, description, community post, comment reply | Custom-built adapter |
| `mcp-twitter-x` | X API v2 — tweet, thread, media upload, reply | Custom-built adapter |
| `mcp-tiktok` | TikTok Content Posting API — video upload, caption, comment | Custom-built adapter |
| `mcp-postgres` | Read/write content_items, interactions, publish_log | `@modelcontextprotocol/server-postgres` (open source) |
| `mcp-gcs` | Upload/retrieve media assets from GCP Cloud Storage | Custom-built adapter |
| `mcp-notion` | Content briefs, client documentation, content calendar inputs | Notion official MCP (already in Victor) |
| `mcp-gmail` | Client communication, approval notifications by email | Google official MCP (already in Victor) |
| `mcp-google-calendar` | Content scheduling, posting time management | Google official MCP (already in Victor) |
| `mcp-telegram` | Mission Control alerts, publish success/failure notifications | Custom (already in Victor) |
| `mcp-slack` | Internal team notifications (approval needed, errors) | Slack official MCP |

### Hardware

| Item | Spec | Who | Qty | Est. Cost |
|---|---|---|---|---|
| Creative Workstation | Apple Mac Studio M3 Max (64GB RAM, 1TB SSD) | Graphic Designer, Video Creator | 2 | ~USD 4,000 each |
| Team Laptops | MacBook Pro M3 14" (18GB RAM, 512GB) | AI Content Editors, Ops Lead, Systems Specialist | 4 | ~USD 2,000 each |
| Development Laptops | MacBook Pro M3 16" (36GB RAM, 1TB) | Dev team (web/API) | 5 | ~USD 2,500 each |
| NAS (Network Storage) | Synology DS923+ with 4× 4TB HDDs | Media staging before GCS upload | 1 | ~USD 1,200 |
| External SSDs | Samsung T7 2TB | Video asset transfer | 4 | ~USD 120 each |
| Monitors | LG 27" 4K UltraFine | Creative workstations | 2 | ~USD 700 each |
| Internet Upgrade | Fiber 500Mbps symmetric | Office | 1 | ~USD 100/month |
| **Hardware CAPEX Total** | | | | **~USD 30,000** |

*Note: If team members already have suitable machines, hardware CAPEX reduces significantly. Repurpose existing equipment where possible.*

### Software Subscriptions

#### Creative Tools

| Tool | Plan | Users | Cost |
|---|---|---|---|
| Adobe Creative Cloud | All Apps | 2 (Designer + Video) | ~USD 60/user/month = USD 120/month |
| Figma | Organization | 3 (Design team) | ~USD 45/editor/month = USD 135/month |
| CapCut for Business | Pro | 1 (Video Creator) | ~USD 20/month |
| DaVinci Resolve Studio | One-time licence | 1 | USD 295 one-time |

#### Development & Operations

| Tool | Plan | Users | Cost |
|---|---|---|---|
| Cursor | Pro | 5 (dev team) | USD 20/user/month = USD 100/month |
| GitHub | Team | All devs | USD 4/user/month = USD 20/month |
| Docker Desktop | Pro | Dev team | USD 21/user/month = USD 105/month |
| Postman | Basic | Dev team | USD 14/user/month = USD 70/month |

#### Collaboration & Project Management

| Tool | Plan | Users | Cost |
|---|---|---|---|
| Notion | Team | All GDA (25) | USD 10/user/month = USD 250/month |
| Slack | Pro | All GDA (25) | USD 7.25/user/month = USD 180/month |
| Telegram | Free | SOMA team | USD 0 |
| 1Password Teams | Teams | All GDA (25) | USD 4/user/month = USD 100/month |

#### Monitoring & Analytics

| Tool | Plan | Cost |
|---|---|---|
| Sentry | Team | USD 26/month |
| Metabase | Open source (self-hosted on GCP) | USD 0 (hosting included in GCP) |
| GCP Cloud Monitoring | Included | USD 0 |

### Platform API Access

| Platform | API Tier | Cost | Requirements |
|---|---|---|---|
| Instagram | Meta Graph API — free | USD 0 | Approved Meta Business account, app review for advanced permissions |
| Facebook | Meta Graph API — free | USD 0 | Facebook Page admin, same app as Instagram |
| YouTube | Data API v3 — free quota | USD 0 (10k units/day free) | Google Cloud project, OAuth consent screen |
| X (Twitter) | Basic tier | USD 100/month | App registration, required for automated posting |
| TikTok | Content Posting API — free | USD 0 | TikTok for Business account + app approval (2–4 week review process) |

*Note: TikTok API approval can take 2–4 weeks. Apply at project start — do not wait.*

### Cloud Infrastructure (GCP) — Monthly Estimates

| Service | Purpose | Est. Cost/Month |
|---|---|---|
| Cloud Run | OpenClaw agent workers | USD 50–150 |
| Cloud SQL (PostgreSQL) | Primary database | USD 50–120 |
| Cloud Storage (GCS) | Media asset storage | USD 20–60 |
| Cloud Scheduler | Scheduled post triggers, monitoring polls | USD 5 |
| Pub/Sub | Agent event bus | USD 10–30 |
| Secret Manager | API keys, OAuth tokens | USD 6 |
| Cloud Logging & Monitoring | Observability | USD 20–40 |
| Cloud Build / Artifact Registry | CI/CD pipeline | USD 10–20 |
| **GCP Total** | | **USD 170–430/month** |

### AI Engine Costs (Anthropic Claude API)

| Model | Use Case | Pricing | Est. Monthly |
|---|---|---|---|
| claude-sonnet-4-6 | Content generation, interaction replies | USD 3/MTok input, USD 15/MTok output | USD 200–600 |
| Prompt Caching | Brand voice + client brief system prompts (reused) | 90% cheaper on cached input tokens | Saves USD 150–400/month at volume |

*At 10 clients × 30 posts/month × 5 platforms = 1,500 content generations/month. Prompt caching on 2,000-token brand voice prompts makes this economically viable.*

### Total Monthly OPEX Estimate (Operating at Scale)

| Category | Monthly Cost |
|---|---|
| GCP Infrastructure | USD 200–430 |
| Anthropic Claude API | USD 200–600 |
| Platform APIs (X Twitter only paid) | USD 100 |
| Adobe Creative Cloud | USD 120 |
| Figma | USD 135 |
| CapCut + other creative | USD 20 |
| Cursor (dev) | USD 100 |
| GitHub + Docker + Postman | USD 195 |
| Notion + Slack + 1Password | USD 530 |
| Sentry | USD 26 |
| Internet upgrade | USD 100 |
| **Total SOMA System OPEX** | **~USD 1,700–2,400/month** |

*Human team salaries are separate OPEX and follow GDA's existing payroll structure.*

## End-to-End Connection Architecture

### Full System Map: GDA Station → Social Media Platforms

```
╔══════════════════════════════════════════════════════════════════╗
║                    GDA TEAM STATIONS                             ║
║  MacBook / Mac Studio — Chrome/Safari browser                    ║
║                                                                  ║
║  ┌─────────────────┐  ┌────────────────┐  ┌──────────────────┐   ║
║  │ AI Content      │  │ SOMA Review    │  │ SOMA Systems     │   ║
║  │ Editor          │  │ Portal         │  │ Specialist       │   ║
║  │ · Writes briefs │  │ (Next.js SPA)  │  │ · Admin console  │   ║
║  │ · Edits AI copy │  │ · Content Queue│  │ · Platform OAuth │   ║
║  │ · Approves post │  │ · Media Library│  │ · OpenClaw logs  │   ║
║  └────────┬────────┘  └───────┬────────┘  └────────┬─────────┘   ║
╚═══════════╪═══════════════════╪════════════════════╪════════════╝
            │ HTTPS/443         │ HTTPS/443           │ HTTPS/443
            │   (TLS)           │   (TLS)             │   (TLS)
╔═══════════╪═══════════════════╪════════════════════╪════════════╗
║           ▼       SOMA PORTAL LAYER (GCP Cloud Run)             ║
║  ┌──────────────────────────────────────────────────────────┐   ║
║  │                Next.js Frontend App                      │   ║
║  │  JWT Auth (PassportJS) · Role-based rendering            │   ║
║  │  · Content Queue · Media Library · Calendar · Inbox      │   ║
║  └────────────────────────┬─────────────────────────────────┘   ║
║                           │ REST API calls (internal)           ║
║  ┌────────────────────────▼─────────────────────────────────┐   ║
║  │                NestJS API Backend                        │   ║
║  │  Routes: /content  /media  /approve  /schedule           │   ║
║  │          /interactions  /publish-log  /analytics         │   ║
║  │  Webhook handler: /webhooks/meta  /webhooks/youtube      │   ║
║  └──┬──────────┬──────────────┬──────────────┬─────────────-┘   ║
║     │          │              │              │                  ║
║     ▼          ▼              ▼              ▼                  ║
║  ┌──────┐  ┌──────┐   ┌───────────┐  ┌───────────┐              ║
║  │Cloud │  │Cloud │   │  GCP      │  │  GCP      │              ║
║  │SQL   │  │Pub/  │   │  Storage  │  │  Secret   │              ║
║  │(PG)  │  │Sub   │   │  (GCS)    │  │  Manager  │              ║
║  │      │  │      │   │  media    │  │  tokens   │              ║
║  └──┬───┘  └──┬───┘   └───────────┘  └───────────┘              ║
╚═════╪═════════╪═════════════════════════════════════════════=═══╝
      │         │ event: content_approved
      │         ▼
╔═════╪══════════════════════════════════════════════════════════╗
║     │        OPENCLAW AGENT LAYER (GCP Cloud Run — workers)    ║
║     │                                                          ║
║     │   ┌──────────────────────────────────────────────────┐   ║
║     │   │           OpenClaw Orchestrator                  │   ║
║     │   │   Pub/Sub subscriber · task router               │   ║
║     └───┤   reads approved content_items from PostgreSQL   │   ║
║         └──────┬──────────┬────────────────────┬───────────┘   ║
║                │          │                    │               ║
║         ┌──────▼──┐  ┌────▼──────────┐  ┌─────▼──────────┐     ║  
║         │Content  │  │Interaction    │  │Publisher       │     ║
║         │Agent    │  │Agent          │  │Agent           │     ║
║         │(Claude) │  │(Claude)       │  │(dispatcher)    │     ║
║         │generates│  │drafts replies │  │routes to       │     ║
║         │copy     │  │from comments  │  │platform adapter│     ║
║         └──┬──────┘  └────┬──────────┘  └─────┬──────────┘     ║
║            │              │                    │               ║
║            ▼              ▼                    ▼               ║
║   ┌────────────────────────────────────────────────────────┐   ║
║   │               MCP SERVER LAYER                        │    ║
║   │  (stdio transport — local to Cloud Run container)     │    ║
║   │                                                       │    ║
║   │  mcp-instagram-facebook   mcp-youtube                 │    ║
║   │  mcp-twitter-x            mcp-tiktok                  │    ║
║   │  mcp-postgres             mcp-gcs                     │    ║
║   └──────┬────────┬──────────┬────────────┬───────────────┘    ║
╚══════════╪════════╪══════════╪════════════╪══════════════════=═╝
           │ HTTPS  │ HTTPS    │ HTTPS      │ HTTPS
           │        │          │            │
╔══════════╪════════╪══════════╪════════════╪═══════════════════╗
║          ▼        ▼          ▼            ▼                   ║
║     SOCIAL MEDIA PLATFORM APIs (External — Internet)          ║
║                                                               ║
║  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐     ║
║  │ Meta         │  │ YouTube      │  │ X (Twitter)      │     ║
║  │ Graph API    │  │ Data API v3  │  │ API v2           │     ║
║  │ graph.face   │  │ googleapis   │  │ api.twitter.com  │     ║
║  │ book.com/v18 │  │ .com/youtube │  │ /2/tweets        │     ║
║  │              │  │ /v3/         │  │                  │     ║
║  │ Instagram ✓  │  │ Video upload │  │ Tweet + media    │     ║
║  │ Facebook  ✓  │  │ Comment reply│  │ Reply            │     ║
║  └──────────────┘  └──────────────┘  └──────────────────┘     ║
║                                                               ║
║  ┌──────────────────────────────────────────────────────┐     ║
║  │ TikTok Content Posting API                           │     ║
║  │ open.tiktokapis.com/v2/post/publish/                 │     ║
║  │ Video upload (2-step: init → upload → complete)      │     ║
║  └──────────────────────────────────────────────────────┘     ║
║                                                               ║
║  ▼▼▼ PUBLISHED TO FOLLOWERS ▼▼▼                               ║
╚═══════════════════════════════════════════════════════════════╝
```
### Connection Detail: Content Publishing Flow

```
1. GDA Portal (browser)
   │  User clicks "Approve + Schedule"
   │  POST /api/content/{id}/approve  { scheduled_at: "2026-04-22T10:00:00Z" }
   ▼
2. NestJS API
   │  Updates content_items: status='approved', approved_by, scheduled_at
   │  Publishes Pub/Sub message: { content_id, platform, scheduled_at }
   ▼
3. GCP Cloud Scheduler (for scheduled posts)
   │  At scheduled_at time, triggers Cloud Run job
   │  OR Pub/Sub message triggers worker immediately if scheduled_at = now
   ▼
4. OpenClaw SocialPublisherAgent (Cloud Run)
   │  Reads content_item from PostgreSQL via mcp-postgres
   │  Reads media file URL from GCS via mcp-gcs (generates signed download URL)
   │  Selects correct platform adapter based on content_item.platform
   ▼
5. Platform Adapter (MCP Server, inside same container)
   │  Retrieves OAuth token from GCP Secret Manager
   │  Executes platform-specific publish sequence (see per-platform below)
   ▼
6. Social Media Platform API
   │  Returns post_id / media_id on success
   ▼
7. OpenClaw writes back to PostgreSQL
      status = 'published', platform_post_id, published_at
      Sends Telegram/Slack notification to GDA Mission Control
```

### Connection Detail: Interaction Reply Flow

```
1. SocialMonitorAgent (Cloud Run — triggered every 15 min by Cloud Scheduler)
   │  OR: Webhook received from Meta/YouTube at /webhooks/{platform}
   ▼
2. Platform poll / webhook payload
   │  New comments, mentions, DMs collected
   │  Stored in interactions table (PostgreSQL)
   ▼
3. SocialInteractionAgent (Claude claude-sonnet-4-6)
   │  Reads interaction + brand voice system prompt (cached)
   │  Generates reply draft
   │  Writes to reply_drafts table, status='pending_review'
   ▼
4. GDA Portal — Interaction Inbox
   │  GDA reviewer sees reply draft
   │  Approve / Edit / Reject
   ▼
5. On Approval: same Pub/Sub → OpenClaw Publisher → Platform reply API
      POST /{comment_id}/replies  (Meta)
      POST /youtube/v3/comments   (YouTube)
      POST /2/tweets (in_reply_to) (X)
      POST /v2/comment/reply      (TikTok)
```

### Per-Platform Connection Specification

#### Instagram (via Meta Graph API v18+)

```
AUTHENTICATION
  Flow:    OAuth2 Authorization Code
  Token:   Long-lived Page Access Token (60-day expiry, auto-refresh)
  Scope:   instagram_basic, instagram_content_publish,
           instagram_manage_comments, instagram_manage_insights,
           pages_read_engagement
  Storage: GCP Secret Manager → key: soma/instagram/{client_id}/access_token

MEDIA UPLOAD — IMAGE POST
  Step 1:  POST https://graph.facebook.com/v18.0/{ig_user_id}/media
           Body: { image_url: "<GCS signed URL>", caption: "...", access_token }
           Returns: { id: "creation_container_id" }
  Step 2:  POST https://graph.facebook.com/v18.0/{ig_user_id}/media_publish
           Body: { creation_id: "...", access_token }
           Returns: { id: "ig_media_id" }  ← saved to publish_log

MEDIA UPLOAD — REEL (VIDEO)
  Step 1:  POST /media  { media_type: "REELS", video_url: "<GCS signed URL>",
                          caption: "...", share_to_feed: true }
  Wait:    Poll GET /media/{id}?fields=status_code until status = FINISHED
  Step 2:  POST /media_publish  { creation_id }

MEDIA UPLOAD — STORY
  Step 1:  POST /media  { media_type: "STORIES", image_url or video_url }
  Step 2:  POST /media_publish

COMMENT REPLY
  POST https://graph.facebook.com/v18.0/{comment_id}/replies
  Body: { message: "reply text", access_token }

WEBHOOK (incoming comments/mentions)
  Register: POST /app/subscriptions  { object: "instagram", fields: ["comments"] }
  Receives: POST /webhooks/meta  (NestJS handler verifies X-Hub-Signature-256)

RATE LIMITS
  200 API calls/hour per token. Publisher Agent applies exponential backoff
  on 429 responses. Posts spread across time to stay under limit.
```

#### Facebook (via Meta Graph API v18+)

```
AUTHENTICATION
  Same OAuth2 app as Instagram. Separate Page Access Token per FB Page.
  Scope: pages_manage_posts, pages_read_engagement, pages_manage_comments

TEXT POST
  POST https://graph.facebook.com/v18.0/{page_id}/feed
  Body: { message: "...", access_token }

IMAGE POST
  POST https://graph.facebook.com/v18.0/{page_id}/photos
  Body: { url: "<GCS signed URL>", caption: "...", access_token }

VIDEO POST (standard, up to 1GB)
  POST https://graph-video.facebook.com/v18.0/{page_id}/videos
  Body: multipart/form-data  { source: <video bytes>, description: "..." }
  Large files: Resumable upload (chunked, 10MB chunks)

COMMENT REPLY
  POST https://graph.facebook.com/v18.0/{comment_id}/comments
  Body: { message: "...", access_token }

WEBHOOK
  Same Meta app subscription: object: "page", fields: ["feed", "mention"]
```

#### YouTube (Data API v3)

```
AUTHENTICATION
  Flow:    OAuth2 Authorization Code (Google)
  Token:   Access token (1hr) + Refresh token (permanent until revoked)
  Scope:   https://www.googleapis.com/auth/youtube.upload
           https://www.googleapis.com/auth/youtube.force-ssl
  Storage: GCP Secret Manager → key: soma/youtube/{channel_id}/refresh_token
  Library: google-auth-library (Node.js)

VIDEO UPLOAD — RESUMABLE (required for files > 5MB)
  Step 1:  POST https://www.googleapis.com/upload/youtube/v3/videos
           ?uploadType=resumable
           Headers: Authorization: Bearer {token}
                    X-Upload-Content-Type: video/mp4
                    X-Upload-Content-Length: {bytes}
           Body: { snippet: { title, description, tags, categoryId },
                   status: { privacyStatus: "public" } }
           Returns: Location header with resumable upload URI

  Step 2:  OpenClaw streams video from GCS to YouTube resumable URI
           PUT {resumable_uri}  (chunked, 256KB minimum per chunk)
           On completion: Returns { id: "youtube_video_id" }

  Note:    YouTube processes video asynchronously (transcoding).
           Poll GET /videos?id={id}&part=status until status.uploadStatus = "processed"

COMMENT REPLY
  POST https://www.googleapis.com/youtube/v3/comments
  Body: { snippet: { parentId: "{comment_id}", textOriginal: "reply" } }

POLLING (no webhook for comments)
  GET /youtube/v3/commentThreads?videoId={id}&order=time
  Cloud Scheduler triggers SocialMonitorAgent every 30 min

QUOTA
  10,000 units/day free. Video upload = 1,600 units. Comment reply = 50 units.
  Monitor via GCP dashboard. Request quota increase if needed (~48hr approval).
```

#### X / Twitter (API v2)

```
AUTHENTICATION
  Flow:    OAuth2 with PKCE (user-context, required for posting)
  Token:   Access token + Refresh token
  Scope:   tweet.read tweet.write users.read offline.access
  Storage: GCP Secret Manager → key: soma/twitter/{account_id}/access_token
  Plan:    X Basic ($100/month) — required for automated posting

TEXT TWEET
  POST https://api.twitter.com/2/tweets
  Headers: Authorization: Bearer {access_token}
  Body: { text: "..." }
  Returns: { data: { id: "tweet_id" } }

TWEET WITH IMAGE
  Step 1 (media upload — still v1.1):
    POST https://upload.twitter.com/1.1/media/upload.json
    (INIT)     Body: { command: "INIT", media_type: "image/jpeg",
                       total_bytes: N, media_category: "tweet_image" }
    (APPEND)   PUT with chunk
    (FINALIZE) POST { command: "FINALIZE" }
    Returns: { media_id_string: "..." }
  Step 2:
    POST /2/tweets  Body: { text: "...", media: { media_ids: ["..."] } }

TWEET WITH VIDEO
  Same CHUNKED_MEDIA upload flow with media_category: "tweet_video"
  Poll CHUNKED_MEDIA STATUS until processing_info.state = "succeeded"
  Then POST /2/tweets with media_ids

REPLY
  POST /2/tweets  Body: { text: "...", reply: { in_reply_to_tweet_id: "..." } }

MENTION MONITORING
  GET /2/tweets/search/recent?query=@{handle}&max_results=100
  Cloud Scheduler every 15 min (Basic plan: 500k tweets/month read cap)

RATE LIMITS
  Basic: 1,500 tweets/month write, 10,000 reads/month
  Spread posts — do not burst. Queue enforces max 50 posts/day per account.
```

#### TikTok (Content Posting API)

```
AUTHENTICATION
  Flow:    OAuth2 Authorization Code (TikTok Login Kit)
  Token:   Access token (24hr) + Refresh token (365 days)
  Scope:   video.publish video.upload user.info.basic
  Storage: GCP Secret Manager → key: soma/tiktok/{account_id}/access_token
  Note:    Requires TikTok for Business account + app approval (2–4 weeks)
           Apply at project start. Sandbox available while waiting.

VIDEO UPLOAD — 2-STEP FLOW
  Step 1 — Initialise:
    POST https://open.tiktokapis.com/v2/post/publish/video/init/
    Headers: Authorization: Bearer {access_token}
    Body: { post_info: { title: "caption #hashtags",
                         privacy_level: "PUBLIC_TO_EVERYONE",
                         disable_comment: false },
            source_info: { source: "FILE_UPLOAD",
                           video_size: N, chunk_size: 10MB,
                           total_chunk_count: N } }
    Returns: { publish_id, upload_url }

  Step 2 — Upload chunks:
    PUT {upload_url}
    Headers: Content-Range: bytes 0-{chunk_size}/{total}
    Body: video bytes (chunk)
    Repeat for each chunk

  Step 3 — Check status:
    GET /v2/post/publish/status/fetch/
    Body: { publish_id }
    Poll until status = "PUBLISH_COMPLETE"

COMMENT REPLY
  POST https://open.tiktokapis.com/v2/comment/reply/publish/
  Body: { video_id: "...", text: "reply", comment_id: "..." }

COMMENT POLLING
  GET /v2/video/comment/list/?video_id={id}
  Cloud Scheduler every 30 min (no webhook available on standard tier)

SANDBOX TESTING
  Use https://developers.tiktok.com/tools/sandbox during development.
  Sandbox posts do not appear publicly — safe for testing full upload flow.
```

### OAuth Token Lifecycle Management

All platform tokens are managed by a dedicated **TokenService** in the NestJS API:

```
┌─────────────────────────────────────────────────────────────────┐
│                    TokenService (NestJS)                        │
│                                                                 │
│  Stores in:  GCP Secret Manager (encrypted at rest)             │
│  Table:      platform_accounts (token metadata only, not value) │
│                                                                 │
│  REFRESH LOGIC:                                                 │
│  - Cloud Scheduler checks token expiry daily                    │
│  - If expires_in < 7 days → auto-refresh via platform API       │
│  - On refresh failure → alert to Telegram + Slack (URGENT)      │
│  - Never store raw tokens in PostgreSQL — only Secret Manager   │
│                                                                 │
│  TOKEN ROTATION PER PLATFORM:                                   │
│  Instagram/Facebook  60-day long-lived token, refresh monthly   │
│  YouTube             Refresh token permanent, access = 1hr      │
│  X (Twitter)         Refresh token, set offline.access scope    │
│  TikTok              Refresh token 365 days, access = 24hr      │
└────────────────────────────────────────────────────────────────-─┘
```

### Media Flow: GDA Station → GCS → Platform

```
GDA Creative uploads file in SOMA Portal
  │  Browser → multipart POST /api/media/upload
  │  NestJS issues GCS Signed Upload URL (no file passes through server)
  │  Browser uploads directly to GCS via signed URL (PUT)
  │  NestJS records media_assets row (gcs_path, mime_type, size, client_id)
  ▼
Media sits in GCS bucket: gs://soma-media/{client_id}/{uuid}.mp4
  │  Bucket policy: private (no public access)
  │  Lifecycle: delete after 90 days post-publish (cost control)
  ▼
On publish, OpenClaw Publisher Agent:
  │  Requests short-lived GCS Signed Download URL (15 min expiry)
  │  Streams file from GCS → platform upload API
  │  For large videos: streams in chunks (no full download to worker memory)
  ▼
Platform stores file on own CDN → public to followers
```

### Webhook Registration & Inbound Connection

Platforms that support webhooks push new events to SOMA rather than being polled:

```
META (Instagram + Facebook)
  Register once:
    POST https://graph.facebook.com/v18.0/{app_id}/subscriptions
    { object: "instagram", callback_url: "https://soma.gaiada.com/webhooks/meta",
      fields: ["comments", "mentions", "messages"],
      verify_token: {SECRET}, access_token: {app_token} }
  Meta sends: GET /webhooks/meta?hub.challenge=... (verification)
  NestJS responds with hub.challenge to confirm
  Live events: POST /webhooks/meta  { entry: [...] }
  Verification: HMAC-SHA256 of payload with app_secret (X-Hub-Signature-256 header)

YOUTUBE
  No webhook for comments. Cloud Scheduler polls every 30 min.
  YouTube Data API v3 Notifications available for new video uploads only
  (PubSubHubbub) — register at: https://pubsubhubbub.appspot.com/

X (TWITTER)
  Basic tier does not include Account Activity API (webhooks).
  Polling via /2/tweets/search/recent on 15-min Cloud Scheduler.

TIKTOK
  No comment webhook on standard tier. Polling on 30-min Cloud Scheduler.
```

### Network & Security

```
GDA Stations → SOMA Portal
  · HTTPS/TLS 1.3 only
  · JWT access token (15min) + refresh token (7 days, httpOnly cookie)
  · CSRF protection on all mutating routes
  · Role-based route guards (NestJS Guards)

SOMA Portal → NestJS API
  · Internal GCP VPC (if co-located on Cloud Run)
  · Or same Cloud Run service (monorepo deploy)

NestJS → GCP Services
  · Service Account with least-privilege IAM roles
  · Cloud SQL: private IP (VPC peering, no public IP)
  · GCS: signed URLs only (no public bucket)
  · Secret Manager: secretAccessor role only

OpenClaw Workers → Platform APIs
  · Static egress IP via GCP Cloud NAT (required by some platforms)
  · All calls over HTTPS
  · Platform API keys never in code — always Secret Manager at runtime

Inbound Webhooks
  · /webhooks/* routes behind HMAC signature verification
  · Invalid signatures → 401, logged, alerted
  · Replay attack prevention: timestamp validation (± 5 min window)
```

### Environment Summary

| Environment | Purpose | URL Pattern |
|---|---|---|
| Local Dev | Developer machine, Docker Compose | localhost:3000 / localhost:3001 |
| Staging | Cloud Run (staging project), sandbox platform APIs | staging.soma.gaiada.com |
| Production | Cloud Run (prod project), live platform APIs | soma.gaiada.com |

Each environment has its own GCP project, Secret Manager, and Cloud SQL instance. Platform OAuth apps should have separate staging apps where supported (Meta + Google both allow this). TikTok sandbox is used for staging.

## Project Structure

```
gda_socmed/
├── apps/
│   ├── portal/          # Next.js GDA Review Portal
│   └── api/             # NestJS backend
├── packages/
│   ├── openclaw-social/ # Social Media OpenClaw agents
│   ├── platform-adapters/ # IG, FB, YT, X, TikTok wrappers
│   └── db/              # Drizzle schema + migrations
├── infrastructure/      # GCP Terraform / deployment configs
└── docs/                # Architecture docs
```
