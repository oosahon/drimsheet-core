# ADR 0004: Drizzle ORM for Queries & node-pg-migrate for Migrations

## Status

Accepted

## Context

Drimsheet's PostgreSQL database must enforce ACID compliance, support robust jsonb data columns, and allow high-performance operations without obfuscating what the actual SQL query is doing. Heavy, highly-abstracted ORMs (like Prisma or TypeORM) often generate inefficient SQL layers internally, suffer from the "N+1" query problem silently, and lack fine-grained query adjustments.
However, while choosing a lightweight ORM is beneficial for querying, database migration tools must rigorously support complex deployment lifecycles. This includes robust rollbacks (`down` migrations) and independent execution states, which simplistic ORM-bundled migration tools sometimes lack.

## Decision

The system utilizes a split-responsibility approach:

- **Drizzle ORM** is used strictly for application-level database interactions (queries, inserts, type definitions) alongside standard `pg` drivers.
- **node-pg-migrate** is used exclusively for handling and tracking database schema migrations.

## Consequences

### Positive

- `node-pg-migrate` grants us absolute control over independent database state migrations and reliable rollbacks, which Drizzle's native migration tool lacks robust support for.
- Drizzle behaves predominantly as a type-safe SQL wrapper rather than a magic abstraction. Developers clearly understand the exact `JOIN`s and `SELECT`s they are executing.
- Outstanding query performance characteristics with no hidden abstraction overhead.

### Negative

- Developers must manage two separate toolings for the database (one for schema layout migrations via `node-pg-migrate`, and the other for maintaining the type-safe Drizzle schema definitions used in the app).
- Writing relational queries in Drizzle requires slightly more verbosity compared to heavier ORMs like Prisma.
