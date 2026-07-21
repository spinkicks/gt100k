#!/bin/sh

set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repo_root=$(CDPATH= cd -- "$script_dir/.." && pwd)
temp_base=${TMPDIR:-/tmp}
temp_base=${temp_base%/}
[ -n "$temp_base" ] || temp_base=/tmp
temp_root=$(mktemp -d "$temp_base/gt100k-buf-generate.XXXXXX")

cleanup() {
	case "$temp_root" in
	"$temp_base"/gt100k-buf-generate.*) rm -rf -- "$temp_root" ;;
	*) printf '%s\n' "refusing to remove unexpected path: $temp_root" >&2 ;;
	esac
}
trap cleanup EXIT
trap 'exit 2' HUP INT TERM

mkdir -p "$temp_root/proto"
cp "$repo_root/buf.yaml" "$repo_root/buf.gen.yaml" "$temp_root/"
cp "$script_dir/buf.yaml" "$script_dir/buf.gen.yaml" "$script_dir/buf.lock" "$temp_root/proto/"
cp -R "$script_dir/gt100k" "$temp_root/proto/"

(cd "$temp_root" && buf generate proto)

if ! diff -ru "$script_dir/gen" "$temp_root/proto/gen"; then
	printf '%s\n' 'generated Go is stale; run buf generate proto and retain the updated output' >&2
	exit 1
fi

printf '%s\n' 'generated Go matches the Protobuf schema'
