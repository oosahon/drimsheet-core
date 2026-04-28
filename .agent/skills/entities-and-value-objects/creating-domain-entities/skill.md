# Skill: Creating Domain Entities

**Objective**: Ensure consistency, type safety, and data integrity when defining and creating domain entities across the application.

When building or modifying domain entities, you must strictly adhere to the following established architectural patterns, conceptually in this order:

## 1. Define and Group Domain Events

Every domain entity that mutates state must emit an event encapsulating what occurred. All events related to a domain entity should be defined inside a dedicated `.events.ts` file (e.g., `src/domain/accounting/events/accounting-entity.events.ts`).

Follow these strict conventions when defining events:

- **Event Constants Object (`E<EntityName>Events`)**: Export an object containing all the event string values. The key convention is UpperCamelCase, and the string value must be formatted as `'domain:<context>:<entity>:<action>'` (e.g., `'domain:accounting:entity:created'`).
- **Description Mapping**: Export an object mapping each event value to a human-readable description string. This is typically named `<entityName>EventDescriptions` and typed as `Record<string, string>`.
- **Factory Functions**: Create individual factory functions for each event payload (e.g., `makeCreatedEvent`), utilizing the global `eventValue.make` helper.
- **Grouped Export**: Freeze all the event factories into a single object (e.g., `<entityName>Events`) and `export default` it.

**Example: `src/domain/accounting/events/accounting-entity.events.ts`**

```typescript
import eventValue from '../../../shared/value-objects/event.vo';
import { IAccountingEntity } from '../types/accounting-entity.types';

export const EAccountingEntityEvents = {
  Created: 'domain:accounting:entity:created',
} as const;

export const accountingEntityEventDescriptions: Record<string, string> = {
  [EAccountingEntityEvents.Created]: 'Created an accounting entity.',
};

function makeCreatedEvent(params: IAccountingEntity) {
  return eventValue.make<IAccountingEntity>({
    type: EAccountingEntityEvents.Created,
    data: params,
  });
}

const accountingEntityEvents = Object.freeze({
  created: makeCreatedEvent,
});

export default accountingEntityEvents;
```

## 2. Write Validation Helpers for Every Field

Do not rely on implicit validation. Every field inside the entity payload must be validated. If a specific validation logic doesn't already exist in standard utilities, you must write local helpers (e.g., `isValidStatus`, `validateStatus`).

These validation helpers should be created in a dedicated helper file within a `helpers` subdirectory next to the entity file. For example, if your entity is `category.entity.ts`, the helpers should be in `helpers/category.entity.helpers.ts`.

**Example: `src/domain/category/entities/helpers/category.entity.helpers.ts`**

```typescript
function isValidStatus(status: unknown): status is UCategoryStatus {
  return Object.values(ECategoryStatus).includes(status as UCategoryStatus);
}

function validateStatus(status: unknown) {
  if (!isValidStatus(status)) {
    throw new AppError('Invalid category status', {
      cause: status as Record<string, unknown>,
    });
  }
}

const categoryEntityHelpers = Object.freeze({
  isValidStatus,
  validateStatus,
});

export default categoryEntityHelpers;
```

**Example: `src/domain/category/entities/category.entity.ts`**

```typescript
import categoryEntityHelpers from './helpers/category.entity.helpers';

function make(payload: TCreationOmits<ICategory, 'version'>) {
  categoryEntityHelpers.validateStatus(payload.status);

  // ... rest of the factory
}

const categoryEntity = Object.freeze({
  make,
  // ... other factories

  // Spread the helpers so they are exposed alongside the entity factories
  ...categoryEntityHelpers,
});

export default categoryEntity;
```

## 3. Utilize Existing Utilities and Value Objects

Leverage the rich set of shared utilities to validate standard data types before assigning them. This ensures robust and uniform validation across the entire domain.
Common utilities include:

- `stringUtils` (e.g., `sanitizeAndValidate`, `validateUUID`)
- `dateUtils` (e.g., `validateDate`, `validateGreaterThan`)
- `numberUtils` (e.g., `validatePositiveNumber`, `validateInteger`)
- Existing Value Objects like `moneyValue`, etc.

## 4. Never Spread the Payload

To prevent malicious or accidental data corruption (such as injecting unwanted properties), **never** use the spread operator (`...payload`) when constructing the entity object. Every property must be explicitly assigned from the validated payload or generated internally (like `id` and `timestamp`).

**Correct:**

```typescript
const entity = Object.freeze({
  id: generateUUID(),
  name: payload.name,
  status: payload.status,
  // explicit assignments only
});
```

**Incorrect:**

```typescript
const entity = Object.freeze({
  id: generateUUID(),
  ...payload, // ❌ NEVER DO THIS
});
```

## 5. Return Frozen Entities and Related Events

Entities must be immutable once created. When implementing a factory method (e.g., `makeFiscalYear`, `makeAccountingPeriod`), you must use `Object.freeze()` on the constructed entity object.
Additionally, entity creation typically yields a domain event. The factory should return a tuple containing the frozen entity and an array of events (using the `TEntityWithEvents` type).

```typescript
const entity = Object.freeze({
  id: generateUUID(),
  name,
  // ...other fields
});

const events = someEntityEvents.created(entity);

return [entity, [events]];
```

## Related Skills

Once you have created your domain entities, you must write rigorous tests for them. Please refer to the testing guidelines in:

- [Testing Domain Entities & Value Objects](../../testing/testing-domain-entities-and-value-objects/skill.md)
