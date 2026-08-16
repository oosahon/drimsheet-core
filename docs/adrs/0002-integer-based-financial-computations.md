# ADR 0002: Integer-Based Financial Computations

## Status

Accepted

## Context

Drimsheet handles complex financial operations, double-entry bookkeeping, tax calculations, and multi-currency conversions. Floating-point numbers (`dec`/`float` in some languages/databases) are notoriously bad for financial applications due to rounding errors and precision loss (e.g., `0.1 + 0.2 = 0.30000000000000004`). In a strict accounting system, a margin of error of even a fraction of a cent can prevent a journal from balancing.

## Decision

All monetary values within the Drimsheet Core system, memory strings, and PostgreSQL persistence layers are processed and stored as **Integers representing the lowest denomination** of a currency (e.g., Kobo for NGN, Cents for USD).

## Consequences

### Positive

- Total elimination of floating-point precision loss.
- Perfect predictability when balancing Debits to Credits mathematically across transactions and cross-currency conversions.
- Improved database performance and storage efficiency using standard 64-bit integers.

### Negative

- The Interface Layer (UI and external API consumers) is responsible for converting back and forth between human-readable floating amounts and system-wide integer amounts (e.g., dividing/multiplying by 100).
- Developers must be constantly aware whether a given variable represents "base units" or "display units" when implementing features.
