# Error Creation

Errors are context-owned values.

## Rules

- Throw errors from the same bounded context as the failing rule.
- Create a new context error when no existing error fits.
- Do not throw generic `Error` or hardcoded `AppError`.
- Error names describe the fault, not the validation rule.
- Generic shared `error_*` keys must not reach clients. Wrap them in domain/app errors.
- Export a default frozen object. Do not use named exports.

## Shape

- `EErrorKeys`: frozen keys matching `<domain>_error_<context>_${string}`.
- `U<Context>Error`: union of `EErrorKeys` values.
- `<Context>Error`: base class extending the domain/app base error.
- Specific classes extend the context base and pass one key to `super`.

Status mapping keywords:

- `*_not_found` -> 404
- `*_conflict` -> 409
- `*_unauthorized` -> 401
- `*_forbidden` -> 403
- `*_too_many_requests` -> 429
- `*_validation_error` -> 422
- `*_internal_server_error` -> 500
