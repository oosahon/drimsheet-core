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

- `EErrorKeys`: frozen keys constrained with
  `as const satisfies TErrorKeys<'<owning_context>'>`.
- `U<Context>Error`: union of `EErrorKeys` values.
- `<Context>Error`: base class extending the domain/app base error.
- Specific classes extend the context base and pass one key to `super`.

Every key must end in exactly one status suffix:

- `*_invalid` -> 400
- `*_unauthorized` -> 401
- `*_payment_required` -> 402
- `*_forbidden` -> 403
- `*_not_found` -> 404
- `*_conflict` -> 409
- `*_validation_error` -> 422
- `*_too_many_requests` -> 429
- `*_unexpected` -> 500

Use `_invalid` for a field, value, or request fault. Reserve
`_validation_error` for the top-level structured validation envelope. Use
`_unexpected` for repository, runtime, history, infrastructure, or impossible
state failures that a client cannot correct.
