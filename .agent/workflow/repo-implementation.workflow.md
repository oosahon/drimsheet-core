# Repo Implementation Workflow

This workflow outlines the steps to implement a repository in the `purple-ledger` project.

1. **Define the Domain Interface**
   - Create the repository interface in `src/domain/<domain-name>/repos/<repo-name>.ts`.
   - Adhere to the "one table = one repo" rule.
   - The repository methods must work strictly with Domain entity types.
   - Preferably, the `save` method should accept both a single entity and an array of entities (`T | T[]`) to support bulk operations efficiently.

2. **Add Repository Mocks**
   - Create a mock for the repository in `src/infra/persistence/repos/__mocks__/<repo-name>.impl.mock.ts`.
   - Use `jest.Mocked<IRepoInterface>` and implement the methods using `jest.fn()`.

3. **Verify Schema Definition**
   - Check the Drizzle schema in `src/infra/config/drizzle/schema.ts` to locate the target table.
   - The schema is usually named following the pattern `<entity-name-as-table>In<Schema>` (e.g., `accountingEntitiesInCore`).

4. **Create the Mapper (If Applicable)**
   - If the database schema differs from the domain entity type, create a mapper in `src/app/mappers/<entity-name>.mapper.ts`.
   - The mapper must contain:
     - `toRepo(entity: IDomainEntity): IModel` to transform domain models to database types.
     - `toDomain(payload: IModel): IDomainEntity` to transform database query results into domain models.
     - `toInterface(payload: IDomainEntity): IRes` for external DTO representation.

5. **Write the Repository Implementation**
   - Create the implementation file at `src/infra/persistence/repos/<repo-name>.impl.ts`.
   - Implement the domain interface.
   - Use `getDbQuery(options)` to support transactions.
   - Enforce the use of mappers: the methods must receive values as defined in the domain, use the mapper (`toRepo`) to transform them for Drizzle ORM operations, and use the mapper (`toDomain`) to transform the database results back before returning them.

6. **Export the Implementation**
   - Export the new repository implementation from `src/infra/persistence/repos/index.ts` so that it is properly integrated and available to other parts of the application.
