# GitHub Enterprise IaC - Operation: Iron Crucible
# Terraform configuration for sovereign organization setup

terraform {
  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }
}

provider "github" {
  token = var.github_token
  owner = var.organization_name
}

variable "github_token" {
  description = "GitHub Personal Access Token with admin:org scope"
  type        = string
  sensitive   = true
}

variable "organization_name" {
  description = "Sovereign Organization Name"
  type        = string
  default     = "sov-unified-field"
}

variable "region" {
  description = "AWS Region for self-hosted runners"
  type        = string
  default     = "us-east-1"
}

# ─────────────────────────────────────────────────────────────
# ORGANIZATION SETTINGS
# ─────────────────────────────────────────────────────────────

resource "github_organization_settings" "sovereign" {
  billing_email                          = "security@sov-unified-field.org"
  company                                = "Sovereign Core Shield"
  email                                  = "admin@sov-unified-field.org"
  twitter_username                       = ""
  blog                                   = "https://sov-unified-field.org"
  location                               = "Decentralized / AWS Multi-AZ"
  name                                   = "Sovereign Unified Field"
  description                            = "Enterprise-grade orchestration for decentralized guardianship"
  has_organization_projects              = true
  has_repository_projects                = true
  default_repository_permission          = "none"
  members_can_create_repositories        = false
  members_can_create_internal_repositories = false
  members_can_create_private_repositories  = false
  members_can_create_public_repositories   = false
  members_can_fork_private_repositories    = false
  web_commit_signoff_required            = true
}

# ─────────────────────────────────────────────────────────────
# TEAMS & RBAC (Role-Based Access Control)
# ─────────────────────────────────────────────────────────────

# Core Architects: Full control over critical infrastructure
resource "github_team" "core_architects" {
  name        = "Core-Architects"
  description = "Lead architects with sovereignty over core infrastructure"
  privacy     = "closed"
}

resource "github_team_repository" "architect_repos" {
  team_id    = github_team.core_architects.id
  repository = "*"
  permission = "admin"
}

# Pantheon Agents: CI/CD automation and deployment rights
resource "github_team" "pantheon_agents" {
  name        = "Pantheon-Agents"
  description = "Automated agents for deployment and orchestration"
  privacy     = "closed"
}

resource "github_team_repository" "agent_repos" {
  team_id    = github_team.pantheon_agents.id
  repository = "*"
  permission = "push"
}

# Auditors: Read-only access for compliance verification
resource "github_team" "auditors" {
  name        = "Auditors"
  description = "Compliance officers with immutable audit log access"
  privacy     = "closed"
}

resource "github_team_repository" "auditor_repos" {
  team_id    = github_team.auditors.id
  repository = "*"
  permission = "read"
}

# Security Operations: Secret management and vulnerability response
resource "github_team" "security_ops" {
  name        = "Security-Ops"
  description = "Security team for vulnerability management and incident response"
  privacy     = "closed"
}

resource "github_team_repository" "security_repos" {
  team_id    = github_team.security_ops.id
  repository = "*"
  permission = "admin"
}

# ─────────────────────────────────────────────────────────────
# ORGANIZATION RULESETS (Global Branch Protection)
# ─────────────────────────────────────────────────────────────

resource "github_organization_ruleset" "sovereign_main" {
  name        = "sovereign-main-protection"
  target      = "branch"
  enforcement = "active"

  branches_include {
    pattern = "~DEFAULT_BRANCH~"
  }

  conditions {
    ref_name {
      include = ["~DEFAULT_BRANCH~", "main", "master", "production"]
    }
  }

  # Require pull request before merging
  rule_pull_request {
    required_approving_review_count   = 2
    dismiss_stale_reviews_on_push     = true
    require_code_owner_review         = true
    require_last_push_approval        = true
    required_review_thread_resolution = true
  }

  # Require status checks to pass
  rule_required_status_checks {
    strict_required_status_checks_policy = true
    required_status_check {
      check = "CI/CD Pipeline Validation"
    }
    required_status_check {
      check = "Security Scan (CodeQL)"
    }
    required_status_check {
      check = "Secret Detection"
    }
  }

  # Prevent force pushes and deletions
  rule_force_pushes       = false
  rule_deletions          = false
  rule_linear_history     = true
  rule_merge_queue        = true
  rule_non_fast_forward   = false
}

# ─────────────────────────────────────────────────────────────
# SECURITY & COMPLIANCE
# ─────────────────────────────────────────────────────────────

resource "github_organization_security_manager" "security_team" {
  team_id = github_team.security_ops.id
}

resource "github_dependabot_organization_secret_scan_alerts" "enabled" {
  visibility = "all"
}

# Enable code scanning defaults
resource "github_actions_organization_permissions" "code_scanning" {
  enabled_repositories             = "all"
  allow_actions_create_private     = false
  allow_actions_create_public      = false
  allowed_actions                  = "selected"
  selected_actions_url             = []
  enable_default_workflow_settings = true
}

# ─────────────────────────────────────────────────────────────
# SELF-HOSTED RUNNERS (AWS Fargate Integration)
# ─────────────────────────────────────────────────────────────

resource "github_actions_organization_secret" "aws_credentials" {
  secret_name     = "AWS_CREDENTIALS"
  plaintext_value = var.aws_credentials_json
  visibility      = "selected"
  selected_repository_ids = []
}

resource "github_actions_runner_group" "sovereign_runners" {
  name                     = "sovereign-fargate-runners"
  visibility               = "all"
  allows_public_repositories = false
  restricted_to_workflows    = true
  selected_workflows       = [
    "deploy-production.yml",
    "security-scan.yml",
    "chronos-sync.yml"
  ]
}

# ─────────────────────────────────────────────────────────────
# AUDIT LOG STREAMING CONFIGURATION
# ─────────────────────────────────────────────────────────────

output "organization_url" {
  value = "https://github.com/${var.organization_name}"
}

output "team_ids" {
  value = {
    core_architects = github_team.core_architects.id
    pantheon_agents = github_team.pantheon_agents.id
    auditors        = github_team.auditors.id
    security_ops    = github_team.security_ops.id
  }
}

output "ruleset_id" {
  value = github_organization_ruleset.sovereign_main.id
}

output "runner_group_id" {
  value = github_actions_runner_group.sovereign_runners.id
}
