# Gaia Plans Presentation

Gaia Digital Agency — **Unified Operating Model & System Blueprints**. A single-page, GitHub Pages-hosted presentation that bundles the Business Plan and every service blueprint (Implementation, Figma→Site, Full Service, Social Media, Live POC) into one navigable static site.

> **Live site:** https://gaia-digital-agency.github.io/gaia_plans/

## Structure (10 page-views)

| # | Section | Sub-pages | Status |
|---|---|---|---|
| 1 | **Overview** — About this report + Main Architecture (GCP · Openclaw · Claude) | 1 page | — |
| 2 | **Business Plan — Venturi Model** | What · Architecture | Strategic |
| 3 | **Implementation — 180-Day Gaia OS Build** | 1 page | Active |
| 4 | **Figma → Site + QA Automation** | What (Figma→MCP→Site→QA→85%→Manual) · Architecture | No agent |
| 5 | **Full Service (Templatebase + Victor)** | What · Architecture | Agent Active |
| 6 | **Social Media Automation (SOMA)** | What + Architecture (combined) | Planned — agent not yet built |
| 7 | **Full Service POC — Schoolcatering + Brian** | What + Architecture (combined) | Live |
| 8 | **Appendix + References** — Change Mgmt · Timeline · Principles · Reference docs | 1 page | — |

**Total:** exactly 10 printed pages (one per section card).

## Navigation

Sticky top nav + bottom mirror nav:

`Overview · Plan · Impl · Figma→Site · Full Service · Socmed · POC · Appendix`

Keyboard shortcuts: <kbd>1</kbd> Overview · <kbd>2</kbd> Plan · <kbd>3</kbd> Implementation · <kbd>4</kbd> Figma→Site · <kbd>5</kbd> Full Service · <kbd>6</kbd> Socmed · <kbd>7</kbd> POC · <kbd>8</kbd> Appendix · <kbd>0</kbd> Top · <kbd>Esc</kbd> closes the reference doc viewer.

Per-section `↑ Top` links, Prev/Next links, and deep-linkable anchors (`#overview` … `#appendix`).

## Agents (named)

- **Victor** (`openclaw_var`) — Openclaw multi-agent orchestrator for **Part 4, Full Service (Templatebase + Victor)**. Specialists: main, web-manager, copywriter, writer, booking, drive-manager, analyst. Primary LLM DeepSeek, fallback Gemini. Gateway :19289. Channels Telegram + Mission Control.
- **Brian** (`openclaw_bsc`) — Openclaw WhatsApp AI operator for **Part 6, Live POC (Schoolcatering)**. Public responder `main` delegates every BSC operation to the internal execution agent `Orders` (`workspace-bsc`). Gateway :18789 on `gda-ai01`. Public URL `bsc.gaiada0.online`.
- **SOMA agents** (`socmed_plan_01.md`) — SocialContent / Interaction / Publisher / Monitor / BrandCompliance / ContentPlanner. **Not yet built** — Part 5 is the spec.

## Branding

- Logo and favicon sourced from `docs/gda.jpg` (Gaia Digital Agency tree-of-life).
- Palette sampled directly from the logo:
  - **GDA Gold** `#E8B830` — primary accent (nav underline, section highlights, metric cards)
  - **GDA Ink** `#070201` — headings, nav background
  - **GDA Teal** `#36776C`, **GDA Blue** `#56A3D6`, **GDA Orange** `#D36525` — root-node accents
  - **Deep Blue** `#0B5394` — secondary section headers (architecture pages)
  - **GDA Green** `#059669` — "Live" status badge
  - **GDA Red** `#DC2626` — "Planned" status badge

## Contents

```
plan_presentation/
├── index.html                 Single-page presentation markup (10 sections)
├── styles.css                 Presentation styling, print rules, responsive layout
├── script.js                  Mermaid setup, modal viewer, keyboard navigation
├── README.md                  This file
├── .nojekyll                  Disables Jekyll on GitHub Pages so assets/ + docs/*.md serve as-is
├── .github/workflows/
│   └── deploy-pages.yml       Deploys root to GitHub Pages on push to main
├── assets/                    Brand + favicon set
│   ├── gda-logo.png           256×256 header logo
│   ├── gda-logo-nav.png       64×64 nav-bar logo
│   ├── favicon.ico            multi-size (16/32/48)
│   ├── favicon-16.png · favicon-32.png · favicon.png
│   ├── favicon-180.png        apple-touch-icon
│   ├── favicon-192.png · favicon-512.png
│   ├── og-image.jpg           1200×630 OpenGraph social preview
│   └── site.webmanifest       PWA manifest (relative paths)
└── docs/                      Reference material (opened in on-page modal viewer)
    ├── ai_business_plan.html
    ├── ai_business_plan_appendix.html
    ├── figma_to_site_automation.html
    ├── qa_automation.html
    ├── socmed_plan_01.md
    ├── gaia_plans.md
    ├── gda.jpg                Source logo
    └── venturi_02.png
```

## Related repositories (Gaia-Digital-Agency org)

| Repo | Role |
|---|---|
| [`gaia_plans`](https://github.com/Gaia-Digital-Agency/gaia_plans) | This presentation |
| [`web_templatebase`](https://github.com/Gaia-Digital-Agency/web_templatebase) | VRTPN-stack starter (Vite SSR + React 19 + Tailwind v4 + Payload CMS + Node + Postgres) |
| [`openclaw_var`](https://github.com/Gaia-Digital-Agency/openclaw_var) | **Victor** — Openclaw agent for Full Service (Part 4) |
| [`openclaw_bsc`](https://github.com/Gaia-Digital-Agency/openclaw_bsc) | **Brian** — Openclaw agent for Schoolcatering POC (Part 6) |
| [`blossom_schoolcatering`](https://github.com/Gaia-Digital-Agency/blossom_schoolcatering) | Full-working-service POC product (Next.js + NestJS + Postgres) |

## Usage

- **View online:** https://gaia-digital-agency.github.io/gaia_plans/
- **Local preview:** open `index.html` directly in a browser, or serve with any static server (e.g. `npx serve` or `python -m http.server 8000`).
- **Deep links:** every section is addressable — share `index.html#figma` or `index.html#poc` to jump straight to a topic.
- **Print / PDF:** the page is print-optimized — each section prints on its own page for a clean 10-page PDF export.

## Deployment

Automatic via `.github/workflows/deploy-pages.yml`:

1. Push to `main` triggers the workflow.
2. Standard GitHub Pages actions: `checkout` → `configure-pages` → `upload-pages-artifact` (repo root) → `deploy-pages`.
3. `.nojekyll` at the repo root disables Jekyll so `assets/` and `docs/*.md` are served as-is.
4. All paths in `index.html` and `site.webmanifest` are relative so the site works under the `/gaia_plans/` project sub-path.
