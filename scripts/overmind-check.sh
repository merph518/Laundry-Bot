#!/usr/bin/env bash
# Fail when the vendored skills under .claude/att-docs differ from the tree the
# lock file pins, so a hand edit to a vendored file cannot land. Works offline.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
LOCK=.claude/att-docs.lock
PREFIX=.claude/att-docs

if [ ! -f "$LOCK" ]; then
  echo "att-docs: no $LOCK"
  exit 1
fi

if ! git diff --quiet -- "$PREFIX"; then
  echo "att-docs: unstaged changes under $PREFIX"
  exit 1
fi

PINNED="$(sed -n 's/^tree=//p' "$LOCK")"
ACTUAL="$(git write-tree --prefix="$PREFIX/" 2>/dev/null || true)"
if [ -z "$PINNED" ] || [ "$PINNED" != "$ACTUAL" ]; then
  echo "att-docs: $PREFIX is tree '${ACTUAL:-missing}', the lock pins '${PINNED:-none}'"
  echo "att-docs: change the pin with scripts/overmind-sync.sh <tag>, never by hand"
  exit 1
fi
echo "att-docs: $PREFIX matches the pin $(sed -n 's/^tag=//p' "$LOCK")"
