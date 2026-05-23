# Article 04 — The Problem with a Single Chart of Accounts

## Status

- [ ] Title finalised
- [ ] Outline approved
- [ ] Draft written
- [ ] Review done

## Title

"The Problem with a Single Chart of Accounts Across Accounting Standards"

## Core Insight

Most accounting software ships with one opinionated Chart of Accounts baked in.
That works until you cross a border or add a second reporting standard.
IFRS requires FIFO; GAAP permits LIFO — the same inventory, two different valuations.
A Fintech platform that intends to scale across jurisdictions needs a deliberate strategy
for handling this divergence **without corrupting the GL**.

## Key Code References

- `src/domain/ledger/entities/` — the five account types (asset, liability, equity, revenue, expense)
- `src/domain/subledger/` — the Subledger Strategy for parallel valuations
- `src/domain/accounting/__doc__/02-architecture.md` — the Subledger Strategy section
- `src/domain/accounting/__doc__/05-statutory-reporting.md` — statutory reporting context

## Things to Cover (TODOs)

- [ ] What a Chart of Accounts is and why it matters
- [ ] The five account classes: asset, liability, equity, revenue, expense
- [ ] The IFRS vs GAAP inventory valuation problem (FIFO vs LIFO) — concrete numbers example
- [ ] Why you can't just add two journal entries for two standards — GL corruption risk
- [ ] The Subledger Strategy: how subledgers track parallel valuations without touching the GL
- [ ] How the Reporting Layer pulls the right valuation from the subledger at report time
- [ ] The scalability payoff: adding a third standard without touching the GL
- [ ] Audience: Fintech engineers, finance architects, and accounting software evaluators

## Article Structure (template)

- Introduction
- Section 1: What — the Chart of Accounts and its role
- Section 2: Why — the multi-standard valuation problem
- Section 3: How — the Subledger Strategy
- Section 4: When/Where — statutory reporting and jurisdiction expansion
- Conclusion
- TL;DR
- Additional Resources
