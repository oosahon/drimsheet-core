# ADR 0008: Dynamic Secrets Injection via Doppler

## Status

Accepted

## Context

Deploying software containing `.env` files physically stored on servers, committed in source code, or shared via internal chat applications presents a catastrophic data-loss risk and complicates credential rotation across local, staging, and production boundaries.

## Decision

We replaced all `.env` reliance with **Doppler**, acting as our centralized secret management.

1. Secrets are mapped securely within Doppler.
2. During continuous integration pipelines via Coolify, the Doppler CLI natively injects those variables directly into the Node.js Docker container lifecycle dynamically at startup.
3. Within the App, configuration is firmly typed via our `vars.config.ts`, ensuring we never process undefined essential keys.

## Consequences

### Positive

- Extremely rapid, 1-click credential rotation globally.
- Strict operational auditing.
- Impossible for `.env` secrets to leak into GitHub histories or Docker Image artifact layers accidentally.

### Negative

- Local development necessitates the installation of the Doppler Command Line Interface and maintaining a valid authentication state to spin out environments.
