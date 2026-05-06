# Article 03 — The Bookkeeper and the Accountant

## Status

- [ ] Title finalised
- [ ] Outline approved
- [ ] Draft written
- [ ] Review done

## Title

"The Bookkeeper and the Accountant: Why Your General Ledger Should Know Nothing About IFRS"

## Core Insight

A General Ledger that is coupled to a specific accounting standard (IFRS, GAAP, etc.)
becomes unmaintainable the moment you need to support a second jurisdiction.
The solution: keep the GL **pure and standard-agnostic**, and push all standard-specific
logic into a **Reporting Layer** that maps raw GL balances to context-specific financial statements.

## Key Code References

- `src/domain/ledger/` — the pure, standard-agnostic GL (accounts, journal entries)
- `src/domain/accounting/` — the Reporting Layer (contexts, headers, adjustments)
- `src/domain/accounting/__doc__/01-philosophy.md` — the Bookkeeper vs Accountant analogy
- `src/domain/accounting/__doc__/02-architecture.md` — Reporting Headers architecture
- `src/domain/accounting/__doc__/03-adjustments-and-reporting.md`
- `src/domain/accounting/__doc__/05-statutory-reporting.md`

## Things to Cover (TODOs)

- [ ] The analogy: the bookkeeper records facts; the accountant interprets them
- [ ] What "standard-agnostic" means in practice for a GL
- [ ] The `LedgerAccount` as a pure double-entry structure (debits = credits, full stop)
- [ ] The `ReportingContext` — what it is (standard + fiscal year + jurisdiction)
- [ ] The `ReportingHeaders` tree — how GL accounts are _mapped_ to reporting nodes, not embedded
- [ ] Depreciation example: why the GL stores purchase price, not depreciated value
- [ ] The multi-jurisdiction payoff: one GL, N reporting standards
- [ ] Audience: CTOs, lead engineers, and finance professionals evaluating Fintech architecture

## Article Structure (template)

- Introduction
- Section 1: What — the GL and what it should (and shouldn't) know
- Section 2: Why — the pain of a standard-coupled GL at scale
- Section 3: How — the Reporting Headers mapping architecture
- Section 4: When/Where — depreciation, adjustments, multi-jurisdiction
- Conclusion
- TL;DR
- Additional Resources
