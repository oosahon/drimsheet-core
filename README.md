![Coverage Badge](./badges/coverage.svg)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

# PurpleLedger

PurpleLedger is an AI-powered, robust, auditable accounting software for companies, sole traders (business name owners), and individuals in Nigeria.\
It's a software for accountants and non-accountants alike.

Accounting-savvy users who want to be in control of everything can create journals, charts of accounts, etc.

Users with no accounting background are not left out. They can also track their income, expenses and taxes. Under the hood, PurpleLedger will use accounting standards to set up their ledgers.\
\
PurpleLedger was created with 💜 and distributed for free by [Osahon Oboite](https://osahon.dev)

## Table of Contents

- [Introduction](#introduction)
- [Requirements](#requirements)
- [Installation](#installation)
- [Running the core app](#running-the-core-app)
  - [Testing](#testing)
  - [Linting and Formatting](#linting-and-formatting)
- [Documentation](#documentation)
- [Contributing](#contributing)

## Introduction

This repo contains the core accounting module of PurpleLedger. It encompasses the central double-entry accounting engine, the Nigeria Tax Act (NTA) computation and filing integrations (via FIRS Tax ProMax), open banking reconciliations (via Mono), and exposes its tools securely to autonomous AI agents via an integrated Model Context Protocol (MCP) server.

## Requirements

- Docker (for local PostgreSQL and Redis databases)
- Node.js (>=20.18.1 as specified in `package.json`)
- npm
- AWS account for S3 storage
- API credentials for 3rd party integrations (Paystack, Mono, ZeptoMail) managed securely via Doppler

## Installation

- Clone the repo
- Run `npm install`
- Copy the environment variables from Doppler (dev) and save them in a `.env` file in the root directory. [Env URL](https://dashboard.doppler.com/workplace/b0fb8d6179aa66108eac/projects/purple-ledger-be/configs/dev)

### Setting up the PostgreSQL database

- Clone the [postgres schema repo](https://github.com/oosahon/PurpleLedger-db-schema)
- Follow the instructions in the repo to set up the database.

### Running the core app

- Run `npm run dev`
- The app should now be running on `http://localhost:${PORT}`

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
