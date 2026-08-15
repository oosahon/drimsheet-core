# Error Key Policy

- All user-facing, client-facing, and validation error messages in `src/` that can be delivered through an interface must use error keys.
- Do not introduce plain-English error strings in thrown errors, validation schemas, or mapped API error payloads that may reach an interface.
- English text is allowed in logs, developer comments, and tests that are asserting legacy behavior during migration.
- When a new interface-delivered failure mode is needed, add the key in the owning layer's error module first, then reference that key at the call site.
- Constrain every `EErrorKeys` declaration with the context-aware `TErrorKeys`
  brand and one terminal suffix from [Error Creation](error-creation.md).
- The primary response error key is the sole HTTP-status signal. Nested
  `validationErrors[].message` keys identify invalid fields and do not override
  the top-level `_validation_error` status.
- Interface boundaries must report unknown, missing, malformed, and
  `_unexpected` errors, then return a cause-free generic `_unexpected` `500`.
