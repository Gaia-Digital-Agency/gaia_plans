# GDA-AI02 Multi-Organization Agent System Design
Version: v1  
Purpose: Production-oriented organization, agent, subagent, routing, memory, and UI design for a multi-organization AI operations stack.

---

# 1. Executive Summary

This document expands the initial organization design into a deployable operating blueprint for two distinct AI-enabled organizations on the same server:

1. **Commercial Operations**
   - Sales
   - Customer Service
   - Booking

2. **Digital Agency Operations**
   - Account Strategy
   - Ads
   - SEO
   - Branding
   - Social Media

The design assumes:

- one central server on GCP
- browser-based operator UI
- direct human interaction with orchestrators, agents, and subagents
- isolated organization memory and policy boundaries
- Gemini 2.5 as the primary model
- Sonnet as the fallback model
- subagents acting as specialist executors rather than autonomous organizational owners

This document covers:

- org structure
- exact agent and subagent roles
- input / output contracts
- escalation rules
- routing logic
- memory boundaries
- file and folder layout
- UI navigation manifest
- sample YAML definitions
- recommended implementation sequence

---

# 2. Core Design Principles

## 2.1 Separate organizations, not one mixed org

The two organizations should remain operationally separate because they serve different objectives:

### Commercial Operations
Optimized for:
- response time
- conversion
- booking accuracy
- customer satisfaction
- operational continuity

### Digital Agency Operations
Optimized for:
- strategy quality
- campaign and content delivery
- brand consistency
- structured client servicing
- reporting and iteration

Mixing both into one organization would create:
- prompt contamination
- blurred escalation rules
- messy memory access
- weak operational governance

---

## 2.2 Orchestrator → Agent → Subagent hierarchy

Use a strict hierarchy:

- **Orchestrator**: intake, triage, routing, escalation, coordination
- **Agent**: functional owner of a domain
- **Subagent**: specialist execution unit for a narrow workstream

This avoids the common mistake of creating too many top-level agents.

---

## 2.3 Default human entry point should be the orchestrator

The UI should allow humans to talk directly to any level, but default usage should be:

- human starts at orchestrator
- orchestrator routes or delegates
- human only drops into a subagent when specialist work is needed

This preserves structure while still allowing visibility.

---

## 2.4 Memory must be scoped

Memory access must not be universal.

Each layer should have controlled access:

- organization shared memory
- agent scoped memory
- subagent task memory
- case/session memory

No subagent should automatically read all organizational memory.

---

## 2.5 Keep humans in the approval loop for commercial or reputational risk

AI can draft, recommend, route, summarize, and propose.  
Humans should approve:

- pricing commitments
- refunds or credits
- formal compensation
- strategic client positioning
- budget reallocation
- final public brand outputs
- high-risk complaint resolutions

---

# 3. System Overview

## 3.1 Organizations

```text
GDA-AI02
├── commercial-ops
└── digital-agency-ops
```

## 3.2 Organization composition

### Commercial Ops
- 1 orchestrator
- 3 top-level agents
- 9 subagents

### Digital Agency Ops
- 1 orchestrator
- 5 top-level agents
- 15 subagents

---

# 4. Organization A — Commercial Operations

## 4.1 Mission

Commercial Operations exists to convert inquiries into revenue, support customers reliably, and manage bookings accurately.

## 4.2 Functional domains

- Sales
- Customer Service
- Booking

## 4.3 Agent tree

```text
commercial-ops
├── orchestrator
├── sales-agent
│   ├── lead-qualifier
│   ├── proposal
│   └── followup
├── customer-service-agent
│   ├── inquiry-response
│   ├── complaint-resolution
│   └── knowledgebase
└── booking-agent
    ├── availability
    ├── reservation
    └── reschedule-cancellation
```

---

## 4.4 Commercial Ops Orchestrator

### Role
Primary entry point for all commercial operations requests.

### Responsibilities
- receive inbound request
- classify the request
- determine urgency
- assign to correct agent
- manage cross-functional dependency
- track SLA and escalation status
- summarize the case for human review when needed

### Typical input
- website form
- UI chat message
- copied email
- call note
- booking inquiry
- complaint message

### Typical output
- routing decision
- structured case summary
- urgency tag
- assigned workstream
- escalation recommendation

### Routing categories
- sales inquiry
- booking request
- booking change
- support question
- complaint
- policy clarification
- mixed request

### Escalate when
- user threatens legal action
- refund or compensation is requested
- case involves public reputation risk
- customer identity or payment issue is unclear
- multiple functions conflict

---

## 4.5 Sales Agent

### Role
Owns lead qualification, offer structuring, proposal drafting, and follow-up management.

### Responsibilities
- qualify leads
- assess budget and timeline
- identify fit
- recommend package path
- prepare proposal draft
- maintain next-step momentum

### Inputs
- lead inquiry
- service request
- discovery note
- package interest
- budget or timing signal

### Outputs
- lead summary
- fit score
- recommended package
- draft pricing outline
- proposal note
- follow-up sequence

### Subagents
- lead-qualifier
- proposal
- followup

---

### 4.5.1 Lead Qualifier Subagent

#### Purpose
Convert unstructured inquiries into structured commercial lead records.

#### Responsibilities
- extract lead identity
- infer business need
- identify urgency
- estimate buying intent
- classify hot / warm / cold
- identify missing information

#### Input contract
Receives:
- freeform lead message
- email
- intake form
- pasted transcript

#### Output contract
Returns:
```yaml
lead_summary:
  lead_name: ""
  company: ""
  contact_channel: ""
  requested_service: ""
  budget_signal: ""
  timeline_signal: ""
  urgency: low|medium|high
  qualification_status: hot|warm|cold|unclear
  missing_information: []
  recommended_next_step: ""
```

#### Escalation triggers
- high-value lead with unclear needs
- lead requests custom pricing
- lead requests contract deviations
- lead requests guaranteed outcomes

---

### 4.5.2 Proposal Subagent

#### Purpose
Translate a qualified opportunity into an offer structure.

#### Responsibilities
- select relevant package options
- draft proposal summary
- define scope boundaries
- list assumptions
- identify upsell/cross-sell opportunities
- prepare objection-handling notes

#### Input contract
Receives:
- structured lead summary
- package catalog
- commercial rules
- service availability assumptions

#### Output contract
Returns:
```yaml
proposal_draft:
  package_recommendation: ""
  scope_summary: ""
  assumptions: []
  exclusions: []
  commercial_notes: []
  approval_required: true|false
```

#### Escalation triggers
- custom scope
- out-of-policy discount request
- enterprise or strategic account
- proposal requires manual pricing

---

### 4.5.3 Followup Subagent

#### Purpose
Maintain pipeline momentum after the first interaction or proposal.

#### Responsibilities
- schedule next steps
- generate follow-up drafts
- create reminder cadence
- summarize stalled deals
- propose re-engagement actions

#### Input contract
Receives:
- lead status
- last interaction summary
- proposal status
- SLA/follow-up rule

#### Output contract
Returns:
```yaml
followup_plan:
  current_stage: ""
  next_action_date: ""
  next_action_type: ""
  draft_message: ""
  stale_risk: low|medium|high
```

#### Escalation triggers
- repeated silence from high-value lead
- lead objections imply major product gap
- commercial conflict or scope confusion

---

## 4.6 Customer Service Agent

### Role
Owns customer communication for inquiries, issue resolution, and support playbook quality.

### Responsibilities
- answer service questions
- resolve routine issues
- manage complaint workflows
- maintain tone and professionalism
- identify recurring support failure patterns

### Inputs
- inbound support message
- complaint
- customer follow-up
- FAQ need
- policy question

### Outputs
- response draft
- issue summary
- resolution recommendation
- FAQ update request
- escalation note

### Subagents
- inquiry-response
- complaint-resolution
- knowledgebase

---

### 4.6.1 Inquiry Response Subagent

#### Purpose
Handle common support questions quickly and consistently.

#### Responsibilities
- answer FAQ-type inquiries
- use policy-approved language
- identify when a question exceeds standard scope
- draft professional responses

#### Output contract
```yaml
support_response:
  question_type: ""
  answer_summary: ""
  confidence: low|medium|high
  escalation_required: true|false
  response_draft: ""
```

#### Escalation triggers
- policy ambiguity
- nonstandard customer demand
- payment dispute
- complaint hidden inside “simple” question

---

### 4.6.2 Complaint Resolution Subagent

#### Purpose
Structure and de-escalate customer complaints.

#### Responsibilities
- summarize issue clearly
- assess severity
- identify policy relevance
- recommend remedy options
- draft apology and corrective path
- escalate where commercial impact exists

#### Output contract
```yaml
complaint_case:
  issue_type: ""
  severity: low|medium|high|critical
  customer_impact: ""
  root_cause_hypothesis: ""
  recommended_resolution: ""
  compensation_considered: true|false
  escalation_required: true|false
```

#### Escalation triggers
- refund requested
- public accusation
- threat of legal action
- repeated service failure
- VIP or key account customer

---

### 4.6.3 Knowledgebase Subagent

#### Purpose
Turn recurring support patterns into reusable operational knowledge.

#### Responsibilities
- detect recurring questions
- recommend FAQ updates
- recommend macro/template updates
- identify SOP gaps
- improve agent response consistency

#### Output contract
```yaml
knowledgebase_update:
  recurring_issue: ""
  affected_area: ""
  suggested_faq_entry: ""
  suggested_sop_update: ""
  urgency: low|medium|high
```

---

## 4.7 Booking Agent

### Role
Owns schedule, reservation integrity, and booking modification workflows.

### Responsibilities
- verify availability
- manage reservations
- handle rescheduling and cancellations
- align policy and schedule operations
- reduce double booking or ambiguity risk

### Inputs
- booking inquiry
- booking details
- availability request
- date change request
- cancellation request

### Outputs
- availability options
- reservation summary
- reschedule options
- cancellation response
- booking exception note

### Subagents
- availability
- reservation
- reschedule-cancellation

---

### 4.7.1 Availability Subagent

#### Purpose
Determine slot and resource availability.

#### Responsibilities
- check dates and time slots
- identify conflicts
- suggest alternatives
- summarize slot options

#### Output contract
```yaml
availability_result:
  requested_slot: ""
  is_available: true|false
  alternatives: []
  constraints: []
```

---

### 4.7.2 Reservation Subagent

#### Purpose
Convert an approved booking path into a reservation summary ready for confirmation.

#### Responsibilities
- validate required information
- summarize booking details
- prepare confirmation
- ensure policy alignment

#### Output contract
```yaml
reservation_summary:
  customer_name: ""
  service_type: ""
  date: ""
  time: ""
  attendees: ""
  special_notes: ""
  confirmation_ready: true|false
  missing_information: []
```

---

### 4.7.3 Reschedule/Cancellation Subagent

#### Purpose
Manage change requests without breaking policy or operational continuity.

#### Responsibilities
- determine applicable policy
- propose alternate slots
- identify penalties or implications
- draft customer communication

#### Output contract
```yaml
change_request_result:
  request_type: reschedule|cancellation
  policy_applied: ""
  eligible_options: []
  financial_implication: ""
  approval_required: true|false
  draft_response: ""
```

#### Escalation triggers
- refund implication
- policy dispute
- goodwill exception request
- repeated customer dissatisfaction

---

# 5. Organization B — Digital Agency Operations

## 5.1 Mission

Digital Agency Operations exists to intake client needs, convert them into structured strategic and execution workstreams, and deliver consistent performance across brand, media, search, and social channels.

## 5.2 Functional domains

- Account Strategy
- Ads
- SEO
- Branding
- Social Media

## 5.3 Agent tree

```text
digital-agency-ops
├── orchestrator
├── account-strategy-agent
│   ├── client-intake
│   ├── scope-planning
│   └── reporting
├── ads-agent
│   ├── media-planning
│   ├── ad-copy-creative-brief
│   └── performance-optimization
├── seo-agent
│   ├── keyword-research
│   ├── onpage-seo
│   └── seo-audit
├── branding-agent
│   ├── brand-strategy
│   ├── messaging
│   └── visual-direction
└── social-media-agent
    ├── content-calendar
    ├── caption-community
    └── analytics-growth
```

---

## 5.4 Digital Agency Orchestrator

### Role
Central coordinator for client requests, delivery routing, dependency tracking, and approval control.

### Responsibilities
- classify new client/project requests
- break work into functions
- coordinate cross-functional deliverables
- maintain timeline visibility
- request approvals where necessary
- summarize project status and dependency risk

### Inputs
- client brief
- campaign request
- strategy question
- reporting request
- delivery revision note

### Outputs
- work breakdown
- routing map
- project summary
- escalation recommendation
- dependency list

### Escalate when
- client scope is unclear or conflicts internally
- multiple agents require prioritization decisions
- commercial change affects scope or billing
- strategic recommendation could materially change brand or spend direction

---

## 5.5 Account Strategy Agent

### Role
Owns client understanding, scope structure, and client-facing synthesis.

### Responsibilities
- intake client profile
- define project scope
- translate goals into workstreams
- prepare executive reporting
- identify dependencies and risk

### Subagents
- client-intake
- scope-planning
- reporting

---

### 5.5.1 Client Intake Subagent

#### Purpose
Convert raw client briefing into a structured client profile.

#### Responsibilities
- identify company context
- identify audience
- identify goals, timeline, and channels
- capture tone and constraints
- summarize business context

#### Output contract
```yaml
client_profile:
  client_name: ""
  business_type: ""
  audience: ""
  goals: []
  channels: []
  constraints: []
  tone_preferences: []
  deadlines: []
```

---

### 5.5.2 Scope Planning Subagent

#### Purpose
Turn goals into defined work packages and deliverables.

#### Responsibilities
- map requested services
- define phases
- define milestones
- identify dependencies
- separate included vs excluded scope

#### Output contract
```yaml
scope_plan:
  objectives: []
  workstreams: []
  deliverables: []
  dependencies: []
  exclusions: []
  approval_required: true|false
```

---

### 5.5.3 Reporting Subagent

#### Purpose
Create structured executive-friendly reporting.

#### Responsibilities
- compile agent inputs
- summarize KPI changes
- highlight wins, issues, and next actions
- tailor for client-facing format

#### Output contract
```yaml
reporting_pack:
  reporting_period: ""
  highlights: []
  issues: []
  metrics_summary: []
  next_actions: []
```

---

## 5.6 Ads Agent

### Role
Owns paid media planning, creative direction, and optimization workflow.

### Responsibilities
- recommend media structure
- align campaigns to goals
- develop messaging hooks and briefs
- interpret performance
- propose optimization actions

### Subagents
- media-planning
- ad-copy-creative-brief
- performance-optimization

---

### 5.6.1 Media Planning Subagent

#### Purpose
Build campaign structure recommendations.

#### Responsibilities
- define objective
- map funnel stage
- recommend channels
- suggest budget allocation logic
- propose audience segmentation

#### Output contract
```yaml
media_plan:
  business_goal: ""
  recommended_channels: []
  funnel_structure: []
  audience_segments: []
  budget_logic: ""
```

---

### 5.6.2 Ad Copy / Creative Brief Subagent

#### Purpose
Convert marketing strategy into creative directions and copy angles.

#### Responsibilities
- define angles
- propose hooks and CTAs
- produce brief for creative production
- align message to audience and funnel

#### Output contract
```yaml
creative_brief:
  campaign_theme: ""
  audience: ""
  key_angles: []
  hooks: []
  ctas: []
  asset_requirements: []
```

---

### 5.6.3 Performance Optimization Subagent

#### Purpose
Review campaign performance and propose interventions.

#### Responsibilities
- inspect KPI shifts
- identify weak points
- recommend tests
- prioritize optimization actions

#### Output contract
```yaml
optimization_review:
  diagnosis: []
  priority_issues: []
  recommended_tests: []
  expected_impact: ""
```

#### Escalation triggers
- spend increase recommendation
- strategic channel shift
- landing page problem outside media scope
- severe conversion drop without clear cause

---

## 5.7 SEO Agent

### Role
Owns search visibility work across keyword strategy, on-page improvements, and audit analysis.

### Responsibilities
- keyword clustering
- intent mapping
- on-page recommendation
- technical SEO review
- prioritization of SEO opportunities

### Subagents
- keyword-research
- onpage-seo
- seo-audit

---

### 5.7.1 Keyword Research Subagent

#### Purpose
Identify keyword opportunities aligned with business intent.

#### Responsibilities
- cluster keywords by topic and intent
- prioritize based on business relevance
- identify content opportunities
- structure opportunity map

#### Output contract
```yaml
keyword_map:
  themes: []
  priority_keywords: []
  intent_groups: []
  content_opportunities: []
```

---

### 5.7.2 On-Page SEO Subagent

#### Purpose
Create page-level optimization recommendations.

#### Responsibilities
- improve titles and meta structure
- recommend heading hierarchy
- recommend internal linking
- propose content enhancements

#### Output contract
```yaml
onpage_recommendation:
  page_target: ""
  title_recommendation: ""
  meta_recommendation: ""
  heading_structure: []
  internal_linking_notes: []
  content_improvements: []
```

---

### 5.7.3 SEO Audit Subagent

#### Purpose
Summarize technical and structural SEO issues.

#### Responsibilities
- identify crawl/index concerns
- flag performance or structural problems
- prioritize issue severity
- create remediation list

#### Output contract
```yaml
seo_audit_result:
  critical_issues: []
  medium_priority_issues: []
  low_priority_issues: []
  remediation_order: []
```

---

## 5.8 Branding Agent

### Role
Owns positioning, narrative, messaging coherence, and visual direction inputs.

### Responsibilities
- define positioning
- clarify differentiation
- shape message architecture
- produce visual direction briefs
- maintain brand consistency

### Subagents
- brand-strategy
- messaging
- visual-direction

---

### 5.8.1 Brand Strategy Subagent

#### Purpose
Clarify strategic brand direction.

#### Responsibilities
- define positioning territory
- identify differentiation
- align with audience perception goals
- summarize strategic brand thesis

#### Output contract
```yaml
brand_strategy:
  audience: ""
  positioning_statement: ""
  differentiation_points: []
  competitor_reference: []
  perception_goal: ""
```

---

### 5.8.2 Messaging Subagent

#### Purpose
Turn strategy into usable language.

#### Responsibilities
- create message pillars
- define tone of voice
- draft taglines or narrative variants
- structure key proof points

#### Output contract
```yaml
messaging_framework:
  core_message: ""
  support_messages: []
  tone_of_voice: []
  tagline_options: []
  proof_points: []
```

---

### 5.8.3 Visual Direction Subagent

#### Purpose
Define visual translation direction for creative teams.

#### Responsibilities
- describe visual territory
- recommend mood and style direction
- outline consistency rules
- provide creative guidance

#### Output contract
```yaml
visual_direction:
  aesthetic_keywords: []
  color_direction: []
  typography_direction: []
  imagery_direction: []
  design_constraints: []
```

#### Escalation triggers
- final rebrand approval
- public-facing identity shift
- direction conflicts with existing brand system

---

## 5.9 Social Media Agent

### Role
Owns content planning, copy assistance, community language support, and social reporting.

### Responsibilities
- build content calendars
- draft captions
- suggest community responses
- interpret social performance
- recommend next-cycle changes

### Subagents
- content-calendar
- caption-community
- analytics-growth

---

### 5.9.1 Content Calendar Subagent

#### Purpose
Convert campaign or brand priorities into a publishing schedule.

#### Responsibilities
- map posting cadence
- assign themes and content types
- align calendar to launches, offers, and campaigns
- balance content mix

#### Output contract
```yaml
content_calendar:
  period: ""
  themes: []
  posting_schedule: []
  campaign_alignment: []
```

---

### 5.9.2 Caption / Community Subagent

#### Purpose
Support copywriting and community interaction consistency.

#### Responsibilities
- draft captions
- draft replies
- apply tone of voice
- adapt by platform format

#### Output contract
```yaml
caption_pack:
  platform: ""
  caption_drafts: []
  community_reply_examples: []
  tone_notes: []
```

---

### 5.9.3 Analytics / Growth Subagent

#### Purpose
Interpret social performance and suggest next steps.

#### Responsibilities
- summarize reach and engagement trends
- identify winning themes
- identify weak formats
- propose next-cycle tests

#### Output contract
```yaml
social_growth_review:
  top_content_patterns: []
  underperforming_patterns: []
  audience_signal: []
  next_tests: []
```

---

# 6. Routing Logic

## 6.1 Commercial Ops routing matrix

| Request Type | Primary Route | Secondary Route | Human Approval |
|---|---|---|---|
| New pricing inquiry | Sales Agent | Booking Agent if date-sensitive | Sometimes |
| Availability question | Booking Agent | Sales Agent if package discussion needed | Rare |
| Booking confirmation | Booking Agent | None | Rare |
| Customer complaint | Customer Service Agent | Booking Agent or Sales Agent if relevant | Often |
| Refund request | Customer Service Agent | Booking Agent / Human Manager | Yes |
| Custom proposal | Sales Agent | Booking Agent if resource-dependent | Yes |
| Policy dispute | Customer Service Agent | Human Manager | Yes |

### Example routing flow
```text
Inbound message
→ Commercial Ops Orchestrator
→ classify
   → sales
   → support
   → booking
→ assign
→ gather subagent outputs
→ return draft / escalate
```

---

## 6.2 Digital Agency routing matrix

| Request Type | Primary Route | Secondary Route | Human Approval |
|---|---|---|---|
| New client brief | Account Strategy | Relevant execution agents | Usually |
| Ads strategy request | Ads Agent | Account Strategy | Often |
| SEO improvement request | SEO Agent | Account Strategy | Sometimes |
| Rebrand request | Branding Agent | Account Strategy / Social Media | Yes |
| Monthly reporting | Account Strategy | Ads / SEO / Social inputs | Usually |
| Social content plan | Social Media Agent | Branding / Account Strategy | Sometimes |
| Performance drop analysis | Ads or Social | SEO / Account Strategy | Often |

### Example routing flow
```text
Client request
→ Digital Agency Orchestrator
→ break into workstreams
→ assign to one or more agents
→ collect output
→ consolidate
→ request approval if needed
→ deliver draft
```

---

# 7. Escalation Framework

## 7.1 Escalation levels

### Level 0 — autonomous draft
AI may draft or recommend with no human touch yet.

### Level 1 — agent review
Top-level agent reviews subagent work before output.

### Level 2 — orchestrator review
Orchestrator consolidates cross-functional response.

### Level 3 — human approval required
Human must review before sending or acting.

---

## 7.2 Mandatory human approval cases

### Commercial Ops
- final custom pricing
- refund or compensation
- policy exception
- legal threat
- payment dispute
- goodwill commercial decision

### Digital Agency Ops
- final strategic recommendation
- client scope change
- major brand repositioning
- budget increase or reallocation
- final external-facing branding direction
- deliverables with contractual implications

---

# 8. Memory Architecture

## 8.1 Memory layers

```text
organization-shared-memory
agent-memory
subagent-working-memory
session/case-memory
```

## 8.2 Commercial Ops shared memory
- package catalog
- booking policies
- operating hours
- FAQ
- escalation matrix
- service restrictions
- commercial SOPs

## 8.3 Digital Agency shared memory
- brand frameworks
- campaign frameworks
- client templates
- reporting templates
- performance benchmark rules
- content and tone guidelines

## 8.4 Agent memory examples

### Sales Agent
- qualification rubric
- pricing heuristics
- package mapping
- objection patterns

### Booking Agent
- reservation rules
- slot logic
- scheduling constraints
- cancellation policy logic

### Ads Agent
- channel strategy frameworks
- budget logic
- KPI threshold guidance

### Branding Agent
- message architecture rules
- positioning framework
- visual direction principles

## 8.5 Subagent memory rules
Subagents should receive:
- only what is needed for the task
- current session summary
- relevant policy/doc references
- not full unrestricted org history

---

# 9. UI Design

## 9.1 Sidebar navigation

```text
Organizations
├── Commercial Ops
│   ├── Orchestrator
│   ├── Sales
│   │   ├── Lead Qualifier
│   │   ├── Proposal
│   │   └── Follow-up
│   ├── Customer Service
│   │   ├── Inquiry Response
│   │   ├── Complaint Resolution
│   │   └── Knowledgebase
│   └── Booking
│       ├── Availability
│       ├── Reservation
│       └── Reschedule/Cancellation
└── Digital Agency Ops
    ├── Orchestrator
    ├── Account Strategy
    │   ├── Client Intake
    │   ├── Scope Planning
    │   └── Reporting
    ├── Ads
    │   ├── Media Planning
    │   ├── Ad Copy / Creative Brief
    │   └── Performance Optimization
    ├── SEO
    │   ├── Keyword Research
    │   ├── On-Page SEO
    │   └── SEO Audit
    ├── Branding
    │   ├── Brand Strategy
    │   ├── Messaging
    │   └── Visual Direction
    └── Social Media
        ├── Content Calendar
        ├── Caption / Community
        └── Analytics / Growth
```

## 9.2 Main UI panels

### Left panel
- organizations
- agents
- subagents
- status badges

### Center panel
- chat thread
- active task
- current instructions
- generated artifacts

### Right panel
- logs
- memory references
- approvals required
- agent metadata
- linked sessions

### Bottom composer
- message input
- attach context
- choose “delegate”
- choose “request approval”

---

## 9.3 Agent card fields

Each agent/subagent card should show:
- display name
- organization
- level
- status
- model in use
- last active timestamp
- current task label
- escalation state

---

# 10. UI Manifest Example

```json
{
  "organizations": [
    {
      "id": "commercial-ops",
      "label": "Commercial Ops",
      "defaultEntry": "orchestrator",
      "agents": [
        {
          "id": "orchestrator",
          "label": "Orchestrator",
          "type": "orchestrator"
        },
        {
          "id": "sales-agent",
          "label": "Sales",
          "type": "agent",
          "subagents": [
            {"id": "lead-qualifier", "label": "Lead Qualifier"},
            {"id": "proposal", "label": "Proposal"},
            {"id": "followup", "label": "Follow-up"}
          ]
        },
        {
          "id": "customer-service-agent",
          "label": "Customer Service",
          "type": "agent",
          "subagents": [
            {"id": "inquiry-response", "label": "Inquiry Response"},
            {"id": "complaint-resolution", "label": "Complaint Resolution"},
            {"id": "knowledgebase", "label": "Knowledgebase"}
          ]
        },
        {
          "id": "booking-agent",
          "label": "Booking",
          "type": "agent",
          "subagents": [
            {"id": "availability", "label": "Availability"},
            {"id": "reservation", "label": "Reservation"},
            {"id": "reschedule-cancellation", "label": "Reschedule/Cancellation"}
          ]
        }
      ]
    },
    {
      "id": "digital-agency-ops",
      "label": "Digital Agency Ops",
      "defaultEntry": "orchestrator",
      "agents": [
        {
          "id": "orchestrator",
          "label": "Orchestrator",
          "type": "orchestrator"
        },
        {
          "id": "account-strategy-agent",
          "label": "Account Strategy",
          "type": "agent",
          "subagents": [
            {"id": "client-intake", "label": "Client Intake"},
            {"id": "scope-planning", "label": "Scope Planning"},
            {"id": "reporting", "label": "Reporting"}
          ]
        },
        {
          "id": "ads-agent",
          "label": "Ads",
          "type": "agent",
          "subagents": [
            {"id": "media-planning", "label": "Media Planning"},
            {"id": "ad-copy-creative-brief", "label": "Ad Copy / Creative Brief"},
            {"id": "performance-optimization", "label": "Performance Optimization"}
          ]
        },
        {
          "id": "seo-agent",
          "label": "SEO",
          "type": "agent",
          "subagents": [
            {"id": "keyword-research", "label": "Keyword Research"},
            {"id": "onpage-seo", "label": "On-Page SEO"},
            {"id": "seo-audit", "label": "SEO Audit"}
          ]
        },
        {
          "id": "branding-agent",
          "label": "Branding",
          "type": "agent",
          "subagents": [
            {"id": "brand-strategy", "label": "Brand Strategy"},
            {"id": "messaging", "label": "Messaging"},
            {"id": "visual-direction", "label": "Visual Direction"}
          ]
        },
        {
          "id": "social-media-agent",
          "label": "Social Media",
          "type": "agent",
          "subagents": [
            {"id": "content-calendar", "label": "Content Calendar"},
            {"id": "caption-community", "label": "Caption / Community"},
            {"id": "analytics-growth", "label": "Analytics / Growth"}
          ]
        }
      ]
    }
  ]
}
```

---

# 11. File and Folder Structure

```text
/opt/gda-ai02/
├── control-ui/
│   ├── frontend/
│   ├── backend/
│   ├── shared/
│   └── docker/
├── organizations/
│   ├── commercial-ops/
│   │   ├── orchestrator/
│   │   │   ├── agent.yaml
│   │   │   ├── prompt.md
│   │   │   ├── routing.yaml
│   │   │   └── policy.yaml
│   │   ├── sales-agent/
│   │   │   ├── agent.yaml
│   │   │   ├── prompt.md
│   │   │   ├── memory/
│   │   │   ├── templates/
│   │   │   └── subagents/
│   │   │       ├── lead-qualifier/
│   │   │       │   ├── agent.yaml
│   │   │       │   ├── prompt.md
│   │   │       │   └── tools.yaml
│   │   │       ├── proposal/
│   │   │       └── followup/
│   │   ├── customer-service-agent/
│   │   │   └── subagents/
│   │   ├── booking-agent/
│   │   │   └── subagents/
│   │   ├── shared/
│   │   │   ├── faq/
│   │   │   ├── sop/
│   │   │   ├── policies/
│   │   │   ├── templates/
│   │   │   └── memory/
│   │   └── ui-manifest.json
│   └── digital-agency-ops/
│       ├── orchestrator/
│       ├── account-strategy-agent/
│       ├── ads-agent/
│       ├── seo-agent/
│       ├── branding-agent/
│       ├── social-media-agent/
│       ├── shared/
│       │   ├── frameworks/
│       │   ├── templates/
│       │   ├── client-briefs/
│       │   ├── reporting/
│       │   └── memory/
│       └── ui-manifest.json
├── sessions/
├── logs/
├── runtime/
└── deployments/
```

---

# 12. Sample YAML Definitions

## 12.1 Base orchestrator YAML

```yaml
id: commercial-ops-orchestrator
display_name: Commercial Ops Orchestrator
type: orchestrator
organization: commercial-ops
model:
  primary: gemini-2.5
  fallback: sonnet
capabilities:
  - triage
  - routing
  - escalation
  - summary
allowed_tools:
  - session_router
  - memory_read
  - policy_lookup
  - task_assign
  - audit_log
memory_scope:
  - organizations/commercial-ops/shared/memory
approval_policy:
  auto_send_allowed: false
  requires_human_for:
    - refunds
    - pricing_commitments
    - policy_exceptions
routing_targets:
  - sales-agent
  - customer-service-agent
  - booking-agent
```

## 12.2 Sales agent YAML

```yaml
id: sales-agent
display_name: Sales Agent
type: agent
organization: commercial-ops
parent: commercial-ops-orchestrator
model:
  primary: gemini-2.5
  fallback: sonnet
subagents:
  - lead-qualifier
  - proposal
  - followup
allowed_tools:
  - memory_read
  - template_loader
  - pricing_rules_lookup
  - task_assign
memory_scope:
  - organizations/commercial-ops/shared/memory
  - organizations/commercial-ops/sales-agent/memory
approval_policy:
  auto_send_allowed: false
  requires_human_for:
    - custom_pricing
    - discounts
    - contractual_terms
```

## 12.3 Subagent YAML example

```yaml
id: lead-qualifier
display_name: Lead Qualifier
type: subagent
organization: commercial-ops
parent: sales-agent
model:
  primary: gemini-2.5
  fallback: sonnet
purpose: Structure and score inbound leads.
allowed_tools:
  - memory_read
  - form_parser
  - summarizer
memory_scope:
  - organizations/commercial-ops/shared/memory
  - organizations/commercial-ops/sales-agent/memory
output_schema: lead_summary
approval_policy:
  auto_send_allowed: false
```

## 12.4 Digital agency ads YAML example

```yaml
id: ads-agent
display_name: Ads Agent
type: agent
organization: digital-agency-ops
parent: digital-agency-orchestrator
model:
  primary: gemini-2.5
  fallback: sonnet
subagents:
  - media-planning
  - ad-copy-creative-brief
  - performance-optimization
allowed_tools:
  - memory_read
  - reporting_lookup
  - task_assign
  - brief_generator
memory_scope:
  - organizations/digital-agency-ops/shared/memory
  - organizations/digital-agency-ops/ads-agent/memory
approval_policy:
  auto_send_allowed: false
  requires_human_for:
    - budget_reallocation
    - strategic_channel_shift
```

---

# 13. Prompt Template Pattern

Each agent should have a prompt file using a consistent pattern.

## 13.1 Template structure

```markdown
# Identity
You are the [AGENT NAME] for [ORGANIZATION].

# Mission
[What this agent is responsible for.]

# You must do
- [Task 1]
- [Task 2]

# You must not do
- [Boundary 1]
- [Boundary 2]

# Inputs you receive
- [Input types]

# Output format
[Schema or structured format]

# Escalate when
- [Escalation conditions]

# Memory available
- [Memory scope]

# Approval requirements
- [Rules]
```

---

# 14. Governance Rules

## 14.1 Auto-approve allowed
These can usually remain draft-only or be internally circulated without approval:
- FAQ draft answers
- internal research summaries
- preliminary content plans
- audit summaries
- issue diagnosis
- lead qualification summaries

## 14.2 Human approval required
- custom quotations
- refunds and compensation
- payment decisions
- policy exceptions
- budget changes
- final strategy recommendations
- final branding direction
- external-facing sensitive outputs

---

# 15. Model Strategy

## 15.1 Primary model
- Gemini 2.5

## 15.2 Fallback model
- Sonnet

## 15.3 Practical implementation rule
Model routing should happen at the platform layer, not inside every prompt.

Recommended behavior:
- default all agents to Gemini 2.5
- fail over to Sonnet when timeout, unavailability, or configured task-class fallback is triggered
- log model used per task in session metadata

## 15.4 Suggested task-class preference
Use Gemini 2.5 by default for:
- routing
- summarization
- structured extraction
- strategy synthesis
- reporting

Use Sonnet fallback for:
- continuity during provider outage
- secondary attempt on failed generation
- optional A/B comparison in high-value outputs

---

# 16. Recommended Build Sequence

## Phase 1 — structure only
Build:
- organizations
- agents
- subagents
- UI sidebar
- chat to each node

## Phase 2 — orchestration
Build:
- routing engine
- session linkage
- escalation states
- output schema validation

## Phase 3 — memory and policies
Build:
- shared memory loaders
- scoped retrieval
- policy enforcement
- approval gates

## Phase 4 — production workflows
Build:
- logs
- audit trail
- operator dashboard
- artifact export
- reporting layer

---

# 17. MVP Recommendation

If you want the first build to succeed faster, start with this MVP.

## Commercial Ops MVP
- orchestrator
- sales-agent
  - lead-qualifier
  - proposal
- customer-service-agent
  - inquiry-response
  - complaint-resolution
- booking-agent
  - availability
  - reservation

## Digital Agency Ops MVP
- orchestrator
- account-strategy-agent
  - client-intake
  - reporting
- ads-agent
  - media-planning
  - performance-optimization
- seo-agent
  - keyword-research
  - seo-audit
- branding-agent
  - messaging
  - visual-direction
- social-media-agent
  - content-calendar
  - analytics-growth

This gives you the correct architecture without overcomplicating the first release.

---

# 18. Final Recommendation

Implement this stack as:

- 2 organizations
- 2 orchestrators
- 8 top-level functional agents
- 24 subagents
- one shared operator UI
- scoped memory per organization and agent
- human approval gates for sensitive decisions
- Gemini 2.5 primary with Sonnet fallback
- direct UI access to every orchestrator, agent, and subagent

This is large enough to be useful, but still governed enough to remain operable.

---

# 19. Next Artifacts To Generate

The next practical files to create after this design document are:

1. `ui-manifest.json` for both organizations  
2. `agent.yaml` for every orchestrator, agent, and subagent  
3. `prompt.md` for each role  
4. `routing.yaml` per orchestrator  
5. `policy.yaml` per organization  
6. `memory index` files per organization  
7. backend API mapping for session routing  
8. operator approval rules configuration  

