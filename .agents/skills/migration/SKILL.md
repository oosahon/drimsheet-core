---
name: migration
description: Use when creating, running, or reviewing database migrations.
---

# Database Migration

## Rules

- Use `node-pg-migrate`.
- Define table names in `db/config`; do not hardcode them in migrations.
- Use migration helpers such as `toSchemaString` for enum/schema strings.
- Do not edit `src/infra/config/drizzle` by hand.
- After a successful migration, run `npm run drizzle:pull`.

## Commands

- Create: `npm run db:migrate create <name-in-kebab-case>`
- Run up: `npm run db:migrate up`
- Roll back one: `npm run db:migrate`
- Roll back N: `npm run db:migrate <count>`
