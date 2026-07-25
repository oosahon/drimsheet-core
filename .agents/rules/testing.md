# Testing

## Rules

- Keep coverage at 100% for touched behavior.
- Do not use `any`.
- Prefer existing shared mocks from `__mocks__`.
- Do not create ad hoc dependency mocks when a shared mock should exist.
- Build domain objects with entity/value factories instead of raw object literals.
- Domain entity/value tests do not mock dependencies except time.
- Clean up temporary agent-created files.

Run the narrowest useful test first, then broader validation when risk justifies it.
