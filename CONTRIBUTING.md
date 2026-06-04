# Contributing to Purple Ledger

This document provides guidelines for contributing to this project to ensure a smooth workflow and high-quality code.

## Table of Contents

- [Design Pattern](#design-pattern)
  - [Pragmatic Functional OOP](#pragmatic-functional-oop)
  - [Event-Driven Pattern and Immutability](#event-driven-pattern-and-immutability)
  - [Folder Structure](#folder-structure)
- [Domain Documentation](#domain-documentation)
- [Working with Money](#working-with-money)
- [Git Workflow](#git-workflow)
  - [Branching Strategy](#branching-strategy)
  - [Feature Branches](#feature-branches)
  - [Commit Messages & Pull Requests](#commit-messages--pull-requests)
- [Testing](#testing)
- [Reporting Bugs](#reporting-bugs)

## Design Pattern

### Pragmatic Functional OOP

- All entities, services, repos, and use-cases are pure functions (causing no side effect).
- All similar functions are grouped in an immutable object
- Function/Methods do not call external services directly. Dependencies are wired up in `index.ts` of each feature or sub-layer.\
  for example, `src/app/bookkeeping/usecases/index.ts` or `src/infra/services/index.ts`.

### Event-Driven Pattern and Immutability

- Domain entity creations or mutations MUST return both the new entity state and any corresponding domain events (e.g., `return [entity, events]`).
- Domain publishing is done on the application layer.

- **Strong Immutability**: All domain entities and state objects MUST be deeply frozen (e.g., using `deepFreeze()`) to prevent accidental mutations.\
  See `src/domain/journal-entry/entities/journal-entry.entity.ts` or `src/domain/ledger/entities/shared/ledger-account.entity.ts` for reference.

### Folder Structure

For the folder structure, we have favored Domain Driven Design.

> For a deeper architectural understanding of how these layers interact and the dependency rules between them, please read **[Section 5: Building Block View](docs/05_building_block_view.md)**.

Here are the top level folders you would find on the application:

```text

src/
├─ app/                 # Application layer: orchestrates use-cases, handles commands, maps data between domain and external interfaces
│  ├─ _bootstrap/       # Application bootstrap logic and server initialization
│  ├─ _internal/        # Internal-only application use cases
│  ├─ accounting/       # Accounting feature: dtos, handlers, mappers, use cases
│  ├─ auth/             # Authentication feature: contracts, dtos, errors, mappers, use cases
│  ├─ bookkeeping/      # Bookkeeping feature: dtos, handlers, mappers, use cases
│  ├─ currency/         # Currency feature: mappers and use cases
│  ├─ ledger/           # Ledger feature: dtos, errors, handlers, mappers, use cases
│  ├─ shared/           # App-layer shared context, contracts, dtos, errors, handlers, and mappers
│  └─ user/             # User feature: dtos, handlers, mappers, use cases
│
├─ domain/              # Domain layer: core business logic, entities, repo interfaces and rules
│  ├─ accounting/
│  ├─ bookkeeping/
│  ├─ currency/
│  ├─ journal-entry/
│  ├─ ledger/
│  ├─ subledger/
│  └─ user/
│
├─ infra/               # Technical layer: implementations of services, database, and infrastructure concerns
│  ├─ config/           # Configuration files for app, environment variables, secrets, and third-party services
│  ├─ observability/    # Logging, metrics, monitoring, and tracing
│  ├─ persistence/      # Data persistence mechanisms including DB (Drizzle), caching, and concrete repo implementations
│  ├─ server/           # Express (or other HTTP) server setup and bootstrapping
│  └─ services/         # External service clients (e.g., third-party API clients)
│
├─ interface/           # Application entry points and external interfaces
│  ├─ http/             # API REST endpoints, controllers, handlers, and middlewares
│  └─ mcp/              # MCP (Model Context Protocol) endpoints
│
└─ shared/              # Shared utilities and types used across multiple layers
   ├─ __docs__/         # Shared documentation covering concepts like monetary values
   ├─ errors/           # Shared domain/application error types
   ├─ types/            # Global TypeScript types and interfaces
   ├─ utils/            # Helper functions, constants, and reusable utilities
   └─ value-objects/    # Shared value objects and related entities

```

## Domain Documentation

Contributors should see further documentations in the `__docs__` folder within the `domain` layer for the respective domains.

## Working with Money

- **Always use minor units**: Never use fractional values for money.
- **Use the Value Object**: Always run calculations through `moneyValue` (`src/shared/value-objects/money.vo.ts`).

For detailed documentation and examples on handling currency, see [`src/shared/__docs__/money.md`](src/shared/__docs__/money.md).

## Git Workflow

To maintain a clean and organized codebase, please follow these strict git workflow guidelines.

### Branching Strategy

- **`development`**: This is the main branch for development. All contributor Pull Requests (PRs) should be merged into `development`.
- **`staging`**: This branch is for pre-release testing. Code from the `development` branch is merged here.
- **`main`**: This is the production branch. Only the `staging` branch and hotfix branches are merged here.

### Feature Branches

- **Source**: Every new branch must be created off the `development` branch.
- **Target**: Every update must be submitted as a PR to the `development` branch.
- **Naming Convention**:
  - Branches should be named using the format: `<type>/<description-with-hyphens>/<optional-issue-id>`
  - **Types**: `feat`, `fix`, `chore`, `refactor`, `test`, `doc`
  - **Examples**:
    - `feat/add-accounts-endpoint/49494`
    - `fix/login-error/49494`

### Commit Messages & Pull Requests

We enforce a specific commit message format to generate clean changelogs and track history effectively.

- **Format**:
  ```text
  <type>(<domain>): <short description> <optional-id>
  ```
- **Rules**:
  - Pull request titles should also have the commit message structure.
  - PRs must be squashed and merged.
- **Examples**:
  - `feat(accounts): add endpoint to create account 3442`
  - `test(auth): improves smoke test`

## Testing

Our project follows these guidelines for testing:

- **Test Proximity**: Test files should be kept near their test subjects.
- **Domain tests**: Domain entity, service, and rule tests use nearby `__tests__` folders with `.test.ts` files. Domain entity factories are never mocked.
- **Application, infrastructure, and interface tests**: App-layer mappers/use cases, infrastructure adapters, and HTTP helpers/middlewares use nearby `__specs__` folders with `.spec.ts` files.
- **End-to-End (E2E) Tests**: All E2E testing is handled in the frontend repository.

## Reporting Bugs

If you find a bug, please create a ticket for it on our [GitHub Issues page](https://github.com/purple-ledger/pl-core/issues).
Before opening a new issue, please search existing issues to see if it has already been reported.

- **Requirement**: Every bug report must have a corresponding ticket.
- **Format**: The ticket must clearly specify:
  1.  **Expected Behaviour**: What should happen.
  2.  **Current Behaviour**: What is actually happening.
