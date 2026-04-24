# Figma → Site Playbook (RH Properties)

End-to-end reference for turning a Figma design into a production real-estate
site on the 3PRVTN stack (**P**ostgreSQL + **P**ayload Headless CMS + **P**ython + **R**eactJS + **V**iteJS + **T**ailwindCSS + **N**odeJS). Everything in this doc is what we actually did on
this project, recorded so the next project can copy the steps without
re-deriving them.

> **Companion doc:** [`docs/figma_automation.md`](./figma_automation.md) is the
> chronological work log — the *narrative* of what happened day by day. This
> document is the *playbook* — clean steps, decisions, and references.

---

## Table of contents

1. [The stack, topology, and URLs](#1-the-stack-topology-and-urls)
2. [Prerequisites — what to install](#2-prerequisites--what-to-install)
3. [Phase 1 — Scaffold from `templatebase`](#3-phase-1--scaffold-from-templatebase)
4. [Phase 2 — Rebrand & isolate](#4-phase-2--rebrand--isolate)
5. [Phase 3 — Go live (Postgres, PM2, nginx, SSL)](#5-phase-3--go-live)
6. [Phase 3.5 — Seed strategy](#6-phase-35--seed-strategy)
7. [Phase 3.6 — Handoff to the laptop](#7-phase-36--handoff-to-the-laptop)
8. [Phase 4 — Figma MCP setup](#8-phase-4--figma-mcp-setup)
9. [Phase 4.1 — Tokens-first (palette + font)](#9-phase-41--tokens-first)
10. [Phase 4.2 — Delete templatebase leftovers](#10-phase-42--delete-templatebase-leftovers)
11. [Phase 4.3 — IA rework (sitemap → Payload schema)](#11-phase-43--ia-rework)
12. [Phase 4.4 — Home page sections as Payload blocks](#12-phase-44--home-sections-as-payload-blocks)
13. [Phase 4.5 — Header / Footer rebrand](#13-phase-45--header--footer-rebrand)
14. [Phase 4.6 — Finish the rest of the pages](#14-phase-46--finish-the-rest-of-the-pages)
15. [Phase 4.7 — Polish (images, dropdown, anchors, dark-theme fix)](#15-phase-47--polish)
16. [Local dev (laptop)](#16-local-dev-laptop)
17. [Deploy flow — laptop → GitHub → server](#17-deploy-flow)
18. [Gotchas we hit (and the fixes)](#18-gotchas-we-hit)
19. [Payload CMS — the parts that matter](#19-payload-cms--the-parts-that-matter)
20. [SEO — robots.txt + sitemap.xml](#20-seo--robotstxt--sitemapxml)
21. [File map — where things live](#21-file-map)
22. [Next steps (tomorrow's backlog)](#22-next-steps-tomorrows-backlog)

---

## 1. The stack, topology, and URLs

| | |
|---|---|
| **Frontend** | Vite 6 SSR + React 19 + React Router 6 + Tailwind v4 |
| **CMS** | Payload 3 (Next.js 16 App Router under the hood) |
| **DB** | PostgreSQL 16 (local dev + prod) |
| **Process manager** | PM2 (`ecosystem.config.cjs`) |
| **Reverse proxy** | nginx + Let's Encrypt SAN cert |
| **Repo** | `git@github.com:Gaia-Digital-Agency/rhproperties_react.git` |

**Three environments, three jobs:**

| | Purpose | Path |
|---|---|---|
| Laptop (macOS) | Canonical dev — Figma MCP, code edits, commits, pushes | `/Users/rogerwoolie/Downloads/rhproperties_react` |
| Server `gda-s01` | Production deploy target — `git pull` + build + restart | `/var/www/rhproperties` |
| GitHub | Source of truth | `Gaia-Digital-Agency/rhproperties_react` |

**Flow:** laptop edit → `git push main` → ssh server → `git pull` → build → seed → `pm2 restart`.

**Live URLs:**
- Frontend — https://rhproperties.gaiada.online/
- Admin — https://rhproperties.gaiada.online/admin (demo creds below)

**Ports on the VM:**
- 3007 — `rhproperties-web` (Vite SSR)
- 4007 — `rhproperties-cms` (Payload admin + API)

---

## 2. Prerequisites — what to install

### On the laptop (macOS)

```bash
# node / package manager
brew install node@22 pnpm
# git
brew install git
# postgres for local dev (must match prod major version)
brew install postgresql@16 && brew services start postgresql@16
# Figma desktop app (required for the Dev Mode MCP)
#   download from https://www.figma.com/downloads/
# Claude Code CLI (if you're automating the work)
#   see https://claude.com/claude-code
```

Also set up:
- **SSH key access to the server** (`ssh gda-s01` should work without a password — entry in `~/.ssh/config`).
- **GitHub SSH** for the `Gaia-Digital-Agency` org (the repo's `origin` is `git@github.com-net1io:...`, which implies a per-host SSH config entry — mirror that).
- A **writeable Downloads folder** for project assets pulled from Figma.

### On the server (one-time, already done for this project)

```bash
sudo apt install postgresql-16 nginx certbot python3-certbot-nginx
sudo npm i -g pnpm pm2
# Postgres role + DB (see §5)
# PM2 + ecosystem.config.cjs (already checked into the repo)
# nginx vhost + SSL (see §5)
```

---

## 3. Phase 1 — Scaffold from `templatebase`

`templatebase` is our 3PRVTN starter at `/var/www/templatebase`. We copy, not fork, because we want a clean git history and independent deploys.

**On the server:**

```bash
# 1) copy files (exclude node_modules, .git, build artefacts)
sudo rsync -a \
  --exclude='node_modules' --exclude='.git' \
  --exclude='dist' --exclude='.next' \
  --exclude='graphify-out' \
  /var/www/templatebase/ /var/www/rhproperties/

# 2) make it ours
sudo chown -R azlan:azlan /var/www/rhproperties/
cd /var/www/rhproperties

# 3) fresh git history
git init -b main
git remote add origin git@github.com-net1io:Gaia-Digital-Agency/rhproperties_react.git
```

Do **not** inherit templatebase's commits — fresh history makes future diffs meaningful.

---

## 4. Phase 2 — Rebrand & isolate

The scaffold is generic; every identifier still says `templatebase`. Swap **every** occurrence of these before going further:

| Area | templatebase | rhproperties |
|---|---|---|
| Root `package.json` `name` | `templatebase` | `rhproperties` |
| Workspace package names | `@templatebase/cms`, `@templatebase/web` | `@rhproperties/cms`, `@rhproperties/web` |
| PM2 app names | `templatebase-cms`, `templatebase-web` | `rhproperties-cms`, `rhproperties-web` |
| Web port | `3004` | **`3007`** (3005/3006 taken) |
| CMS port | `4004` | **`4007`** |
| DB name / user | `template_db` / `template_user` | `rhproperties_db` / `rhproperties_user` |
| Domain | `templatebase.gaiada.online` | `rhproperties.gaiada.online` |
| Secrets | (inherited) | **rotate all** with `openssl rand -hex 32` |

Files to touch in the scaffold:
`package.json`, `packages/*/package.json`, `ecosystem.config.cjs`,
`packages/cms/.env`, `packages/web/.env`, root `.env`, `README.md`,
`CLAUDE.md`, `docs/TECH_STACK.md`, `.claude/settings.local.json`.

> **Never copy prod `.env` files between environments.** Each env generates
> its own secrets via `openssl rand -hex 32`. Copying server secrets to your
> laptop or vice versa is a security bug.

---

## 5. Phase 3 — Go live

### 5.1 Postgres

```bash
sudo -u postgres psql <<SQL
CREATE ROLE rhproperties_user WITH LOGIN PASSWORD '<strong-random>';
CREATE DATABASE rhproperties_db OWNER rhproperties_user;
GRANT ALL PRIVILEGES ON DATABASE rhproperties_db TO rhproperties_user;
SQL
```

Then in `packages/cms/.env`:

```
DATABASE_URL=postgresql://rhproperties_user:<pw>@127.0.0.1:5432/rhproperties_db
PAYLOAD_SECRET=<openssl rand -hex 32>
PAYLOAD_URL=http://localhost:4007
FRONTEND_URL=http://localhost:3007
REVALIDATION_SECRET=<openssl rand -hex 32>   # same value in packages/web/.env
CRON_SECRET=<openssl rand -hex 32>
WEB_MANAGER_API_SECRET=<openssl rand -hex 32>
WEB_MANAGER_ALLOWED_IPS=127.0.0.1
```

Payload's postgres adapter auto-pushes schema on first boot; no manual migrations.

### 5.2 Install + build + first boot

```bash
pnpm install                                  # 779 packages, clean
pnpm --filter @rhproperties/cms generate:types
cp packages/cms/src/payload-types.ts packages/web/src/payload-types.ts
pnpm build                                    # CMS + web both green
```

### 5.3 PM2

`ecosystem.config.cjs` must invoke `pnpm start`, **not** `node_modules/.bin/next` directly — the `.bin/next` file is a POSIX shell shim and PM2 will try to run it as JS and fail with `SyntaxError: missing ) after argument list`.

Correct form:

```js
{
  name: 'rhproperties-cms',
  cwd: '/var/www/rhproperties/packages/cms',
  script: 'pnpm',
  args: 'start',
  interpreter: 'none',   // CRITICAL
  env: { PORT: '4007' },
},
{
  name: 'rhproperties-web',
  cwd: '/var/www/rhproperties/packages/web',
  script: 'pnpm',
  args: 'start',
  interpreter: 'none',
  env: { PORT: '3007' },
}
```

Then:

```bash
pm2 start ecosystem.config.cjs
pm2 save                      # persists across reboots
```

### 5.4 DNS

A record `rhproperties → 34.124.244.233` at the domain registrar (GoDaddy in our case). Resolves in minutes.

### 5.5 nginx vhost

Our nginx vhost lives at `/etc/nginx/sites-available/subdomains.gaiada.online` and is **symlinked** into `sites-enabled/`. Watch out: on this project we found it was a plain file copy, not a symlink, so earlier edits never landed. Replace with a real symlink once; never edit both.

Server block per app (HTTP → HTTPS redirect + reverse proxy):

```nginx
server {
    listen 80;
    server_name rhproperties.gaiada.online;
    return 301 https://$host$request_uri;
}
server {
    listen 443 ssl;
    server_name rhproperties.gaiada.online;
    ssl_certificate /etc/letsencrypt/live/templategen.gaiada.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/templategen.gaiada.online/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location /admin { proxy_pass http://127.0.0.1:4007; /* + headers */ }
    location /api   { proxy_pass http://127.0.0.1:4007; /* + headers */ }
    location /      { proxy_pass http://127.0.0.1:3007; /* + headers */ }
}
```

Full proxy header block is in the actual vhost — copy the pattern from `/etc/nginx/sites-available/subdomains.gaiada.online`.

### 5.6 SSL

We use **one** SAN Let's Encrypt certificate at `/etc/letsencrypt/live/templategen.gaiada.online/` that covers all `*.gaiada.online` project subdomains. Add a new one with:

```bash
sudo certbot certonly --nginx --expand \
  --cert-name templategen.gaiada.online \
  -d domain1 -d domain2 ... -d rhproperties.gaiada.online
sudo nginx -t && sudo systemctl reload nginx
```

---

## 6. Phase 3.5 — Seed strategy

### Why a dedicated seed runner

The templatebase admin has a `SeedButton` in `BeforeDashboard` that calls `/next/seed`, but that endpoint doesn't exist. We added a standalone seed runner so seeding works without a running server.

Location: `packages/cms/scripts/seed.ts`. It imports `payload` + the seed module and executes against the DB directly.

Script in `packages/cms/package.json`:

```json
"seed": "cross-env NODE_OPTIONS=--no-deprecation tsx scripts/seed.ts"
```

Invoke with:

```bash
pnpm --filter @rhproperties/cms seed
```

### What the seed does (current)

`packages/cms/src/endpoints/seed/index.ts` + `rh-seed.ts`:

1. Wipe globals (header, footer, settings — navItems set to `[]`).
2. Wipe collections in FK-safe order: properties → team-members → posts → pages → forms → form-submissions → categories → media → search.
3. Create the admin user if absent (`admin@gaiada.com` / `admin`).
4. Upload a fallback hero image (`image-hero1.webp` from the Payload template) to `media`.
5. Call `seedRh(...)` which:
   - Uploads Figma property photos from `packages/cms/src/endpoints/seed/assets/` into `media`.
   - Creates 6 Properties (3 commercial + 3 residential) linked to those photos.
   - Creates 4 Team Members.
   - Creates 3 News posts (from the `posts` collection).
   - Creates 5 Pages: Home, Browse Listings, Service, Team, Contact.
   - Creates a Contact Form (Payload form-builder plugin).
   - Writes Header + Footer + Settings globals with the RH nav.

> **Tables for deleted collections get orphaned.** Payload's postgres adapter
> auto-creates tables but doesn't drop them. When we removed `services`,
> `portfolio`, etc., the old tables lingered in the DB until manually dropped.
> Not a correctness issue — just clutter.

---

## 7. Phase 3.6 — Handoff to the laptop

Two Claude Code sessions are typical: **one per environment.** The server session does deploys; the laptop session does the real work (Figma MCP, code edits).

On the laptop:

```bash
cd /Users/rogerwoolie/Downloads
git clone git@github.com-net1io:Gaia-Digital-Agency/rhproperties_react.git
cd rhproperties_react
pnpm install
```

Then set up local dev (§16).

**Rule:** never edit source files on the server. Anything edited there gets blown away on the next `git pull`.

---

## 8. Phase 4 — Figma MCP setup

We used the **official Figma Dev Mode MCP**. Alternatives existed (Framelink's `figma-developer-mcp` + raw REST API) but Dev Mode gives the highest-fidelity output and is free with any paid Figma seat.

### 8.1 Requirements

- **Figma desktop app** (not the web app) installed on the laptop.
- **Dev Mode** toggled on in the target Figma file.
- The MCP server is served locally at `http://127.0.0.1:3845/mcp` whenever the desktop app is running. There's no separate daemon to start.

### 8.2 Register with Claude Code

```bash
claude mcp add figma-dev-mode --transport http http://127.0.0.1:3845/mcp
# verify
claude mcp list
# expect: figma-dev-mode: http://127.0.0.1:3845/mcp (HTTP) - ✓ Connected
```

If it reports `No Figma window open`, the desktop app isn't running or the file isn't focused.

### 8.3 The tools you'll use

| Tool | Purpose |
|---|---|
| `get_metadata(nodeId)` | XML tree of nodes under `nodeId` — names, sizes, positions. Cheap. |
| `get_screenshot(nodeId)` | Rendered PNG of a node. Useful for seeing what a frame looks like. |
| `get_variable_defs(nodeId)` | Colour + type + spacing *variables* as JSON. This is how we pull design tokens. |
| `get_design_context(nodeId)` | The big one — returns (a) reference React+Tailwind code, (b) a screenshot, (c) a summary of styles used. Use this for any frame you're about to port to code. |
| `create_design_system_rules` | Prompt helper for generating a per-project design-system rules doc. |

### 8.4 Node-ID extraction

Every Figma URL looks like `https://www.figma.com/design/<fileKey>/<fileName>?node-id=1-2&…`. The `node-id` URL segment uses `-` but Figma's API wants `:` — convert `1-2` → `1:2`. Page-level frames inside a Figma file have IDs like `0:1` (the canvas root), `9:2` (a specific page frame), etc.

### 8.5 When the MCP loses its session

`mcp-session-id` is a short-lived HTTP header. If you get `No session found for sessionId`, re-initialise:

```bash
SID=$(curl -s -i -X POST http://127.0.0.1:3845/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize",
       "params":{"protocolVersion":"2024-11-05","capabilities":{},
                 "clientInfo":{"name":"probe","version":"0.1"}}}' \
  | awk -F': ' '/mcp-session-id/ {print $2}' | tr -d '\r\n')

curl -s -X POST http://127.0.0.1:3845/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SID" \
  -d '{"jsonrpc":"2.0","method":"notifications/initialized","params":{}}'
```

Then all subsequent requests include `mcp-session-id: $SID`.

---

## 9. Phase 4.1 — Tokens-first

**Principle:** before porting any UI, pull **colours + type + spacing** variables into the Tailwind theme. Do that in one self-contained commit. The existing templatebase blocks then re-skin to the new brand without any component edits.

### 9.1 Pull the variables

```bash
# with an active MCP session
curl -s -X POST http://127.0.0.1:3845/mcp \
  -H "mcp-session-id: $SID" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call",
       "params":{"name":"get_variable_defs",
                 "arguments":{"nodeId":"0:1",
                              "clientLanguages":"typescript,css",
                              "clientFrameworks":"react,tailwind"}}}'
```

Response is JSON keyed by variable name:

```json
{
  "Navy Primary": "#163e69",
  "Warm White": "#f7f5f0",
  "Ink": "#1c1c1a",
  ...
  "Heading/Heading 1 Bold":
    "Font(family: \"Urbanist\", style: Bold, size: 40, weight: 700, lineHeight: 60, letterSpacing: 0)",
  ...
}
```

### 9.2 Wire into Tailwind v4

Tailwind v4 uses `@theme` in CSS, not a JS config. All of this lives in
[`packages/web/src/globals.css`](../packages/web/src/globals.css):

1. **Font** — swap the Google Fonts link in
   [`packages/web/index.html`](../packages/web/index.html), then
   `--font-urbanist` / `--font-sans` / `--font-heading` in the top `@theme` block.
2. **Type scale** — `--text-h1` through `--text-caption` (size + `--line-height` pair each).
3. **Raw palette tokens** — `--navy-primary`, `--warm-white`, etc., defined on `:root` so they're
   resolvable as `var(...)` anywhere.
4. **Semantic mapping** — shadcn-style `--background: var(--warm-white)`, `--primary: var(--navy-primary)`, etc.
5. **`@theme inline` block** — exposes `--color-navy-primary` etc. so
   `bg-navy-primary`, `text-ink` work as Tailwind utilities.
6. **Dark theme** — keep the `[data-theme='dark']` block for future; on this project we later disabled the
   `prefers-color-scheme` auto-flip (see §18.3).

Commit: `feat(web): Phase 4 step 1 — RH Properties tokens from Figma` (a502531).

---

## 10. Phase 4.2 — Delete templatebase leftovers

templatebase was written for a digital agency (portfolio, team, departments, agency services). Keep only what your project needs. We removed:

- Collections: `services` (agency version), `portfolio`, `about-items` (values), `departments`, `team` (agency team).
- Blocks: `AboutBlock`, `CareerBlock`, `PortfolioBlock`, `Services` block — and their web renderers.
- Pages: `Portfolio`, `Careers`, `Blog` from the seed.
- Routes: `/services/:slug` and the matching web page.
- Ancillary: every reference in `web-manager.ts`, `generatePreviewPath.ts`, `data-loader.ts`,
  `server.ts`, `RenderBlocks.tsx`, `RowLabel.tsx`, and the seed.

Process:
1. `Grep` every name/path/slug to find references.
2. Delete the directories.
3. Fix the TS errors until build is green.
4. Re-seed (the seed clears everything first, so orphan rows are gone).
5. Commit once as `chore: remove agency/templatebase leftovers` (c75b240).

---

## 11. Phase 4.3 — IA rework

Start from the client's **sitemap**, not from the scaffold's page layout.

Our sitemap had: `Home · Browse Listings · Service · Team · News · Contact` (+ a "Landing Page" we skipped for now).

Per-node → Payload mapping:

| Sitemap node | Payload shape |
|---|---|
| Home | `pages` slug `home`, `hero.type = rhLanding` |
| Browse Listings | `pages` slug `browse`, two `propertyShowcase` blocks |
| Browse/Commercial · Browse/Residential | web route `/browse/:type` → `BrowseListPage.tsx` fetches properties where type equals param |
| Property Detail | new **`properties`** collection; web route `/properties/:slug` |
| Service | `pages` slug `service`, anchored `aboutAgency` sections (#mini-makeover / #emergency-repair / #other-services) |
| Team | `pages` slug `team` + new **`team-members`** collection; web route `/team/:slug` |
| News | `posts` collection re-labelled "News" in admin (keep slug = `posts` internally to avoid DB churn); route renamed `/posts/*` → `/news/*` |
| Contact | `pages` slug `contact` with `contactDetails` + `formBlock` |

### 11.1 New collections

- [`packages/cms/src/collections/Properties/index.ts`](../packages/cms/src/collections/Properties/index.ts) — title, type (commercial/residential), location, sizeSqm, bedrooms/bathrooms/parking (residential-only), pricingType (sale/lease), price, leaseTerms (lease-only), features[], availability, heroImage, gallery[], meta (SEO), slugField, drafts+autosave.
- [`packages/cms/src/collections/TeamMembers/index.ts`](../packages/cms/src/collections/TeamMembers/index.ts) — name, role, bio, image, email, phone, order, slugField (from `name`), drafts.

### 11.2 Posts → News (URL only)

Kept the collection slug as `posts` (renaming triggers an FK cascade in Postgres and loses existing relations). What changed:

- `Posts.labels = { singular: 'News Article', plural: 'News' }` in admin.
- `collectionPrefixMap.posts = '/news'` in `generatePreviewPath.ts`.
- `data-loader.ts` now matches `segments[0] === 'news'`.
- `App.tsx` routes: `/news`, `/news/page/:n`, `/news/:slug`.
- `web-manager.ts` builds `/news/${slug}`.

Commit: `feat: Phase 4 step 2 — IA rework` (afe992f).

---

## 12. Phase 4.4 — Home sections as Payload blocks

Each section on the Home page is a Payload block — editable in admin, reorderable, and reusable across pages. The ones we built:

| Block (Payload slug) | What it renders | Data source |
|---|---|---|
| `propertyShowcase` | 3- or 6-card grid with CTA | Client-side fetch from `/api/properties?where[type]=...` |
| `aboutAgency` | Two-column (image + copy) with optional anchor + up to 2 CTAs | Static content |
| `ourServices` | 3-column icon + title + description grid | Static content, Lucide icons picked from an allow-list |
| `testimonials` | Carousel with prev/next, avatar, author + role | Static content |
| `newsInsights` | 3-card grid of latest News posts | Client-side fetch from `/api/posts` |
| `ctaBanner` | Full-width dark navy banner with headline + button | Static content |
| `teamGrid` | Grid of Team Members sorted by `order` | Client-side fetch from `/api/team-members` |
| `contactDetails` | 4-column icon strip (map-pin / phone / mail / clock) | Static content |

**Each block has two files:**
- `packages/cms/src/blocks/<Name>/config.ts` — Payload config (fields).
- `packages/web/src/blocks/<Name>/Component.tsx` — React renderer.

**Wiring:**
- Register the Payload config in the Pages collection's `layout` blocks array.
- Register the web component in `packages/web/src/blocks/RenderBlocks.tsx`:
  - Add to `blockComponents` map.
  - Add slug to `fullBleedBlocks` set if the block paints its own section chrome.

After adding/removing blocks, always:

```bash
pnpm --filter @rhproperties/cms generate:types
cp packages/cms/src/payload-types.ts packages/web/src/payload-types.ts
```

to keep `payload-types.ts` in sync between packages.

---

## 13. Phase 4.5 — Header / Footer rebrand

Replaced the hardcoded Payload SVG logo with a text wordmark in
[`packages/web/src/components/Logo/Logo.tsx`](../packages/web/src/components/Logo/Logo.tsx) — drop-in for a real SVG later.

Nav styling lives in [`packages/web/src/Header/Nav/index.tsx`](../packages/web/src/Header/Nav/index.tsx):
uppercase, 12px semi-bold, wide tracking, dropdown panel styled with warm-white bg +
parchment hover.

Footer rewritten in [`packages/web/src/Footer/Component.tsx`](../packages/web/src/Footer/Component.tsx): 4-column layout (brand blurb · nav · contact · social) + thin copyright strip. Removed the templatebase's "Developed by Gaia Digital Agency" credit, visitor count, and theme selector.

---

## 14. Phase 4.6 — Finish the rest of the pages

- **Team** — AboutAgency intro → `teamGrid` (pulls from `team-members`) → CTA banner.
- **Contact** — `contactDetails` (Office · Phone · Email · Hours, each optionally linkable) → `formBlock` referencing a seeded **Contact Form** (name / email / phone / enquiry-type / message, Payload form-builder plugin).
- **Browse** (`/browse`) — two `propertyShowcase` blocks, one per type.
- **Service** — `ourServices` (3-card grid) → three anchored `aboutAgency` sections (`#mini-makeover`, `#emergency-repair`, `#other-services`) → `ctaBanner`.
- **News** (`/news`) — `PostsPage.tsx` rewritten with RH typography (eyebrow + h1 + intro + styled card grid).

Commits: `02dd76a`, `f1d3342`.

---

## 15. Phase 4.7 — Polish

### 15.1 Real property photos from Figma

For each property card:

```bash
# Inside an active MCP session
curl -s -X POST http://127.0.0.1:3845/mcp \
  -H "mcp-session-id: $SID" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call",
       "params":{"name":"get_screenshot",
                 "arguments":{"nodeId":"30:67"}}}'   # "Commercial 1 - Picture"
# extract base64 image from response and save to
# packages/cms/src/endpoints/seed/assets/<slug>.png
```

Then the seed's `uploadAsset()` helper uploads each one into `media` and the
seeded Property's `heroImage` references it. On re-seed, real listing
photos appear immediately.

> The Figma "Picture" frames often contain **both** a Default and a Hover
> state side-by-side. You'll want to crop to just the Default half with a
> quick Python/PIL script, or add a crop to the helper.

> Don't try this on big composite frames (hero, testimonials) — the
> screenshots include baked-in UI text that ghosts under our React overlay.

### 15.2 Priority-image hydration race

Our `ImageMedia` component animated `opacity: 0 → 1` on `onLoad`. For priority-loaded images (eager + fetchPriority=high), the image often finished loading before React attached the listener, so opacity stuck at 0. Fix was a ref callback that checks `img.complete` on mount and flips `loaded: true` immediately.

File: [`packages/web/src/components/Media/ImageMedia/index.tsx`](../packages/web/src/components/Media/ImageMedia/index.tsx).

### 15.3 Dark-theme leak

The templatebase ThemeProvider auto-flipped to `dark` based on the OS
`prefers-color-scheme`, which set `data-theme="dark"` on `<html>` and
killed text contrast across a palette that has no real dark variant.

Fix in [`packages/web/src/providers/Theme/InitTheme/index.tsx`](../packages/web/src/providers/Theme/InitTheme/index.tsx)
and [`packages/web/src/providers/Theme/index.tsx`](../packages/web/src/providers/Theme/index.tsx): honour an explicit `localStorage['payload-theme']` choice but **do not** auto-detect.

### 15.4 Dropdown nav + Service anchors

- Dropdown: `BROWSE LISTINGS ▾` now matches other nav items (uppercase, tracked, warm-white panel on hover).
- Service: `aboutAgency` block gained an optional `anchor` field; seed populates `mini-makeover` / `emergency-repair` / `other-services`; the OurServices cards' CTAs scroll-link to them.

---

## 16. Local dev (laptop)

### 16.1 Ensure Postgres is running

```bash
brew services list   # should show postgresql@16 started
```

If two versions are installed, use the pg16 binaries explicitly:

```bash
export PATH=/opt/homebrew/opt/postgresql@16/bin:$PATH
```

### 16.2 Create role + DB (first time only)

```bash
createuser rhproperties_user
createdb -O rhproperties_user rhproperties_db
psql -d postgres -c "ALTER USER rhproperties_user WITH PASSWORD 'rh_local_dev_only';"
```

### 16.3 Write local `.env` files (never copy from server)

Use `openssl rand -hex 32` for each secret. See the template in §5.1 and the
web equivalent in [`packages/web/.env.example`](../packages/web/.env.example). Use ports 3007 / 4007.

### 16.4 First run

```bash
pnpm --filter @rhproperties/cms generate:types
cp packages/cms/src/payload-types.ts packages/web/src/payload-types.ts
pnpm --filter @rhproperties/cms seed
pnpm dev                    # starts CMS :4007 + web :3007 concurrently
```

Open http://localhost:3007 (frontend) and http://localhost:4007/admin (admin — `admin@gaiada.com` / `admin`).

### 16.5 HMR + cache reset

- **Source edits** to `packages/web/src/*` — Vite HMR picks up client changes immediately; `tsx watch server.ts` restarts the SSR process on server-side file changes.
- **Seed changes** — re-run `pnpm --filter @rhproperties/cms seed`. To bust the web SSR in-memory cache (10-min TTL), either **`touch packages/web/src/data-loader.ts`** to nudge `tsx watch`, or **restart `pnpm dev`** (most reliable).
- **Payload config changes** — Next.js hot-reloads, but regen + sync types after any collection/block change.

---

## 17. Deploy flow

**Laptop (one terminal):**

```bash
git add ...
git commit -m "..."
git push origin main
```

**Server, via SSH:**

```bash
ssh gda-s01 "cd /var/www/rhproperties && \
  git pull origin main && \
  pnpm install --prefer-offline && \
  pnpm --filter @rhproperties/cms generate:types && \
  cp packages/cms/src/payload-types.ts packages/web/src/payload-types.ts && \
  pnpm build && \
  pnpm --filter @rhproperties/cms seed && \
  pm2 restart rhproperties-cms rhproperties-web"
```

Skip the seed if you didn't change the seed — it wipes everything.

**Smoke test:**

```bash
for p in "" browse browse/commercial browse/residential service team news contact; do
  st=$(curl -so /dev/null -w "%{http_code}" https://rhproperties.gaiada.online/$p)
  echo "/$p -> $st"
done
```

---

## 18. Gotchas we hit

### 18.1 PM2 invoking `.bin/next` directly

Error: `SyntaxError: missing ) after argument list`. The `.bin` files are shell
shims, not JS. Use `script: 'pnpm', args: 'start', interpreter: 'none'` in
`ecosystem.config.cjs` (see §5.3). Commit: 96e8226.

### 18.2 `process.env` in client code

React components that also render in the browser **cannot read** `process.env` under Vite — it throws `ReferenceError: process is not defined` during hydration and silently unmounts the whole tree → blank page. Use `import.meta.env.VITE_*` for client-readable values; guard `process.env` with `typeof process !== 'undefined'`.

File: [`packages/web/src/utilities/getURL.ts`](../packages/web/src/utilities/getURL.ts). Commit: 289d122.

### 18.3 Dark theme leak

See §15.3. Symptom: eyebrows/titles render warm-white-on-warm-white because the OS prefers dark mode and the ThemeProvider auto-applied `data-theme="dark"` on `<html>`.

### 18.4 SSR cache persistence

`packages/web/src/lib/cache.ts` holds a 10-minute in-memory TTL cache. If you re-seed and the browser still shows old data, the web SSR process has stale cache. Restart `pnpm dev` or call `POST /api/revalidate` with the appropriate path + `REVALIDATION_SECRET`.

### 18.5 nginx vhost file vs. symlink

On this project `/etc/nginx/sites-enabled/subdomains.gaiada.online` was a plain file copy, not a symlink. Every edit to `sites-available` went nowhere. Replace with a symlink:

```bash
sudo rm /etc/nginx/sites-enabled/subdomains.gaiada.online
sudo ln -s /etc/nginx/sites-available/subdomains.gaiada.online \
           /etc/nginx/sites-enabled/subdomains.gaiada.online
sudo nginx -t && sudo systemctl reload nginx
```

Also watch for stray `.bak` files in `sites-enabled/` — nginx loads every file in that directory, so a leftover backup with the same `server_name` throws `conflicting server name "..." ignored` warnings and one of the blocks silently wins. `sudo rm /etc/nginx/sites-enabled/*.bak*` them.

### 18.6 /admin renders a blank page (Payload + Next.js)

Symptom: `/admin` returns 200 HTML but the page is white; DevTools Network shows every `/_next/static/chunks/*` as 404.

Cause: the Payload admin is a Next.js app served from port 4007. Its HTML references `/_next/static/chunks/*` for JS + CSS. If nginx only proxies `/admin` and `/api` to 4007 but falls `/_next` through to the frontend (3007), the frontend doesn't know those files and serves 404.

Fix: add a `/_next` location to the **same server block** that proxies `/admin`:

```nginx
location /_next {
    proxy_pass http://127.0.0.1:4007;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
}
```

Verify with a direct asset fetch:

```bash
ASSET=$(curl -s https://<host>/admin | grep -oE 'href="/_next/[^"]*\.css"' | head -1 | sed 's/href="//;s/"//')
curl -sI "https://<host>$ASSET" | head -1   # expect 200
```

> This bug affects templatebase and anything scaffolded from it. Mirror the fix in every 3PRVTN project's vhost.

### 18.6 Figma MCP needs the desktop app

Error: `No Figma window open`. Open the file in the Figma **desktop** app (not the browser), and make sure Dev Mode is on.

### 18.7 Figma exports with baked-in text

`get_screenshot` on a hero frame returns the **composited** render — including overlay text, widgets, gradients. Useless as a background image. Get raw fills via the Picture sub-frames instead, or source from elsewhere.

### 18.8 `slugField` signature

Payload's `slugField()` returns a single field, not an array. Use `slugField()` (or `slugField({ useAsSlug: 'name' })`), **not** `...slugField()` — the spread throws `slugField is not a function or its return value is not iterable`.

### 18.9 Autosave + draft create

With `versions: { drafts: { autosave: ... } }` on a collection, Payload types `payload.create(...)` as requiring `draft: true` **and** `DraftDataFromCollectionSlug<...>`. For a seed that writes `_status: 'published'` directly, cast `data: {...} as any` (seeds don't need deep type safety).

### 18.10 `payload-types.ts` drift

CMS edits regenerate `packages/cms/src/payload-types.ts` but not the web package's copy. Always re-sync:

```bash
cp packages/cms/src/payload-types.ts packages/web/src/payload-types.ts
```

Forgetting this lands TS errors on the web side.

---

## 19. Payload CMS — the parts that matter

Payload is doing a lot here. This is the short list of things you'll hit on any project and want a playbook for, not a generic Payload tutorial.

### 19.1 Collections vs. globals vs. blocks

- **Collections** hold many documents of one kind (Pages, Posts, Properties, TeamMembers, Users, Media, Categories). Each gets its own admin list + CRUD + REST/GraphQL.
- **Globals** hold *exactly one* document per slug (Header, Footer, Settings). They fit singletons like the site nav.
- **Blocks** are reusable field groups that can be placed inside a `blocks` field on any collection — this is how the Pages collection's `layout` field holds an ordered, heterogeneous list of `propertyShowcase`, `aboutAgency`, `testimonials`, etc.

### 19.2 Anatomy of a RH block

Every custom block has two halves:

1. **CMS config** — `packages/cms/src/blocks/<Name>/config.ts`. A `Block` object with `slug`, `interfaceName`, `labels`, and `fields[]`. Never change the `slug` after documents exist — it's how Payload identifies the block type in JSON. Use `labels` to rename in admin without breaking data.
2. **Web renderer** — `packages/web/src/blocks/<Name>/Component.tsx`. A React component typed from the generated `payload-types.ts` interface. Rendered by `RenderBlocks.tsx`.

**Registration checklist** — new block won't appear until you do all of these:

```
cms/src/blocks/<Name>/config.ts            # define
cms/src/collections/Pages/index.ts         # import + add to layout.blocks[]
web/src/blocks/<Name>/Component.tsx        # render
web/src/blocks/RenderBlocks.tsx            # import + add to blockComponents map
web/src/blocks/RenderBlocks.tsx            # add to fullBleedBlocks set if it owns its section chrome
pnpm --filter @rhproperties/cms generate:types
cp packages/cms/src/payload-types.ts packages/web/src/payload-types.ts
```

### 19.3 `payload-types.ts` is generated — in two places

Running `pnpm --filter @rhproperties/cms generate:types` writes `packages/cms/src/payload-types.ts`. The web package has its own copy at `packages/web/src/payload-types.ts` that must be re-synced after every CMS schema change:

```bash
cp packages/cms/src/payload-types.ts packages/web/src/payload-types.ts
```

Forgetting this lands TS errors on the web side (missing collection / block interfaces).

### 19.4 Renaming a collection slug = DB migration

Changing `slug: 'posts'` to `slug: 'news'` creates a new Postgres table, drops relations, and loses data. On this project we **kept** `slug: 'posts'` but did two softer things that achieved what we wanted:

- `labels: { singular: 'News Article', plural: 'News' }` — admin sidebar says "News".
- URL route renamed in `data-loader.ts`, `App.tsx`, `server.ts`, `web-manager.ts`, and `generatePreviewPath.ts` — public URLs are `/news/*`.

Rename the slug only if you have **no** production data yet, or you're willing to write a migration.

### 19.5 `slugField` — call it, don't spread it

Payload's `slugField()` returns **one** field (a `RowField` that groups a slug text + a "generate from" checkbox). Use it bare:

```ts
fields: [
  { name: 'title', type: 'text', required: true },
  // ...
  slugField(),                         // ✓
  // slugField({ useAsSlug: 'name' }), // ✓ when title-ish field is called `name`
  // ...slugField(),                   // ✗ throws "slugField is not iterable"
]
```

### 19.6 Drafts + autosave — the `as any` escape hatch in seeds

Any collection with `versions: { drafts: { autosave: {...} } }` has Payload's `payload.create()` typed as a discriminated union where the `draft: true` branch wants `DraftDataFromCollectionSlug<...>`. Seeds that write `_status: 'published'` directly (skipping the draft dance) trip the union. Cast and move on:

```ts
await payload.create({
  collection: 'properties',
  data: { title, _status: 'published', /* ... */ } as any,   // seed-only
})
```

Seeds don't need deep type safety. Don't apply this pattern in runtime code.

### 19.7 Seed idempotency

The seed wipes + recreates every time. Order matters for foreign-key safety:

1. Clear globals (set `navItems: []`).
2. Delete docs in reverse dependency order: properties → team-members → posts → pages → forms → form-submissions → categories → media → search.
3. Upsert the admin user if missing (idempotent by email).
4. Re-upload media (reads files from `packages/cms/src/endpoints/seed/assets/`).
5. Create pages / properties / team / posts / forms.
6. Write globals last (header/footer/settings nav).

Re-running `pnpm --filter @rhproperties/cms seed` at any point is safe. Production should **not** re-seed after real content lands — the admin user skip is the only lingering idempotent step.

### 19.8 Live preview + revalidation

Two separate pipelines, commonly confused:

- **Live preview** — admin's "Preview" button. CMS builds a URL like
  `/next/preview?slug=X&collection=pages&path=/X&previewSecret=...`,
  the web server validates the secret, sets a `payload-draft` cookie,
  and redirects to `/X`. The page's data-loader sees the cookie (via
  the `draft` option) and adds `?draft=true` to Payload API calls to
  fetch unpublished versions. Collection → path mapping lives in
  [`packages/cms/src/utilities/generatePreviewPath.ts`](../packages/cms/src/utilities/generatePreviewPath.ts).
- **Revalidation** — post-publish, CMS `afterChange` hooks POST to
  `http://<web>/api/revalidate` with `{ path | tag }` and a
  `Bearer REVALIDATION_SECRET` header. The web server drops matching
  entries from the in-memory SSR cache. Cache impl: [`packages/web/src/lib/cache.ts`](../packages/web/src/lib/cache.ts).

### 19.9 Form builder

Payload's `@payloadcms/plugin-form-builder` ships the `Form` block and a `forms` collection. The flow:

1. Create a `Form` document in admin (or in the seed — we do it in `rh-seed.ts`).
2. Reference it from a page via the generic `formBlock` (`form: form.id`).
3. The web renderer uses `react-hook-form` + the plugin's field registry.
4. Submissions go to `form-submissions`. We do **not** email by default — see backlog item 7.

### 19.10 Web-manager — machine-to-machine writes

`packages/cms/src/app/(payload)/api/web-manager/*` is a set of authenticated routes for programmatic upserts/publishes/revalidation. Use it for content pipelines from external systems (CRMs, scrapers, generators) — **not** for frontend requests. Guarded by `WEB_MANAGER_API_SECRET` + `WEB_MANAGER_ALLOWED_IPS`. Route map + field guide in [`docs/web-manager-api.md`](./web-manager-api.md).

### 19.11 Access control — `authenticated` vs. `authenticatedOrPublished`

- `read: authenticatedOrPublished` — public can see published docs; authenticated users see drafts too.
- `create | update | delete: authenticated` — only logged-in users.
- Media uploads additionally MIME-whitelist + size-cap. Forms with an `hCaptcha` block verify server-side in `beforeChange`.

### 19.12 SEO plugin

`@payloadcms/plugin-seo` adds an SEO tab to Pages + Posts + Properties. Configured in [`packages/cms/src/plugins/index.ts`](../packages/cms/src/plugins/index.ts) with `generateTitle` (`"<Title> | RH Properties"`) and `generateURL` (`SITE_URL/slug`). The web pages read `data.meta.title / description / image` via `<Helmet>` in each page component.

### 19.13 Admin UX helpers

- `BlockRowLabel` in `packages/cms/src/blocks/RowLabel.tsx` — derives a nice row label for blocks in the admin (reads `blockName`, `title`, then rich-text headings). Keep the `BLOCK_DEFAULTS` map in sync when you add new blocks.
- `BeforeLogin` and `BeforeDashboard` components can be customised per-project; we kept the defaults but trimmed the `SeedButton` since we have a CLI seed runner.

---

## 20. SEO — robots.txt + sitemap.xml

### 20.1 robots.txt

Static file at [`packages/web/public/robots.txt`](../packages/web/public/robots.txt). Vite serves `public/` in dev; Express serves it in prod (`server.ts` `express.static(...)`). Current contents:

```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/*
Disallow: /api/
Disallow: /next/
Disallow: /search?

Sitemap: https://rhproperties.gaiada.online/sitemap.xml
```

### 20.2 sitemap.xml — dynamic

Not a static file — an Express route in `packages/web/server.ts` that queries the CMS on request and outputs XML. Why: static sitemaps rot; doing it dynamically means every new property / team member / post shows up without a rebuild.

What it does:

1. Fetches **pages**, **properties**, **team-members**, **posts** from the CMS REST API (no pagination, `depth=0`).
2. Filters to published docs with a slug.
3. Maps each doc to a URL with the matching route prefix (`/`, `/properties/`, `/team/`, `/news/`).
4. Serialises as a `<urlset>` with `<loc>` + `<lastmod>`.
5. Caches the result for 1 hour in the same in-memory TTL cache we use for page data.

Response headers: `Content-Type: application/xml; charset=utf-8`, `Cache-Control: public, max-age=600`.

Smoke test:

```bash
curl -s https://rhproperties.gaiada.online/robots.txt
curl -s https://rhproperties.gaiada.online/sitemap.xml | head -40
```

If the sitemap comes back with an empty `<urlset>`, the CMS isn't reachable from the web process — check the `PAYLOAD_URL` env var and that the CMS is up.

---

## 21. File map — where things live

```
packages/cms/                         Payload CMS (Next.js 16 App Router)
├── src/
│   ├── access/                       Auth rules (authenticated, authenticatedOrPublished)
│   ├── app/(payload)/api/            Next.js API routes (Payload auto + our web-manager/*)
│   ├── blocks/                       Payload block configs
│   │   ├── AboutAgency/config.ts
│   │   ├── Archive/                  Keep — blog archive block
│   │   ├── Banner/                   Keep — generic
│   │   ├── CallToAction/
│   │   ├── Code/
│   │   ├── Content/
│   │   ├── ContactDetails/config.ts  NEW for RH
│   │   ├── ContentMedia/
│   │   ├── CtaBanner/config.ts       NEW for RH
│   │   ├── Form/config.ts            Payload form-builder plugin wrapper
│   │   ├── MediaBlock/
│   │   ├── NewsInsights/config.ts    NEW for RH
│   │   ├── OurServices/config.ts     NEW for RH
│   │   ├── PropertyShowcase/config.ts  NEW for RH
│   │   ├── RowLabel.tsx              Admin UX — derives block labels
│   │   ├── TeamGrid/config.ts        NEW for RH
│   │   └── Testimonials/config.ts    NEW for RH
│   ├── collections/
│   │   ├── Categories.ts
│   │   ├── Media.ts
│   │   ├── Pages/index.ts            Wires all layout blocks
│   │   ├── Posts/index.ts            Labelled "News" in admin
│   │   ├── Properties/index.ts       NEW for RH
│   │   ├── TeamMembers/index.ts      NEW for RH
│   │   └── Users/
│   ├── Footer/config.ts              Global — footer nav
│   ├── Header/config.ts              Global — header nav + subItems
│   ├── Settings/config.ts            Global — whatsapp, email, social
│   ├── endpoints/seed/
│   │   ├── assets/                   Figma-sourced images (staged for upload)
│   │   ├── image-hero-1.ts           Fallback hero image metadata
│   │   ├── index.ts                  Seed orchestrator (wipe + admin + media + rh-seed)
│   │   └── rh-seed.ts                All RH-specific seed data
│   ├── heros/config.ts               rhLanding / highImpact / mediumImpact / lowImpact
│   ├── payload.config.ts             Payload root config
│   ├── payload-types.ts              GENERATED — never hand-edit
│   ├── plugins/                      SEO, form-builder, search, etc.
│   └── utilities/
│       ├── generatePreviewPath.ts    Maps collection → URL prefix
│       └── web-manager.ts            Machine-to-machine write API auth

packages/web/                         Vite SSR React frontend
├── server.ts                         Express SSR entry
├── src/
│   ├── App.tsx                       React Router routes
│   ├── blocks/                       Web renderers (mirror of cms/src/blocks)
│   │   └── RenderBlocks.tsx          Block-slug → Component map + full-bleed allow-list
│   ├── components/
│   │   ├── Link/                     CMSLink with inline/button appearance
│   │   ├── Logo/Logo.tsx             Wordmark (drop-in for a real SVG)
│   │   ├── Media/ImageMedia/         Payload media renderer
│   │   └── ui/                       shadcn-style button, select, etc.
│   ├── data-loader.ts                SSR data fetch per URL (cached)
│   ├── entry-client.tsx              React hydration entry
│   ├── entry-server.tsx              React SSR entry
│   ├── Footer/Component.tsx          Rebranded footer
│   ├── globals.css                   Tailwind v4 theme + tokens
│   ├── Header/
│   │   ├── Component.client.tsx
│   │   └── Nav/index.tsx             RH-styled nav + dropdown
│   ├── heros/
│   │   ├── RhLanding/index.tsx       NEW — RH home hero (search widget)
│   │   ├── HighImpact / MediumImpact / LowImpact / PostHero
│   │   └── RenderHero.tsx
│   ├── lib/
│   │   ├── cache.ts                  In-memory TTL cache (10 min default)
│   │   └── payload-client.ts         Typed REST client for CMS API
│   ├── pages/
│   │   ├── BrowseListPage.tsx        NEW — /browse/:type
│   │   ├── DynamicPage.tsx           /:slug catch-all (renders blocks)
│   │   ├── HomePage.tsx              /
│   │   ├── NotFoundPage.tsx
│   │   ├── PostPage.tsx              /news/:slug (formerly /posts/:slug)
│   │   ├── PostsPage.tsx             /news index
│   │   ├── PostsPaginatedPage.tsx
│   │   ├── PropertyDetailPage.tsx    NEW — /properties/:slug
│   │   ├── SearchPage.tsx
│   │   └── TeamMemberPage.tsx        NEW — /team/:slug
│   ├── payload-types.ts              MIRROR of cms's — regen + copy after CMS changes
│   ├── providers/Theme/              Light-only (auto-dark disabled)
│   └── utilities/getURL.ts           Vite-safe env access

docs/
├── figma_automation.md               Chronological work log
├── figma_to_site_playbook.md         THIS FILE — the reference
├── TECH_STACK.md                     Stack overview
└── web-manager-api.md                M2M API docs

ecosystem.config.cjs                  PM2 config (script: 'pnpm', interpreter: 'none')
CLAUDE.md                             Project-level Claude Code rules
```

---

## 22. Next steps Post POC

The nine items we queued after the Team/Contact/News/Browse/Service work landed, in priority order. Cross off as done.

1. **Deploy everything to the server.** ✅ *Done 2026-04-20 — everything through `f1d3342` is live at https://rhproperties.gaiada.online/.*
2. **Real hero + about images.** The Figma exports had baked-in text and ghosted under our overlay. Either the client ships proper cityscape + office photos (upload via admin → Media), or we source CC0 stock.
3. **Property & Post detail pages polish.** `/properties/:slug` and `/news/:slug` render but the layouts are generic — port the Figma detail frames (hero + sidebar with price/specs, related listings block).
4. **Mobile responsive QA.** 375px sweep of every page. Expect overflows on the hero search widget, the footer 4-col, and the testimonials carousel.
5. **Real RH Properties content.** Swap placeholder copy, contact details, team names, listings for what the client actually wants. Needs input: actual address, phone, email, hours, bios, photos, property data (or a CRM integration).
6. **Rotate demo credentials + lock admin.** `admin@gaiada.com` / `admin` must not ship. Rotate on the server, update the seed to skip admin creation when `NODE_ENV === 'production'` and a real admin already exists.
7. **Form submissions wired to email.** The contact form writes to `form-submissions` but sends no notifications. Add SMTP/Resend + a transactional template.
8. **Functional search + filter on browse.** Make the hero's Listing Type / Size / Location dropdowns actually filter `/browse/:type?size=<200&location=...` (currently visual-only).
9. **Backwards-compat redirects.** If the old RH site had `/about`, `/portfolio`, `/careers`, `/blog` URLs indexed by Google, 301 them to the new homes from nginx or Express.

Beyond that:
- **Real-listing data source.** Pull from a property CRM or an RSS/XML feed so the Properties collection isn't manually maintained.
- **Sitemap + robots.txt.** Payload has a sitemap plugin; wire it.
- **Analytics + Vitals dashboards.** GA4 / Plausible + a Lighthouse baseline.
- **Accessibility audit.** We used semantic HTML but haven't run axe.
- **Dark variant (optional).** The design tokens support it; we just disabled auto-detect. If the client wants dark mode, define the inverted palette in Figma and re-enable.

---

## Appendix A — Git history at handoff (2026-04-20)

```
f1d3342  feat(web): finish Team / Contact / News / Browse / Service pages
b7789c3  feat(web): real Figma property photos + dropdown polish + service anchors
02dd76a  feat(web): Home page sections matching Figma + header/footer rebrand
afe992f  feat: Phase 4 step 2 — IA rework (properties + team + news routes + RH hero)
289d122  fix(web): don't read process.env from client code (crashed hydration)
1eac734  chore: drop templatebase leftovers — title suffix + legacy posts
c75b240  chore: remove agency/templatebase leftovers (Services/Portfolio/Team/Departments/About)
a502531  feat(web): Phase 4 step 1 — RH Properties tokens from Figma
6094fb6  docs: add figma_automation.md + CLAUDE.md Phase 4 handoff
a2b89ad  chore(cms): add reproducible seed script
96e8226  fix(pm2): invoke via pnpm, not node_modules/.bin, so shell shims don't run under Node
5765be9  chore: scaffold rhproperties from templatebase
```

## Appendix B — Named decisions log

- **2026-04-20** — Ports 3007 / 4007 (next free pair after templatebase / templategen / christos / baligirls).
- **2026-04-20** — Fresh git history; did not inherit templatebase commits.
- **2026-04-20** — PM2 invokes `pnpm start`, not `.bin/next`.
- **2026-04-20** — Dev topology: laptop-canonical, GitHub-source-of-truth, server-deploy-only.
- **2026-04-20** — Seed before Figma so design work has rendered content to iterate against.
- **2026-04-20** — Figma MCP = Option A (Dev Mode on laptop), not Framelink.
- **2026-04-20** — Tokens-first (palette + font), blocks second. Never mix these in one commit.
- **2026-04-20** — Kept `posts` collection slug internally but re-labelled "News" and renamed the URL route. Avoids an FK cascade on the DB and keeps options open to split News from a generic blog later.
- **2026-04-20** — Forced light theme only; OS `prefers-color-scheme` dark-detect disabled until a proper dark palette is defined in Figma.
- **2026-04-20** — Seed wipes + recreates (idempotent). Safe to run any time. Admin user is skipped if it already exists.
