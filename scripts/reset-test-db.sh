#!/usr/bin/env bash
set -e

# Load env vars
if [ -f .env.test ]; then
  set -a
  source .env.test
  set +a
fi

export NODE_ENV=test

echo "Setting up PostgreSQL and Redis..."
yarn start:test:postgres
yarn start:test:redis

echo "Tearing down and setting up database migrations..."
yarn db:migrate down 9999 || true
yarn db:migrate up

echo "Running seeds..."
yarn test:seed

echo "Draining Redis data..."
docker exec "${REDIS_CONTAINER}" redis-cli flushall
