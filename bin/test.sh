#!/usr/bin/env bash
set -e

# Load env vars
if [ -f .env.test ]; then
  set -a
  source .env.test
  set +a
fi

# Start dev services
npx cross-env NODE_ENV=test concurrently \
  "npm run start:postgres" \
  "npm run start:redis" \
  "npm run db:migrate" \
  "nodemon" \
  "nodemon -x 'tsoa spec-and-routes -c tsoa.json'"
