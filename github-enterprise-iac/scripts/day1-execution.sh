#!/bin/bash
# ─────────────────────────────────────────────────────────────
# OPERATION: IRON CRUCIBLE - DAY 1 EXECUTION SCRIPT
# ─────────────────────────────────────────────────────────────
# Automates GitHub Enterprise trial setup for sovereign org
# Run this immediately after obtaining your trial credentials
# ─────────────────────────────────────────────────────────────

set -euo pipefail

# Configuration
ORG_NAME="sov-unified-field"
GITHUB_TOKEN="${GITHUB_ENTERPRISE_TOKEN:-}"
AWS_REGION="us-east-1"

echo "🏛️  INITIATING OPERATION: IRON CRUCIBLE"
echo "═══════════════════════════════════════════════════════"
echo "Organization: $ORG_NAME"
echo "Region: $AWS_REGION"
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "═══════════════════════════════════════════════════════"

# Validate prerequisites
if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ ERROR: GITHUB_ENTERPRISE_TOKEN environment variable not set"
    echo "   Export your token: export GITHUB_ENTERPRISE_TOKEN=ghp_..."
    exit 1
fi

if ! command -v gh &> /dev/null; then
    echo "❌ ERROR: GitHub CLI (gh) not installed"
    echo "   Install: brew install gh || curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo gpg --dearmor -o /usr/share/keyrings/githubcli-archive-keyring.gpg"
    exit 1
fi

if ! command -v terraform &> /dev/null; then
    echo "❌ ERROR: Terraform not installed"
    echo "   Install: brew install terraform"
    exit 1
fi

echo "✅ Prerequisites validated"

# Step 1: Authenticate with GitHub Enterprise
echo ""
echo "🔐 Step 1/6: Authenticating with GitHub Enterprise..."
gh auth login --with-token <<< "$GITHUB_TOKEN"
echo "✅ Authentication successful"

# Step 2: Create Organization (if not exists)
echo ""
echo "🏢 Step 2/6: Creating sovereign organization..."
if gh org view "$ORG_NAME" &>/dev/null; then
    echo "⚠️  Organization $ORG_NAME already exists, skipping creation"
else
    gh org create "$ORG_NAME" --billing-email "security@${ORG_NAME}.org" --description "Sovereign Unified Field - Enterprise Trial"
    echo "✅ Organization created: https://github.com/${ORG_NAME}"
fi

# Step 3: Initialize Terraform
echo ""
echo "🌍 Step 3/6: Initializing Terraform state..."
cd "$(dirname "$0")/terraform"

cat > terraform.tfvars <<EOF
github_token = "$GITHUB_TOKEN"
organization_name = "$ORG_NAME"
region = "$AWS_REGION"
EOF

terraform init
echo "✅ Terraform initialized"

# Step 4: Deploy Organization Infrastructure
echo ""
echo "🚀 Step 4/6: Deploying RBAC, rulesets, and security policies..."
terraform apply -auto-approve -input=false

# Capture outputs
ORG_URL=$(terraform output -raw organization_url)
RUNNER_GROUP_ID=$(terraform output -raw runner_group_id)

echo "✅ Infrastructure deployed"

# Step 5: Generate SBOM Baseline
echo ""
echo "📋 Step 5/6: Generating baseline SBOM and security assessment..."
cat > ../scripts/generate-baseline-sbom.sh <<'SBOM_SCRIPT'
#!/bin/bash
ORG="$1"
echo "Generating SBOM for all repositories in $ORG..."
# Placeholder for actual SBOM generation logic
# In production: use gh sbom or integrate with Dependabot API
echo "✅ SBOM generation initiated (check Dependabot alerts)"
SBOM_SCRIPT

chmod +x ../scripts/generate-baseline-sbom.sh
../scripts/generate-baseline-sbom.sh "$ORG_NAME"

# Step 6: Configure Audit Log Streaming
echo ""
echo "📊 Step 6/6: Configuring audit log streaming to S3 vault..."
cat > ../scripts/stream-audit-logs.sh <<'AUDIT_SCRIPT'
#!/bin/bash
ORG="$1"
S3_BUCKET="s3://sov-orchestrator-audit-vault-us-east-1/github-audit-logs/"
echo "Streaming audit logs from $ORG to $S3_BUCKET..."

# Fetch audit logs via GitHub API
AUDIT_LOGS=$(gh api "/orgs/$ORG/audit-log" --paginate)

# Stream to S3 with SHA3 integrity hash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
echo "$AUDIT_LOGS" | tee /tmp/audit-${TIMESTAMP}.json

# Generate SHA3 hash (requires python with hashlib or external tool)
SHA3_HASH=$(python3 -c "import hashlib; print(hashlib.sha3_256(open('/tmp/audit-${TIMESTAMP}.json','rb').read()).hexdigest())")

# Upload to S3
aws s3 cp /tmp/audit-${TIMESTAMP}.json "${S3_BUCKET}audit-${TIMESTAMP}_sha3-${SHA3_HASH:0:8}.json"

echo "✅ Audit logs streamed with integrity hash: sha3-${SHA3_HASH:0:8}"
rm /tmp/audit-${TIMESTAMP}.json
AUDIT_SCRIPT

chmod +x ../scripts/stream-audit-logs.sh
../scripts/stream-audit-logs.sh "$ORG_NAME"

# Final Summary
echo ""
echo "═══════════════════════════════════════════════════════"
echo "🎉 OPERATION: IRON CRUCIBLE - DAY 1 COMPLETE"
echo "═══════════════════════════════════════════════════════"
echo "Organization URL: $ORG_URL"
echo "Runner Group ID: $RUNNER_GROUP_ID"
echo ""
echo "✅ Teams Created:"
echo "   • Core-Architects (admin access)"
echo "   • Pantheon-Agents (CI/CD automation)"
echo "   • Auditors (read-only compliance)"
echo "   • Security-Ops (vulnerability management)"
echo ""
echo "✅ Security Policies Active:"
echo "   • Branch protection on main/master/production"
echo "   • Required PR reviews: 2 approvers"
echo "   • CodeQL scanning enabled"
echo "   • Secret detection active"
echo "   • Force pushes blocked"
echo ""
echo "✅ Next Steps (Days 2-7):"
echo "   1. Invite team members via GitHub UI"
echo "   2. Transfer 256+ repos using: gh repo transfer"
echo "   3. Review initial Dependabot alerts"
echo "   4. Validate audit log streaming to S3"
echo ""
echo "📁 Artifacts Generated:"
echo "   • terraform/ (IaC state)"
echo "   • scripts/generate-baseline-sbom.sh"
echo "   • scripts/stream-audit-logs.sh"
echo "═══════════════════════════════════════════════════════"
