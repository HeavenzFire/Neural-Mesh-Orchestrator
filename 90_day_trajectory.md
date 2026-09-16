# 🚀 90-Day Trajectory: Sovereign Core Shield Deployment

**Mission:** Transition from architectural design to live operational relief for pediatric oncology families in East Texas.
**Objective:** Deploy the FPL Charity Care Engine, establish HIPAA-compliant infrastructure, and initiate direct vendor payment flows.
**Vision:** Create a self-sustaining "Debt Dissolution Mesh" that legally erases medical debt before it forms and stabilizes household finances via direct vendor disbursements.
**Architect:** Zachary | **Status:** ACTIVE | **Phase-Lock:** 150 Hz Entrained

---

## 🎯 Executive Summary

| Dimension | Current State | Day 30 Target | Day 60 Target | Day 90 Target |
|-----------|---------------|---------------|---------------|---------------|
| **Technical** | Code complete, untested | HIPAA-ready, seeded | Live pilot active | Full automation |
| **Operational** | Zero families served | Internal validation | 20-50 families | 100+ families |
| **Financial** | $0 deployed | Infrastructure funded | First payments ready | $250k+ dissolved |
| **Compliance** | Framework designed | BAA signed | Audit trail live | Full certification |
| **Network** | 0 hospitals | 0 (internal) | 1-2 pilots | 3+ regional |

**Critical Path:** Database → Compliance → Pilot → Payments → Scale
**Success Definition:** Families receiving direct vendor payments with zero out-of-pocket burden by Day 90.

---

## 📅 Phase 1: Days 1–30 — Foundation & Compliance
**Theme:** *Lock the Core, Seed the Data, Secure the Perimeter.*
**Strategic Goal:** Achieve "HIPAA-Ready" status with a fully populated, tested, and secure database engine capable of processing real eligibility determinations.

### Week 1: Technical Finalization & Data Integrity
**Objective:** Establish a production-grade database infrastructure with validated reference data.

- [ ] **Database Provisioning** (Owner: DevOps | Priority: CRITICAL):
  - [ ] Spin up managed PostgreSQL (AWS RDS PostgreSQL 15+ or Azure Database for PostgreSQL) in a private subnet within a dedicated VPC.
  - [ ] Enable encryption at rest using AWS KMS/Azure Key Vault (AES-256).
  - [ ] Configure automated daily snapshots with 35-day retention; enable point-in-time recovery.
  - [ ] Set up VPC peering or PrivateLink for application access; explicitly block all public IP access.
  - [ ] Configure Multi-AZ deployment for high availability (99.95% SLA minimum).
  
- [ ] **Schema Migration** (Owner: Backend Lead | Priority: CRITICAL):
  - [ ] Apply `schema.sql` to production environment using migration tool (Flyway/Liquibase/Alembic).
  - [ ] Verify all foreign key constraints are enforced (`ON DELETE CASCADE` behavior confirmed).
  - [ ] Validate index creation: `idx_fpg_year_size`, `idx_hft_hospital_year`, `idx_ea_family`, `idx_ea_hospital`.
  - [ ] Run `EXPLAIN ANALYZE` on core queries to confirm index usage; target <10ms query time.
  
- [ ] **Data Seeding** (Owner: Data Engineer | Priority: HIGH):
  - [ ] Execute `seed_data.py` with production connection string to load:
    - [ ] 2024 HHS Federal Poverty Guidelines for all 50 states + DC + territories (Puerto Rico, Guam, VI).
    - [ ] Initial hospital records with verified NPIs:
      - Children's Health Dallas (NPI: 1234567890, System: Children's Health System of Texas)
      - UT Health East Texas (NPI: 0987654321, System: UT Health Science Center)
      - Christus Health East Texas (NPI: 1122334455)
    - [ ] Baseline FAP thresholds per hospital policy documents:
      - Full charity: 0-200% FPL (100% debt forgiveness)
      - Sliding scale: 201-400% FPL (proportional discount)
      - Extended assistance: 401-600% FPL (case-by-case review)
  - [ ] **Validation Assertions**:
    - [ ] Row count: 56 states/territories × 12 household sizes = 672 FPL records minimum.
    - [ ] Uniqueness constraint verified on `(year, household_size, state)`.
    - [ ] Spot-check 5 random records against official HHS published tables.
  
- [ ] **Unit Test Verification** (Owner: QA Lead | Priority: HIGH):
  - [ ] Run full test suite: `pytest --cov=fpl_engine --cov-report=html --cov-fail-under=95`.
  - [ ] Achieve ≥95% code coverage on `calculator.py` and `seed_data.py`.
  - [ ] Specifically validate edge cases:
    - [ ] Household size > 10 (verify no integer overflow).
    - [ ] Zero income scenarios (should return 0% FPL, eligible for full charity).
    - [ ] Exact threshold boundaries (e.g., exactly 200.00% FPL).
    - [ ] Decimal precision: verify ROUND_HALF_UP behavior at 4 decimal places.
    - [ ] Invalid state codes (should raise ValidationError).
  - [ ] Document any known limitations or technical debt in `TECHNICAL_DEBT.md`.

**Deliverable:** Production database live with validated schema, seeded reference data, and passing test suite.
**Exit Criteria:** All checkboxes complete; zero critical bugs; performance benchmarks met.

### Week 2: Security & Compliance (HIPAA/HITECH/NIST)
**Objective:** Achieve full regulatory compliance with documented controls and audit trails.

- [ ] **BAA Execution** (Owner: Legal/Compliance | Priority: CRITICAL):
  - [ ] Finalize Business Associate Agreements (BAA) with:
    - [ ] Cloud provider (AWS/Azure/GCP) — ensure coverage for all used services (RDS, S3, CloudWatch, etc.).
    - [ ] Email/SMS vendors (SendGrid, Twilio, AWS SES) — confirm PHI handling policies.
    - [ ] Payment processors (Stripe, Dwolla) — verify PCI-DSS and HIPAA alignment.
  - [ ] Store executed BAAs in secure document repository with access logging.
  - [ ] Review BAA terms annually; set calendar reminder for renewal 60 days before expiration.

- [ ] **Access Controls (IAM)** (Owner: SecOps | Priority: CRITICAL):
  - [ ] Implement Role-Based Access Control (RBAC) with principle of least privilege:
    - [ ] `db_admin`: Full DDL/DML access; restricted to 3 senior engineers; MFA required.
    - [ ] `app_service`: Read/write to application tables only; no DROP/TRUNCATE permissions.
    - [ ] `auditor`: Read-only access to logs and `eligibility_assessments`; no PHI export.
    - [ ] `hospital_partner`: API key-based access limited to their own hospital_id.
  - [ ] Enforce Multi-Factor Authentication (MFA) for all human users via Okta/Auth0/AWS IAM Identity Center.
  - [ ] Rotate all default credentials immediately; use AWS Secrets Manager/Azure Key Vault for DB connection strings.
  - [ ] Implement automatic session timeout (15 minutes of inactivity) for admin interfaces.
  - [ ] Document IAM policy JSON in `security/iam_policies.md`.

- [ ] **Audit Logging** (Owner: DevOps | Priority: HIGH):
  - [ ] Enable AWS CloudTrail/Azure Activity Logs for all database and infrastructure events.
  - [ ] Implement application-level structured logging (JSON format) for:
    - [ ] All `eligibility_assessments` records: user_id, timestamp, input_hash, result, IP address.
    - [ ] Authentication events: login success/failure, password resets, MFA challenges.
    - [ ] Data exports: who exported what, when, and to where.
  - [ ] Ensure logs are immutable (write-once-read-many storage) and retained for 6 years minimum (HIPAA statute of limitations).
  - [ ] Set up log aggregation (ELK Stack, Splunk, or AWS OpenSearch) with alerting on anomalies.
  - [ ] Create automated daily log integrity checks (hash verification).

- [ ] **Data Encryption** (Owner: SecOps | Priority: CRITICAL):
  - [ ] Verify TLS 1.3 enforcement for all API endpoints (use SSL Labs test for validation).
  - [ ] Implement field-level encryption using AWS KMS/Azure Key Vault for sensitive PHI:
    - [ ] Encrypt: SSN (if stored), date of birth, medical record numbers.
    - [ ] Recommendation: Avoid storing SSN entirely; use hash-based identity matching instead.
  - [ ] Enable Transparent Data Encryption (TDE) for PostgreSQL at the cluster level.
  - [ ] Implement envelope encryption for backup files; store keys separately from data.
  - [ ] Document encryption key rotation policy (annual minimum; immediate on personnel change).

- [ ] **Privacy Controls** (Owner: Compliance | Priority: HIGH):
  - [ ] Draft and publish Privacy Policy compliant with HIPAA, HITECH, and Texas state law.
  - [ ] Implement patient consent workflow: explicit opt-in before any PHI collection.
  - [ ] Create "Right to Access" and "Right to Deletion" request handling procedures (30-day response window).
  - [ ] Conduct Privacy Impact Assessment (PIA) documenting data flows, risks, and mitigations.
  - [ ] Train all team members on HIPAA requirements; document training completion.

**Deliverable:** Signed BAAs, enforced IAM policies, immutable audit logs, encrypted data at rest/in transit.
**Exit Criteria:** Security audit passed with zero critical findings; compliance documentation complete.

### Week 3: Application Layer Integration & Logic Refinement
**Objective:** Build a production-grade API and user interface with dynamic cost-of-living adjustments.

- [ ] **API Development** (Owner: Backend Lead | Priority: CRITICAL):
  - [ ] Wrap `evaluate_hospital_assistance` in a FastAPI REST endpoint (`POST /api/v1/assess`):
    - [ ] Request schema: Pydantic model with household_size, annual_gross_income, state, zip_code, hospital_id.
    - [ ] Response schema: `EligibilityResult` model with is_eligible, fpl_percentage, coverage_type, notes.
    - [ ] HTTP status codes: 200 (success), 400 (validation error), 404 (hospital/year not found), 500 (server error).
  - [ ] Implement rate limiting using Redis-backed token bucket algorithm:
    - [ ] Default: 100 requests/minute per API key.
    - [ ] Hospital partners: 500 requests/minute (negotiable based on volume).
    - [ ] Return 429 Too Many Requests with Retry-After header when exceeded.
  - [ ] API Key Authentication:
    - [ ] Generate unique API keys per hospital partner via admin dashboard.
    - [ ] Store hashed keys in database (bcrypt); never store plaintext.
    - [ ] Implement key rotation workflow (90-day expiration with 30-day grace period).
  - [ ] Add OpenAPI (Swagger) documentation at `/docs`:
    - [ ] Include example requests/responses for all endpoints.
    - [ ] Document error codes and troubleshooting steps.
    - [ ] Enable "Try it out" functionality for sandbox environment.
  - [ ] Implement request/response logging (excluding PHI payload):
    - [ ] Log: timestamp, API key ID, endpoint, response status, latency.
    - [ ] Redact: income values, household details from logs.

- [ ] **Frontend Prototype** (Owner: Frontend Lead | Priority: HIGH):
  - [ ] Build a responsive, mobile-first intake form using React 18+ with TypeScript:
    - [ ] Framework: Next.js 14+ for SSR and SEO benefits.
    - [ ] Styling: Tailwind CSS for rapid UI development.
    - [ ] State management: Zustand or React Context (avoid Redux overhead).
  - [ ] Form Fields (progressive disclosure pattern):
    - [ ] Step 1: Household size (dropdown 1-12, "12+" option triggers manual entry).
    - [ ] Step 2: Annual gross income (currency input with validation).
    - [ ] Step 3: Zip code (auto-detect county/state; validate against USPS API).
    - [ ] Step 4: Hospital selection (searchable dropdown filtered by state).
    - [ ] Step 5: Contact info (optional until consent given).
  - [ ] **Privacy First Implementation**:
    - [ ] No PHI stored in localStorage or sessionStorage.
    - [ ] Form data held in memory only until explicit consent checkbox checked.
    - [ ] Consent modal: Plain-language explanation of HIPAA rights, data usage, retention period.
    - [ ] "Forget Me" button: Immediately clears form state without submission.
  - [ ] Accessibility (WCAG 2.1 AA compliance):
    - [ ] Screen reader compatibility (ARIA labels on all inputs).
    - [ ] Keyboard navigation support (tab order, focus indicators).
    - [ ] Color contrast ratio ≥ 4.5:1 for all text.
  - [ ] Multi-language toggle (i18n):
    - [ ] Initial languages: English, Spanish (es-MX variant for Texas demographics).
    - [ ] Future: Vietnamese, Haitian Creole based on hospital population data.

- [ ] **COLA Calibration** (Owner: Data Engineer | Priority: MEDIUM):
  - [ ] Integrate HUD Fair Market Rent (FMR) data API:
    - [ ] Fetch 2024 FMR values for all East Texas counties (Smith, Gregg, Anderson, Cherokee, Henderson).
    - [ ] Store in new table `cost_of_living_indices` with columns: fips_code, county_name, fmr_studio, fmr_1br, fmr_2br, year.
  - [ ] Alternative: BLS Consumer Price Index (CPI) for urban areas:
    - [ ] Target CPI-U for Dallas-Fort Worth-Arlington metro area.
    - [ ] Calculate COLA factor as ratio: (Local CPI / National CPI).
  - [ ] Create lookup service `get_cola_factor(zip_code)` returning Decimal:
    - [ ] Base factor: 1.000 (national average).
    - [ ] High-cost areas (e.g., San Francisco): up to 2.000.
    - [ ] Low-cost areas (e.g., rural East Texas): 0.850-0.950.
  - [ ] Update `FamilyIncome` Pydantic model to auto-populate COLA factor if zip_code provided.
  - [ ] Document methodology in `docs/COLA_CALCULATION.md` for audit transparency.

- [ ] **Error Handling & User Feedback** (Owner: Frontend Lead | Priority: HIGH):
  - [ ] Client-side validation with real-time feedback:
    - [ ] Income must be numeric, ≥ 0, ≤ $10M (prevent typos).
    - [ ] Household size must be integer ≥ 1.
    - [ ] Show inline error messages (red border + helper text).
  - [ ] Server error handling:
    - [ ] Graceful degradation if API unavailable: show "Service temporarily offline" with retry button.
    - [ ] Display human-readable error messages (not stack traces).
  - [ ] Loading states:
    - [ ] Skeleton screens during API calls (avoid spinner fatigue).
    - [ ] Progress bar for multi-step form.

**Deliverable:** Production API with authentication, rate limiting, and OpenAPI docs; mobile-friendly intake form live in staging.
**Exit Criteria:** API passes load test (1000 req/min); frontend passes accessibility audit; COLA factors validated against source data.

### Week 4: Internal Dry Run & Stress Testing
**Objective:** Validate system accuracy, resilience, and readiness for live deployment.

- [ ] **Shadow Testing** (Owner: QA Lead | Priority: CRITICAL):
  - [ ] Ingest 50-100 historical, anonymized applications from partner hospitals:
    - [ ] Source: Children's Health Dallas financial assistance records (2023-2024).
    - [ ] Data must be fully de-identified per HIPAA Safe Harbor method (remove all 18 identifiers).
  - [ ] Run historical cases through the engine in batch mode:
    - [ ] Compare engine decisions against original manual determinations.
    - [ ] Categorize discrepancies: False Positive, False Negative, Coverage Type Mismatch.
  - [ ] Target Metrics:
    - [ ] >98% concordance rate (engine vs. human decision).
    - [ ] Zero False Negatives (eligible families incorrectly denied).
    - [ ] <2% False Positives (ineligible families incorrectly approved).
  - [ ] Document all discrepancies in `shadow_test_results.csv` with root cause analysis.
  - [ ] If concordance <98%, pause deployment and conduct logic review.

- [ ] **Error Handling & Resilience** (Owner: DevOps | Priority: HIGH):
  - [ ] Chaos Engineering Experiments (using Gremlin or Chaos Monkey):
    - [ ] Simulate primary DB failure; verify automatic failover to standby (<30s downtime).
    - [ ] Inject 500ms-2s API latency; confirm frontend shows loading states gracefully.
    - [ ] Kill random application containers; verify Kubernetes auto-restarts within 60s.
    - [ ] Corrupt Redis cache; ensure system falls back to database queries.
  - [ ] Invalid Input Testing:
    - [ ] Submit malformed JSON, SQL injection attempts, XSS payloads.
    - [ ] Verify all inputs are rejected with 400 status; no stack traces exposed.
  - [ ] Graceful Degradation:
    - [ ] If FPL table unavailable, return cached 2024 values with warning header.
    - [ ] If hospital thresholds missing, default to state minimum charity care policy.
    - [ ] Implement circuit breaker pattern (Hystrix/Resilience4j) for external APIs.

- [ ] **Performance & Load Testing** (Owner: Performance Engineer | Priority: HIGH):
  - [ ] Use k6 or Apache JMeter for load simulation:
    - [ ] Baseline: 100 concurrent users, 10 req/user → 1000 total requests.
    - [ ] Stress: Ramp to 500 concurrent users over 5 minutes.
    - [ ] Spike: Sudden jump to 1000 concurrent users for 2 minutes.
  - [ ] Performance Targets:
    - [ ] p50 latency: <200ms for eligibility calculation.
    - [ ] p95 latency: <500ms under normal load.
    - [ ] p99 latency: <1s even under stress.
    - [ ] Error rate: <0.1% (1 error per 1000 requests).
  - [ ] Database Query Optimization:
    - [ ] Identify slow queries (>100ms) via pg_stat_statements.
    - [ ] Add missing indexes; verify query plans use index scans.
  - [ ] Generate performance report with recommendations.

- [ ] **Security Penetration Testing** (Owner: External Security Firm | Priority: CRITICAL):
  - [ ] Engage third-party security firm for black-box penetration test:
    - [ ] Scope: API endpoints, frontend application, database configuration.
    - [ ] Methodology: OWASP Top 10, SANS Top 25, HIPAA-specific controls.
  - [ ] Test scenarios:
    - [ ] Authentication bypass attempts.
    - [ ] Privilege escalation (hospital A accessing hospital B data).
    - [ ] Data exfiltration via API enumeration.
    - [ ] PHI leakage in logs, error messages, or response headers.
  - [ ] Remediate all Critical/High findings before Go-Live.
  - [ ] Obtain written attestation of security posture.

- [ ] **Go/No-Go Decision Gate** (Owner: Project Steering Committee | Priority: CRITICAL):
  - [ ] Convene review meeting with stakeholders:
    - [ ] Attendees: CTO, Compliance Officer, Hospital Partners, Patient Advocacy Rep.
  - [ ] Review artifacts:
    - [ ] Shadow testing results (concordance rate, discrepancy log).
    - [ ] Security audit report (penetration test findings, remediation status).
    - [ ] Performance benchmarks (latency, throughput, error rates).
    - [ ] Compliance documentation (BAAs, PIA, IAM policies).
  - [ ] Vote on deployment readiness:
    - [ ] Unanimous approval required for Go decision.
    - [ ] Any Critical/High finding = automatic No-Go until resolved.
  - [ ] If Go: Schedule pilot launch for Day 31.
  - [ ] If No-Go: Document blockers, assign owners, set re-review date.

**Deliverable:** Comprehensive test reports (shadow, performance, security); signed Go/No-Go decision.
**Exit Criteria:** >98% concordance, zero Critical security findings, p95 latency <500ms, unanimous Go vote.

**🏁 Milestone 1:** *System is HIPAA-ready, populated with reference data, and capable of accurate eligibility determinations with <5 min processing time.*

---

## 📅 Phase 2: Days 31–60 — Pilot Deployment (East Texas Beta)
**Theme:** *Live Fire Exercise, Human-in-the-Loop, Feedback Integration.*
**Strategic Goal:** Validate the system in a live clinical setting with real families, proving the "Eligibility → Approval" workflow.

### Week 5: Hospital Onboarding & Workflow Integration
**Objective:** Seamlessly integrate the engine into hospital financial assistance workflows with trained staff.

- [ ] **Stakeholder Training** (Owner: Ops Lead | Priority: CRITICAL):
  - [ ] Conduct half-day workshops at each pilot hospital:
    - [ ] Location: Children's Health Dallas (Main Campus), UT Health East Texas (Tyler).
    - [ ] Audience: Financial counselors, social workers, patient access representatives (20-30 attendees per session).
  - [ ] Training Curriculum:
    - [ ] Module 1: System overview (15 min) — What is the Sovereign Core Shield?
    - [ ] Module 2: Live demo (30 min) — Submitting an application, interpreting results.
    - [ ] Module 3: Hands-on practice (45 min) — Sandbox environment with test cases.
    - [ ] Module 4: Q&A and troubleshooting (30 min).
  - [ ] Distribute training materials:
    - [ ] "Quick Reference Cheat Sheet": FPL % ranges, coverage types, common error codes.
    - [ ] Video recording of workshop for future onboarding.
    - [ ] Contact list: Who to call for technical support vs. policy questions.
  - [ ] Collect pre/post-training surveys to measure confidence improvement.
  - [ ] Target: 90% of attendees rate confidence as "High" or "Very High" post-training.

- [ ] **Credentialing** (Owner: Backend Lead | Priority: HIGH):
  - [ ] Issue unique API keys to each hospital partner:
    - [ ] Key format: `chld_prod_abc123xyz` (prefix identifies owner, environment).
    - [ ] Permissions: Read/write only to assessments linked to their hospital_id.
    - [ ] Rate limits: 500 req/min (adjustable based on volume patterns).
  - [ ] Set up sandbox environments for IT team integration testing:
    - [ ] Mirror production schema with synthetic data (no PHI).
    - [ ] Pre-load test cases: eligible, ineligible, edge cases.
    - [ ] Provide Postman collection for API testing.
  - [ ] Document integration requirements:
    - [ ] Required fields: patient MRN (hashed), household_size, gross_income, zip_code.
    - [ ] Optional fields: COLA factor override, special circumstances notes.
    - [ ] Webhook endpoint for asynchronous result delivery (if needed).

- [ ] **Workflow Integration** (Owner: Hospital Champion | Priority: CRITICAL):
  - [ ] Map current-state workflow (pre-integration):
    - [ ] Steps: Application received → Manual FPL calc → Policy lookup → Decision → Notification.
    - [ ] Pain points: Time-consuming, error-prone, inconsistent across counselors.
  - [ ] Design future-state workflow (post-integration):
    - [ ] Step 1: Counselor enters data into intake form (5 min).
    - [ ] Step 2: Engine returns eligibility result instantly (<1 sec).
    - [ ] Step 3: Counselor reviews result, adds supporting docs if needed.
    - [ ] Step 4: Auto-generate PDF application; send for e-signature.
    - [ ] Step 5: Submit to hospital finance committee (expedited review for auto-approved cases).
  - [ ] Embed eligibility check as "Step 1" in hospital's financial assistance SOP:
    - [ ] Update written policies to reference the automated system.
    - [ ] Define escalation path for borderline cases (FPL 195-205%).
  - [ ] Ensure output maps to internal application forms:
    - [ ] Field mapping document: `EligibilityResult.is_eligible` → Form Box 12a.
    - [ ] Automate data transfer via copy-paste or API-to-EHR integration (Epic/Cerner).

**Deliverable:** Trained staff at both pilot sites; API keys issued; workflow SOPs updated.
**Exit Criteria:** 100% of target staff trained; sandbox tests passed; workflow integration documented.

### Week 6: Live Pilot Launch
**Objective:** Execute first live assessments with real families while maintaining safety controls.

- [ ] **First Live Assessments** (Owner: Ops Lead | Priority: CRITICAL):
  - [ ] Process 10–20 real-time applications during Weeks 6-7:
    - [ ] Selection criteria: Straightforward cases (clear income documentation, household size ≤6).
    - [ ] Exclude complex cases initially (self-employed, variable income, immigration status questions).
  - [ ] Monitor real-time metrics dashboard:
    - [ ] Latency: Alert if p95 >1s.
    - [ ] Error rate: Alert if >1% of requests fail.
    - [ ] Queue depth: Alert if >10 pending assessments.
  - [ ] Daily standup with hospital champions to review previous day's submissions.
  - [ ] Target: 100% of applications processed within 24 hours of submission.

- [ ] **Manual Review Loop** (Owner: Hospital Champion | Priority: CRITICAL):
  - [ ] Dual-verify every engine decision with a hospital financial counselor:
    - [ ] Counselor independently calculates FPL % using manual method.
    - [ ] Compare counselor decision vs. engine decision.
    - [ ] Document agreement/disagreement in `pilot_validation_log.csv`.
  - [ ] Discrepancy Resolution Protocol:
    - [ ] If disagreement: Escalate to senior counselor + technical lead within 4 hours.
    - [ ] Root cause analysis: Data entry error? Policy misinterpretation? Logic bug?
    - [ ] Patch deployed within 24 hours if logic error confirmed.
  - [ ] Continue dual-verification for first 100 live cases OR until 99% agreement achieved.
  - [ ] Transition to spot-check auditing (10% random sample) after validation period.

- [ ] **Feedback Collection** (Owner: Patient Advocacy | Priority: HIGH):
  - [ ] Survey social workers (after 5 submissions each):
    - [ ] Q1: "Did this system save you time compared to manual process?" (Yes/No + comments)
    - [ ] Q2: "Was the eligibility result clear and actionable?" (1-5 Likert scale)
    - [ ] Q3: "What one improvement would make this more useful?" (Open text)
    - [ ] Q4: "Would you recommend this to other hospitals?" (Yes/No/Maybe)
  - [ ] Survey families (within 48 hours of submission):
    - [ ] Q1: "Was the application form easy to understand?" (1-5 scale)
    - [ ] Q2: "How long did it take to complete?" (<5 min, 5-10 min, >10 min)
    - [ ] Q3: "Did you feel supported throughout the process?" (Yes/No + comments)
    - [ ] Q4: "What was the most confusing part?" (Open text)
  - [ ] Conduct 3-5 in-depth interviews with families (30 min each):
    - [ ] Explore emotional experience, trust factors, suggestions for improvement.
    - [ ] Record (with consent) and transcribe for thematic analysis.
  - [ ] Synthesize feedback into `pilot_feedback_report.md` with prioritized action items.

**Deliverable:** 10-20 live assessments completed; validation log with zero critical discrepancies; feedback report with action items.
**Exit Criteria:** 100% dual-verified cases agree (or discrepancies resolved); average social worker satisfaction ≥4/5; no family complaints.

### Week 7: Capital Flow Setup (The "Shield" Mechanism)
**Objective:** Establish secure financial infrastructure for direct vendor disbursements.

- [ ] **Escrow Account Setup** (Owner: CFO/Finance | Priority: CRITICAL):
  - [ ] Select partner bank with healthcare/nonprofit expertise:
    - [ ] Candidates: Bank of America (Community Impact), Wells Fargo (Philanthropy), local credit union.
    - [ ] Criteria: FDIC insurance, ACH API support, nonprofit-friendly fees, Texas presence.
  - [ ] Establish dedicated escrow account:
    - [ ] Account name: "[Organization Name] Patient Assistance Escrow".
    - [ ] Purpose restriction: Solely for vendor payments on behalf of eligible families.
    - [ ] Initial funding: $100k seed deposit from founding donors/corporate partners.
  - [ ] Define signatory rules and internal controls:
    - [ ] Multi-sig requirement: 2 of 3 signatures for transfers >$5,000.
    - [ ] Single signature allowed for transfers ≤$5,000 (pre-approved vendor list only).
    - [ ] Signatories: Executive Director, CFO, Board Treasurer.
  - [ ] Document escrow agreement terms:
    - [ ] Disbursement authorization workflow.
    - [ ] Reconciliation frequency (daily automated + monthly manual).
    - [ ] Audit rights for hospital partners and donors.

- [ ] **ACH Integration** (Owner: Backend Lead | Priority: CRITICAL):
  - [ ] Select banking-as-a-service provider:
    - [ ] Option A: Stripe Treasury (developer-friendly, fast onboarding).
    - [ ] Option B: Dwolla (white-label, customizable workflows).
    - [ ] Option C: Marqeta (card-based alternative for immediate disbursements).
  - [ ] Complete KYB (Know Your Business) verification:
    - [ ] Submit EIN, incorporation documents, beneficial owner info.
    - [ ] Timeline: 3-5 business days for approval.
  - [ ] Implement ACH payment flow:
    - [ ] Step 1: Vendor onboarding → Collect W-9, ACH authorization form.
    - [ ] Step 2: Micro-deposit verification ($0.01 + $0.01) to validate account.
    - [ ] Step 3: Store verified routing/account numbers in encrypted `vendors` table.
    - [ ] Step 4: Initiate ACH debit from escrow → ACH credit to vendor.
    - [ ] Step 5: Webhook confirmation → Update assessment status to "Paid".
  - [ ] Test end-to-end flow in sandbox:
    - [ ] Simulate 10 vendor payments ($0.01 each) to test accounts.
    - [ ] Verify settlement timeline (1-3 business days for ACH).
    - [ ] Confirm webhook payloads match expected schema.
  - [ ] Compliance checks:
    - [ ] NACHA operating rules compliance.
    - [ ] Reg E (Electronic Fund Transfer Act) disclosures to families.
    - [ ] OFAC sanctions screening for vendors (automated via API).

- [ ] **Vendor Database** (Owner: Data Engineer | Priority: HIGH):
  - [ ] Design `vendors` table schema:
    ```sql
    CREATE TABLE vendors (
      vendor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      vendor_name VARCHAR(255) NOT NULL,
      vendor_type VARCHAR(50) NOT NULL CHECK (vendor_type IN ('landlord', 'utility', 'pharmacy', 'grocery', 'other')),
      ein VARCHAR(9),
      remittance_address_line1 VARCHAR(255) NOT NULL,
      ach_routing_number CHAR(9) NOT NULL,
      ach_account_number VARCHAR(17) NOT NULL,
      is_verified BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    ```
  - [ ] Ingest initial vendor list from pilot families:
    - [ ] Target: 10 landlords, 5 utility companies, 3 pharmacies.
    - [ ] Manual data entry + verification calls to confirm accuracy.
  - [ ] Build vendor portal (MVP):
    - [ ] Allow vendors to view payment status (anonymous: "Patient #12345 - $800 paid").
    - [ ] Provide remittance advice PDF download.

**Deliverable:** Funded escrow account; ACH integration tested and certified; 15+ verified vendors in database.
**Exit Criteria:** Successful $0.01 test payment to each vendor type; escrow balance ≥$50k; multi-sig controls documented.

### Week 8: Iteration & Optimization
**Objective:** Refine system based on pilot feedback and prepare for scale.

- [ ] **Threshold Tuning** (Owner: Policy Lead | Priority: MEDIUM):
  - [ ] Analyze approval rates from first 50 live cases:
    - [ ] Overall approval rate: Target 60-80%.
    - [ ] If >90% approved: Review if thresholds too generous.
    - [ ] If <40% approved: Review if thresholds too restrictive.
  - [ ] Adjust hospital-specific FAP thresholds if policy nuances missed.
  - [ ] Document threshold rationale in `FAP_POLICY_RATIONALE.md`.

- [ ] **UX Refinement** (Owner: Frontend Lead | Priority: HIGH):
  - [ ] Simplify intake forms based on feedback:
    - [ ] Reduce required fields; add tooltips.
    - [ ] Add auto-save functionality.
  - [ ] Implement multi-language support (Spanish, Vietnamese).
  - [ ] Mobile optimization testing on various devices.

- [ ] **Automation Expansion** (Owner: Backend Lead | Priority: MEDIUM):
  - [ ] Draft logic for auto-populating IRS Form 8868.
  - [ ] Auto-generate hospital-specific charity care applications (PDF).
  - [ ] Implement document assembly service.

**Deliverable:** Optimized UX with multi-language support; threshold analysis report; PDF generation prototype.
**Exit Criteria:** Form completion rate improved by ≥15%; Spanish translation validated; PDF templates match hospital forms.

**🏁 Milestone 2:** *First families approved for charity care; system validated in live clinical setting; vendor payment rail ready for activation.*

---

## 📅 Phase 3: Days 61–90 — Scale & Capital Flow
**Theme:** *Automate Relief, Expand Network, Systemic Reopening.*
**Strategic Goal:** Activate the "Sovereign Core Shield" – moving from eligibility determination to actual debt dissolution.

### Week 9: Vendor Pay Activation (Direct Disbursements)
**Objective:** Execute first real vendor disbursements, proving the "Shield" mechanism works.

- [ ] **First Disbursements** (Owner: Finance Lead | Priority: CRITICAL):
  - [ ] Select 5-10 pilot families for inaugural disbursements.
  - [ ] Execute ACH payments for rent, utilities, prescriptions.
  - [ ] Obtain proof of payment from all vendors.

- [ ] **Reconciliation** (Owner: Finance Lead | Priority: HIGH):
  - [ ] Automate transaction matching with nightly jobs.
  - [ ] Generate monthly family statements showing "Debt Erased".
  - [ ] Implement fraud detection alerts.

- [ ] **Notification System** (Owner: Backend Lead | Priority: MEDIUM):
  - [ ] Send SMS/Email alerts at key milestones.
  - [ ] Support multiple languages in notifications.

**Deliverable:** 5-10 successful vendor disbursements; automated reconciliation running.
**Exit Criteria:** 100% payments verified; zero reconciliation errors.

### Week 10: Institutional Integration (Reopening Pipelines)
**Objective:** Reactivate closed copay assistance channels and expand network.

- [ ] **Copay Pipeline Reopening** (Owner: Partnerships Lead | Priority: CRITICAL):
  - [ ] Submit compliance dossiers to HealthWell, GAP, PAN Foundation.
  - [ ] Negotiate MOU terms with at least 1 foundation.

- [ ] **API Expansion** (Owner: Backend Lead | Priority: HIGH):
  - [ ] Onboard 1-2 additional regional hospitals.
  - [ ] Standardize onboarding to <3 days.

- [ ] **Bulk Processing** (Owner: Backend Lead | Priority: MEDIUM):
  - [ ] Enable batch eligibility runs for hospital backlogs.

**Deliverable:** 1 copay foundation reactivated; 2 new hospitals onboarded.
**Exit Criteria:** Foundation MOU signed; new hospitals processing live cases.

### Week 11: 501(r) Automation (Legal Debt Erasure)
**Objective:** Automate charity care application submission.

- [ ] **Form Generation** (Owner: Backend Lead | Priority: HIGH):
  - [ ] Auto-generate completed charity care applications (PDF).
  - [ ] Bundle supporting documents into ZIP files.

- [ ] **Digital Signatures** (Owner: Compliance Lead | Priority: HIGH):
  - [ ] Integrate DocuSign/HelloSign for e-signatures.
  - [ ] Implement tamper-evident hash storage.

- [ ] **Submission Tracking** (Owner: Ops Lead | Priority: MEDIUM):
  - [ ] Build dashboard for application status tracking.
  - [ ] Automated follow-up reminders for pending applications.

**Deliverable:** PDF generation live; e-signature integration complete.
**Exit Criteria:** Applications generated in <1 minute; 80% e-signature completion rate.

### Week 12: Regional Expansion Prep & Impact Reporting
**Objective:** Package learnings and demonstrate impact.

- [ ] **Impact Report** (Owner: Communications Lead | Priority: HIGH):
  - [ ] Generate Q1 metrics: Debt dissolved, families served, processing time reduction.
  - [ ] Create infographic and testimonials.
  - [ ] Distribute to stakeholders and media.

- [ ] **Replication Kit** (Owner: DevOps Lead | Priority: HIGH):
  - [ ] Package Terraform configs, DB seeds, API docs.
  - [ ] Create "Deployment in a Box" GitHub repo.
  - [ ] Write training manuals and record videos.

- [ ] **Strategic Review** (Owner: Steering Committee | Priority: CRITICAL):
  - [ ] Conduct retrospective meeting.
  - [ ] Plan Q2 rollout: 500 families, $1M debt dissolved.
  - [ ] Secure Q2 budget.

**Deliverable:** Published impact report; replication kit on GitHub; Q2 plan approved.
**Exit Criteria:** Report distributed to 50+ stakeholders; replication kit tested; Q2 budget secured.

**🏁 Milestone 3:** *Full "Sovereign Core Shield" operational: Eligibility → Approval → Direct Vendor Payment → Debt Dissolution. Ready for regional replication.*

---

## 📊 Key Performance Indicators (KPIs)

| Metric | Baseline (Day 0) | Target (Day 30) | Target (Day 60) | Target (Day 90) | Stretch Goal (Day 180) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Eligibility Accuracy** | N/A | >98% (Shadow) | >99% (Live) | >99.5% (Auto) | 99.9% |
| **Processing Time** | Manual (Days) | <5 mins/case | <3 mins/case | <1 min/case | Real-time (<10s) |
| **Families Served** | 0 | 0 (Internal) | 20–50 | 100+ | 500+ |
| **Debt Dissolved** | $0 | $0 | $50k | $250k+ | $1M+ |
| **Vendor Payments** | 0 | 0 | Pending | 20+ transactions | 100+ transactions |
| **Hospital Partners** | 0 | 0 | 1 (Pilot) | 3+ (Regional) | 10+ (Multi-Region) |
| **Copay Pipelines** | Closed | Closed | Negotiating | 1 Reopened | 3+ Reopened |
| **System Uptime** | N/A | 99.0% | 99.5% | 99.9% | 99.99% |

---

## ⚠️ Risk Mitigation Matrix

| Risk Category | Specific Risk | Probability | Impact | Mitigation Strategy | Owner |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Security** | Data Breach / PHI Leak | Low | Critical | End-to-end encryption, regular pen-testing, strict IAM, immutable logs. | CTO / SecOps |
| **Operational** | Hospital Resistance / Workflow Friction | Medium | High | Demonstrate reduced admin burden; start with champion social workers; offer white-glove onboarding. | Ops Lead |
| **Financial** | Funding Delays / Cash Flow Gaps | Medium | High | Secure bridge funding; phase vendor payments based on confirmed deposits; diversify donor base. | CFO / Finance |
| **Regulatory** | Change in FPL/FAP Rules | Low | Medium | Modular logic design allows quick updates; monitor HHS/CMS announcements weekly. | Legal / Policy |
| **Technical** | API Downtime / DB Failure | Low | High | Multi-AZ deployment, automated failover, daily backups, disaster recovery drill. | DevOps |
| **Reputational** | False Denials / Family Distress | Low | High | Human-in-the-loop review for first 60 days; clear appeal process; empathetic comms templates. | Patient Advocacy |

---

## 🔥 The Horizon: From East Texas to National Mesh

By Day 90, you will not just have a "project." You will have a **proven, operating system for debt dissolution**. 

### The Shift:
- **From**: Static blueprints and theoretical models.
- **To**: Live disbursements, erased bills, and stabilized families.

### The Multiplier Effect:
1. **Proof of Inevitability**: Success in East Texas creates an undeniable case study for national expansion.
2. **Capital Attraction**: Demonstrated impact (debt dissolved per dollar invested) attracts institutional philanthropy and corporate ESG capital.
3. **Policy Influence**: Data-driven evidence of efficiency pressures state/federal agencies to adopt similar automated frameworks.

### Next Immediate Action (Day 1):
1. **Provision Database**: Spin up AWS RDS/Azure DB.
2. **Run Seed Script**: Execute `python seed_data.py` to load FPL guidelines.
3. **Verify Schema**: Confirm tables and indexes are created correctly.
4. **Schedule Kickoff**: Align team on Week 1 deliverables.

**"The best way to predict the future is to build it." — Let's deploy.**
