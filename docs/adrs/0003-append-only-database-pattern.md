# ADR 0003: Append-Only Database Pattern for Financial Records

## Status

Accepted

## Context

Accounting constraints demand strict compliance, full audibility, and data integrity. Financial records represent historical facts. If a user makes a mistake posting a journal entry containing \₦5,000,000, allowing an `UPDATE` to correct it to \₦50,000 silently destroys the historical trail and invites catastrophic fraud or audit failure.

## Decision

We implement a strict **Append-Only Architecture** for core financial records such as `Transactions` and `Journal Entries`.

- `DELETE` operations on ledgers are fundamentally blocked at the application level.
- `UPDATE` operations that alter business meaning (amounts, dates, linked accounts) are forbidden.
- Mistakes must be explicitly corrected by appending a new "Voiding" or "Reversal" transaction that perfectly negates the original entry.

## Consequences

### Positive

- Absolute confidence during internal compliance checks or external FIRS audits.
- It is cryptographically and historically simple to reconstruct any ledger balance at any point in time.
- Security against malicious internal actors tampering with historical data.

### Negative

- PostgreSQL database sizes will expand continuously over time because data is never pruned.
- The user interface and application layer must implement complex logic to present corrected workflows nicely (e.g., hiding a voided transaction and its reversal, while retaining them under the hood).
