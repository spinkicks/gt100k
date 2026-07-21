#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source_script="${script_dir}/validate_all.sh"
test_dir="$(mktemp -d)"
trap 'rm -rf "${test_dir}"' EXIT

fail() {
  printf 'validate_all_test: %s\n' "$*" >&2
  exit 1
}

test_root="${test_dir}/infra/terraform"
fake_bin="${test_dir}/bin"
calls_file="${test_dir}/terraform.calls"
data_dirs_file="${test_dir}/terraform.data-dirs"

mkdir -p \
  "${test_root}/modules/alpha" \
  "${test_root}/modules/beta" \
  "${test_root}/environments/dev" \
  "${fake_bin}"
cp "${source_script}" "${test_root}/validate_all.sh"
chmod +x "${test_root}/validate_all.sh"
printf 'terraform {}\n' >"${test_root}/modules/alpha/main.tf"
printf 'terraform {}\n' >"${test_root}/modules/beta/main.tf"
printf 'terraform {}\n' >"${test_root}/environments/dev/main.tf"

cat >"${fake_bin}/terraform" <<'FAKE_TERRAFORM'
#!/usr/bin/env bash

set -euo pipefail

: "${TF_DATA_DIR:?validate_all must isolate Terraform data outside each module}"
mkdir -p "${TF_DATA_DIR}"
printf 'fake cache\n' >"${TF_DATA_DIR}/fake-cache"
printf '%s\n' "${TF_DATA_DIR}" >>"${TERRAFORM_DATA_DIRS}"
printf '%s\n' "$*" >>"${TERRAFORM_CALLS}"
module_dir="${1#-chdir=}"
printf 'fake provider lock\n' >"${module_dir}/.terraform.lock.hcl"
if [[ -n "${TERRAFORM_FAIL_MATCH:-}" && "$*" == *"${TERRAFORM_FAIL_MATCH}"* ]]; then
  exit 41
fi
FAKE_TERRAFORM
chmod +x "${fake_bin}/terraform"

PATH="${fake_bin}:${PATH}" TERRAFORM_CALLS="${calls_file}" \
  TERRAFORM_DATA_DIRS="${data_dirs_file}" \
  "${test_root}/validate_all.sh"

for module in alpha beta; do
  module_dir="${test_root}/modules/${module}"
  grep -Eq -- "-chdir=.*/${module} init -backend=false -input=false -no-color$" "${calls_file}" ||
    fail "${module} was not initialized with its backend disabled"
  grep -Eq -- "-chdir=.*/${module} validate -no-color$" "${calls_file}" ||
    fail "${module} was not validated"
  grep -Eq -- "-chdir=.*/${module} fmt -check -recursive$" "${calls_file}" ||
    fail "${module} was not format-checked"

  if grep -Fq -- "-chdir=${module_dir}" "${calls_file}"; then
    fail "${module} was initialized directly in the source tree"
  fi

  [[ ! -e "${module_dir}/.terraform.lock.hcl" ]] ||
    fail "terraform init left a dependency lock in source module ${module}"
done

grep -Eq -- '-chdir=.*/environments/dev init -backend=false -input=false -no-color$' "${calls_file}" ||
  fail 'the dev environment was not initialized with its backend disabled'
grep -Eq -- '-chdir=.*/environments/dev validate -no-color$' "${calls_file}" ||
  fail 'the dev environment was not validated'
grep -Eq -- '-chdir=.*/environments/dev fmt -check -recursive$' "${calls_file}" ||
  fail 'the dev environment was not format-checked'

if grep -Fq -- "-chdir=${test_root}/environments/dev" "${calls_file}"; then
  fail 'the dev environment was initialized directly in the source tree'
fi

[[ ! -e "${test_root}/environments/dev/.terraform.lock.hcl" ]] ||
  fail 'terraform init left a dependency lock in the source dev environment'

if grep -Eq -- '(^|[[:space:]])(apply|plan)([[:space:]]|$)' "${calls_file}"; then
  fail "validate-only gate invoked terraform plan or apply"
fi

if [[ "$(wc -l <"${calls_file}" | tr -d '[:space:]')" != "9" ]]; then
  fail "expected exactly three Terraform commands for each module and environment"
fi

while IFS= read -r data_dir; do
  if [[ -e "${data_dir}" ]]; then
    fail "temporary Terraform data remained after the gate completed"
  fi
done <"${data_dirs_file}"

for failing_command in init validate fmt; do
  : >"${calls_file}"
  if PATH="${fake_bin}:${PATH}" TERRAFORM_CALLS="${calls_file}" \
    TERRAFORM_DATA_DIRS="${data_dirs_file}" \
    TERRAFORM_FAIL_MATCH="/alpha ${failing_command}" "${test_root}/validate_all.sh"; then
    fail "a failed terraform ${failing_command} did not fail the gate"
  fi

  if grep -Fq -- 'modules/beta' "${calls_file}"; then
    fail "the gate continued after a failed module ${failing_command}"
  fi
done

printf 'validate_all_test: PASS\n'
