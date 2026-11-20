#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."

rm -rf -- _site
mkdir -- _site

core_files=(
    index.html desktop.css desktop.js mobile.css mobile-overrides.css
    mobile.js salon-palette.css site-data.js site-regions.js site-services.js
    site-runtime.js favicon-source.png logo-placeholder.svg media-placeholder.svg
)
for file in "${core_files[@]}"; do
    [[ -f "$file" && ! -L "$file" ]]
    cp -- "$file" _site/
done

shopt -s nullglob
for file in hero.webp profile.webp gallery-*.webp team-*.webp logo.webp logo.png logo.svg; do
    if [[ -f "$file" && ! -L "$file" ]]; then
        cp -- "$file" _site/
    fi
done

touch _site/.nojekyll
