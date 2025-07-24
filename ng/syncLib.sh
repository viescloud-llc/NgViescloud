#!/bin/bash

# Get the current branch name
current_branch=$(git branch --show-current)
echo "Current branch: $current_branch"

# Prompt user for the branch to sync from
read -p "Enter the branch you want to sync from: " source_branch

# Check if the branch exists locally
if git show-ref --verify --quiet "refs/heads/$source_branch"; then
  echo "Branch '$source_branch' exists locally. Fetching latest..."
  git fetch origin "$source_branch":"$source_branch"
else
  echo "Branch '$source_branch' does not exist locally. Attempting to fetch from remote..."
  if git ls-remote --exit-code --heads origin "$source_branch" > /dev/null; then
    git fetch origin "$source_branch":"$source_branch"
    echo "Branch '$source_branch' fetched and created locally."
  else
    echo "Remote branch '$source_branch' does not exist. Aborting."
    exit 1
  fi
fi

# Restore specific files from the source branch
echo "Restoring files from branch '$source_branch'..."
git restore --source="$source_branch" src/styles.scss
git restore --source="$source_branch" src/themes.scss
git restore --source="$source_branch" src/lib/

echo "Restore complete."
