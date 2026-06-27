# Repo Implementation Rules

These are the strict guidelines to follow when implementing repositories in the `purple-ledger` project:

1. **One Table = One Repo**
   - Each database table must have exactly one corresponding repository. Do not mix operations for multiple tables in a single repository unless they represent a strict aggregate root that must be persisted atomically, and even then, prefer single-responsibility repos.

2. **Strict Domain Boundary**
   - The repository implementation methods MUST receive values as defined in the domain layer.
   - The repository implementation methods MUST return values as defined in the domain layer.
   - Database schema types (from Drizzle) must **never** leak into the domain layer.

3. **Mandatory Use of Mappers**
   - If the database schema is different from the domain entity type, you **must** use a mapper (`src/app/mappers/<entity-name>.mapper.ts`).
   - Use `mapper.toRepo(domain)` when inserting/updating data in the database.
   - Use `mapper.toDomain(model)` when returning query results.

4. **Bulk Operations Preference**
   - Preferably, a repository's `save` method should be typed to accept either a single entity or an array of entities (`T | T[]`) to gracefully handle batch inserts and updates.

5. **Mock Completeness**
   - Every repository implementation must have a corresponding mock definition located in `src/infra/persistence/repos/__mocks__`.
   - The mock should fully mirror the domain interface using `jest.fn()`.

6. **Transaction Support via `getDbQuery`**
   - Always use `getDbQuery(options)` to instantiate queries in the implementation methods. This ensures that the operation can run seamlessly within an injected database transaction.

7. **No `any` Types**
   - The `any` type must **never** be used in repository interfaces, implementations, mocks, or mappers. Always ensure proper, strict TypeScript typings are maintained.
