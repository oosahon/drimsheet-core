# Article 01 — Money Arithmetic

## Status

- [ ] Title finalised
- [ ] Outline approved
- [ ] Draft written
- [ ] Review done

## Working Titles (pick one)

- Option A: "Add, Subtract, Divide, Multiply: The Arithmetic of Money That Won't Lie to You"
- Option B: "The Cent You Can't Split: How Real Fintech Systems Handle Money Arithmetic"
- Option C: "Integer Arithmetic and the Money Problem: Why Fintech Engineers Throw Away `float`"
- Option D: "Money Doesn't Do Decimals. Your Code Shouldn't Either."

## Core Insight

Money arithmetic in a Fintech system cannot rely on floating-point numbers.
`0.1 + 0.2 !== 0.3` is not a curiosity — it is a liability.
The solution: store amounts as `bigint` in **minor units** (e.g. pence, cents),
and express all operations in **integer arithmetic**.

## Key Code References

- `src/shared/value-objects/money.vo.ts` — the money value object
- `src/shared/types/money.types.ts` — `IMoney` interface
- `src/shared/types/number.types.ts` — `IFactor` (numerator/denominator rational)

## Things to Cover (TODOs)

- [ ] Why floats are dangerous for money (the `0.1 + 0.2` problem, banker's rounding)
- [ ] What "minor units" means and why we normalise into them on `make()`
- [ ] How `add()` and `subtract()` enforce same-currency before operating
- [ ] How `multiply()` uses a rational `IFactor` (not a float multiplier) to avoid drift
- [ ] How `divide()` returns BOTH `value` AND `remainder` — because you can't split a penny
- [ ] The `convert()` pattern: FX via rational factor, not raw rate float
- [ ] Mention `isSafeInteger` guard on normalisation
- [ ] Audience: engineers building financial products

## Article Structure (template)

- Introduction
- Section 1: What — the money type and its constraints
- Section 2: Why — float arithmetic failures in production finance
- Section 3: How — add, subtract, multiply, divide in practice
- Section 4: When/Where — FX conversion and the remainder problem
- Conclusion
- TL;DR
- Additional Resources
