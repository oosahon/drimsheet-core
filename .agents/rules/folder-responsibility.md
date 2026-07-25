# Folder Responsibility

Use the folder that owns the behavior.

## Layers

- `src/domain`: business invariants, entities, values, domain services, domain errors, domain events, and repo contracts. Imports only domain/shared.
- `src/app`: use cases, app services, policies, DTOs, app errors, ports, and application mappers. Imports app/domain/shared.
- `src/interface`: controllers, routes, middlewares, handlers, request parsing, response shaping, status mapping, and TSOA metadata.
- `src/infra`: concrete adapters, persistence, cache, queues, external clients, config, IoC, runtime, observability, and server bootstrap.
- `src/shared`: pure framework-neutral helpers and base primitives. Imports only shared.

## Rules

- Domain must not know HTTP, Express, TSOA, Redis, Drizzle, env vars, cookies, queues, or logging.
- Controllers and middlewares orchestrate only. Business or app decisions go to domain/app.
- Use cases orchestrate domain/app behavior. Extract non-trivial rules to domain services, entities, values, or app policies.
- Repositories store and retrieve data only. Multi-step persistence behavior belongs in a service.
- Config files configure adapters. They are not helper folders.
- Shared must not contain product-specific rules or framework assumptions.
- Helpers inherit the owner of the behavior they contain.

## Placement Check

1. Business invariant or state transition? `src/domain`.
2. Application workflow or policy? `src/app`.
3. HTTP or delivery concern? `src/interface`.
4. Concrete adapter or runtime wiring? `src/infra`.
5. Pure cross-layer utility? `src/shared`.

See `eslint.config.mjs` for enforced import boundaries.
