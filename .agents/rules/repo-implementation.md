# Repository Implementation

Repositories are storage adapters. Keep them boring.

## Rules

- One table gets one repository unless an aggregate must be persisted atomically.
- Methods receive and return domain/app contract types, not Drizzle types.
- Use explicit mappers for persistence shape changes.
- Use `getDbQuery(options)` so callers can pass transactions.
- Add a matching mock under `src/infra/persistence/repos/**/__mocks__`.
- Do not use `any`.

## Never Put In Repos

- Business rules.
- Application policy.
- Workflow orchestration.
- Event publishing.
- Emails, queues, HTTP calls, cache side effects, or service calls.
- Convenience methods that combine use-case steps.

If storing or loading needs multi-step coordination, put that coordination in an app, domain, or persistence service and inject narrow repo methods into it.
