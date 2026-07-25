# Domain Unit Tests

- Put domain unit tests in an owning unit's `__tests__` folder.
- Name domain unit tests `<subject>.test.ts`.
- Test business invariants, state transitions, calculations, and emitted domain
  events through the public API.
- Build entities and values with their factories instead of raw object literals.
- Do not mock dependencies in entity or value-object tests except time.
- Prefer deterministic inputs and assert immutable results where relevant.

Follow [General Testing](general.md).
