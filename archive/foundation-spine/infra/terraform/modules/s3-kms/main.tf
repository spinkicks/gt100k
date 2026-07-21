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

variable "name_prefix" {
  type    = string
  default = "gt100k"

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$", var.name_prefix))
    error_message = "name_prefix must be a short lowercase bucket-safe prefix."
  }
}

variable "subject_key_alias_prefix" {
  type        = string
  description = "Alias prefix reserved for deferred per-subject data keys."
  default     = "alias/gt100k/subjects"
}

variable "subject_encryption_context_key" {
  type        = string
  description = "Encryption-context key required by the deferred per-subject key hierarchy."
  default     = "gt100k:subject_ref"
}

locals {
  buckets = {
    artifacts = "artifacts"
    audit     = "audit"
  }
}

resource "aws_kms_key" "data" {
  description             = "GT100K envelope encryption hierarchy root"
  enable_key_rotation     = true
  deletion_window_in_days = 30
  key_usage               = "ENCRYPT_DECRYPT"
  multi_region            = false
}

resource "aws_kms_alias" "data" {
  name          = "alias/${var.name_prefix}/data"
  target_key_id = aws_kms_key.data.key_id
}

resource "aws_s3_bucket" "data" {
  for_each = local.buckets

  bucket_prefix = "${var.name_prefix}-${each.value}-"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_public_access_block" "data" {
  for_each = aws_s3_bucket.data

  bucket                  = each.value.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "data" {
  for_each = aws_s3_bucket.data

  bucket = each.value.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "data" {
  for_each = aws_s3_bucket.data

  bucket = each.value.id

  rule {
    bucket_key_enabled = true

    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.data.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

data "aws_iam_policy_document" "bucket" {
  for_each = aws_s3_bucket.data

  statement {
    sid     = "DenyInsecureTransport"
    effect  = "Deny"
    actions = ["s3:*"]
    resources = [
      each.value.arn,
      "${each.value.arn}/*",
    ]

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }

  statement {
    sid       = "DenySSES3ObjectWrites"
    effect    = "Deny"
    actions   = ["s3:PutObject"]
    resources = ["${each.value.arn}/*"]

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-server-side-encryption"
      values   = ["AES256"]
    }
  }

  statement {
    sid       = "DenyWrongKMSKey"
    effect    = "Deny"
    actions   = ["s3:PutObject"]
    resources = ["${each.value.arn}/*"]

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-server-side-encryption"
      values   = ["aws:kms"]
    }

    condition {
      test     = "StringNotEquals"
      variable = "s3:x-amz-server-side-encryption-aws-kms-key-id"
      values   = [aws_kms_key.data.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "data" {
  for_each = aws_s3_bucket.data

  bucket = each.value.id
  policy = data.aws_iam_policy_document.bucket[each.key].json
}

output "kms_key_arn" {
  value = aws_kms_key.data.arn
}

output "bucket_ids" {
  value = { for name, bucket in aws_s3_bucket.data : name => bucket.id }
}

output "subject_key_hierarchy" {
  value = {
    alias_prefix           = var.subject_key_alias_prefix
    encryption_context_key = var.subject_encryption_context_key
    root_key_arn           = aws_kms_key.data.arn
  }
}
