# **Xnumia \+ Agentic Operations Layer**

## **Project & Initiative Brief**

---

## **1\. Executive summary**

We are building **Xnumia**: a stablecoin orchestration platform with an agentic operations backend, deployed in two environments off one codebase, sold through two channels (direct production engagement and consulting-led FI distribution), and operating across two regulatory phases (PSP-bridged today, MSB-licensed tomorrow).

The platform's job is to run **accounts receivable and accounts payable across fiat and stablecoin rails** for the back-office client of the lead investor (Matt) and its downstream clients, with the operational work — settlement, reconciliation, fraud, AML, payments ops — handled by autonomous agents rather than humans. The same platform is then deployed as a sandbox/QA environment for Canadian credit unions, banks, and fintechs exploring stablecoin use cases, with distribution funneled through Marko's consulting practice and a recurring FI presentation channel.

Taylor's scope inside this is **AI architecture lead for the agentic operations layer**: defining, building, and operating the agent stack that owns the five operational workloads. Marko is founder, sales lead, and regulatory owner. Matt is lead investor and first production client via his back office. Bo is the MSB licensing path.

**The thing being built is not a stablecoin platform with AI features bolted on. It is an agent-run payments operations company that happens to settle in stablecoin.** That distinction drives every architecture and sequencing decision below.

---

## **2\. Strategic context**

Two market truths shape the opportunity:

**Truth one: stablecoin orchestration is early, fragmented, and underserved at the SMB and FI exploration tier.** Banks and credit unions in Canada are at radically different points on the curve — one FI on the call ("the central organization for clearing and payments across Canadian credit unions") is asking for a basic stablecoin playbook, while a US bank is asking whether they're already too late on x402. That spread is the wedge: there is no productized way for a Tier-1-curious FI to move from "explain stablecoins to me" to "let me test a use case in a sandbox" to "deploy this in production." Marko's consulting practice is currently absorbing that demand one engagement at a time. Exnumia productizes it.

**Truth two: the operational work of running a payments business — settlement, reconciliation, fraud, AML, exception handling — is the largest cost line in this kind of company, and it is the workload that agentic AI is now demonstrably capable of owning.** Building an orchestration platform without an agent-run operations layer is building a 2018 fintech with a stablecoin label. Building it with an agent-run layer from day one is a structurally different cost curve, and is what makes a two-person founding team viable at this surface area.

The strategic bet: own both layers. The orchestration platform is the substrate; the agentic operations layer is the moat.

---

## **3\. Scope: what we are building**

### **3.1 The core platform**

Exnumia is middleware sitting between four external systems:

* **Bank** — fiat custody, fiat rails (ACH, EFT, wire)  
* **Crypto exchange** — stablecoin custody, on/off-ramp between fiat and stablecoin  
* **Payment Service Provider (PSP)** — regulatory bridge during Phase 1 only; Exnumia cannot legally custody or move funds until the MSB license is issued, so the PSP acts on Exnumia's behalf between the bank and the platform  
* **Accounting software** — Xero, QuickBooks, and similar; the reconciliation surface for every transaction the platform executes

The platform's function is **AR/AP as a service**: receive funds in either rail, convert between fiat and stablecoin as required by the use case, pay out in either rail, and keep the client's books reconciled in real time against their accounting software.

### **3.2 Two environments off one codebase**

The same platform is deployed twice:

* **Production environment.** Real money, live rails, live bank and exchange integrations. Serves Matt's back-office client (Tier 3 — see below) and its downstream commercial clients. This is the revenue engine.  
* **QA / sandbox environment.** Real integrations, no real funds. Serves Tier 1 and Tier 2 FI buyers (credit unions, banks, fintechs) who want to test stablecoin use cases without taking regulatory or financial risk. This is the distribution engine.

Marko explicitly collapsed his original two-product diagram (Exnumia \+ "service as a consultant") into one platform with two environments. That collapse is correct and is locked. There is **one product**, not two.

### **3.3 Three client tiers**

The platform must serve three buyer postures concurrently because each one consumes a different slice of the same platform:

| Tier | Posture | Reference example | What they get |
| ----- | ----- | ----- | ----- |
| **Tier 1** | Early / curious | Canadian credit union via "she"-caller | Playbook \+ sandbox access in QA environment |
| **Tier 2** | Exploring but stuck | US bank evaluating orchestration middleware | QA environment with configurable modules (e.g., swap prepaid card module for credit card module via API) |
| **Tier 3** | Production-ready | Matt's back-office client | Full production stack, live rails, live money |

Tier 1 is acquired through Marko's consulting practice and the FI-presentation distribution channel ("she"-caller's monthly fintech spotlight, first slot June 8). Tier 2 graduates from Tier 1\. Tier 3 is acquired directly through investor and operator network.

### **3.4 Two regulatory phases**

The platform must operate legally and continuously across two states without a rewrite:

* **Phase 1 — PSP-bridged.** All fund movement is brokered through the PSP. Exnumia does not custody or move funds itself. This is the only legal mode pre-license.  
* **Phase 2 — MSB-licensed.** Bo's track delivers the MSB license. PSP is removed from the architecture. Exnumia connects directly to the bank and crypto exchange, owns its own custody and movement, and captures the margin previously routed to the PSP.

Phase transition must be a configuration change, not a re-platform. The architecture has to be built Phase-2-ready with the PSP as a swappable module sitting in the rails layer.

### **3.5 The agentic operations layer (Taylor's primary scope)**

Five operational workloads must be owned end-to-end by autonomous agents, with humans reviewing exceptions only:

1. **Settlement.** Confirm finality across rails, close the loop between bank and exchange ledgers, mark transactions complete in the accounting system.  
2. **Reconciliation.** Match ledger entries across bank, crypto exchange, PSP (Phase 1), and accounting software. Flag mismatches, propose resolutions, execute resolutions on approved patterns.  
3. **Fraud detection.** Flag anomalous transactions in-flight, hold suspect movements, escalate.  
4. **AML compliance.** Sanctions screening, transaction monitoring, suspicious activity pattern detection, regulatory reporting prep.  
5. **Regular payments operations support.** Exceptions, retries, customer-service-tier resolution for downstream clients of the back office.

These agents must run in **both environments** (production and QA) and across **both regulatory phases** (with and without the PSP in the rails layer).

The infrastructure substrate is currently scoped to **Cloudflare's Agentix stack** — hosted, multi-tenant, with native support for dynamic agents (agents that spawn other agents on the fly). Taylor is already working in this stack. This is the lowest-friction path to a working v1 and is locked unless a specific blocker emerges during build.

The architectural pattern is **validation/orchestration agents**: each agent has scoped read/write access to specific systems (bank API, exchange API, accounting API, PSP API), executes a defined workflow, reports back to an orchestrator, and surfaces exceptions to humans only when its scoped resolution patterns don't apply. This is not a single mega-agent. This is an orchestrator coordinating a fleet of specialist agents, each with tools.

---

## **4\. Architecture**

The working architecture diagram (Google Slides, slide 13 in the Exnumia working deck) currently captures:

* Xnumia (the platform), PSP, and Bank in the top rails layer  
* One "Client" box (Matt's back office) as the Tier 3 production buyer  
* Accounting Software as the horizontal integration substrate  
* Four downstream "Client" boxes (the back office's commercial clients, gray)  
* Three FI buyer boxes (CU, Banks, FI — green) representing Tier 1/2 QA buyers

**Four gaps to close before this diagram goes to Matt or anyone else:**

1. **Add the crypto exchange box** to the top rails layer alongside PSP and Bank. The stablecoin half of the orchestration is currently invisible.  
2. **Add a horizontal "Agentic Operations" band** between Xnumia and the rails, labeled with the five workloads. This is the layer being built and it currently has no representation.  
3. **Visually separate production from QA.** Either split Xnumia into two instances or color-code the bottom tiers so the two environments are obvious.  
4. **Mark the PSP as Phase-1-only** with a dotted outline or annotation, so the architecture shows that it disappears in Phase 2\.

The diagram should be closed out and re-versioned before the next Marko/Matt conversation.

---

## **5\. Roles and responsibilities**

| Person | Role | Owns |
| ----- | ----- | ----- |
| **Marko** | Founder, CEO, sales lead | Product vision, fundraising, consulting practice and distribution, regulatory track (with Bo), FI relationships, "she"-channel for FI distribution |
| **Taylor Erwin** | AI architecture lead / agentic operations | Agent stack design and build, Cloudflare Agentix infrastructure, the five workload agents, orchestration layer, environment parity (prod ↔ QA), Phase 1 → Phase 2 transition design |
| **Matt** (lead investor, Ottawa) | Investor, first production client | $250k investment for 40% equity, back office and downstream clients as Tier 3 reference deployment |
| **Bo** | Regulatory | MSB license track that enables Phase 2 |
| **"She"-caller** | Distribution partner | Monthly FI fintech spotlight (first slot June 8), pipeline into Tier 1 FI buyers including the credit union playbook engagement |

Taylor's capacity is **\~10 hours/week**, scoped as architecture and orchestration lead rather than full-time individual contributor. Marko's framing on the call — and the operating assumption going forward — is that this is enough at the lead level because the agents do the work, not the humans.

---

## **6\. Phasing and sequence**

### **Phase 0 — Foundation (now → 2 weeks)**

* Marko closes deal with Matt (\~$250k for 40%, 60% retained)  
* Marko sends Taylor the Exnumia description doc  
* Architecture diagram is updated to close the four gaps in §4  
* Marko delivers the credit union stablecoin playbook (free; positioned as business development toward the "she"-channel partnership)  
* Taylor scopes the agent stack against the Cloudflare Agentix substrate and produces a v1 build plan  
* First "she"-channel FI spotlight slot locked for June 8

### **Phase 1 — PSP-bridged build and first production deployment (months 1–4)**

* Build core platform: Xnumia ↔ PSP ↔ Bank ↔ Crypto Exchange ↔ Accounting Software  
* Build agentic operations layer for the five workloads, scoped to production environment first  
* Deploy production environment for Matt's back office and its downstream clients; route real AR/AP  
* Stand up QA environment in parallel using the same codebase  
* Onboard first Tier 1 FI buyer (credit union via "she"-channel) into QA sandbox  
* Continue FI spotlight distribution monthly

### **Phase 2 — MSB-licensed and PSP-free (months 4–8, gated by Bo)**

* License issuance triggers PSP removal from rails layer  
* Direct bank and exchange connections go live  
* Settlement and reconciliation agents reconfigured for direct-rail topology  
* Margin previously routed through PSP is captured  
* Tier 2 buyers can graduate from QA into production without an architecture change

### **Phase 3 — Scale via consulting wedge (months 6+)**

* Marko's consulting practice becomes the primary acquisition engine for Tier 1 → Tier 2 → Tier 3 progression  
* Additional FI distribution channels added beyond "she"-channel  
* Agentic ops layer becomes the productizable asset that differentiates Exnumia from generic orchestration middleware

---

## **7\. Success criteria — what v1 "finished" means**

A finished v1 of this initiative is:

1. **One platform, two environments**, running off a single codebase with Phase-1 PSP topology and Phase-2-ready architecture  
2. **Tier 3 in production**: Matt's back office and at least one downstream client moving real AR/AP through fiat ↔ stablecoin rails, with books reconciled in real time against accounting software  
3. **Tier 1 in QA**: at least one FI (credit union via "she"-channel is the warm lead) actively testing a stablecoin use case in sandbox  
4. **All five agent workloads** (settlement, reconciliation, fraud, AML, payments ops) running autonomously across both environments, with humans reviewing exceptions only  
5. **A documented Phase-2 transition path** that turns PSP removal and direct-rail connection into a configuration change, not a re-platform  
6. **A distribution motion that funnels FI buyers** from Marko's consulting and "she"-channel into the QA environment as a repeatable pattern

When all six are true, this is a fundable Series A company. Before all six are true, it is a credible seed-stage operation with one production client and a clear path.

---

## **8\. Risks and open questions**

**On the build side:**

* Cloudflare Agentix is new; if a blocker emerges, the fallback substrate is undecided  
* Agents touching live financial rails carry regulatory and reputational risk — exception-handling and human-review surfaces have to be designed in from day one, not bolted on  
* The accounting-software integration surface is wider than it looks (Xero, QuickBooks, others); pick one for v1 and don't fan out early

**On the regulatory side:**

* MSB license timing through Bo is the gate on Phase 2; if it slips, PSP economics persist and margin is compressed  
* AML/sanctions agent workload must satisfy real regulatory standards in production, not just look like it does — design against actual FINTRAC / FinCEN guidance from day one

**On the commercial side:**

* "She"-channel distribution is a single-point dependency in the early months; need at least one more FI distribution channel by month 4  
* Matt's 40% equity stake for $250k is rich; defensible only if his back office becomes a strong production reference and his network delivers Tier 3 graduations

**On the capacity side:**

* Taylor at 10 hours/week is a real constraint at the orchestrator-lead level and an immediate blocker at the individual-contributor level; either Marko hires a Cloudflare-fluent builder under Taylor's architecture lead, or Taylor's hours have to flex up during Phase 1 build

**On the diagram side (immediate):**

* The architecture diagram as it stands is not ready for an external audience; four gaps must be closed before next Marko/Matt conversation

---

## **9\. Immediate next steps**

In order, this week:

1. **Marko** sends Taylor the Exnumia description doc (blocker on Taylor's scoping work)  
2. **Taylor** updates the architecture diagram to close the four gaps in §4  
3. **Marko** finalizes terms with Matt and signs  
4. **Marko** delivers credit union stablecoin playbook by Monday and confirms June 8 FI spotlight slot  
5. **Taylor** produces a v1 agent stack build plan against Cloudflare Agentix, scoped to the five workloads and the Phase-1 topology  
6. **Marko \+ Taylor** reconvene to align on capacity model and decide whether a Cloudflare-fluent builder is hired under Taylor's architecture lead for Phase 1

---

*End of brief.*

