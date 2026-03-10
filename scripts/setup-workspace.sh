#!/usr/bin/env bash
set -euo pipefail

main_worktree=$(git worktree list --porcelain | awk 'NR==1 { sub(/^worktree /, ""); print; exit }')
this_dir=$(pwd)
assets_source="$main_worktree/assets"

if [ ! -d "$assets_source" ]; then
    echo "Error: assets/ folder not found in main worktree at $assets_source"
    exit 1
fi

if [ "$this_dir" = "$main_worktree" ]; then
    echo "Current directory is the main worktree; assets/ already lives here"
    exit 0
fi

if [ -L "assets" ]; then
    echo "assets/ symlink already exists, pointing to $(readlink assets)"
elif [ -e "assets" ]; then
    echo "Error: assets/ already exists and is not a symlink"
    exit 1
else
    ln -s "$assets_source" assets
    echo "Symlinked assets/ -> $assets_source"
fi
