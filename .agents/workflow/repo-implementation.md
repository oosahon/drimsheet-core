# Repository Implementation Workflow

1. Define or update the repo contract in `src/domain/<domain>/repos`.
2. Keep contract methods narrow: storage/retrieval only.
3. Add or update the shared repo mock.
4. Confirm the Drizzle schema in `src/infra/config/drizzle/schema.ts`.
5. Add or update explicit persistence mappers when shapes differ.
6. Implement the repo under `src/infra/persistence/repos`.
7. Use `getDbQuery(options)` in every method.
8. Export the implementation from the repo index when needed.

Follow `../rules/repo-implementation.md` and `../rules/folder-responsibility.md`.
