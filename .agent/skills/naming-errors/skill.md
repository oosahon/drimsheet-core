# Error Naming Convention

When defining domain or utility error classes and their associated keys, you must follow this naming convention to ensure consistency and clarity across the codebase.

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
