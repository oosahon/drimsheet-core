# Creating Errors

This repository enforces strict, context-bounded error handling. Errors must be defined within their specific domains and contexts, adhering to the standard structure outlined below.

## 1. Context Boundaries

- **Encapsulation**: Domains must only throw their own errors. Cross-domain error throwing is prohibited unless specifically utilizing a shared validation or service from another context.
- **Organization**: Errors should be grouped by context (e.g., `period.errors.ts`, `accounting-entity.errors.ts`) within a domain's `errors` directory.

## 2. Standard Types and Constants

Every context error file must define the following standard types and constants:

- **`TErrorKeyPrefix`**: A template literal type ensuring all string error keys follow a standard naming convention:
  ```typescript
  type TErrorKeyPrefix = `<domain>_error_<context>_${string}`;
  // Example: `accounting_error_period_${string}`
  ```
- **`EErrorKeys`**: A constant object containing all error keys for the context, satisfying the `TErrorKeyPrefix`.
  ```typescript
  const EErrorKeys = {
    SpecificReason: 'domain_error_context_specific_reason',
  } as const satisfies Record<string, TErrorKeyPrefix>;
  ```
- **`U<Context>Error`**: A union type extracting the valid string keys from `EErrorKeys`.
  ```typescript
  type UPeriodError = (typeof EErrorKeys)[keyof typeof EErrorKeys];
  ```

## 3. Error Classes

- **Base Context Error**: There must be a base error class for the specific context extending the domain's base error (e.g., `AccountingError`).
  ```typescript
  class PeriodError extends AccountingError<UPeriodError> {
    constructor(key: UPeriodError, cause?: TErrorCause) {
      super(key, cause);
    }
  }
  ```
- **Specific Error Classes**: Every individual error must have its own dedicated class extending the Base Context Error. Each specific error must write its corresponding key from `EErrorKeys` via the `super()` call.

## 4. Frozen Object Export

All errors must be aggregated and exported as a frozen object to prevent mutation.

- **No Redundant Suffixes**: The keys within this frozen object **must not** have a redundant `Error` suffix.
- **Base Error Mapping**: The base context error class should typically be mapped to the key `Error`.

### Example Implementation (`period.errors.ts`)

```typescript
import { AccountingError } from '.';
import { TErrorCause } from '../../../shared/errors/error';

type TErrorKeyPrefix = `accounting_error_period_${string}`;

const EErrorKeys = {
  InvalidUnit: 'accounting_error_period_invalid_unit',
} as const satisfies Record<string, TErrorKeyPrefix>;

type UPeriodError = (typeof EErrorKeys)[keyof typeof EErrorKeys];

// Base Context Error
class PeriodError extends AccountingError<UPeriodError> {
  constructor(key: UPeriodError, cause?: TErrorCause) {
    super(key, cause);
  }
}

// Specific Error Class
class InvalidPeriodUnitError extends PeriodError {
  constructor(cause?: TErrorCause) {
    super(EErrorKeys.InvalidUnit, cause);
  }
}

// Frozen Object Export (Keys do NOT have an 'Error' suffix)
const periodError = Object.freeze({
  Error: PeriodError,
  InvalidUnit: InvalidPeriodUnitError,
});

export default periodError;
```

## Naming Convention

When defining errors classes and their associated keys, you must follow this naming convention to ensure consistency and clarity across the codebase.

## Core Rule: Name the Fault, Not the Rule

- **Errors are System Faults:** Error names must represent the actual system fault or invalid state, not the validation rule itself.
- **Read Like Names, Not Descriptions:** Error keys and class names should read like nouns or specific names representing the fault.

### Examples of the Convention

Instead of naming what the value _should not_ be or what the validation _checked_, name what the invalid value actually _is_.

- ❌ **Incorrect:** `NotFloat` (Describes the validation rule: "It must not be a float")
- ✅ **Correct:** `InvalidFloat` (Names the fault: "The provided value is an invalid float")
- ❌ **Incorrect:** `NotNegative` (Describes the rule)
- ✅ **Correct:** `NegativeValue` (Names the fault)
- ❌ **Incorrect:** `NotPositive` (Describes the rule)
- ✅ **Correct:** `NonPositiveValue` (Names the fault)

## Implementation Details

When implementing errors using the project's standard error factory (`getMappedErrors`):

1. Apply this naming convention to the `EErrorKeys` constant keys.
2. Ensure the string value of the error key mirrors the name (e.g., `value_error_number_negative_value` for `NegativeValue`).
