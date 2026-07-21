#!/bin/sh

set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
temp_base=${TMPDIR:-/tmp}
temp_base=${temp_base%/}
[ -n "$temp_base" ] || temp_base=/tmp
temp_root=$(mktemp -d "$temp_base/gt100k-buf-breaking.XXXXXX")

cleanup() {
	case "$temp_root" in
	"$temp_base"/gt100k-buf-breaking.*) rm -rf -- "$temp_root" ;;
	*) printf '%s\n' "refusing to remove unexpected path: $temp_root" >&2 ;;
	esac
}
trap cleanup EXIT
trap 'exit 2' HUP INT TERM

copy_registry() {
	destination=$1
	mkdir -p "$destination"
	cp "$script_dir/buf.yaml" "$script_dir/buf.lock" "$destination/"
	cp -R "$script_dir/gt100k" "$destination/"
}

rewrite() {
	source_file=$1
	next_file=$2
	shift 2
	awk "$@" "$source_file" >"$next_file"
	mv "$next_file" "$source_file"
}

expect_lint_failure() {
	fixture=$1
	expected_rule=$2
	if output=$(cd "$fixture" && buf lint --error-format=json 2>&1); then
		printf '%s\n' "expected lint failure for $fixture" >&2
		exit 1
	fi
	case "$output" in
	*"$expected_rule"*) ;;
	*)
		printf '%s\n' "lint failed without $expected_rule:" "$output" >&2
		exit 1
		;;
	esac
}

expect_breaking_failure() {
	fixture=$1
	expected_rule=${2:-}
	if output=$(cd "$fixture" && buf breaking --against "$baseline" --error-format=json 2>&1); then
		printf '%s\n' "expected breaking failure for $fixture" >&2
		exit 1
	fi
	if [ -n "$expected_rule" ]; then
		case "$output" in
		*"$expected_rule"*) ;;
		*)
			printf '%s\n' "breaking check failed without $expected_rule:" "$output" >&2
			exit 1
			;;
		esac
	fi
}

baseline="$temp_root/baseline"
removed="$temp_root/removed"
renamed="$temp_root/renamed"
reused="$temp_root/reused"
added="$temp_root/added"
invalid_name="$temp_root/invalid-name"
empty_baseline="$temp_root/empty-baseline"

for fixture in "$baseline" "$removed" "$renamed" "$reused" "$added" "$invalid_name"; do
	copy_registry "$fixture"
done
mkdir -p "$empty_baseline"
cp "$script_dir/buf.yaml" "$script_dir/buf.lock" "$empty_baseline/"

envelope_path=gt100k/platform/v1/envelope.proto
decision_path=gt100k/platform/v1/decision.proto

rewrite "$removed/$envelope_path" "$removed/envelope.next" \
	'$0 != "  string tenant_id = 3;"'
rewrite "$renamed/$envelope_path" "$renamed/envelope.next" \
	'{ sub(/string tenant_id = 3;/, "string account_id = 3;"); print }'
rewrite "$reused/$envelope_path" "$reused/envelope.next" \
	'{ sub(/string tenant_id = 3;/, "bool replacement_tenant = 3;"); print }'
rewrite "$added/$decision_path" "$added/decision.next" \
	'/^}$/ && !done { print "  // new_note is an additive compatibility fixture."; print "  string new_note = 50;"; done=1 } { print }'
rewrite "$invalid_name/$envelope_path" "$invalid_name/envelope.next" \
	'{ sub(/string tenant_id = 3;/, "string TenantID = 3;"); print }'

for fixture in "$baseline" "$removed" "$renamed" "$reused" "$added"; do
	(cd "$fixture" && buf lint)
done

(cd "$baseline" && buf breaking --against "$baseline")
(cd "$added" && buf breaking --against "$baseline")
expect_breaking_failure "$removed" FIELD_NO_DELETE
expect_breaking_failure "$renamed" FIELD_SAME_NAME
expect_breaking_failure "$reused"
expect_lint_failure "$invalid_name" FIELD_LOWER_SNAKE_CASE

BUF_BREAKING_INPUT="$baseline" BUF_BREAKING_AGAINST="$empty_baseline" \
	"$script_dir/breaking_against_main.sh"
BUF_BREAKING_INPUT="$added" BUF_BREAKING_AGAINST="$baseline" \
	"$script_dir/breaking_against_main.sh"
if BUF_BREAKING_INPUT="$removed" BUF_BREAKING_AGAINST="$baseline" \
	"$script_dir/breaking_against_main.sh" >/dev/null 2>&1; then
	printf '%s\n' 'main compatibility gate accepted a field removal' >&2
	exit 1
fi

printf '%s\n' 'G-BUF compatibility fixtures passed'
