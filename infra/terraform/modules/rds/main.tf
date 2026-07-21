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

variable "identifier" {
  type    = string
  default = "gt100k"
}

variable "database_name" {
  type    = string
  default = "gt100k"
}

variable "master_username" {
  type    = string
  default = "gt100k_admin"
}

variable "private_subnet_ids" {
  type = list(string)

  validation {
    condition     = length(var.private_subnet_ids) >= 2
    error_message = "RDS requires at least two private subnets."
  }
}

variable "security_group_ids" {
  type = list(string)
}

variable "kms_key_arn" {
  type = string
}

variable "engine_version" {
  type    = string
  default = "16"
}

variable "parameter_group_family" {
  type    = string
  default = "postgres16"
}

variable "instance_class" {
  type    = string
  default = "db.m7g.large"
}

variable "allocated_storage_gib" {
  type    = number
  default = 100
}

variable "max_allocated_storage_gib" {
  type    = number
  default = 1000
}

variable "backup_retention_period" {
  type        = number
  description = "Days of automated backups retained for point-in-time recovery."
  default     = 35

  validation {
    condition     = var.backup_retention_period >= 1 && var.backup_retention_period <= 35
    error_message = "backup_retention_period must be between 1 and 35 days."
  }
}

variable "required_database_extensions" {
  type        = set(string)
  description = "Extensions installed by the deferred database migration path."
  default     = ["vector"]

  validation {
    condition     = contains(var.required_database_extensions, "vector")
    error_message = "required_database_extensions must include pgvector's vector extension."
  }
}

resource "aws_db_subnet_group" "this" {
  name       = "${var.identifier}-private"
  subnet_ids = var.private_subnet_ids
}

resource "aws_db_parameter_group" "this" {
  name   = "${var.identifier}-postgres"
  family = var.parameter_group_family

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }
}

resource "aws_db_instance" "this" {
  identifier                          = var.identifier
  allocated_storage                   = var.allocated_storage_gib
  max_allocated_storage               = var.max_allocated_storage_gib
  storage_type                        = "gp3"
  engine                              = "postgres"
  engine_version                      = var.engine_version
  instance_class                      = var.instance_class
  db_name                             = var.database_name
  username                            = var.master_username
  manage_master_user_password         = true
  master_user_secret_kms_key_id       = var.kms_key_arn
  db_subnet_group_name                = aws_db_subnet_group.this.name
  vpc_security_group_ids              = var.security_group_ids
  parameter_group_name                = aws_db_parameter_group.this.name
  storage_encrypted                   = true
  kms_key_id                          = var.kms_key_arn
  multi_az                            = true
  publicly_accessible                 = false
  backup_retention_period             = var.backup_retention_period
  iam_database_authentication_enabled = true
  deletion_protection                 = true
  skip_final_snapshot                 = false
  final_snapshot_identifier           = "${var.identifier}-final"
  copy_tags_to_snapshot               = true
  auto_minor_version_upgrade          = true
}

output "instance_id" {
  value = aws_db_instance.this.id
}

output "endpoint" {
  value     = aws_db_instance.this.endpoint
  sensitive = true
}

output "master_user_secret_arn" {
  value     = aws_db_instance.this.master_user_secret[0].secret_arn
  sensitive = true
}

output "required_database_extensions" {
  value = var.required_database_extensions
}
