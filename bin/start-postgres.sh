#!/bin/bash
set -e

# Load the environment variables to access POSTGRES_PORT
source .env

docker start ${POSTGRES_CONTAINER_NAME}
