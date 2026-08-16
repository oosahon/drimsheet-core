# ADR 0007: Exposing Core Logic via the Model Context Protocol (MCP)

## Status

Accepted

## Context

One of the goals of Drimsheet is to empower accounting support securely via Autonomous AI Agents. Exposing raw API endpoints directly to large language model wrappers is prone to hallucinated payloads and unsecured mutations, risking violations of our core ACIDS/Accounting constraints.

## Decision

We natively expose core interfaces utilizing the **Model Context Protocol (MCP)**.

- Agents receive distinctly bounded, highly typed use-cases designed explicitly to function as deterministic LLM Tools.
- Dangerous or highly sensitive mutations explicitly require human-in-the-loop validation or strict Role-Based Access Control (RBAC) scoping before the MCP handler executes downstream.

## Consequences

### Positive

- Drimsheet becomes instantly interoperable with standard LLM tooling ecosystems out-of-the-box, serving high-value integrations safely.
- Agents can natively read tax/audit status securely directly from the context source.

### Negative

- The interface layer must be carefully duplicated or adapted into distinct MCP payloads, requiring more active developer maintenance when a use-case input payload changes.
