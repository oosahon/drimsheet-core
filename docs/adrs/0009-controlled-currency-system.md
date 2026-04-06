# ADR 0009: Controlled Currency System

## Status

Accepted

## Context

PurpleLedger natively supports calculating a consolidated Networth for a user across all their accounting domains. To accurately aggregate financial values held in different currencies (e.g., Naira and USD) into a single baseline valuation, the system must rely on highly accurate, chronologically-aware exchange rates. If users are permitted to create arbitrary custom currencies (like niche cryptocurrencies or fictional tokens), the system cannot verify or maintain daily exchange rates, breaking the reliability of consolidated reporting.

## Decision

The system completely restricts the creation of currencies by end-users. PurpleLedger ships with predefined, system-supported currencies internally monitored by a centralized exchange service.

## Consequences

### Positive

- Allows the platform to actively maintain and guarantee accurate, verifiable exchange rates internally.
- Flawless, deterministic computations for multi-currency transactions and consolidated Networth reporting.

### Negative

- Restricts flexibility for users who wish to do bookkeeping in unsupported fiat currencies, local private tokens, or niche cryptocurrencies.
