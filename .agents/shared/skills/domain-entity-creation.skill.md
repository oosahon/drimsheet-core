---
Title: Domain Entity Creation Skill
Description: Use this skill when creating or working with domain entities (*.entity.ts)
---

## Key Principles

- **Immutability**: All domain entity instances must be frozen via `Object.freeze` to prevent runtime mutations.
- **Tuples for Audit/Events**: Entity creation/mutation methods (e.g. `make`, `update`) must return a tuple: `[Entity, IEvent[], IAudit | null]`.
- **Default Exports**: Export the entity as a default frozen object containing `make`, other transition methods, and helper methods. Never use named exports.
- **Separate Helpers**: Keep entity validation and helper functions in a separate file (e.g., `helpers/<entity-name>.entity.helpers.ts`) and spread them into the default export.

## File Structure

- Entity definition: `src/domain/<domain>/entities/<entity-name>.entity.ts`
- Helpers/Validation: `src/domain/<domain>/entities/helpers/<entity-name>.entity.helpers.ts`
- Tests: `src/domain/<domain>/entities/__tests__/<entity-name>.entity.test.ts`

## Implementation Guidelines

### 1. Entity File

Define the entity using standard types and `make` logic. Use `TCreationOmits<IEntity>` for the `make` payload.

```ts
import { TCreationOmits } from '../../../shared/types/creation-omits.types';
import { TAuditedEntity } from '../../../shared/types/event.types';
import generateUUID from '../../../shared/utils/uuid-generator';
import domainError from '../errors/domain.error';
import helpers from './helpers/example.entity.helpers';

function make(
  payload: TCreationOmits<IExample>
): TAuditedEntity<IExample, IExample, IExample> {
  // Validate fields via helpers or utility validation
  helpers.validateType(payload.type);

  const timestamp = new Date();

  const entity: IExample = Object.freeze({
    id: generateUUID(),
    ...payload,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  const events = exampleEvents.created(entity);
  const audit = exampleAudit.make({
    before: null,
    after: entity,
    action: EExampleActions.Created,
  });

  return [entity, [events], audit];
}

const exampleEntity = Object.freeze({
  make,
  ...helpers,
});

export default exampleEntity;
```

### 2. Helpers File

All field validations and helper methods must reside in a separate helper file.

```ts
import domainError from '../../errors/domain.error';

function isValidType(type: string): boolean {
  return ['type-a', 'type-b'].includes(type);
}

function validateType(type: string) {
  if (!isValidType(type)) {
    throw new domainError.InvalidType({ type });
  }
}

const exampleEntityHelpers = Object.freeze({
  isValidType,
  validateType,
});

export default exampleEntityHelpers;
```

### 3. Error Handling

- **No Generic Errors**: Never throw generic JavaScript `Error` or base `AppError` with hardcoded strings.
- **Domain Errors**: Always throw named domain-specific errors (e.g. `domainError.InvalidValue` or `domainError.InvalidType`).
- **Inject Domain Errors**: When using shared utilities, inject a domain-specific error as the fallback/assertion parameter.
  ```ts
  stringUtils.validateUUID(payload.id, domainError.InvalidId);
  ```

### 4. Unit Testing

- **Naming**: Tests must be named `<entity-name>.entity.test.ts` and placed inside `__tests__/`.
- **No Mocking**: Never mock database adapters, external APIs, or other domain objects. Entities are pure domain logic. Mocking time using `jest.useFakeTimers()` is allowed.
- **Helper Tests**: Include a dedicated `describe('helpers', ...)` block to test all exported helpers.

## Reference Prototypes

For codebase standards, refer to:

- **Entity**: [accounting-entity.entity.ts](../../../src/domain/accounting/entities/accounting-entity.entity.ts)
- **Helpers**: [accounting-entity.entity.helpers.ts](../../../src/domain/accounting/entities/helpers/accounting-entity.entity.helpers.ts)
- **Tests**: [accounting-entity.entity.test.ts](../../../src/domain/accounting/entities/__tests__/accounting-entity.entity.test.ts)

## Mandatory Rules & Skills

- ALWAYS follow [Creating Errors](../rules/error-creation.rule.md)
- ALWAYS follow [Testing Rules](../rules/testing.rule.md)
- ALWAYS USE [Error Handling](./error-handling.skill.md)
