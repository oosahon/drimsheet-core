# Article 01-A — Money Is Not a Number

## Status

- [ ] Title finalised
- [ ] Outline approved
- [ ] Draft written
- [ ] Review done

## Objective

Convince the reader that money is a first-class domain concept — not a primitive —
and that collapsing it to a `number` or `float` is an architectural mistake
with real, compounding consequences in production financial systems.

The reader should finish this article having internalised a single, uncomfortable truth:
every Fintech system that stores `amount: number` has already made an error.
It just hasn't surfaced yet.

## Working Titles

- Option A: "Money Is Not a Number. So Stop Treating It Like One."
- Option B: "The Type That Knows What Currency It's In"
- Option C: "Why `amount: number` Is Already a Bug"
- Option D: "Before You Do Any Math: Modelling Money Correctly"

## Core Insight

Money in a Fintech system is not a scalar — it is a **pair**: an amount and a currency.
Neither component is optional. Neither has a sensible default.
A `number` type can represent neither constraint.

The system's `IMoney` interface (`amount: bigint`, `currency: ICurrency`) makes this
explicit. The `make()` factory enforces it at the boundary.
The `Object.freeze()` on every constructed value is not incidental — it signals
that money is **immutable by design**.

## Key Code References

- `src/shared/types/money.types.ts` — `IMoney`: `{ amount: bigint; currency: ICurrency }`
- `src/domain/currency/types/currency.types.ts` — `ICurrency`: code, symbol, name, `minorUnit: bigint`
- `src/domain/currency/config/currencies.config.ts` — `SYSTEM_CURRENCIES`, `UCurrencyCode` union type
- `src/domain/currency/entities/currency.entity.ts` — `isValidCode()`, `getByCode()`, `isValidMinorUnit()`
- `src/shared/value-objects/money.vo.ts` — `make()`, `makeZeroAmount()`, `Object.freeze()`
- `src/shared/errors/money.error.ts` — `InvalidCurrencyCode`, `FractionalMinorUnit`, `NonNormalizableAmount`

## Article Structure

### Introduction

- Open with a real-world scenario: a developer stores `price: 19.99` in a database column typed `FLOAT`.
  Six months later, a reconciliation report shows £0.01 discrepancies across thousands of transactions.
  The bug was in the model, not the math.
- State the thesis: money requires a type, not a primitive.

### Section 1 — What (The Money Type and Its Invariants)

- Introduce `IMoney`: two fields, both required, both typed precisely.
- Unpack `ICurrency`: it's not a string. It carries `code` (validated against `UCurrencyCode`),
  `symbol`, `name`, and critically — `minorUnit: bigint`.
- `minorUnit` is the number of decimal places the currency has by ISO 4217 standard.
  GBP → 2, JPY → 0, KWD → 3. This is not optional knowledge.
- The `UCurrencyCode` union type is a compile-time allowlist — you cannot construct
  money in an unsupported currency.

### Section 2 — Why (What Goes Wrong Without a Type)

- `amount: number` cannot express "no currency" as an error — it just silently holds a float.
- Without `minorUnit`, you cannot normalise: is `1000` one thousand pounds, or ten pounds?
  The answer is the currency's business, not the caller's guess.
- Without immutability, amount fields get mutated in place during transformations —
  a subtle source of ledger drift.
- The `FractionalMinorUnit` error in `money.error.ts` exists because someone,
  somewhere, will try to pass `0.5` as an already-minor-unit amount. The type
  cannot prevent this at compile time — so the factory does it at runtime.

### Section 3 — How (Constructing Money Correctly)

- Walk through `make(amount, currency, isInMinorUnit)`:
  - Step 1: `currencyEntity.isValidCode()` — reject unknown currencies before anything else.
  - Step 2: if caller says `isInMinorUnit: true`, the amount must be a safe integer.
    The `isSafeInteger` guard exists because JavaScript's `number` type cannot
    reliably represent integers above 2^53 − 1.
  - Step 3: if `isInMinorUnit: false`, `getNormalizedMinorUnit()` multiplies by `10^minorUnit`
    and rounds — this is the _only_ place floating-point is permitted, and it is immediately
    converted to `bigint`.
- Result: `Object.freeze({ amount: bigint, currency })` — immutable from birth.
- `makeZeroAmount(currency)` is a deliberate API: zero is not `make(0, ...)` by convention,
  it is a named concept.

### Section 4 — Where (The System Boundary)

- Money objects are constructed at the _edge_ of the system — when data enters from the outside
  world (API payloads, database reads, user input).
- Inside the domain, money is always `IMoney` — never a raw number.
- The conversion boundary (minor units ↔ display format) is explicit and intentional,
  not scattered throughout the codebase.
- This is where `convert()` comes into the picture: applying an FX factor produces
  a new `IMoney` in a different currency — still typed, still immutable, still validated.
  (Arithmetic details deferred to Article 01-B.)

### Conclusion

- The `IMoney` type is small — two fields.
  Its power comes not from what it contains, but from what it _refuses to allow_.
- A `number` can be a temperature, a count, an index, or a price.
  `IMoney` can only be money.
- Type safety in financial systems is not about developer convenience.
  It is about correctness under audit.

### TL;DR

- Money = `{ amount: bigint, currency: ICurrency }` — a pair, not a scalar.
- Currency carries `minorUnit` — the ISO 4217 decimal precision for that currency.
- `make()` validates the currency code, enforces integer amounts in minor units,
  and returns a frozen (immutable) object.
- The boundary is the only place floating-point is tolerated — and only briefly.
- An `amount: number` field in a financial schema is a bug waiting to be discovered.

### Additional Resources

- ISO 4217 — Currency codes and minor unit definitions
  https://www.iso.org/iso-4217-currency-codes.html
- Martin Fowler — Money Pattern (Patterns of Enterprise Application Architecture)
  https://martinfowler.com/eaaCatalog/money.html
- MDN — `Number.isSafeInteger()`
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger
- MDN — `BigInt`
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt
