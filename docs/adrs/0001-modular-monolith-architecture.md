# ADR 0001: Modular Monolith Architecture

## Status

Accepted

## Context

PurpleLedger natively supports highly separated domains: Accounting, Taxation, Users, and Currencies. Traditional scaling advice suggests separating strictly bounded contexts into microservices to allow independent scaling and deployment. However, microservices introduce massive complexities such as network latency, distributed transactions challenges, and difficult local development environments.

## Decision

We chose to implement a **Modular Monolith** architecture. The codebase strictly adheres to Domain-Driven Design (DDD) to enforce architectural boundaries in code (e.g., the Tax domain cannot arbitrarily reach into the Ledger Account repository). Despite these strict logical boundaries, the system is fundamentally deployed as a single Node.js container representing a unified runtime.

## Consequences

### Positive

- Removes distributed transaction and eventual consistency problems at the infrastructure level.
- Drastically simplifies our DigitalOcean & Coolify deployment pipelines.
- Easier and faster local development loops.

### Negative

- Requires strict developer discipline. If bounded contexts begin directly calling each other's databases rather than using explicit integration events/interfaces, the system degrades into a "Big Ball of Mud".
- A heavy load on a single internal module (e.g., massive tax computations) will consume CPU resources for the entire Node process, unlike microservices where only the Tax service would need replica scaling.
