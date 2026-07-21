terraform {
  required_version = "~> 1.11"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

locals {
  allowed_aws_regions = toset(["us-east-1", "us-east-2", "us-west-1", "us-west-2"])
}

data "aws_region" "current" {}

check "aws_region" {
  assert {
    condition     = contains(local.allowed_aws_regions, data.aws_region.current.name)
    error_message = "The injected AWS provider must target a commercial US region."
  }
}

variable "org_email_domain" {
  type        = string
  description = "Placeholder-safe domain used to derive account emails at apply time."
  default     = "example.invalid"
}

variable "core_account_name" {
  type    = string
  default = "gt100k-core"
}

variable "identity_account_name" {
  type    = string
  default = "gt100k-identity"
}

locals {
  boundaries = {
    core               = "core"
    identity           = "identity"
    public-release     = "public-release"
    workload-sandbox   = "workload-sandbox"
    sensitive-research = "sensitive-research"
  }

  provisioned_accounts = {
    core = {
      name       = var.core_account_name
      email_slug = "gt100k-core"
      boundary   = "core"
    }
    identity = {
      name       = var.identity_account_name
      email_slug = "gt100k-identity"
      boundary   = "identity"
    }
  }
}

resource "aws_organizations_organization" "this" {
  feature_set = "ALL"
}

resource "aws_organizations_organizational_unit" "boundary" {
  for_each = local.boundaries

  name      = each.value
  parent_id = aws_organizations_organization.this.roots[0].id
}

resource "aws_organizations_account" "workload" {
  for_each = local.provisioned_accounts

  name                       = each.value.name
  email                      = "${each.value.email_slug}@${var.org_email_domain}"
  parent_id                  = aws_organizations_organizational_unit.boundary[each.value.boundary].id
  role_name                  = "OrganizationAccountAccessRole"
  close_on_deletion          = false
  create_govcloud            = false
  iam_user_access_to_billing = "DENY"

  lifecycle {
    prevent_destroy = true
  }
}

output "organization_id" {
  value = aws_organizations_organization.this.id
}

output "account_ids" {
  value = { for name, account in aws_organizations_account.workload : name => account.id }
}

output "boundary_ou_ids" {
  value = { for name, boundary in aws_organizations_organizational_unit.boundary : name => boundary.id }
}
