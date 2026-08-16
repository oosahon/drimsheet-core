# Philosophy

> [!WARNING]
> This document is scoped to the following milestone:\
> https://github.com/Drimsheet/drimsheet-core/milestone/1 (v0.1.0 — Individual MVP)

The Bookkeeping domain is the foundation of the financial system. It is strictly **standard-agnostic**. Its only concern is recording the raw mechanical facts of financial events (debits and credits) in compliance with double-entry accounting principles.

It does not know about tax laws, depreciation schedules, GAAP, or IFRS. It simply ensures that the books balance. It is "The Bookkeeper" — recording transactions so that "The Accountant" (the Reporting Layer) can later classify and report on them.
