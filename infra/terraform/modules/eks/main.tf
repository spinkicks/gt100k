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

variable "cluster_name" {
  type    = string
  default = "gt100k"
}

variable "cluster_role_arn" {
  type = string
}

variable "node_role_arn" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)

  validation {
    condition     = length(var.private_subnet_ids) >= 3
    error_message = "EKS requires at least three private subnets."
  }
}

variable "security_group_ids" {
  type    = list(string)
  default = []
}

variable "node_security_group_id" {
  type        = string
  description = "Default-deny workload security group attached to every managed node."
}

variable "cluster_admin_principal_arns" {
  type        = set(string)
  description = "Explicit IAM principals granted the EKS cluster-admin access policy."

  validation {
    condition = (
      length(var.cluster_admin_principal_arns) > 0 &&
      alltrue([for arn in var.cluster_admin_principal_arns : can(regex("^arn:aws:iam::[0-9]{12}:(role|user)/.+", arn))])
    )
    error_message = "At least one account-scoped IAM role or user ARN must administer the cluster."
  }
}

variable "oidc_thumbprint_list" {
  type        = set(string)
  description = "SHA-1 root certificate thumbprints approved for the EKS OIDC provider."

  validation {
    condition = (
      length(var.oidc_thumbprint_list) > 0 &&
      alltrue([for thumbprint in var.oidc_thumbprint_list : can(regex("^[0-9a-fA-F]{40}$", thumbprint))])
    )
    error_message = "At least one 40-character SHA-1 OIDC root thumbprint is required."
  }
}

variable "kubernetes_version" {
  type    = string
  default = null
}

variable "node_instance_types" {
  type    = list(string)
  default = ["m7i.large"]
}

variable "node_min_size" {
  type    = number
  default = 2
}

variable "node_desired_size" {
  type    = number
  default = 2
}

variable "node_max_size" {
  type    = number
  default = 4
}

resource "aws_eks_cluster" "this" {
  name     = var.cluster_name
  role_arn = var.cluster_role_arn
  version  = var.kubernetes_version

  access_config {
    authentication_mode                         = "API_AND_CONFIG_MAP"
    bootstrap_cluster_creator_admin_permissions = false
  }

  vpc_config {
    endpoint_private_access = true
    endpoint_public_access  = false
    security_group_ids      = var.security_group_ids
    subnet_ids              = var.private_subnet_ids
  }
}

resource "aws_eks_access_entry" "admin" {
  for_each = var.cluster_admin_principal_arns

  cluster_name  = aws_eks_cluster.this.name
  principal_arn = each.value
  type          = "STANDARD"
}

resource "aws_eks_access_policy_association" "admin" {
  for_each = var.cluster_admin_principal_arns

  cluster_name  = aws_eks_cluster.this.name
  principal_arn = aws_eks_access_entry.admin[each.key].principal_arn
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"

  access_scope {
    type = "cluster"
  }
}

resource "aws_iam_openid_connect_provider" "this" {
  url             = aws_eks_cluster.this.identity[0].oidc[0].issuer
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = var.oidc_thumbprint_list
}

locals {
  cluster_security_group_id = aws_eks_cluster.this.vpc_config[0].cluster_security_group_id
}

resource "aws_vpc_security_group_ingress_rule" "cluster_api" {
  security_group_id            = local.cluster_security_group_id
  referenced_security_group_id = var.node_security_group_id
  ip_protocol                  = "tcp"
  from_port                    = 443
  to_port                      = 443
}

resource "aws_vpc_security_group_egress_rule" "node_cluster_api" {
  security_group_id            = var.node_security_group_id
  referenced_security_group_id = local.cluster_security_group_id
  ip_protocol                  = "tcp"
  from_port                    = 443
  to_port                      = 443
}

resource "aws_vpc_security_group_ingress_rule" "node_kubelet" {
  security_group_id            = var.node_security_group_id
  referenced_security_group_id = local.cluster_security_group_id
  ip_protocol                  = "tcp"
  from_port                    = 10250
  to_port                      = 10250
}

resource "aws_vpc_security_group_egress_rule" "cluster_kubelet" {
  security_group_id            = local.cluster_security_group_id
  referenced_security_group_id = var.node_security_group_id
  ip_protocol                  = "tcp"
  from_port                    = 10250
  to_port                      = 10250
}

resource "aws_vpc_security_group_ingress_rule" "node_internal" {
  security_group_id            = var.node_security_group_id
  referenced_security_group_id = var.node_security_group_id
  ip_protocol                  = "-1"
}

resource "aws_vpc_security_group_egress_rule" "node_internal" {
  security_group_id            = var.node_security_group_id
  referenced_security_group_id = var.node_security_group_id
  ip_protocol                  = "-1"
}

resource "aws_launch_template" "system" {
  name_prefix            = "${var.cluster_name}-system-"
  update_default_version = true
  vpc_security_group_ids = [var.node_security_group_id]

  metadata_options {
    http_endpoint               = "enabled"
    http_protocol_ipv6          = "disabled"
    http_put_response_hop_limit = 2
    http_tokens                 = "required"
    instance_metadata_tags      = "disabled"
  }

  tag_specifications {
    resource_type = "instance"

    tags = {
      Name = "${var.cluster_name}-system"
    }
  }
}

resource "aws_eks_node_group" "system" {
  cluster_name    = aws_eks_cluster.this.name
  node_group_name = "${var.cluster_name}-system"
  node_role_arn   = var.node_role_arn
  subnet_ids      = var.private_subnet_ids
  capacity_type   = "ON_DEMAND"
  instance_types  = var.node_instance_types

  launch_template {
    id      = aws_launch_template.system.id
    version = aws_launch_template.system.latest_version
  }

  scaling_config {
    desired_size = var.node_desired_size
    max_size     = var.node_max_size
    min_size     = var.node_min_size
  }

  update_config {
    max_unavailable = 1
  }

  lifecycle {
    precondition {
      condition = (
        var.node_min_size <= var.node_desired_size &&
        var.node_desired_size <= var.node_max_size
      )
      error_message = "Node scaling must satisfy min <= desired <= max."
    }
  }

  depends_on = [
    aws_vpc_security_group_ingress_rule.cluster_api,
    aws_vpc_security_group_egress_rule.node_cluster_api,
    aws_vpc_security_group_ingress_rule.node_kubelet,
    aws_vpc_security_group_egress_rule.cluster_kubelet,
    aws_vpc_security_group_ingress_rule.node_internal,
    aws_vpc_security_group_egress_rule.node_internal,
  ]
}

output "cluster_name" {
  value = aws_eks_cluster.this.name
}

output "cluster_arn" {
  value = aws_eks_cluster.this.arn
}

output "cluster_endpoint" {
  value     = aws_eks_cluster.this.endpoint
  sensitive = true
}

output "oidc_issuer_url" {
  value = aws_eks_cluster.this.identity[0].oidc[0].issuer
}

output "oidc_provider_arn" {
  value = aws_iam_openid_connect_provider.this.arn
}
