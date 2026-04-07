#!/bin/bash
set -euo pipefail

ENV="${1:?Usage: deploy.sh <staging|production>}"
BASE_DIR="/home/web/projects/${ENV}/myweb"
KEEP_RELEASES=5
RELEASE_DIR="${BASE_DIR}/releases/$(date +%Y%m%d-%H%M%S)"

mkdir -p "${RELEASE_DIR}"

# dist/ is rsync'd to RELEASE_DIR/dist/ by CI before this script runs

# Atomic symlink swap
ln -sfn "${RELEASE_DIR}" "${BASE_DIR}/current"

# Prune old releases (keep last N)
cd "${BASE_DIR}/releases"
ls -1dt */ | tail -n +$((KEEP_RELEASES + 1)) | xargs -r rm -rf

echo "Deployed ${ENV} to ${RELEASE_DIR}"
