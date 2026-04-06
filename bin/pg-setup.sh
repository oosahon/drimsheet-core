#!/usr/bin/env bash
set -euo pipefail

if [ "${NODE_ENV:-}" != "test" ]; then
  echo "Skipping pg-setup: NODE_ENV is not 'test' (current: ${NODE_ENV:-})"
  exit 0
fi

ENV_FILE=".env.test"
POSTGRES_VOLUME="PurpleLedger_pg_data_test"

if [ ! -f "$ENV_FILE" ]; then
  echo "$ENV_FILE file not found"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if docker ps -a --format '{{.Names}}' | grep -q "^${POSTGRES_CONTAINER}$"; then
  echo "Container ${POSTGRES_CONTAINER} already exists, starting it..."
  docker start "${POSTGRES_CONTAINER}"
else
  echo "Creating new PostgreSQL container with persistent volume (${POSTGRES_VOLUME})..."
  docker run -d \
    --name "${POSTGRES_CONTAINER}" \
    -e POSTGRES_DB="${POSTGRES_DB}" \
    -e POSTGRES_USER="${POSTGRES_USER}" \
    -e POSTGRES_PASSWORD="${POSTGRES_PASSWORD}" \
    -p "${POSTGRES_PORT}:5432" \
    -v "${POSTGRES_VOLUME}:/var/lib/postgresql/data" \
    postgres:"${POSTGRES_VERSION}"
fi

echo "Waiting for PostgreSQL to be ready..."
until docker exec "${POSTGRES_CONTAINER}" pg_isready -U "${POSTGRES_USER}" >/dev/null 2>&1; do
  sleep 1
done

echo "PostgreSQL is ready to accept connections!"
