# Gaia AI — 180-Day Implementation Plan  
## Web Development + Social Media / Ads / SEO  
**Prepared for:** Gaia Digital Agency  
**Context sources:** Gaia public plan, uploaded business plan, uploaded appendix pack, prior internal socmed analysis  
**Date:** 2026-04-23

---

## 1. Purpose of this plan

This document sets out a complete **180-day implementation plan** for Gaia AI focused on the two service tracks that best fit Gaia’s current operating vision and fastest path to proof:

1. **Web Development**
2. **Social Media / Ads / SEO**

The purpose is not simply to “use AI more.”  
The purpose is to redesign delivery so Gaia can:

- improve output quality and consistency,
- reduce dependence on individual staff memory and manual coordination,
- increase delivery speed and throughput,
- move from producers toward orchestrators,
- grow revenue without linearly growing headcount,
- build reusable AI-enabled managed-service capability.

This plan is written to align directly with Gaia’s stated Venturi model, no-manpower-growth logic, 25-orchestrator target state, RM 1 million month-18 ambition, and the existing public blueprints for Figma-to-Site and Social Media Automation (SOMA).

---

## 2. Strategic anchor points

The 180-day plan should stay anchored to the following non-negotiable strategic principles.

### 2.1 Business outcome target
Gaia is not building an isolated innovation lab.  
Gaia is building a **service-enabled tech operating layer** inside the agency.

### 2.2 Venturi logic
Broad, chaotic, client demand should be compressed through a structured AI orchestration layer and released as higher-speed, higher-consistency output.

### 2.3 No-manpower-growth principle
The point is not to hire proportionally as work grows.  
The point is to increase output-per-head through AI-assisted orchestration, reusable workflows, controlled QA, and standardized delivery systems.

### 2.4 Human-in-the-loop rule
AI drafts, routes, checks, recommends, summarizes, and helps execute.  
Humans remain accountable for:
- final public output,
- strategic judgment,
- budget and client commitments,
- reputation-sensitive decisions,
- approvals at the edge.

### 2.5 Focus discipline
The first 180 days should prioritize:
- a small number of repeatable offers,
- a limited number of pilots,
- strong operating control,
- measurable evidence,
- reusable capability.

Anything outside that should be screened tightly.

---

## 3. What “success at Day 180” should mean

By Day 180, Gaia should not judge success by number of experiments.  
It should judge success by whether the following have been achieved:

### 3.1 Web Development target state by Day 180
- Figma → MCP → site → QA → manual finish workflow operational and documented
- repeatable template-based build process in live use
- QA automation running as standard gate
- 2 to 4 live client deployments or equivalent internal proof cases completed through the AI-assisted web pipeline
- measurable reduction in time-to-staging and time-to-launch
- clear human role split between AI-assisted build and manual finish
- reusable playbooks, prompts, and QA checklist library in place

### 3.2 Socmed / Ads / SEO target state by Day 180
- client asset intake and structured memory workflow operational
- content-planning and drafting copilots in working use
- brand-compliance and review queue functioning
- human-approved publishing workflow live
- performance-insight loop established
- 2 to 3 active client pilots operating through the new AI-supported workflow
- repeatable managed-service package defined for Social, Ads support, and SEO support
- clear recommendation engine in place for campaign/content iteration

### 3.3 Operating model target state by Day 180
- governance cadence running
- ownership assigned
- delivery metrics tracked
- commercial packaging usable by account team
- platform architecture stable enough for measured expansion
- capability reuse visible across clients
- people shifting from production-heavy roles toward orchestration, QA, and system-led delivery

---

## 4. Scope of the first 180 days

This plan focuses on two lanes only.

### Lane A — Web Development
Primary implementation logic:
- Figma intake
- MCP extraction
- Claude-assisted build
- Templatebase / Payload / web stack generation
- automated QA
- human finisher
- GCP staging and production deployment
- reusable handoff and maintenance logic

### Lane B — Social Media / Ads / SEO
Primary implementation logic:
- asset intake
- brand/client memory
- planning
- drafting
- QA
- review/approval
- publishing or launch handoff
- monitoring
- insight feedback loop

This plan does **not** prioritize in the first 180 days:
- broad autonomous client-facing agents across all service lines
- large custom SaaS bets
- expansion into too many verticals
- uncontrolled experimentation across many platforms at once

---

## 5. Overall 180-day structure

The implementation should run in **six 30-day phases**.

| Phase | Days | Theme | Core outcome |
|---|---:|---|---|
| Phase 1 | 1–30 | Foundation | Operating base, ownership, architecture baseline |
| Phase 2 | 31–60 | Service Build | Productize first-wave offers and internal tooling |
| Phase 3 | 61–90 | Pilot Launch | Deploy controlled pilots and collect proof |
| Phase 4 | 91–120 | Stabilization | Fix weaknesses, standardize, raise reliability |
| Phase 5 | 121–150 | Scale Packaging | Convert working pilots into repeatable service packages |
| Phase 6 | 151–180 | Commercialization and Controlled Expansion | Prepare broader rollout while maintaining governance |

---

## 6. Cross-functional operating model

Before going phase by phase, Gaia should standardize one cross-functional model used across both priority lanes.

### 6.1 Shared operating layers
1. **Intake**
2. **Structured memory / context**
3. **Planning**
4. **Drafting / generation**
5. **QA / compliance**
6. **Human review**
7. **Execution / publish / deploy**
8. **Monitoring**
9. **Learning / optimization**

### 6.2 Shared enabling systems
- GCP as core cloud backbone
- OpenClaw as orchestration layer where agent logic is used
- Claude / OpenAI / Gemini / supporting models based on task fit
- PostgreSQL for queue / content / workflow state
- Review portals using Gaia’s preferred SaaS stack
- BigQuery / Looker or equivalent reporting layer for operating visibility
- central prompt / pattern / playbook repository
- environment separation for dev / staging / production

### 6.3 Shared governance rules
- no direct public publishing without human approval
- no direct budget changes without human approval
- no client-facing deployment without checklist gate
- no pilot expansion without measurable proof
- all reusable logic must be documented
- all pilot workflows must have named owners

---

# PART I — 180-DAY PHASE PLAN

## 7. Phase 1 — Foundation (Days 1–30)

### 7.1 Objective
Establish the minimum operating base required to launch Gaia AI execution in a controlled way across the two selected lanes.

### 7.2 Cross-functional priorities
- finalize AI Business Unit operating charter
- assign accountable owners
- lock first-wave scope
- confirm architecture baseline
- define readiness criteria
- define KPI baseline
- confirm governance and approval path

### 7.3 Web Development priorities
- confirm the target web-delivery pipeline:
  - Figma
  - MCP access
  - Claude Code / code generation flow
  - Templatebase / stack conventions
  - Python QA engine
  - GCP staging + production model
- document current web production workflow and bottlenecks
- identify which existing web projects are suitable as first pilot cases
- create standard web project intake template:
  - brand summary
  - sitemap
  - design source
  - CMS scope
  - API dependencies
  - QA requirements
  - launch checklist
- define the “85% ready” milestone clearly
- define manual finisher responsibilities

### 7.4 Socmed / Ads / SEO priorities
- define standard client asset intake structure
- design the client memory schema:
  - brand voice
  - audience
  - offers
  - platform mix
  - campaign history
  - SEO targets
  - do/don’t rules
  - approval rules
- define first pilot scope:
  - Socmed first
  - Ads support second
  - SEO support third
- confirm queue states and review process
- define initial performance schema and reporting fields
- choose first 2 to 3 candidate pilot clients

### 7.5 People and governance priorities
- establish leadership ownership:
  - AI division lead
  - web delivery owner
  - socmed/ads/seo owner
  - AI operations / technical owner
  - commercial / account interface owner
- define decision rights:
  - offer approval
  - deployment approval
  - budget exception approval
  - client risk escalation
- define weekly operating cadence
- define HITL policy for public outputs and deployments

### 7.6 Deliverables by Day 30
- AI Business Unit charter
- 180-day master roadmap approved
- first-wave offer list approved
- named owner matrix
- web AI pipeline blueprint documented
- social/ads/seo AI workflow blueprint documented
- client memory schema v1
- pilot-screening criteria
- QA / approval standards v1
- launch KPI dashboard v1
- operating glossary and SOP index

### 7.7 Exit criteria for Phase 1
Gaia should exit Phase 1 only when:
- ownership is explicit,
- architecture baseline is agreed,
- pilot candidates are shortlisted,
- first-wave scope is frozen,
- governance model is accepted,
- “ready for build” is unambiguous.

---

## 8. Phase 2 — Service Build (Days 31–60)

### 8.1 Objective
Turn strategy into deployable internal systems, first-wave playbooks, and productized delivery patterns.

### 8.2 Cross-functional priorities
- build the minimum working tools and interfaces
- standardize first-wave playbooks
- prepare internal enablement
- create statement-of-work and delivery templates
- define performance measurement methods
- prepare pilot environments

### 8.3 Web Development build priorities
#### A. Workflow and templates
- finalize web intake brief template
- create standard prompt packs for:
  - design interpretation
  - page structure generation
  - content block mapping
  - Payload schema generation
  - QA remediation
- build reusable starter structures for common site types:
  - hospitality site
  - F&B site
  - corporate site
  - campaign/landing site

#### B. QA and release controls
- define web QA gate:
  - accessibility
  - performance
  - security scan
  - SEO/crawlability
  - responsive behavior
  - analytics tag checks
- create standardized remediation loop between QA and code generation
- define staging signoff protocol
- define launch signoff protocol

#### C. Pilot preparation
- select 1 to 2 internal or low-risk web pilot builds
- confirm Figma design availability
- confirm which parts are AI-buildable vs manually finished

### 8.4 Socmed / Ads / SEO build priorities
#### A. Client memory and intake
- implement client asset folder standard
- build ingestion checklist
- create structured client memory record format
- create platform-specific metadata fields

#### B. Socmed tools
- build content planner v1
- build caption / CTA drafting assistant
- build creative brief generator
- build brand-compliance check logic
- build approval queue structure

#### C. Ads support tools
- build campaign brief generator
- build ad copy variant generator
- build offer-angle matrix template
- build landing-page mismatch checker
- build optimization memo template

#### D. SEO support tools
- build keyword clustering workflow
- build metadata draft tool
- build content brief generator
- build internal link suggestion template
- build issue-priority summarizer

### 8.5 Enablement priorities
- run first wave of team training
- train copywriters, designers, editors, SEO specialists, account team, developers on new workflows
- define “AI-assisted” vs “human-owned” responsibility table
- create internal feedback process for tooling issues

### 8.6 Deliverables by Day 60
- web delivery playbook v1
- web QA playbook v1
- Figma-to-site pilot checklist
- content planner/copilot v1
- client memory structure live
- brand-compliance workflow v1
- ads support toolkit v1
- SEO support toolkit v1
- pilot SOW templates
- account shortlist confirmed
- internal enablement completed for first-wave staff
- case-study and measurement templates prepared

### 8.7 Exit criteria for Phase 2
Gaia should exit Phase 2 only when:
- first-wave offers are sellable,
- first-wave workflows are deliverable,
- staff understand the operating model,
- pilots are qualified and scoped,
- tool stack is usable enough for live testing.

---

## 9. Phase 3 — Pilot Launch (Days 61–90)

### 9.1 Objective
Deploy controlled pilots, observe real operating behavior, and convert working output into proof.

### 9.2 Pilot design rules
Every pilot should meet four tests:
1. clear use case,
2. limited scope,
3. measurable outcome,
4. reference value.

### 9.3 Web pilot execution priorities
- deploy first AI-assisted web build pilot
- use actual Figma input and measure end-to-end timing
- run full QA cycle
- document % automated vs manual finish effort
- capture defects, prompt failures, and rework patterns
- produce first before/after comparison:
  - historical build cycle vs AI-assisted build cycle
  - historical QA effort vs automated QA-assisted effort

#### Suggested pilot outputs
- one landing site
- one brochure / profile site
- one CMS-backed content site if capacity allows

### 9.4 Socmed / Ads / SEO pilot execution priorities
#### Socmed pilot
- onboard 2 to 3 pilot clients
- ingest assets and build client memory
- run monthly plan + weekly queue
- generate drafts
- perform brand check
- review and approve in queue
- publish through controlled handoff
- generate weekly insight memo

#### Ads support pilot
- do not start with autonomous budget moves
- start in recommendation mode
- generate:
  - test ideas
  - copy variants
  - optimization notes
  - landing-page observations

#### SEO support pilot
- generate keyword clusters
- generate content briefs
- propose metadata improvements
- prioritize technical/content issues
- deliver insight memos, not uncontrolled edits

### 9.5 Management priorities in Phase 3
- watch control failure closely
- watch user adoption closely
- watch team friction closely
- watch pilot scope creep closely
- document every lesson rapidly
- do not expand too early

### 9.6 Deliverables by Day 90
- live web pilot deployment(s)
- live socmed pilot deployment(s)
- ads recommendation pilot outputs
- SEO support pilot outputs
- post-launch monitoring protocol
- pilot result summaries
- documented lessons learned
- revised delivery package based on real pilot feedback
- first client-facing proof materials
- first internal ROI hypothesis based on observed gains

### 9.7 Exit criteria for first 90 days
Gaia should move beyond the initial launch phase only if:
- first-wave offers are clearly repeatable,
- pilot delivery stayed controlled,
- early client value is visible,
- referenceability or expansion potential exists,
- management visibility is good enough to scale carefully.

---

## 10. Phase 4 — Stabilization (Days 91–120)

### 10.1 Objective
Strengthen reliability, remove operational friction, and convert pilot workflows into standardized systems.

### 10.2 Why this phase matters
Many AI initiatives fail after pilot stage because they confuse “working once” with “operationally stable.”  
This phase is about discipline, not novelty.

### 10.3 Cross-functional priorities
- eliminate pilot-era ambiguity
- standardize reusable workflows
- fix data / prompt / queue issues
- improve observability
- tighten governance
- remove unnecessary manual steps
- improve reuse across clients

### 10.4 Web Development stabilization priorities
- identify recurrent failure modes in AI-generated builds
- tighten prompt templates and build contracts
- improve QA routing and remediation logic
- standardize handoff package to manual finisher
- standardize deployment checklist
- define maintenance/update workflow for post-launch support
- create asset and page-type libraries from completed pilots
- add measurement of:
  - time to first scaffold
  - time to staging
  - QA pass rate
  - manual polish hours
  - total launch cycle time

### 10.5 Socmed / Ads / SEO stabilization priorities
#### Socmed
- refine client memory schema based on live use
- improve content planner accuracy
- reduce revision loops
- improve review portal usability
- standardize approval SLA
- classify recurring content types for reuse

#### Ads
- refine angle library and copy variants based on early results
- add structured creative test logging
- improve recommendation quality and relevance
- define bounded decision-support process for media team

#### SEO
- improve keyword-cluster templates
- refine content-brief quality
- improve technical issue summarization
- build refresh-priority logic for existing content

### 10.6 Team and governance priorities
- run second training wave using real pilot examples
- formalize escalation triggers
- formalize revision control
- define when AI outputs are good enough to skip certain manual steps
- define which steps must always stay human-led

### 10.7 Deliverables by Day 120
- stabilized web build SOP v2
- stabilized social workflow SOP v2
- stabilized ads recommendation SOP v2
- stabilized SEO support SOP v2
- issue register with fixes closed or prioritized
- revised role matrix by function
- dashboard v2 with more stable service-line metrics
- pilot-to-standard conversion memo

### 10.8 Exit criteria for Phase 4
- major control failures are resolved,
- revision loops are falling,
- teams trust the workflow more,
- time and quality metrics are improving,
- repeatability is visibly stronger than at Day 90.

---

## 11. Phase 5 — Scale Packaging (Days 121–150)

### 11.1 Objective
Turn working internal systems into properly packaged, sellable, repeatable service offers with clear boundaries.

### 11.2 Cross-functional priorities
- package the offers
- define pricing logic
- standardize onboarding
- standardize scope boundaries
- standardize reporting outputs
- standardize commercial language

### 11.3 Web Development packaging priorities
Create 2 to 3 productized web offers, for example:

#### Offer A — AI-Assisted Website Sprint
- best for brochure/corporate sites
- Figma to staging fast
- manual finish included
- fixed QA gate
- fast launch timeline

#### Offer B — AI-Assisted CMS Launch
- for content-led sites
- Payload-backed
- repeatable page models
- editorial handoff included

#### Offer C — White-Label AI Web Delivery
- for partner agencies
- Gaia as backend acceleration layer
- clear handoff and quality rules

For each offer define:
- scope
- exclusions
- expected timeline
- required input quality
- review steps
- change-order logic
- KPI promise
- proof points

### 11.4 Socmed / Ads / SEO packaging priorities
Create first-wave managed-service packages.

#### Offer A — AI-Assisted Social Media Managed Service
Includes:
- asset intake
- client memory
- monthly plan
- weekly queue
- caption / CTA drafting
- brand-compliance check
- approval workflow
- publishing handoff
- weekly insight memo

#### Offer B — AI-Assisted Ads Performance Support
Includes:
- campaign brief support
- copy variants
- test matrix
- landing-page observations
- weekly optimization memo
- anomaly watchlist

#### Offer C — AI-Assisted SEO Content and Optimization Support
Includes:
- keyword clustering
- content briefs
- metadata suggestions
- issue prioritization
- refresh recommendations
- performance interpretation

### 11.5 Commercial enablement priorities
- create proposal language
- create pricing logic
- create case-study assets
- create sales deck support
- create onboarding checklist
- create account-management checklist
- create managed-service reporting templates

### 11.6 Deliverables by Day 150
- packaged web offers
- packaged socmed offer
- packaged ads support offer
- packaged SEO support offer
- proposal templates
- pricing guardrails
- onboarding packs
- case-study proofs
- standard monthly reporting templates
- scope-control checklist
- partner/white-label version where relevant

### 11.7 Exit criteria for Phase 5
Gaia should exit this phase only when:
- offers are clearly understandable commercially,
- delivery teams can execute them repeatedly,
- account team can sell them consistently,
- proof assets are available,
- onboarding is no longer improvised.

---

## 12. Phase 6 — Commercialization and Controlled Expansion (Days 151–180)

### 12.1 Objective
Move from pilot-era operations to a controlled growth mode without losing governance.

### 12.2 Strategic principle
The point of this phase is **not** aggressive expansion.  
It is **controlled commercialization**.

### 12.3 Cross-functional priorities
- expand only after proof
- convert pilot credibility into pipeline
- improve recurring-revenue logic
- tighten dashboard discipline
- prepare next-wave roadmap
- maintain fixed-cost discipline

### 12.4 Web Development priorities
- move from isolated pilot cases to repeatable delivery line
- identify 3 to 5 near-term accounts where AI-assisted web delivery is best fit
- refine white-label agency path
- define service-level expectations:
  - turnaround
  - revision limits
  - QA standards
  - human finisher responsibilities
- decide whether additional web-agent orchestration beyond the current non-agent build flow is commercially justified now or later

### 12.5 Socmed / Ads / SEO priorities
- expand socmed pilot into managed monthly service where results justify it
- convert ads and SEO support from pilot to standard operating package
- define client fit rules:
  - who is right for the AI-assisted model
  - who still needs more manual custom work
- prepare second-wave enhancements:
  - interaction workflows
  - stronger monitoring
  - better client insight dashboards
  - platform adapter normalization

### 12.6 Organizational priorities
- formalize business-unit reporting
- review whether selective hiring is needed
- redeploy staff from repetitive work into:
  - orchestration
  - QA
  - performance interpretation
  - account growth
- update compensation / evaluation logic if needed to reward orchestration and quality, not only manual output volume

### 12.7 Financial and commercial priorities
- track recurring revenue share
- track margin by service family
- track pilot-to-retainer conversion
- track cost per delivery unit
- track capability reuse
- keep fixed-cost growth slower than revenue growth
- maintain contingency discipline

### 12.8 Deliverables by Day 180
- 180-day implementation review
- service-line scorecard
- commercialization pack for web and socmed/ads/seo
- portfolio decision memo:
  - continue
  - refine
  - pause
  - expand
- Year 1 next-step roadmap
- controlled expansion plan for Bali accounts and selected partner channels

### 12.9 Exit criteria for Day 180
Gaia should call the first 180 days successful only if:
- at least one repeatable web offer is operational,
- at least one repeatable AI-assisted social managed-service offer is operational,
- ads and SEO support layers are functioning in controlled recommendation mode or better,
- pilots produced proof without major control failure,
- people roles have measurably shifted toward orchestration,
- governance is functioning,
- commercial packaging is no longer conceptual,
- expansion can occur without improvisation.

---

# PART II — DETAILED TRACK PLANS

## 13. Detailed track plan — Web Development

### 13.1 Strategic role of the Web Development lane
The web lane is Gaia’s clearest path to visible AI-enabled delivery because the public plan already defines a concrete pipeline:
**Figma → MCP → site build → automated QA → ~85% ready → manual finish → GCP deployment.**

This should remain the implementation anchor.

### 13.2 Operating model
#### Intake
- client brief
- sitemap
- Figma link
- assets
- CMS needs
- integrations
- launch constraints

#### AI-assisted build
- frame/token interpretation
- structure generation
- scaffolding
- component mapping
- Payload and content-model generation where needed
- code generation and refactor loop

#### QA layer
- performance
- accessibility
- crawlability
- security scan
- responsive and browser checks
- analytics checks

#### Human finisher layer
- copy refinement
- design edge cases
- accessibility nuances
- content polish
- launch judgment

### 13.3 What AI should do in Web Development
- parse design structure
- scaffold pages and layouts
- generate repetitive code patterns
- prepare CMS models
- suggest content structures
- run QA and summarize issues
- suggest remediation
- produce technical handoff notes

### 13.4 What humans should continue to own
- design interpretation in ambiguous areas
- final copy and brand nuance
- client consultation
- last-mile polish
- exception handling
- launch approval
- quality judgment on aesthetics and feel

### 13.5 Core web KPIs
- time to first scaffold
- time to staging
- QA pass rate
- % of build completed before human finisher
- hours saved per project
- revision count after QA
- launch cycle time
- defect severity after deployment
- gross margin per web delivery type

---

## 14. Detailed track plan — Socmed / Ads / SEO

### 14.1 Strategic role of this lane
This lane is the best candidate for building a reusable managed-service operating system because of its:
- repetition,
- measurable outputs,
- dependency on memory and coordination,
- strong fit for planning + drafting + QA + monitoring loops.

### 14.2 Core implementation sequence
The correct operating loop is:

**Assets → Memory → Objectives → Plan → Drafts → QA → Approval → Publish / Launch → Monitor → Learn**

### 14.3 Social Media implementation logic
#### AI role
- create monthly content plan
- create weekly queue
- draft captions and CTAs
- adapt content by platform
- draft response suggestions
- suggest creative briefs
- summarize weekly performance

#### Human role
- approve public output
- refine brand-sensitive messaging
- handle risky interactions
- decide campaign priorities
- sign off calendars

### 14.4 Ads implementation logic
#### AI role
- generate campaign brief support
- generate copy variants
- generate angle/test matrix
- flag landing-page mismatch
- generate optimization memo
- summarize anomalies and fatigue signals

#### Human role
- own budget
- approve launch
- approve major optimizations
- interpret business nuance
- manage client commitments

### 14.5 SEO implementation logic
#### AI role
- keyword clustering
- content brief generation
- metadata suggestions
- internal link ideas
- issue prioritization
- search-performance interpretation

#### Human role
- final strategy choice
- technical implementation judgment
- content quality control
- off-page/outreach judgment
- client-facing prioritization

### 14.6 Core Socmed / Ads / SEO KPIs
- asset-to-draft cycle time
- draft-to-approval cycle time
- revision rounds per content piece
- approval SLA
- content throughput per team member
- campaign recommendation adoption rate
- content-brief turnaround
- % of outputs passing brand check first time
- engagement / CTR / conversion proxy improvements where measurable
- recurring revenue retention for managed-service accounts

---

# PART III — PEOPLE, GOVERNANCE, METRICS, AND RISK

## 15. Role redesign for Gaia

The people plan should follow Gaia’s stated direction: **from producers to orchestrators**.

### 15.1 Role evolution by function
- **Web developer** → AI-assisted engineer + solution finisher
- **SEO specialist** → search strategist + QA reviewer
- **Copywriter** → narrative editor + prompt/pattern owner
- **Graphic designer** → creative director + variant/brand curator
- **Video editor** → AI-assisted cut supervisor + final polish owner
- **Social media executive** → community strategist + workflow supervisor
- **Account manager** → managed-service lead + client objective owner
- **AI division** → orchestration owner + system governance + capability builder

### 15.2 Capability-building tracks
#### Upskilling
- AI-assisted workflow use
- prompt discipline
- review discipline
- output validation
- system thinking

#### Redeployment
- move repetitive production staff into:
  - review,
  - QA,
  - insight generation,
  - managed service coordination,
  - pattern library maintenance

#### Selective hiring
Only where needed for:
- AI operations
- workflow engineering
- data/reporting
- special technical integration
- commercial packaging support

---

## 16. Governance cadence

### 16.1 Weekly cadence
- Monday: operating review
- Wednesday: build / issue review
- Friday: pilot / performance review

### 16.2 Monthly cadence
- service-line scorecard review
- pilot-to-package review
- risk review
- commercial conversion review
- budget and token / tooling cost review

### 16.3 Decision gates
#### Gate 1 — Build readiness
Before Phase 2 tools go live:
- ownership assigned
- workflows defined
- QA controls active

#### Gate 2 — Pilot readiness
Before pilots launch:
- scope limited
- client fit confirmed
- metrics defined
- review process active

#### Gate 3 — Post-pilot validation
Before scale packaging:
- measurable client value shown
- control failure acceptable
- team adoption workable

#### Gate 4 — Expansion readiness
Before broader commercialization:
- offer repeatability visible
- delivery reliable
- governance stable
- financial visibility present

---

## 17. KPI dashboard for the first 180 days

### 17.1 Business-unit KPIs
- delivery throughput
- implementation quality
- recurring-revenue retention
- account expansion
- operating reliability
- capability reuse

### 17.2 Web Development KPIs
- time to scaffold
- time to staging
- QA pass rate
- manual finish hours
- launch time reduction
- defect rate

### 17.3 Socmed / Ads / SEO KPIs
- content throughput
- cycle time from asset intake to publish-ready draft
- revision rate
- brand-check pass rate
- pilot performance lift signals
- client reporting timeliness
- recommendation-to-action rate

### 17.4 Financial guardrails
- revenue by stream
- recurring revenue share
- gross margin by service family
- OPEX by fixed vs variable
- cost per client workflow
- payback status
- contingency use
- revenue per delivery resource

---

## 18. Major risks and mitigation in the first 180 days

### 18.1 Strategic drift
**Risk:** too many experiments, too many offers, no focus  
**Mitigation:** keep first-wave scope small and decision rights explicit

### 18.2 Pilot complexity overload
**Risk:** pilots become custom consulting exercises  
**Mitigation:** use strict pilot-screening criteria and scope limits

### 18.3 Tooling instability
**Risk:** platform/tool stack not reliable enough for live use  
**Mitigation:** stabilize before scale, maintain staging and QA gates

### 18.4 Team resistance or confusion
**Risk:** staff see AI as threat or extra work  
**Mitigation:** redesign roles clearly and train through real pilot examples

### 18.5 Quality inconsistency
**Risk:** AI outputs create generic or off-brand deliverables  
**Mitigation:** brand memory, compliance checks, human review, reusable patterns

### 18.6 Cost sprawl
**Risk:** experimentation burns budget without revenue proof  
**Mitigation:** preserve capital, track variable cost, tie expansion to commercial proof

### 18.7 Governance failure
**Risk:** AI publishes, deploys, or recommends actions without proper control  
**Mitigation:** human approvals at edges, named owners, escalation paths, environment separation

---

## 19. Recommended pilot slate

### 19.1 Web pilots
1. **Internal demonstration site or low-risk client site**
2. **Hospitality/F&B branded site using Figma source**
3. **CMS-enabled content site if operationally feasible**

### 19.2 Socmed / Ads / SEO pilots
1. **AI-assisted Social Media Managed Service Pilot** for 2–3 current clients
2. **Ads recommendation-support pilot** for 1–2 clients with active campaigns
3. **SEO content and optimization support pilot** for 1–2 clients with existing site content and measurable search baseline

### 19.3 Why this mix is correct
- web creates visible transformation proof
- social creates high-frequency workflow proof
- ads/seo create measurable optimization support proof
- together they validate both production acceleration and managed-service orchestration

---

## 20. Suggested resource concentration across the 180 days

This is not a budget model. It is a management allocation guide.

### 20.1 Highest concentration
- delivery architecture
- pilot execution
- QA and review control
- prompt/workflow/playbook reuse
- commercial packaging from proof

### 20.2 Medium concentration
- dashboarding and reporting
- team enablement
- monitoring and observability
- account-management adaptation

### 20.3 Lowest concentration in first 180 days
- broad R&D
- too many new offers
- advanced autonomous agents with reputational risk
- non-core internal experiments without near-term delivery relevance

---

## 21. Final recommendation

Gaia should treat the next 180 days as the period in which it proves that its AI vision can become a real operating model, not just a concept, not just a POC, and not just a set of tools.

The best execution logic is:

1. **Use the existing 90-day plan as the launch spine**
2. **Run two focused transformation lanes: Web Development and Socmed / Ads / SEO**
3. **Stabilize after pilot rather than rushing to expand**
4. **Turn working pilots into productized offers**
5. **Commercialize only after repeatability and governance are visible**

The first 180 days should therefore be judged against one central question:

> Has Gaia turned AI from support utility into a disciplined delivery engine for real client work?

If the answer is yes, then Gaia will have built the foundation required to move toward:
- 25 orchestrators,
- 3× output per head,
- stronger recurring revenue,
- and a more scalable agency model without proportional manpower growth.

That would be fully aligned with Gaia’s stated vision.

---

## 22. Reference basis used for this plan

### Primary Gaia public plan
- Gaia AI public operating model and system blueprints
- Venturi business plan section
- Figma → Site section
- SOMA section
- Victor / full-service operating logic

### Uploaded files
- Gaia AI business plan markdown / HTML
- appendix pack
- prior internal social-media / ads / SEO implementation analysis

### Design assumptions inherited from source materials
- GCP-led infrastructure
- OpenClaw orchestration layer
- human approval at the edge
- focused first-wave launch
- no-manpower-growth discipline
- delivery reuse over custom sprawl
