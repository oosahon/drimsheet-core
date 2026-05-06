# Article 05 — Why I Store Exchange Rates as a Pair, Not a Price

## Status

- [ ] Title finalised
- [ ] Outline approved
- [ ] Draft written
- [ ] Review done

## Title

"Why I Store Exchange Rates as a Pair, Not a Price"

## Core Insight

Storing an exchange rate as a single float (`rate: 1.27`) loses critical context:
which way does it go? As of when? From which source?
A production Fintech system stores exchange rates as a **typed record** with a currency pair,
a point-in-time `asOf` date, a named `source`, and a `type` — because auditability
and bi-directional FX are non-negotiable at scale.

## Key Code References

- `src/domain/currency/value-objects/exchange-rate.vo.ts` — the `IExchangeRate` value object
- `src/domain/currency/types/exchange-rate.types.ts` — the `IExchangeRate` interface
- `src/domain/currency/entities/currency.entity.ts` — currency code validation
- `src/domain/transaction/entities/transaction.entity.ts` — how `exchangeRate` is consumed
- `src/shared/value-objects/money.vo.ts` — `convert()` using rational `IFactor`

## Things to Cover (TODOs)

- [ ] The naive approach: storing a float and why it fails (direction ambiguity, staleness)
- [ ] What `currencyPair` is: `"GBP/USD"` as a compound key, not two loose fields
- [ ] The `asOf` field: point-in-time rates and why "current rate" is an anti-pattern in finance
- [ ] The `source` field: auditability — was this rate from the ECB, an open API, or manual entry?
- [ ] The `type` field: spot vs forward rates — different semantics, same structure
- [ ] How the rate is consumed via `IFactor` (rational arithmetic) not raw float multiplication
- [ ] The `functionalCurrency` concept: every accounting entity has a home currency for reporting
- [ ] Regulatory angle: auditors want to know the rate, when it was set, and who set it
- [ ] Audience: Fintech engineers, finance architects

## Article Structure (template)

- Introduction
- Section 1: What — the exchange rate record and all its fields
- Section 2: Why — the failures of naive rate storage
- Section 3: How — currency pairs, point-in-time rates, and rational conversion
- Section 4: When/Where — FX in transactions and statutory reporting
- Conclusion
- TL;DR
- Additional Resources
