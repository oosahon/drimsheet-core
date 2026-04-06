# ADR 0006: Self-Hosted Infrastructure via Coolify

## Status

Accepted

## Context

Cost constraints, ease of deployments, data privacy capabilities, and infrastructural simplicity are crucial constraints. Managed AWS or GCP services (like RDS, Elasticache, or ECS) possess extremely high reliability but are disproportionately expensive and complicated to configure.

## Decision

By consolidating our deployment logic to **Coolify** running on a single dedicated IaaS **DigitalOcean ** Droplet, we deploy our entire container orchestration layer (Node API, Redis caches, PostgreSQL DB, and Qdrant Vector Data) automatically and reliably via standard git webhooks.

## Consequences

### Positive

- Drastically reduced cloud infrastructure costs, circumventing massive vendor lock-in.
- Entire stack is deployed via GitOps without reliance on complex multi-repository terraform definitions initially.
- The system is easily portable to any bare-metal Linux node worldwide simply by migrating our Docker volumes.

### Negative

- We lack the fully-managed multi-availability zone database replication capabilities of AWS RDS.
- Uptime SLA relies on our own proactive operational monitoring. The team is fully responsible for managing manual droplet scaling and health checks.
