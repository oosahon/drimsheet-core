#!/usr/bin/env bash
set -e

# Load env vars
if [ -f .env.test ]; then
  set -a
  source .env.test
  set +a
fi

export NODE_ENV=test

# NOTE: Infrastructure (Postgres, Redis, RabbitMQ) should be started
# separately via purple-ledger-platforms: bash bin/start.sh --test


echo "Tearing down and setting up database migrations..."
yarn db:migrate down 9999 || true
yarn db:migrate up

echo "Running seeds..."
yarn test:seed

echo "Draining Redis data..."
docker exec "${REDIS_CONTAINER}" redis-cli flushall
