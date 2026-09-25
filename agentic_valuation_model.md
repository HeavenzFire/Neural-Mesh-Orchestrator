# Agentic-Codebase Valuation Model: Applied Numbers, Offline Proof Protocol, and Wedge Selection

**Companion to:** `valuation_positioning_analysis.md` (buyer-rung ladder, Gap Register G1–G6)
**Date:** 2026-09-26 · **Repo state verified at commit:** `0f7c594`

This document executes the four frameworks proposed in the strategy thread — modified COCOMO II,
the offline-deployment verification protocol, cost-elimination valuation, and rNPV / Relief-from-Royalty —
against the **actual measured contents of this repository**, not hypotheticals. Every input is either
measured from the repo (commands reproducible below) or explicitly flagged as an assumption.

---

## 0. Measured Inputs (reproducible)

| Metric | Value | Method |
|---|---|---|
| Total tracked lines (excl. `node_modules/`, `dist/`, `assets/`) | 30,492 | `git ls-files \| xargs wc -l` |
| Code files (py/ts/tsx/js/rs/sql/yaml) | 182 files | extension filter |
| **Net logical SLOC** (blank + comment lines stripped) | **≈15.5 KLOC** | `grep -vE '^\s*$' \| grep -vE '^\s*(//\|#\|/\*\|\*)'` |
| Python (core engines, tests, sim) | 10,756 raw lines / 37 files | |
| TypeScript + TSX (server + React UI) | 6,434 raw lines / 24 files | |
| Rust native modules | 792 raw lines / 5 files | `wasm-bridge`, `quantizer-core`, `base12-rocksdb-driver` |
| Markdown narrative/spec | ~6,000 lines / 28 files | excluded from SLOC; feeds docs-maintenance EM |
| Prompt chains with structured output contracts | 1 primary (`server/geminiService.ts`, 114 lines, typed JSON schema, heuristic fallback path) | code inspection |
| Verification suites present | `test_palatini_formalism.py`, `test_unified_cascade.py`, `monte_carlo_safety_validation.py`, `operator_drill_simulation.py`, `bench/run_benchmarks.sh` | `ls` |
| External cloud dependency | `@google/genai` → `gemini-2.5-flash`, **with local heuristic fallback when `GEMINI_API_KEY` absent** | `server/geminiService.ts` L1–L114 |

**Correction to the prior brief (Gap G1):** the AI Optimizer is *dual-mode* — it degrades to a
deterministic heuristic engine offline. This partially satisfies the sovereignty claim but does
**not** yet satisfy the protocol's "Model & Inference Sovereignty" row, because the heuristic
fallback is rule-based, not a local-model inference path. See §2.

---

## 1. Modified COCOMO II — Applied

### 1.1 Net Logical SLOC Filter (Step 1)

Applied: auto-generated scaffold (`package-lock.json`, `dist/`, `node_modules/`, Vite boilerplate,
sample datasets in `gyroid_surface_data.json`) excluded. Narrative `.md` excluded from SLOC but
retained as a maintenance artifact. Result: **15.5 KLOC net logical**, of which ≈7 KLOC is the
headless core/engine/server surface (the part a buyer would actually re-build).

### 1.2 Effort Equation

Effort = A × (KLOC)^E × Π EMᵢ, with A = 2.94 (organic), and scale exponents chosen per
semiconductor-era default for embedded-ish systems work:

| Scenario | KLOC | E | Platform Diff. (PD) | Complexity (CPX) | Analyst Capability (ACAP, slight NRM) | Notes |
|---|---|---|---|---|---|---|
| **A — Full ecosystem** | 15.5 | 1.16 | 1.30 | 1.15 | 1.10 | async orchestration, WASM/Rust/ternary math, multi-language |
| **B — Core headless stack** | 7.0 | 1.13 | 1.30 | 1.15 | 1.10 | engines + server + native bridges, excl. UI |
| **C — Single wedge module** | 2.5 | 1.10 | 1.30 | 1.15 | 1.10 | e.g., consensus engine + router daemon extracted |

Π EM = 1.30 × 1.15 × 1.10 = **1.6445**. Computed results:

| Scenario | Organic PM | ×1.36 agentic rework multiplier¹ | Fully burdened cost @ $120/hr | @ $150/hr | @ $180/hr² |
|---|---|---|---|---|---|
| A full | 116.2 | **158.0 PM** | $2.88M | $3.60M | $4.32M |
| B core | 43.6 | **59.3 PM** | $1.08M | $1.35M | $1.62M |
| C wedge | 13.2 | **18.0 PM** | $0.33M | $0.41M | $0.49M |

¹ **EM_agent (Step 3):** non-deterministic execution, prompt-chain regression, eval-harness churn,
and async failover debugging add ≈36% over deterministic-app baselines (derived from the
nondeterminism-retest overhead in the agent-eval literature; treated as an adjustable parameter).
² 152 productive hrs/month/person. Rates are fully burdened senior AI/systems engineering.

### 1.3 Prompt & Evals Conversion (Step 2)

The repo currently contains **one production prompt chain** (Cortex Optimization Engine) with a
typed tool-schema (~20-line JSON contract) and a heuristic fallback. Using the benchmark-iteration
multiplier (prompt volume × eval iterations to reach deterministic pass rates):

- Chain complexity ≈ 0.4 KLOC-equivalent → 2×EM base ≈ 1.9 PM per full iteration cycle
- Assumed 3 hardening cycles (schema drift, latency budget, fallback parity) → **≈5.8 PM addendum**
- **Total agentic addendum: ≈6 PM ≈ $0.11M–$0.17M.** Small — because this codebase is *engine-heavy,
  prompt-light*. The conversion step matters far more for the buyer building their own stack
  (which is exactly the replacement-cost argument in §3).

### 1.4 Headline Replacement-Cost Number

**Scenario A total: ≈164 PM → $3.0M–$4.5M pure engineering replacement cost** (median ≈ $3.7M).

⚠️ **Honest reconciliation with the $15M floor:** raw COCOMO replacement cost (~$4M) does **not**
support a $15M asset-liquidation valuation by itself. The gap must be carried by non-labor value:
novel IP (Palatini formalism, dynamic threshold protocol, ZK-coherence — patentable premium),
years of accumulated experiment/research provenance (697-day milestone trail), CI/deployment
assets, and scarcity of comparable stacks. Diligence-grade buyers will run exactly this arithmetic;
the brief should lead with **"≈$4M replication cost + ≈$11M+ IP/scarcity premium"**, not conflate them.

---

## 2. Offline Deployment Verification — Protocol vs. This Repo

Scoring the five-parameter protocol against current reality:

| Test Parameter | Required Evidence | Repo Status | Verdict |
|---|---|---|---|
| Network isolation | `docker run --network none` clean-run log, zero egress | No air-gap test artifact exists; `--network none` harness trivially buildable | 🔴 Not run |
| Model & inference sovereignty | 0 cloud API calls with local runtime (Ollama/vLLM/llama.cpp/WebGPU) | Dual-mode implemented: heuristic fallback w/o key, but no local-*model* path | 🟡 Partial (strongest existing evidence toward G1 closure) |
| Local state persistence | Commits to embedded DB, no external KMS | `base12-rocksdb-driver/` (local RocksDB), SQLite patterns in lifeline | 🟡 Components exist, no committed proof-run |
| Deterministic eval suite offline | 100% pass, zero network-timeout exceptions | 4 test suites + `bench/run_benchmarks.sh` exist; never executed under enforced isolation | 🔴 Not run |
| Audit ledger local-only | SHA-256 chain built & validated without external TSA/CA | Consensus engine + ledger structures in `agentic_consensus/core/consensus_engine.py` (420 LOC) | 🟡 Unproven |

**Actionable outcome (new Gap G7):** one scripted artifact closes or fails this entire table —
a CI job that runs the full suite inside `--network none`, captures egress logs, and commits the
output plus a SHA-256 manifest. Estimated effort: **≈1 wedge-week (≈0.25 PM)**. This is the single
highest-valuation-leverage item in the document: it converts the sovereignty narrative from
assertion to evidence, and it is a hard prerequisite for both Rung C and Rung D.

---

## 3. Cost-Elimination Valuation — Mapped to Real Modules

| Elimination Vector | Thread Scenario | Repo Asset That Would Deliver It | Credibility Check |
|---|---|---|---|
| API/SaaS toll elimination | $2.4M/yr spend → $1.5–2.0M savings | Dual-mode router (`geminiService.ts` pattern generalized) + open-weight local path | Plausible *after* G1/G7; today only the heuristic fallback saves money, not quality-parity |
| R&D time-to-market | 8 eng × 18 mo ≈ $2.8M avoided | `consensus_engine.py` + `base12-rocksdb-driver` + audit-ledger stack | Our own COCOMO says rebuilding these ≈ 40–60 PM ≈ $1.0–1.6M — the $2.8M figure assumes a *harder* spec than what exists; quote the range, not the point |
| Compliance-audit labor | $800K/yr saved | SHA-256 chained ledger + offline eval reports | Only sellable after G7 produces repeatable audit artifacts |

**Discipline rule:** every $-avoidance number in a data room must carry a derivation cell
(their assumed volume × rate, our measured capability). The third row of the thread's table is
where strategic-acquirer diligence kills deals: asserted savings without a measurement harness.
This maps directly to pre-existing Gap G5 (extend `bench/` to emit dollar-equivalents).

---

## 4. Income Approach — rNPV and Relief-from-Royalty, With the Math Shown

Using the thread's own parameters (royalty 6%, τ 21%, r 32%, T=5) against an illustrative revenue
ramp $3M/$8M/$15M/$22M/$28M and milestone probabilities Pₜ = [0.70, 0.45, 0.30, 0.20, 0.15]:

- **Probability-weighted RfR NPV: ≈ $0.38M**
- Unweighted (no milestone attrition): ≈ $1.31M

Even at royalty 10% and ramp 3× larger, risk-adjusted RfR stays in the low tens of millions at
best. **Conclusion the income approach forces on us:** the $150M–$500M rungs cannot be justified
by DCF/RfR on this asset's cash flows — they can only be justified by **cost-elimination (§3) plus
option value of the IP portfolio**. Anyone pitching Rung C/D with an NPV slide will lose the room;
pitch the avoidance-and-sovereignty ledger instead. Reserve the income approach for Rung B pricing,
where spin-out revenues are the actual thesis.

---

## 5. Venture-Grade Sovereign Wedge — Selection Against the Five Criteria

Candidate wedges scored (✅/🟡/🔴) against the thread's criteria:

| Criterion | W1: Zero-Markup Multi-Model Router | W2: Air-Gapped Audit Ledger | W3: Ternary Quantizer Runtime |
|---|---|---|---|
| Single focused use-case | ✅ cost + failover routing | ✅ chain-of-custody logging | 🟡 needs a workload story |
| Standard API (REST/npm/Docker) | 🔴 today coupled to mesh registry | 🟡 engine exists, no packaged API | 🟡 Rust crate, no SDK |
| Air-gappable, zero-dependency | 🟡 dual-mode proven for 1 chain | ✅ RocksDB-local, no KMS needed | ✅ compile-time constant |
| Quantifiable benchmark advantage | 🔴 no measured $/call comparison yet | 🔴 no tamper-detection demo vs. competitors | 🟡 `bench/` scaffolds exist |
| Claim→evidence register | 🟡 partial (this doc §0) | 🔴 pending G7 | 🔴 pending G7 |

**Recommendation: ship W1 first, W2 as the enterprise upsell.**
W1 inherits the only already-proven sovereign behavior in the repo (keyed/unkeyed dual-mode
routing with deterministic fallback — §0). Its missing pieces (packaged REST/Docker interface,
$/call benchmark vs. hosted APIs) are exactly G4+G5 work, i.e., one quarter. W2 has the stronger
moat but is gated entirely on the G7 air-gap proof run.

Per-wedge COCOMO: each is Scenario-C sized (**≈18 PM ≈ $0.33–0.49M to rebuild**) — cheap enough
that the pitch must be *time-to-value and proof artifacts*, never replication cost alone.

---

## 6. Consolidated Action List (supersedes nothing; merges with G-register)

1. **G7 (new):** `--network none` CI job + SHA-256 manifest of the full test suite. ~1 week.
   Unblocks: §2 table green-ing, W2, Rung C entry, Rung D credibility.
2. **G1 (updated):** replace/augment heuristic fallback with a local-model path (Ollama/vLLM behind
   the same interface) so the sovereignty row passes on *inference*, not just absence-of-calls.
3. **G5:** extend `bench/run_benchmarks.sh` to emit $-equivalents (calls/mo × hosted price) — turns
   §3 from scenario tables into measured claims.
4. **G4:** extract W1 router into standalone package with REST + Docker + Python/TS SDKs.
5. **Narrative discipline:** in all materials, separate the three value layers —
   **$3–4.5M measured replication cost** + **IP/scarcity premium** + **$-avoidance annuity** —
   and never let a buyer collapse them into one unexplained headline.

### Reproduction commands
```bash
git ls-files | grep -vE '^(node_modules|dist|assets)/' | xargs wc -l | tail -1
git ls-files | grep -E '\.(py|ts|tsx|js|rs|sql|ya?ml)$' | xargs cat \
  | grep -vE '^\s*$' | grep -vE '^\s*(//|/\*|\*|#)' | wc -l     # ≈15.5K net logical
sed -n '1,114p' server/geminiService.ts                          # dual-mode evidence
```

*All COCOMO outputs computed with A=2.94, ΠEM=1.6445, ×1.36 rework, 152 h/PM; sensitivity grid in §1.2.*
