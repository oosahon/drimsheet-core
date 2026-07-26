# Mappers

Mappers translate between layers.

## Rules

- Place app mappers under `src/app/mappers` unless a local folder already owns the mapper pattern.
- Place persistence mappers under `src/infra/persistence/mappers`.
- Map every field explicitly. Do not use object spread.
- Keep mappers pure and side-effect free.
- Expose only mapping operations the mapper owns.
- Do not re-export, wrap, or delegate unrelated helpers such as date utilities,
  sanitizers, validators, or formatters for call-site convenience.
- Import helpers from their actual owner instead of expanding a mapper API.
- Do not use `any`.

Mappers must not validate business rules, sanitize security-sensitive data, authorize, fetch, persist, emit events, or call services.
