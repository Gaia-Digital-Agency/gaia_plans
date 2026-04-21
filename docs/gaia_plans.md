# Gaia AI — Operating Model & Change Reference

**Organization:** Gaia Digital Agency (www.gaiada.com)
**Model:** Venturi-based, Claude-centric AI Operating Architecture
**Companion to:** Gaia AI Business Plan

## 1. Core Operating Model — The Concentric Architecture

Reads inside-out: **GCP ecosystem + Claude AI core → Claude tools → Operations layer (QA + Openclaw) → 7 client service verticals**, with Knowledge Base, MCP, Governance, and Feedback as supporting layers.

```mermaid
%%{init: {"flowchart": {"subGraphTitleMargin": {"top": 20, "bottom": 10}}}}%%
flowchart TB
    classDef core fill:#0B5394,stroke:#052E5C,stroke-width:3px,color:#fff,font-weight:bold
    classDef engine fill:#D97706,stroke:#7C2D12,stroke-width:3px,color:#fff,font-weight:bold
    classDef tools fill:#F59E0B,stroke:#92400E,stroke-width:2px,color:#1F2937
    classDef ops fill:#059669,stroke:#064E3B,stroke-width:2px,color:#fff
    classDef services fill:#7C3AED,stroke:#4C1D95,stroke-width:2px,color:#fff
    classDef support fill:#6B7280,stroke:#1F2937,stroke-width:1px,color:#fff
    classDef governance fill:#DC2626,stroke:#7F1D1D,stroke-width:2px,color:#fff

    subgraph CORE["CORE — Ecosystem + Engine"]
        GCP["☁️ Google Cloud Platform<br/>Infrastructure · BigQuery · Looker"]
        CLAUDE["🧠 Claude AI<br/>Central Intelligence Engine"]
        GCP --- CLAUDE
    end

    subgraph RING1["🛠️ Ring 1 — Claude Product Suite"]
        CC["Claude Code"]
        CW["Cowork"]
        CD["Claude Design"]
        CH["Claude Chat"]
    end

    subgraph RING2["⚙️ Ring 2 — Operations Layer"]
        QA["🐍 Python QA Engine<br/>7 Web Tools → Simplified to Claude"]
        OC["🦾 Openclaw<br/>Multi-agent Orchestration"]
    end

    subgraph RING3["🎯 Ring 3 — Service Verticals"]
        HOSP["🏨 Hospitality"]
        FB["🍽️ F&B"]
        WEB["💻 Web Dev"]
        SEO["🔍 SEO"]
        BRAND["✨ Branding"]
        ADS["📢 Ads"]
        SMM["📱 Social Media"]
    end

    subgraph SUPPORT["📚 Support & Governance"]
        KB["Knowledge Base<br/>(Brand · SOPs · Context)"]
        MCP["MCP Connectors<br/>(Workspace · CRM · Drive)"]
        HITL["Human-in-the-Loop<br/>Review Gates"]
        LOOP["Feedback Loop<br/>→ KB improvement"]
    end

    CLAUDE --> CC & CW & CD & CH
    CC & CW & CD & CH --> QA & OC
    OC --> HOSP & FB & WEB & SEO & BRAND & ADS & SMM
    KB -.feeds.-> CLAUDE
    MCP -.connects.-> CLAUDE
    HITL -.reviews.-> OC
    RING3 -.outcomes.-> LOOP
    LOOP -.-> KB

    class GCP core
    class CLAUDE engine
    class CC,CW,CD,CH tools
    class QA,OC ops
    class HOSP,FB,WEB,SEO,BRAND,ADS,SMM services
    class KB,MCP,LOOP support
    class HITL governance
```

## 2. Delivery Pipelines — Three Signature Flows

Three service pipelines share one orchestration core: **Web Dev** (Figma→Code→GCP), **Social Media** (platforms ↔ Openclaw ↔ Claude), and the **QA engine** (7 tools → Python → Claude actions).

```mermaid
%%{init: {"flowchart": {"subGraphTitleMargin": {"top": 20, "bottom": 10}}}}%%
flowchart LR
    classDef input fill:#F472B6,stroke:#9D174D,color:#fff,stroke-width:2px
    classDef ai fill:#D97706,stroke:#7C2D12,color:#fff,stroke-width:2px
    classDef cloud fill:#0B5394,stroke:#052E5C,color:#fff,stroke-width:2px
    classDef check fill:#059669,stroke:#064E3B,color:#fff,stroke-width:2px
    classDef human fill:#DC2626,stroke:#7F1D1D,color:#fff,stroke-width:2px

    subgraph WEBDEV["🌐 Web Dev Pipeline"]
        direction LR
        W1["Figma<br/>Design"]:::input --> W2["Claude Code<br/>Build"]:::ai --> W3["Python QA<br/>Scan"]:::check --> W4["GCP<br/>Host"]:::cloud
        W3 -.fail.-> W2
    end

    subgraph SOCIAL["📱 Social Media Pipeline"]
        direction LR
        S1["Platforms<br/>IG · TikTok · LinkedIn<br/>FB · X · YouTube"]:::input -->|"listen"| S2["Openclaw<br/>Agents"]:::check
        S2 <--> S3["Claude AI<br/>Strategy · Copy"]:::ai
        S2 --> S4["Human<br/>Approval"]:::human -->|"publish"| S1
    end

    subgraph QAENGINE["🐍 QA Engine — 7 Web Tools"]
        direction LR
        Q1["Lighthouse · axe-core<br/>SEMrush · OWASP ZAP<br/>Screaming Frog<br/>BrowserStack · GA4"]:::input --> Q2["Python<br/>Orchestrator"]:::check --> Q3["Claude<br/>Action items"]:::ai
    end
```

## 3. Change Management — Dual-Track Transformation

Two parallel tracks (**People + IT**) running from Today's labor-heavy state to the Venturi target state, gated by the 90-day build-to-operate checkpoints.

```mermaid
%%{init: {"flowchart": {"subGraphTitleMargin": {"top": 20, "bottom": 10}}}}%%
flowchart LR
    classDef today fill:#FEE2E2,stroke:#991B1B,color:#7F1D1D,stroke-width:2px
    classDef future fill:#D1FAE5,stroke:#065F46,color:#064E3B,stroke-width:3px,font-weight:bold
    classDef people fill:#059669,stroke:#064E3B,color:#fff,stroke-width:2px
    classDef tech fill:#0B5394,stroke:#052E5C,color:#fff,stroke-width:2px
    classDef gate fill:#DC2626,stroke:#7F1D1D,color:#fff,stroke-width:2px

    TODAY["📍 TODAY<br/>30 producers<br/>Labor-heavy<br/>Billable hours"]:::today

    subgraph PEOPLE["👥 PEOPLE TRACK — Producer → Orchestrator"]
        direction TB
        P1["Awareness<br/>& Vision"]:::people
        P2["AI Academy<br/>+ Certification"]:::people
        P3["Role Transition<br/>Shadow → Lead"]:::people
        P4["New KPIs<br/>+ Rewards"]:::people
        P1 --> P2 --> P3 --> P4
    end

    subgraph TECH["💻 IT TRACK — Fragmented → Venturi Stack"]
        direction TB
        T1["GCP + IAM<br/>Foundation"]:::tech
        T2["Multi-LLM<br/>+ MCP"]:::tech
        T3["Dual Build Tracks<br/>Branding + SaaS"]:::tech
        T4["Observability<br/>+ Legacy Sunset"]:::tech
        T1 --> T2 --> T3 --> T4
    end

    G1{{"🚦 Gate 1<br/>Launch Ready"}}:::gate
    G2{{"🚦 Gate 2<br/>Pilots Validated"}}:::gate
    G3{{"🚦 Gate 3<br/>Scale Ready"}}:::gate

    FUTURE["🎯 VENTURI STATE<br/>25 AI Orchestrators<br/>GCP + Multi-LLM Core<br/>RM 1M by Month 18<br/>20% IRR"]:::future

    TODAY --> PEOPLE & TECH
    PEOPLE --> G1
    TECH --> G1
    G1 --> G2 --> G3 --> FUTURE
```

### Role Evolution at a Glance

| From (Producer) | To (Orchestrator) |
|---|---|
| Content Writer | Content Orchestrator + Brand Guardian |
| Web Developer | AI-Assisted Engineer + Solution Architect |
| SEO Specialist | SEO Strategist + QA Reviewer |
| Designer | Creative Director + Prompt Curator |
| Account Manager | Client Success + Managed-Service Lead |
| Social Media Exec | Community Strategist + Agent Supervisor |

### Current → Target IT State

| Layer | Today | Venturi Target |
|---|---|---|
| **AI** | Ad-hoc ChatGPT + Gemini | Claude (primary) + OpenAI + Gemini + DeepSeek |
| **Infra** | Mixed hosting | GCP-led hybrid |
| **Build** | Per-project tooling | Branding track (React/Vite) + SaaS track (Next/Nest) |
| **QA** | Manual spreadsheets | Python engine + 7 web tools |
| **Knowledge** | Scattered | Central KB + Vector DB + MCP |
| **Analytics** | Reports on request | BigQuery + Looker dashboards |

## 4. Integrated Timeline — People + IT + Gates (Phased)

```mermaid
%%{init: {"flowchart": {"subGraphTitleMargin": {"top": 20, "bottom": 10}}}}%%
flowchart LR
    classDef phase fill:#FEF3C7,stroke:#92400E,color:#78350F,stroke-width:2px,font-weight:bold
    classDef people fill:#059669,stroke:#064E3B,color:#fff,stroke-width:2px
    classDef tech fill:#0B5394,stroke:#052E5C,color:#fff,stroke-width:2px
    classDef commercial fill:#7C3AED,stroke:#4C1D95,color:#fff,stroke-width:2px
    classDef gate fill:#DC2626,stroke:#7F1D1D,color:#fff,stroke-width:2px,font-weight:bold
    classDef outcome fill:#D1FAE5,stroke:#065F46,color:#064E3B,stroke-width:3px,font-weight:bold

    subgraph PH1["PHASE 1 · Foundation"]
        direction TB
        F1["👥 Change Lead appointed<br/>Awareness campaign"]:::people
        F2["💻 GCP + IAM setup<br/>Multi-LLM + MCP rollout"]:::tech
    end

    subgraph PH2["PHASE 2 · Service Build"]
        direction TB
        S1["👥 AI Academy<br/>Role mapping & redeployment"]:::people
        S2["💻 Dual build tracks<br/>Knowledge Base + Vector DB"]:::tech
    end

    subgraph PH3["PHASE 3 · Pilot Launch"]
        direction TB
        L1["👥 Orchestrator certification"]:::people
        L2["💻 Python QA engine<br/>(7 tools)"]:::tech
        L3["🎯 Bali pilots<br/>Hospitality + F&B"]:::commercial
    end

    subgraph PH4["PHASE 4 · Market Broadening"]
        direction TB
        B1["👥 New KPIs + reward alignment"]:::people
        B2["💻 Looker dashboards"]:::tech
        B3["🎯 Web Dev + SEO live<br/>Managed services + white-label"]:::commercial
    end

    subgraph PH5["PHASE 5 · Scale Economics"]
        direction TB
        SC1["💻 Legacy decommission waves"]:::tech
        SC2["🎯 Regional expansion<br/>Indonesia + Australia"]:::commercial
    end

    G1{{"🚦 Gate 1<br/>Launch Ready"}}:::gate
    G2{{"🚦 Gate 2<br/>Pilots Validated"}}:::gate
    G3{{"🚦 Gate 3<br/>Scale Ready"}}:::gate

    RESULT["🎯 RM 1M Revenue<br/>25 Orchestrators<br/>20% IRR"]:::outcome

    PH1 --> G1 --> PH2 --> PH3 --> G2 --> PH4 --> G3 --> PH5 --> RESULT

    class PH1,PH2,PH3,PH4,PH5 phase
```

## 5. Governing Principles (One-Page Summary)

| Principle | What It Means | How It Shows Up |
|---|---|---|
| **Venturi Compression** | Broad demand → narrow AI throat → high-velocity output | 25-person team delivers work of 75 via Claude + Openclaw |
| **No-Manpower-Growth** | Scale revenue without scaling headcount | Redeploy, don't replace; capability via system expansion |
| **Proof Before Scale** | Every gate needs evidence, not optimism | Victor is live proof; pilots before regional rollout |
| **Revenue Quality > Volume** | Recurring + managed beats one-off billable | Track recurring-revenue share as a lead KPI |
| **Coexist Before Cutover** | Protect live client work during IT migration | Pilots on new stack; legacy continues until Gate 2 |
| **Single Source of Truth** | One brain for the agency, shared across all work | Knowledge Base + prompt library treated as a product |
| **Human Judgment at the Edges** | AI in the middle, humans at intake + approval | HITL gates on every client-facing deliverable |

## 6. One-Line Positioning

> **Gaia AI** — *The service-enabled tech platform where Claude thinks, GCP scales, and humans give it soul.*

*Single reference document · merges operating architecture + change management · renders in any Mermaid-compatible viewer (GitHub, Notion, Obsidian, VS Code).*

## 6. Refefecnce Documents

- ai_businesss_plan.md
- ai_businss_plan_appendix.md
- qa_aitomaton_readme.md
- figma_automation.md
- figma_to_site_playbook.md
