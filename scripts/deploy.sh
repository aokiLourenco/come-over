#!/usr/bin/env bash
# Builds the static site and publishes it to the gh-pages branch.
set -euo pipefail

remote_url=$(git remote get-url origin)
repo=$(basename "$remote_url" .git)

rm -rf .next out
NEXT_PUBLIC_BASE_PATH="/$repo" npx next build
touch out/.nojekyll # Otherwise Pages skips the _next folder.

site=$(mktemp -d)
trap 'rm -rf "$site"' EXIT
cp -R out/. "$site"
git -C "$site" init -q -b gh-pages
git -C "$site" add -A
git -C "$site" commit -q -m "Deploy $(git rev-parse --short HEAD)"
git -C "$site" push -q --force "$remote_url" gh-pages
echo "Published from $(git rev-parse --short HEAD)"
