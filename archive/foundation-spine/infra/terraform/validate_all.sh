#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
modules_dir="${script_dir}/modules"
terraform_data_root="$(mktemp -d)"
terraform_work_root="${terraform_data_root}/workspace"

cleanup() {
  rm -rf -- "${terraform_data_root}"
}
trap cleanup EXIT

if ! command -v terraform >/dev/null 2>&1; then
  printf 'validate_all: terraform is required\n' >&2
  exit 1
fi

shopt -s nullglob
module_dirs=("${modules_dir}"/*/)
environment_dirs=("${script_dir}/environments"/*/)
shopt -u nullglob

if ((${#module_dirs[@]} == 0)); then
  printf 'validate_all: no Terraform modules found under %s\n' "${modules_dir}" >&2
  exit 1
fi

mkdir -p "${terraform_work_root}"
cp -R -- "${script_dir}/." "${terraform_work_root}/"

config_dirs=("${module_dirs[@]}" "${environment_dirs[@]}")
for config_dir in "${config_dirs[@]}"; do
  config_dir="${config_dir%/}"
  config_relative_path="${config_dir#"${script_dir}/"}"
  config_data_name="${config_relative_path//\//-}"
  config_data_dir="${terraform_data_root}/data/${config_data_name}"
  config_work_dir="${terraform_work_root}/${config_relative_path}"
  mkdir -p "${config_data_dir}"

  printf '==> validating Terraform configuration %s\n' "${config_relative_path}"
  TF_DATA_DIR="${config_data_dir}" \
    terraform -chdir="${config_work_dir}" init -backend=false -input=false -no-color
  TF_DATA_DIR="${config_data_dir}" terraform -chdir="${config_work_dir}" validate -no-color
  TF_DATA_DIR="${config_data_dir}" terraform -chdir="${config_work_dir}" fmt -check -recursive
done
