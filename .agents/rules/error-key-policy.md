# Error Key Policy

- All user-facing, client-facing, and validation error messages in `src/` that can be delivered through an interface must use error keys.
- Do not introduce plain-English error strings in thrown errors, validation schemas, or mapped API error payloads that may reach an interface.
- English text is allowed in logs, developer comments, and tests that are asserting legacy behavior during migration.
- When a new interface-delivered failure mode is needed, add the key in the owning layer's error module first, then reference that key at the call site.
