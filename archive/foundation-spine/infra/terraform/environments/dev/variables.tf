variable "aws_region" {
  type    = string
  default = "us-east-1"

  validation {
    condition     = contains(["us-east-1", "us-east-2", "us-west-1", "us-west-2"], var.aws_region)
    error_message = "aws_region must be a commercial US AWS region."
  }
}

variable "org_email_domain" {
  type        = string
  description = "Placeholder-safe domain used by the validate-only organization composition."
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

variable "cluster_admin_principal_arns" {
  type        = set(string)
  description = "Synthetic placeholders for explicit EKS administrators; replace only in an approved apply configuration."
  default     = ["arn:aws:iam::000000000000:role/gt100k/dev-admin"]
}

variable "oidc_thumbprint_list" {
  type        = set(string)
  description = "Synthetic OIDC root thumbprint placeholder used only for validate-only composition."
  default     = ["0000000000000000000000000000000000000000"]
}

variable "irsa_roles" {
  type = map(object({
    namespace       = string
    service_account = string
    policy_arns     = set(string)
  }))
  description = "Deferred account-scoped workload grants; empty for validate-only development."
  default     = {}
}
