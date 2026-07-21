#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
modules_dir="${script_dir}/modules"

fail() {
  printf 'modules_contract_test: %s\n' "$*" >&2
  exit 1
}

require_text() {
  local module="$1"
  local text="$2"
  local description="$3"

  rg -Fq --glob '*.tf' -- "${text}" "${modules_dir}/${module}" ||
    fail "${module} is missing ${description}"
}

require_pattern() {
  local module="$1"
  local pattern="$2"
  local description="$3"

  rg -q --glob '*.tf' -- "${pattern}" "${modules_dir}/${module}" ||
    fail "${module} is missing ${description}"
}

required_modules=(bootstrap-org network-vpc eks rds s3-kms iam event-runtime)
aws_modules=(bootstrap-org network-vpc eks rds s3-kms iam)

for module in "${required_modules[@]}"; do
  module_dir="${modules_dir}/${module}"
  [[ -d "${module_dir}" ]] || fail "missing module directory ${module}"

  mapfile -t terraform_files < <(rg --files "${module_dir}" | rg '\.tf$')
  ((${#terraform_files[@]} > 0)) || fail "${module} has no Terraform files"

  require_text "${module}" 'required_version = "~> 1.11"' 'the pinned Terraform constraint'
done

for module in "${aws_modules[@]}"; do
  require_text "${module}" 'source  = "hashicorp/aws"' 'the AWS provider declaration'
  require_text "${module}" 'data "aws_region" "current"' 'provider-region inspection'
  require_text "${module}" 'us-east-1' 'the explicit commercial US region allowlist'
  require_text "${module}" 'us-west-2' 'the explicit commercial US region allowlist'

  if rg -q --glob '*.tf' '^[[:space:]]*provider[[:space:]]+"aws"' "${modules_dir}/${module}"; then
    fail "${module} embeds an AWS provider instead of accepting an injected provider"
  fi
done

if rg -n --glob '*.tf' \
  '(terraform[[:space:]]+(plan|apply)|backend[[:space:]]+"|access_key[[:space:]]*=|secret_key[[:space:]]*=)' \
  "${modules_dir}"; then
  fail 'module source contains a backend, cloud credential, or plan/apply path'
fi

require_text bootstrap-org 'resource "aws_organizations_organization"' 'the AWS Organization'
require_text bootstrap-org 'resource "aws_organizations_organizational_unit"' 'account boundaries'
require_text bootstrap-org 'resource "aws_organizations_account"' 'Core and Identity accounts'
for boundary in core identity public-release workload-sandbox sensitive-research; do
  require_text bootstrap-org "${boundary}" "the ${boundary} boundary"
done

require_text network-vpc 'resource "aws_vpc"' 'a VPC'
require_text network-vpc 'resource "aws_subnet" "private"' 'private subnets'
require_text network-vpc 'resource "aws_default_security_group" "default_deny"' 'the default-deny security group'
require_pattern network-vpc 'map_public_ip_on_launch[[:space:]]*=[[:space:]]*false' 'private subnet addressing'
require_text network-vpc '${var.aws_region}${each.key}' 'region-relative availability zones'
require_pattern network-vpc 'length\(var\.private_subnet_cidrs\)[[:space:]]*>=[[:space:]]*3' 'a three-AZ minimum'
require_text network-vpc 'resource "aws_vpc_endpoint" "interface"' 'private interface service endpoints'
require_text network-vpc 'resource "aws_vpc_endpoint" "s3"' 'the private S3 gateway endpoint'
require_text network-vpc 'resource "aws_vpc_security_group_egress_rule" "workload_dns_udp"' 'private DNS egress'
require_text network-vpc 'resource "aws_vpc_security_group_egress_rule" "workload_dns_tcp"' 'large private DNS response egress'
for service in ecr.api ecr.dkr sts ec2 autoscaling logs; do
  require_text network-vpc "${service}" "the ${service} private endpoint"
done

require_text eks 'resource "aws_eks_cluster"' 'an EKS cluster'
require_text eks 'resource "aws_eks_node_group"' 'managed compute'
require_pattern eks 'endpoint_public_access[[:space:]]*=[[:space:]]*false' 'a private Kubernetes API endpoint'
require_text eks 'resource "aws_eks_access_entry"' 'explicit cluster administrators'
require_text eks 'resource "aws_eks_access_policy_association"' 'cluster access policy bindings'
require_text eks 'resource "aws_iam_openid_connect_provider"' 'the IRSA OIDC provider'
require_text eks 'output "oidc_provider_arn"' 'the IRSA provider output'
require_text eks 'variable "node_security_group_id"' 'an explicit managed-node security group'
require_pattern eks 'length\(var\.private_subnet_ids\)[[:space:]]*>=[[:space:]]*3' 'a three-AZ subnet minimum'
require_text eks 'resource "aws_launch_template" "system"' 'managed-node security group attachment'
require_text eks 'resource "aws_vpc_security_group_ingress_rule" "cluster_api"' 'node-to-control-plane access'
require_text eks 'resource "aws_vpc_security_group_ingress_rule" "node_kubelet"' 'control-plane-to-kubelet access'

require_text rds 'resource "aws_db_instance"' 'PostgreSQL RDS'
require_pattern rds 'engine[[:space:]]*=[[:space:]]*"postgres"' 'the PostgreSQL engine'
require_pattern rds 'storage_encrypted[[:space:]]*=[[:space:]]*true' 'storage encryption'
require_pattern rds 'publicly_accessible[[:space:]]*=[[:space:]]*false' 'private database access'
require_pattern rds 'manage_master_user_password[[:space:]]*=[[:space:]]*true' 'AWS-managed credentials'
require_text rds 'backup_retention_period' 'the PITR retention input'
require_text rds 'vector' 'the pgvector extension contract'

require_text s3-kms 'resource "aws_kms_key"' 'a KMS hierarchy root'
require_text s3-kms 'resource "aws_s3_bucket_server_side_encryption_configuration"' 'KMS bucket encryption'
require_text s3-kms 'resource "aws_s3_bucket_public_access_block"' 'public-access denial'
require_text s3-kms 'resource "aws_s3_bucket_policy"' 'transport and encryption enforcement'
require_text s3-kms 'aws:SecureTransport' 'TLS-only bucket access'
require_text s3-kms 's3:x-amz-server-side-encryption' 'KMS-only object writes'
require_text s3-kms 'subject_key_alias_prefix' 'the per-subject key alias contract'
require_text s3-kms 'subject_encryption_context_key' 'the per-subject encryption-context contract'

require_text iam 'resource "aws_iam_role"' 'IRSA roles'
require_text iam 'resource "aws_iam_role_policy_attachment"' 'least-privilege policy attachments'
require_text iam 'sts:AssumeRoleWithWebIdentity' 'the IRSA trust action'
require_text iam 'eks.amazonaws.com' 'the EKS cluster trust policy'
require_text iam 'ec2.amazonaws.com' 'the EKS node trust policy'
require_text iam 'AmazonEKSClusterPolicy' 'the EKS cluster policy attachment'
require_text iam 'AmazonEKSWorkerNodePolicy' 'the EKS worker policy attachment'
require_text iam 'AmazonEKS_CNI_Policy' 'bootstrap CNI permissions before IRSA takeover'
require_text iam 'output "cluster_role_arn"' 'the EKS cluster role output'
require_text iam 'output "node_role_arn"' 'the EKS node role output'
require_text iam 'depends_on = [aws_iam_role_policy_attachment.eks_cluster]' 'cluster-policy attachment ordering'
require_text iam 'depends_on = [aws_iam_role_policy_attachment.eks_node]' 'node-policy attachment ordering'
require_text iam 'variable "create_eks_roles"' 'separate base-role and post-cluster IRSA composition'
require_text iam 'policy/gt100k/' 'the account-scoped IRSA policy path restriction'

require_text event-runtime 'variable "aws_region"' 'the managed-service region'
require_text event-runtime 'us-east-1' 'the explicit commercial US region allowlist'
require_text event-runtime 'us-west-2' 'the explicit commercial US region allowlist'
require_text event-runtime 'variable "redpanda_brokers"' 'Redpanda wiring'
require_text event-runtime 'variable "temporal_address"' 'Temporal wiring'
require_text event-runtime 'variable "temporal_namespace"' 'the Temporal namespace'
if rg -n --glob '*.tf' '^[[:space:]]*(resource|data|provider)[[:space:]]+"' \
  "${modules_dir}/event-runtime"; then
  fail 'event-runtime must contain wiring variables and outputs only'
fi

printf 'modules_contract_test: PASS\n'
