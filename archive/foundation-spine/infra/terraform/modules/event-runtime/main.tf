terraform {
  required_version = "~> 1.11"
}

variable "aws_region" {
  type    = string
  default = "us-east-1"

  validation {
    condition     = contains(["us-east-1", "us-east-2", "us-west-1", "us-west-2"], var.aws_region)
    error_message = "aws_region must be a commercial US AWS region."
  }
}

variable "redpanda_brokers" {
  type        = list(string)
  description = "Managed Redpanda bootstrap endpoints supplied by the environment."
  default     = []
}

variable "redpanda_topic_prefix" {
  type    = string
  default = "gt100k"
}

variable "redpanda_tls_enabled" {
  type    = bool
  default = true
}

variable "redpanda_credentials_secret_arn" {
  type        = string
  description = "Optional secret reference only; secret material never enters Terraform source."
  default     = null
  nullable    = true
}

variable "temporal_address" {
  type        = string
  description = "Managed Temporal endpoint supplied by the environment."
  default     = ""
}

variable "temporal_namespace" {
  type    = string
  default = "gt100k-dev"
}

variable "temporal_task_queue" {
  type    = string
  default = "gt100k-deletion"
}

variable "temporal_tls_enabled" {
  type    = bool
  default = true
}

variable "temporal_credentials_secret_arn" {
  type        = string
  description = "Optional secret reference only; secret material never enters Terraform source."
  default     = null
  nullable    = true
}

output "region" {
  value = var.aws_region
}

output "redpanda" {
  value = {
    brokers                = var.redpanda_brokers
    topic_prefix           = var.redpanda_topic_prefix
    tls_enabled            = var.redpanda_tls_enabled
    credentials_secret_arn = var.redpanda_credentials_secret_arn
  }
  sensitive = true
}

output "temporal" {
  value = {
    address                = var.temporal_address
    namespace              = var.temporal_namespace
    task_queue             = var.temporal_task_queue
    tls_enabled            = var.temporal_tls_enabled
    credentials_secret_arn = var.temporal_credentials_secret_arn
  }
  sensitive = true
}
