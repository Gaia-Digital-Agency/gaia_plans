# Gaia Plans Presentation

Gaia Digital Agency — **Unified Operating Model & System Blueprints**. A single-page, GitHub Pages-hosted presentation that bundles the Business Plan, Figma→Site Automation, Social Media Automation, and Sample POC into one navigable `index.html`.

> **Live site:** https://gaia-digital-agency.github.io/gaia_plans/

## Structure (9 page-views, under a single sticky nav bar)

| # | Section | Role |
|---|---|---|
| 1 | Part A · Overview | Business Plan (Venturi Model) |
| 2 | Part A · Architecture | Concentric Architecture + Delivery Pipelines |
| 3 | Part B · Overview | Figma → Site Automation (Templatebase + **Victor**) |
| 4 | Part B · Architecture | End-to-end Figma → GCP pipeline |
| 5 | Part C · Overview | Social Media Automation (SOMA) |
| 6 | Part C · Architecture | 5-layer Venturi-throat pipeline |
| 7 | Part D · Overview | Sample POC — Blossom School Catering + **Brian** |
| 8 | Part D · Architecture | WhatsApp → Brian → Orders → BSC API |
| 9 | Appendix + References | Dual-Track Transformation · Integrated Timeline · Role Evolution · IT State · Governing Principles · Reference docs |

Navigation:
- Sticky top nav bar with deep-linkable anchors (`#part-a` … `#references`).
- Bottom mirror nav for jumping back.
- Per-section `↑ Top` + Prev/Next links.
- Keyboard shortcuts: <kbd>1</kbd>–<kbd>5</kbd> jump to Parts A–Appendix, <kbd>0</kbd> to top, <kbd>Esc</kbd> closes the ref-doc viewer.

## Agents (named)

- **Victor** (`openclaw_var`) — Openclaw multi-agent orchestrator for the **Figma → Site Automation** pipeline. Agents: main, web-manager, copywriter, writer, booking, drive-manager, analyst.
- **Brian** (`openclaw_bsc`) — Openclaw WhatsApp AI operator for the **Blossom School Catering POC**. Public responder (Brian · main) delegates every BSC operation to the internal execution agent (Orders · workspace-bsc).

## Branding

- Logo and favicon sourced from `docs/gda.jpg` (Gaia Digital Agency tree-of-life mark).
- Palette sampled directly from the logo:
  - **GDA Gold** `#E8B830` (primary accent / nav underline / section highlights)
  - **GDA Ink** `#070201` (headings / nav background)
  - **GDA Teal** `#36776C`, **GDA Blue** `#56A3D6`, **GDA Orange** `#D36525` (root-node accents)
  - **Deep Blue** `#0B5394` (retained for secondary section headers)

## Contents

```
plan_presentation/
├── index.html                 Single-page presentation (9 sections)
├── README.md                  This file
├── .nojekyll                  Disables Jekyll on GitHub Pages so assets/ + docs/.md serve as-is
├── .github/workflows/
│   └── deploy-pages.yml       Deploys root to GitHub Pages on push to main
├── assets/                    Brand + favicon set
│   ├── gda-logo.png           256×256 header logo
│   ├── gda-logo-nav.png       64×64 nav-bar logo
│   ├── favicon.ico            multi-size (16/32/48)
│   ├── favicon-16.png
│   ├── favicon-32.png
│   ├── favicon-180.png        apple-touch-icon
│   ├── favicon-192.png
│   ├── favicon-512.png
│   ├── favicon.png            default 32×32
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
| [`openclaw_var`](https://github.com/Gaia-Digital-Agency/openclaw_var) | **Victor** — Openclaw agent for Figma → Site Automation |
| [`openclaw_bsc`](https://github.com/Gaia-Digital-Agency/openclaw_bsc) | **Brian** — Openclaw agent for Blossom School Catering |
| [`blossom_schoolcatering`](https://github.com/Gaia-Digital-Agency/blossom_schoolcatering) | Full-working-service POC product (Next.js + NestJS + Postgres) |

## Usage

- **View online:** https://gaia-digital-agency.github.io/gaia_plans/
- **Local preview:** open `index.html` directly in a browser, or serve with any static server (e.g. `npx serve` or `python -m http.server 8000`).
- **Deep links:** every section is addressable — share `index.html#part-b` or `index.html#appendix` to jump straight to a topic.
- **Print / PDF:** the page is print-optimized — each section prints on its own page for a clean 9-page PDF export.

## Deployment

Automatic via `.github/workflows/deploy-pages.yml`:

1. Push to `main` triggers the workflow.
2. The workflow uses the standard GitHub Pages actions:
   - `actions/checkout@v4`
   - `actions/configure-pages@v5`
   - `actions/upload-pages-artifact@v3` (uploads the repo root)
   - `actions/deploy-pages@v4`
3. `.nojekyll` at the repo root disables Jekyll so `assets/` and `docs/*.md` files are served as-is (no pre-processing).

All paths in `index.html` and `site.webmanifest` are relative so the site works under the `/gaia_plans/` project sub-path.
