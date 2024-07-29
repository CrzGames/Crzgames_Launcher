#!/bin/bash

# Chemin vers le fichier tauri.conf.json
conf_file="src-tauri/tauri.conf.json"

# Déterminer la branche ou le tag actuel
if [[ -n "$GITHUB_REF" ]]; then
  # GitHub Actions
  ref_type=$(echo "$GITHUB_REF" | cut -d'/' -f2)
  if [[ "$ref_type" == "heads" ]]; then
    branch=$(echo "$GITHUB_REF" | cut -d'/' -f3)
  elif [[ "$ref_type" == "tags" ]]; then
    branch="main"
  else
    echo "Unsupported ref type: $ref_type"
    exit 1
  fi
else
  # Local environment
  branch=$(git rev-parse --abbrev-ref HEAD)
fi

# Affichage de la branche ou du tag pour le débogage
echo "Current branch or tag: $branch"

if [[ $branch == "main" ]]; then
  npm run web:build:static:prod
elif [[ $branch == "staging" ]]; then
  npm run web:build:static:staging
else
  npm run web:build:static:develop
fi
