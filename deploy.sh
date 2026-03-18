#!/bin/bash
set -e

REMOTE_USER="root"
REMOTE_HOST="123.57.180.180"
REMOTE_PATH="/var/www/denny"

echo "=== Denny Personal Site Deployment ==="

echo "1. Building project locally..."
npm install
npm run build

echo "2. Syncing files to server..."
rsync -avz --delete \
  -e "ssh -o StrictHostKeyChecking=no" \
  ./dist/ \
  ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/

echo "3. Done! Site should be live at http://123.57.180.180"
