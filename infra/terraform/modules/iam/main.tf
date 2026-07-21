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
}

variable "create_eks_roles" {
  type        = bool
  description = "Create EKS cluster/node roles; disable in a second post-cluster module instance used only for IRSA."
  default     = true
}

variable "oidc_provider_arn" {
  type     = string
  default  = null
  nullable = true
}

variable "oidc_issuer_url" {
  type     = string
  default  = null
  nullable = true
}

variable "irsa_roles" {
  type = map(object({
    namespace       = string
    service_account = string
    policy_arns     = set(string)
  }))
  description = "Explicit service-account-to-policy grants; no wildcard policy is created by this module."
  default     = {}

  validation {
    condition = (
      (length(var.irsa_roles) == 0 || (var.oidc_provider_arn != null && var.oidc_issuer_url != null)) &&
      alltrue(flatten([
        for role in values(var.irsa_roles) : [
          for policy_arn in role.policy_arns : can(regex("^arn:aws:iam::[0-9]{12}:policy/gt100k/.+", policy_arn))
        ]
      ]))
    )
    error_message = "IRSA roles require OIDC inputs and account-scoped policy ARNs under policy/gt100k/."
  }
}

locals {
  oidc_host = var.oidc_issuer_url == null ? "" : replace(var.oidc_issuer_url, "https://", "")
  eks_node_policy_arns = toset([
    "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
    "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
    "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
  ])
  policy_attachments = {
    for attachment in flatten([
      for role_name, role in var.irsa_roles : [
        for policy_arn in role.policy_arns : {
          key        = "${role_name}:${policy_arn}"
          role_name  = role_name
          policy_arn = policy_arn
        }
      ]
    ]) : attachment.key => attachment
  }
}

data "aws_iam_policy_document" "eks_cluster_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["eks.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "eks_node_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "eks_cluster" {
  count = var.create_eks_roles ? 1 : 0

  name               = "${var.name_prefix}-eks-cluster"
  assume_role_policy = data.aws_iam_policy_document.eks_cluster_trust.json
}

resource "aws_iam_role_policy_attachment" "eks_cluster" {
  count = var.create_eks_roles ? 1 : 0

  role       = aws_iam_role.eks_cluster[0].name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
}

resource "aws_iam_role" "eks_node" {
  count = var.create_eks_roles ? 1 : 0

  name               = "${var.name_prefix}-eks-node"
  assume_role_policy = data.aws_iam_policy_document.eks_node_trust.json
}

resource "aws_iam_role_policy_attachment" "eks_node" {
  for_each = var.create_eks_roles ? local.eks_node_policy_arns : toset([])

  role       = aws_iam_role.eks_node[0].name
  policy_arn = each.value
}

data "aws_iam_policy_document" "irsa_trust" {
  for_each = var.irsa_roles

  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [coalesce(var.oidc_provider_arn, "")]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.oidc_host}:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "${local.oidc_host}:sub"
      values   = ["system:serviceaccount:${each.value.namespace}:${each.value.service_account}"]
    }
  }
}

resource "aws_iam_role" "irsa" {
  for_each = var.irsa_roles

  name               = "${var.name_prefix}-${each.key}"
  assume_role_policy = data.aws_iam_policy_document.irsa_trust[each.key].json
}

resource "aws_iam_role_policy_attachment" "irsa" {
  for_each = local.policy_attachments

  role       = aws_iam_role.irsa[each.value.role_name].name
  policy_arn = each.value.policy_arn
}

output "role_arns" {
  value = { for name, role in aws_iam_role.irsa : name => role.arn }
}

output "cluster_role_arn" {
  value      = try(aws_iam_role.eks_cluster[0].arn, null)
  depends_on = [aws_iam_role_policy_attachment.eks_cluster]
}

output "node_role_arn" {
  value      = try(aws_iam_role.eks_node[0].arn, null)
  depends_on = [aws_iam_role_policy_attachment.eks_node]
}
