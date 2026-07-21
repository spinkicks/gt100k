#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
dev_dir="${script_dir}/environments/dev"

fail() {
  printf 'dev_environment_contract_test: %s\n' "$*" >&2
  exit 1
}

require_file() {
  local path="$1"

  [[ -f "${dev_dir}/${path}" ]] || fail "missing environments/dev/${path}"
}

require_text() {
  local text="$1"
  local description="$2"

  rg -Fq --glob '*.tf' -- "${text}" "${dev_dir}" || fail "missing ${description}"
}

require_pattern() {
  local pattern="$1"
  local description="$2"

  rg -q --glob '*.tf' -- "${pattern}" "${dev_dir}" || fail "missing ${description}"
}

for file in versions.tf variables.tf main.tf outputs.tf terraform.tfvars.example .terraform.lock.hcl; do
  require_file "${file}"
done

require_text 'required_version = "~> 1.11"' 'the pinned Terraform constraint'
require_text 'source  = "hashicorp/aws"' 'the AWS provider declaration'
require_pattern 'provider[[:space:]]+"aws"' 'the environment AWS provider'
require_pattern 'region[[:space:]]*=[[:space:]]*var\.aws_region' 'variable-driven provider region'
for account_boundary in organization core identity; do
  require_text "alias  = \"${account_boundary}\"" "the ${account_boundary} provider boundary"
done
require_text 'providers = { aws = aws.organization }' 'organization provider routing'
require_text 'providers = { aws = aws.core }' 'Core provider routing'
require_text 'providers = { aws = aws.identity }' 'Identity provider routing'

declare -A module_sources=(
  [organization]='../../modules/bootstrap-org'
  [network]='../../modules/network-vpc'
  [identity_storage]='../../modules/s3-kms'
  [eks_base_iam]='../../modules/iam'
  [cluster]='../../modules/eks'
  [workload_irsa]='../../modules/iam'
  [database]='../../modules/rds'
  [event_runtime]='../../modules/event-runtime'
)

for module in "${!module_sources[@]}"; do
  require_pattern "module[[:space:]]+\"${module}\"" "the ${module} module block"
  require_text "source = \"${module_sources[${module}]}\"" "the ${module} module source"
done

require_pattern 'cluster_role_arn[[:space:]]*=[[:space:]]*module\.eks_base_iam\.cluster_role_arn' \
  'base IAM to EKS cluster-role wiring'
require_pattern 'node_role_arn[[:space:]]*=[[:space:]]*module\.eks_base_iam\.node_role_arn' \
  'base IAM to EKS node-role wiring'
require_pattern 'private_subnet_ids[[:space:]]*=[[:space:]]*module\.network\.private_subnet_ids' \
  'network subnet wiring'
require_pattern 'node_security_group_id[[:space:]]*=[[:space:]]*module\.network\.workload_security_group_id' \
  'default-deny node security-group wiring'
require_pattern 'oidc_provider_arn[[:space:]]*=[[:space:]]*module\.cluster\.oidc_provider_arn' \
  'EKS OIDC to post-cluster IRSA wiring'
require_pattern 'oidc_issuer_url[[:space:]]*=[[:space:]]*module\.cluster\.oidc_issuer_url' \
  'EKS issuer to post-cluster IRSA wiring'
require_pattern 'create_eks_roles[[:space:]]*=[[:space:]]*false' \
  'separate post-cluster IRSA role creation'
require_pattern 'kms_key_arn[[:space:]]*=[[:space:]]*module\.identity_storage\.kms_key_arn' \
  'KMS to encrypted PostgreSQL wiring'

for value in us-east-1 us-east-2 us-west-1 us-west-2; do
  require_text "${value}" "the ${value} commercial-US allowlist value"
done

example="${dev_dir}/terraform.tfvars.example"
for assignment in \
  'aws_region        = "us-east-1"' \
  'org_email_domain  = "example.invalid"' \
  'core_account_name = "gt100k-core"' \
  'identity_account_name = "gt100k-identity"'; do
  rg -Fq -- "${assignment}" "${example}" || fail "terraform.tfvars.example is missing ${assignment}"
done

if rg -n --glob '*.tf*' \
  '(terraform[[:space:]]+(plan|apply)|backend[[:space:]]+"|access_key[[:space:]]*=|secret_key[[:space:]]*=|/Users/|/home/)' \
  "${dev_dir}"; then
  fail 'dev composition contains a backend, credential, plan/apply path, or machine path'
fi

if rg -n --glob '*.tf*' '[1-9][0-9]{11}' "${dev_dir}"; then
  fail 'dev composition contains a non-placeholder AWS account identifier'
fi

printf 'dev_environment_contract_test: PASS\n'
