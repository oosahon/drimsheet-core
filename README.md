![Coverage Badge](./badges/coverage.svg)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

# Drimsheet

Drimsheet is an AI-powered, robust, auditable accounting software for companies, sole traders (business name owners), and individuals in Nigeria.\
It's a software for accountants and non-accountants alike.

Accounting-savvy users who want to be in control of everything can create journals, charts of accounts, etc.

Users with no accounting background are not left out. They can also track their income, expenses and taxes. Under the hood, Drimsheet will use accounting standards to set up their ledgers.\
\
Drimsheet was created with 💜 and distributed for free by [Osahon Oboite](https://osahon.dev)

## Table of Contents

- [Introduction](#introduction)
- [Requirements](#requirements)
- [Installation](#installation)
- [Running the core app](#running-the-core-app)
  - [Ingesting CBN exchange rates](#ingesting-cbn-exchange-rates)
  - [Testing](#testing)
  - [Linting and Formatting](#linting-and-formatting)
- [Documentation](#documentation)
- [Contributing](#contributing)

## Introduction

This repo contains the core accounting module of Drimsheet. It encompasses the central double-entry accounting engine, the Nigeria Tax Act (NTA) computation and filing integrations (via FIRS Tax ProMax), open banking reconciliations (via Mono), and exposes its tools securely to autonomous AI agents via an integrated Model Context Protocol (MCP) server.

## Requirements

- [PostgreSQL](https://www.postgresql.org/) (>=16)
- [Redis](https://redis.io/) (>=8)
- Node.js (>=20.18.1 as specified in `package.json`)
- npm
- AWS account for S3 storage
- API credentials for 3rd party integrations (Paystack, Mono, ZeptoMail) managed securely via Doppler

> **Note:** PostgreSQL and Redis can be installed locally or run as Docker containers using the [drimsheet-platforms](https://github.com/Drimsheet/drimsheet-platforms) repo.

## Installation

1. Clone the repo
2. Run `npm install`
3. Copy the environment variables from Doppler (dev) and save them in a `.env` file in the root directory. [Env URL](https://dashboard.doppler.com/workplace/b0fb8d6179aa66108eac/projects/drimsheet-core/configs/dev)

### Setting up platform services

The app requires running PostgreSQL and Redis instances. You have two options:

**Option A — Use the [drimsheet-platforms](https://github.com/Drimsheet/drimsheet-platforms) repo (recommended)**

1. Clone the [drimsheet-platforms](https://github.com/Drimsheet/drimsheet-platforms) repo
2. Follow its [Quick Start](https://github.com/Drimsheet/drimsheet-platforms#quick-start) instructions to spin up all services via Docker

**Option B — Install locally**

Install and run PostgreSQL and Redis on your machine and configure the connection details in your `.env` file.

### Running the core app

- Ensure PostgreSQL and Redis are running (see above)
- Run `npm run dev`
- The app should now be running on `http://localhost:${PORT}`

### Ingesting CBN exchange rates

After building the image and applying database migrations, run the standalone
one-shot process with:

```bash
yarn ingest:exchange-rates
```

The process fetches official CBN `centralrate` observations and uses 2024-01-01
as the initial boundary for each currency pair without stored history. On later
runs, the latest committed observation date for each pair becomes that pair's
inclusive cutoff. PostgreSQL exchange-rate observations are therefore the
ingestion progress record; no separate last-run state is configured or
maintained.

Selected observations are written transactionally to PostgreSQL. The process
retries bounded transient failures and exits non-zero after terminal failure.
It does not start the API or workers. Coolify owns the production cron schedule
and any platform-level rerun policy. The job requires `POSTGRES_URL` and may use
the same optional Sentry and Better Stack configuration as the API.

### Testing

Run the test suite:

```bash
npm test
```

### Linting and Formatting

Format your code before submitting a PR:

```bash
npm run format:all
```

## Documentation

**[Architecture Documentation](docs/README.md)**: A comprehensive guide to the system's architecture, including technical constraints, domain models, and architectural decisions.

## Contributing

Please read the [CONTRIBUTING.md](CONTRIBUTING.md) file for more information.

## License

This project is licensed under the [GNU Affero General Public License v3.0 (AGPLv3)](LICENSE).
