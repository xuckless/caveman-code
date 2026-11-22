#!/usr/bin/env bash
# Creates identical scratch repos for every task in tasks.json: <root>/<id>/{a,b}.
# Usage: evals/setup.sh <root>   (then run evals/workflow.js via Claude Code's Workflow tool with args {root, skill, tasks})
set -euo pipefail
ROOT=${1:?usage: setup.sh <root>}
HERE=$(cd "$(dirname "$0")" && pwd)

mk_ts()  { mkdir -p "$1/src" "$1/test"; printf '{ "name": "task", "private": true, "type": "module",\n  "scripts": { "test": "node --test" } }\n' > "$1/package.json"; }
mk_py()  { mkdir -p "$1/src" "$1/tests"; touch "$1/src/__init__.py" "$1/tests/__init__.py"; }
mk_go()  { mkdir -p "$1"; printf 'module task\n\ngo 1.26\n' > "$1/go.mod"; }
mk_rs()  { cargo init --lib --name task --vcs none -q "$1"; }
mk_c()   { mkdir -p "$1/src" "$1/tests"; printf 'CFLAGS=-std=c11 -Wall -Wextra -Werror -O1\n\ntest:\n\t$(CC) $(CFLAGS) -Isrc src/*.c tests/*.c -o /tmp/run_tests_$$$$ && /tmp/run_tests_$$$$\n' > "$1/Makefile"; }
mk_zig() { mkdir -p "$1/src"; }

node -e 'for (const t of require(process.argv[1])) console.log(t.id, t.lang)' "$HERE/tasks.json" |
while read -r id lang; do
  for v in a b; do
    dir="$ROOT/$id/$v"
    "mk_$lang" "$dir"
    if [ -d "$HERE/seeds/$id" ]; then cp -r "$HERE/seeds/$id/." "$dir/"; fi
  done
done
echo "created $(ls "$ROOT" | wc -l) tasks in $ROOT"
