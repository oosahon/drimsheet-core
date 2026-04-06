#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=".env"
REDIS_VOLUME="purple_ledger_redis_data"

if [ "${NODE_ENV:-}" = "test" ]; then
  ENV_FILE=".env.test"
  REDIS_VOLUME="purple_ledger_redis_data_test"
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "$ENV_FILE file not found"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

required_vars=(REDIS_CONTAINER REDIS_PORT REDIS_VERSION)
for var in "${required_vars[@]}"; do
  if [ -z "${!var:-}" ]; then
    echo "Missing required env var: $var"
    exit 1
  fi
done

if docker ps -a --format '{{.Names}}' | grep -q "^${REDIS_CONTAINER}$"; then
  echo "Container ${REDIS_CONTAINER} already exists, starting it..."
  docker start "${REDIS_CONTAINER}"
else
  echo "Creating new Redis container with persistent volume (${REDIS_VOLUME})..."
  docker run -d \
    --name "${REDIS_CONTAINER}" \
    -p "${REDIS_PORT}:6379" \
    -v "${REDIS_VOLUME}:/data" \
    ${REDIS_PASSWORD:+-e REDIS_PASSWORD="$REDIS_PASSWORD"} \
    redis:"${REDIS_VERSION}" \
    redis-server --appendonly yes
fi

echo "Waiting for Redis..."
until docker exec "${REDIS_CONTAINER}" redis-cli ping >/dev/null 2>&1; do
  sleep 1
done

echo "Redis is ready at port ${REDIS_PORT}"
if [ -n "${REDIS_PASSWORD:-}" ]; then
  echo "Password protected"
fi
