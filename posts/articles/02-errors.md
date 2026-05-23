# Article 02 — Errors as First Class Citizens

## Status

- [ ] Title finalised
- [ ] Outline approved
- [ ] Draft written
- [ ] Review done

## Title

"Errors as First Class Citizens"

## Core Insight

Most APIs treat errors as an afterthought — a status code and a string message.
A well-designed Fintech system treats errors as a **typed, versioned, contractual interface**
between the API and its consumers. Error keys are not messages; they are contracts.

## Key Code References

- `src/shared/errors/domain.error.ts` — base `DomainError` class
- `src/app/errors/app.error.ts` — `AppError` hierarchy, `EErrorKeys` enum pattern
- `src/app/errors/ledger.error.ts` — domain-scoped error with prefixed keys
- `src/app/errors/auth.error.ts` — auth-scoped errors
- `src/shared/utils/error.ts` — `getMappedErrors` utility
- `bin/export-error-keys.ts` — script that exports all keys to `exports/error-keys.json`

## Things to Cover (TODOs)

- [ ] The problem: generic errors (`"something went wrong"`) that force clients to parse strings
- [ ] What an error key is: a namespaced, typed string (`app_error_ledger_account_not_found`)
- [ ] The hierarchy: `DomainError → AppError → LedgerAppError` and why layering matters
- [ ] The `EErrorKeys` + `satisfies` pattern — compile-time enforcement of key naming conventions
- [ ] The `getMappedErrors` utility — auto-generating typed error classes from a key map
- [ ] Error keys as a cross-service JSON contract (`export-error-keys.ts`)
- [ ] How clients consume error keys (i18n, UI mapping, support tooling)
- [ ] Audience: backend engineers and API designers in Fintech

## Article Structure (template)

- Introduction
- Section 1: What — what an error key is vs a message
- Section 2: Why — the cost of stringly-typed errors at scale
- Section 3: How — the typed hierarchy and naming convention
- Section 4: When/Where — exporting keys as a cross-service contract
- Conclusion
- TL;DR
- Additional Resources
