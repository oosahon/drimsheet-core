# Article 01-B — The Cent You Can't Split

## Status

- [ ] Title finalised
- [ ] Outline approved
- [ ] Draft written
- [ ] Review done

## Objective

Convince the reader that every arithmetic operation on money has an edge case
that floating-point silently fails, and that the solution is **integer arithmetic
with explicit remainder handling** — a design choice, not a workaround.

The reader should finish this article understanding that the question
"what do I do with the leftover penny?" is not a triviality —
it is a correctness problem that production Fintech systems must answer explicitly.

## Working Titles

- Option A: "The Cent You Can't Split: Arithmetic That Doesn't Lie"
- Option B: "Why `0.1 + 0.2` Is a Liability, Not a Curiosity"
- Option C: "Integer-Only: The Rule That Makes Financial Math Trustworthy"
- Option D: "Add, Subtract, Multiply, Divide — and What to Do with What's Left"

## Core Insight

Once money is correctly typed (see Article 01-A), every operation on it must
preserve two guarantees: **no float drift** and **no silent loss of value**.

`add()` and `subtract()` are trivial in bigint — the insight is the currency-mismatch
guard that makes cross-currency mistakes a thrown error, not a silent wrong answer.

`multiply()` is where most systems introduce drift: multiplying by a tax rate (0.2),
a commission (0.015), or a proration factor reintroduces floats through the back door.
The solution is `IFactor` — a rational number expressed as `{ numerator, denominator }`.

`divide()` is where the indivisible penny problem becomes unavoidable.
The system's answer: return _both_ `value` and `remainder`. Always. No rounding policy hidden inside.

## Key Code References

- `src/shared/types/number.types.ts` — `IFactor: { numerator: number; denominator: number }`
- `src/shared/value-objects/money.vo.ts`:
  - `add()` — bigint reduce, currency-mismatch guard
  - `subtract()` — bigint reduce from first, currency-mismatch guard
  - `multiply()` — `(amount * numerator) / denominator` in bigint
  - `divide()` — returns `{ value: IMoney; remainder: IMoney }`
  - `isValidFactor()` — `isSafeInteger` on both numerator and denominator, `denominator > 0`
  - `convert()` — FX via `multiply()` then `make()` into target currency
- `src/shared/errors/money.error.ts` — `CurrencyMismatch`, `InvalidFactor`, `DivisionByZero`

## Article Structure

### Introduction

- Open with the classic: `0.1 + 0.2 === 0.3` evaluates to `false` in JavaScript.
  In a calculator app, this is a quirk. In a payment system processing millions of
  transactions a day, it is compounding fraud risk.
- State the thesis: arithmetic on money is not "just math" — it requires explicit
  decisions about precision, rounding, and remainder that a `number` type
  cannot enforce.

### Section 1 — What (The Rules of Money Arithmetic)

- Four operations: add, subtract, multiply, divide.
- One inviolable rule per operation:
  - **Add/Subtract**: same currency, or throw. No implicit conversion.
  - **Multiply**: no float multipliers. Use a rational factor.
  - **Divide**: no silent rounding. Return the remainder.
- These are not implementation details — they are financial correctness requirements.

### Section 2 — Why (Where Float Math Fails in Finance)

- `0.1 + 0.2` — the classic. 17 decimal places of wrong.
- Tax calculation: `price * 0.2` — a float multiplier on a bigint is a precision hole.
- Proration: splitting a £10/month subscription across 3 users gives £3.33 + £3.33 + £3.33 = £9.99.
  The missing penny must go _somewhere_. Float math doesn't tell you where.
- Banker's rounding: why "round half to even" exists, and why silently applying
  any rounding policy inside a library is a hidden assumption.

### Section 3 — How (The Implementation)

- **`add()` and `subtract()`**: pure bigint arithmetic after the currency guard.
  Show the `isSameCurrency()` check and why it throws `CurrencyMismatch` —
  the error exists so that no caller can accidentally add GBP to USD.
- **`IFactor` — the rational number**:
  - Instead of `multiply(price, 0.2)`, the API demands `multiply(price, { numerator: 1, denominator: 5 })`.
  - `(amount * BigInt(numerator)) / BigInt(denominator)` — entirely in bigint. Zero float.
  - `isValidFactor()`: both parts must be safe integers; denominator must be positive.
    The guard prevents callers from smuggling floats in through the numerator/denominator.
- **`divide()` — the remainder contract**:
  - Returns `{ value: IMoney; remainder: IMoney }`. Not just a quotient.
  - The caller is forced to decide what to do with the remainder: absorb it, assign it
    to the first party, add it to the last instalment, etc.
  - This is the correct design: the library cannot know the business rule.
    It can only refuse to hide the problem.
  - Walk through the implementation: invert the factor, multiply, mod.

### Section 4 — When/Where (FX Conversion as Arithmetic)

- `convert(money, factor, targetCurrency)` — applying an exchange rate is `multiply()` + `make()`.
- The exchange rate is expressed as an `IFactor` — not a `rate: number`.
  (Article 05 covers _why exchange rates are stored as a pair_; this section covers
  _how the arithmetic of conversion is kept exact_.)
- Cross-rate chains: converting GBP → EUR → USD via two rational factors —
  still no float in the chain.
- The `CurrencyMismatch` error does not fire here because `convert()` explicitly
  produces a new currency — the direction of the conversion is encoded in `targetCurrency`,
  not inferred from the amounts.

### Conclusion

- The design of `add()`, `multiply()`, and `divide()` in a Fintech system is
  not a technical preference — it is a statement about correctness guarantees.
- `IFactor` makes "no float multipliers" a compile-time-visible rule.
- Returning `remainder` from `divide()` makes "no silent rounding" a contractual obligation.
- The missing penny always goes somewhere. A well-designed system decides where.
  A poorly-designed one hopes nobody notices.

### TL;DR

- `add()` and `subtract()` enforce same-currency before operating — cross-currency is a thrown error.
- `multiply()` takes `IFactor { numerator, denominator }` — no float multipliers, ever.
- `divide()` returns `{ value, remainder }` — callers must decide what to do with the leftover.
- `convert()` applies FX as a rational factor, keeping the entire chain in bigint.
- The missing penny is not a rounding problem — it is a business rule that the library
  correctly refuses to hide.

### Additional Resources

- IEEE 754 — Floating-Point Arithmetic Standard
  https://en.wikipedia.org/wiki/IEEE_754
- Martin Fowler — Money Pattern
  https://martinfowler.com/eaaCatalog/money.html
- "What Every Computer Scientist Should Know About Floating-Point Arithmetic" — David Goldberg
  https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html
- Banker's Rounding (Round Half to Even)
  https://en.wikipedia.org/wiki/Rounding#Round_half_to_even
- ISO 4217 — Currency minor units
  https://www.iso.org/iso-4217-currency-codes.html
