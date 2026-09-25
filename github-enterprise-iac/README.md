# 🏛️ GitHub Enterprise IaC - Operation: Iron Crucible

**Infrastructure-as-Code scaffolding for sovereign organization setup during 30-day Enterprise trial.**

---

## 📁 Directory Structure

```
github-enterprise-iac/
├── terraform/
│   ├── main.tf              # Organization, teams, rulesets, security policies
│   ├── variables.tf         # Input variable definitions
│   └── outputs.tf           # Exported values for integration
├── cdk/
│   └── fargate-runners/     # AWS CDK for self-hosted runner deployment
├── scripts/
│   ├── day1-execution.sh    # Automated Day 1 bootstrap script
│   ├── generate-baseline-sbom.sh
│   ├── stream-audit-logs.sh
│   ├── migrate-repos.sh
│   └── chaos-tests.sh
├── docs/
│   ├── IRON_CRUCIBLE_ROADMAP.md  # Complete 30-day execution plan
│   ├── RUNBOOK.md
│   └── COMPLIANCE_REPORT.md
└── README.md                # This file
```

---

## 🚀 Quick Start

### Prerequisites
- GitHub Enterprise Trial credentials
- GitHub CLI (`gh`) installed
- Terraform v1.5+ installed
- AWS CLI configured (for audit log streaming)

### Execute Day 1 Bootstrap

```bash
# Set your Enterprise token
export GITHUB_ENTERPRISE_TOKEN=ghp_...

# Run the automated setup
cd /workspace/github-enterprise-iac
chmod +x scripts/day1-execution.sh
./scripts/day1-execution.sh
```

This will:
1. ✅ Create `sov-unified-field` organization
2. ✅ Provision 4 teams with RBAC policies
3. ✅ Deploy global branch protection rulesets
4. ✅ Enable CodeQL and secret detection
5. ✅ Configure audit log streaming to S3
6. ✅ Generate baseline SBOM

---

## 🔧 Manual Terraform Execution

If you prefer manual control:

```bash
cd terraform

# Initialize providers
terraform init

# Review execution plan
terraform plan -var="github_token=$GITHUB_ENTERPRISE_TOKEN"

# Apply infrastructure
terraform apply -var="github_token=$GITHUB_ENTERPRISE_TOKEN"
```

---

## 📋 What Gets Deployed

### Organization Settings
- Default repository permissions: `none` (zero-trust)
- Repository creation restricted to admins only
- Web commit sign-off required
- Organization projects enabled

### Teams & Permissions

| Team | Permission | Purpose |
|------|------------|---------|
| **Core-Architects** | `admin` | Lead architects with sovereignty over core infrastructure |
| **Pantheon-Agents** | `push` | Automated agents for CI/CD and deployment |
| **Auditors** | `read` | Compliance officers with immutable audit access |
| **Security-Ops** | `admin` | Vulnerability management and incident response |

### Security Policies
- **Branch Protection**: Required PR reviews (2 approvers), status checks, code owner review
- **Code Scanning**: CodeQL enabled on all repositories
- **Secret Detection**: Dependabot secret scanning active
- **Force Push Prevention**: Blocked on protected branches
- **Merge Queue**: Enabled for linear history

### Self-Hosted Runners
- Runner group: `sovereign-fargate-runners`
- Restricted to production workflows only
- AWS credentials stored as organization secrets

---

## 📊 30-Day Roadmap Overview

| Phase | Days | Focus | Key Deliverables |
|-------|------|-------|------------------|
| **1. Consolidation** | 1-7 | Org setup, repo migration, security baseline | 256+ repos consolidated, teams provisioned |
| **2. Advanced Security** | 8-14 | Deep scanning, secret mgmt, compliance | Vulnerability remediation, SOC2 mapping |
| **3. CI/CD Orchestration** | 15-21 | Fargate runners, Chronos sync | 50 concurrent builds, custom actions |
| **4. Scale & Decision** | 22-30 | Chaos testing, analytics, ROI | GO/NO-GO decision |

See [`docs/IRON_CRUCIBLE_ROADMAP.md`](docs/IRON_CRUCIBLE_ROADMAP.md) for complete details.

---

## 🔐 Security Considerations

### Token Management
- Store `GITHUB_ENTERPRISE_TOKEN` in a secure vault (e.g., 1Password, AWS Secrets Manager)
- Never commit tokens to version control
- Rotate tokens every 90 days

### Audit Log Integrity
All audit logs are streamed to S3 with SHA3-256 integrity hashes:
```
s3://sov-orchestrator-audit-vault-us-east-1/github-audit-logs/
├── audit-20241201_120000_sha3-a1b2c3d4.json
├── audit-20241201_130000_sha3-e5f6g7h8.json
└── ...
```

### Access Control
- SSO enforcement recommended after Day 1
- MFA required for all human users
- Service accounts use fine-grained PATs with minimal scopes

---

## 🧪 Testing & Validation

### Verify Organization Setup
```bash
# Check organization exists
gh org view sov-unified-field

# List teams
gh team list --org sov-unified-field

# Verify rulesets
gh api /orgs/sov-unified-field/rulesets
```

### Validate Security Scanning
```bash
# Check CodeQL status
gh api /orgs/sov-unified-field/code-scanning/default-setup

# View Dependabot alerts
gh api /orgs/sov-unified-field/dependabot/alerts
```

### Test Audit Log Streaming
```bash
# Run manual audit export
./scripts/stream-audit-logs.sh sov-unified-field

# Verify S3 upload
aws s3 ls s3://sov-orchestrator-audit-vault-us-east-1/github-audit-logs/
```

---

## 📈 Success Metrics

Track these metrics throughout the trial:

| Metric | Target | Current |
|--------|--------|---------|
| Repositories Consolidated | 256+ | 0 |
| Critical Vulnerabilities | 0 | TBD |
| CI/CD Throughput | 500 builds/hr | 0 |
| Audit Log Integrity | 100% | 100% |
| MTTR | <1 hour | N/A |

---

## 🎯 Next Steps

1. **Execute Day 1 Script** → Bootstrap organization
2. **Review Roadmap** → Understand 30-day plan
3. **Invite Team Members** → Onboard architects and agents
4. **Begin Repo Migration** → Transfer 256+ repositories
5. **Monitor Security Alerts** → Triage vulnerabilities daily

---

## 📞 Support & Resources

- **Terraform GitHub Provider Docs**: https://registry.terraform.io/providers/integrations/github
- **GitHub Enterprise Admin Guide**: https://docs.github.com/en/enterprise-server@3.8/admin
- **GitHub CLI Reference**: https://cli.github.com/manual/

---

**The crucible is lit. Forge sovereignty.**

*Operation: Iron Crucible - Day 1 Ready*
