#!/bin/sh

set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repo_root=$(CDPATH= cd -- "$script_dir/.." && pwd)
input=${BUF_BREAKING_INPUT:-$repo_root/proto}
against=${BUF_BREAKING_AGAINST:-.git#branch=main,subdir=proto}

if baseline_files=$(buf ls-files "$against" 2>&1); then
	if [ -z "$baseline_files" ]; then
		printf '%s\n' 'buf breaking: main has no schema baseline yet; bootstrap comparison skipped'
		exit 0
	fi
else
	case "$baseline_files" in
	*'had no .proto files'*)
		printf '%s\n' 'buf breaking: main has no schema baseline yet; bootstrap comparison skipped'
		exit 0
		;;
	*)
		printf '%s\n' "$baseline_files" >&2
		exit 1
		;;
	esac
fi

buf breaking "$input" --against "$against"
