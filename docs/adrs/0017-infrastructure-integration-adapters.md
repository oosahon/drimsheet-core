# ADR 0017: Infrastructure Integration Adapters

## Status

Accepted

## Context

Drimsheet Core integrates with named external platforms for authentication,
feature flags, observability, notifications, and future business capabilities.
The existing provider-specific code is distributed across infrastructure
configuration, services, and runtime folders. That makes configuration modules
own behavior, obscures provider boundaries, and leaves no consistent location
for a new external adapter.

The application, domain, and shared layers already own the contracts and data
shapes that external adapters satisfy. Provider-neutral infrastructure also has
established owners: persistence, messaging, observability, runtime, server, and
interface delivery.

## Decision

- Named external-platform adapters live under
  `src/infra/integrations/<provider-or-capability>`.
- An integration owns provider-specific SDK or client construction,
  configuration derivation, authentication, schemas, mapping, and bounded
  provider lifecycle behavior.
- System-facing contracts and DTOs remain owned by `src/app`, `src/domain`, or
  `src/shared`. Outbound integrations implement those contracts; inbound
  integrations translate provider inputs and delegate to system-owned use
  cases or handlers.
- Provider-neutral persistence, messaging, observability facades, process
  lifecycle coordination, HTTP delivery, IoC, and business rules do not move
  into integrations.
- Callers import the concrete integration they intentionally compose. No
  integration registry, generic base adapter, or compatibility re-export layer
  is introduced.
- Better Stack, LaunchDarkly, Google OAuth, and ZeptoMail are the initial
  integrations migrated to this structure.

## Consequences

### Positive

- External-platform code has a predictable, provider-owned location.
- Configuration modules no longer act as containers for adapter behavior.
- System-owned contracts remain independent of provider SDKs and payloads.
- Provider-specific observability and lifecycle behavior is easier to test in
  isolation without moving generic runtime responsibilities.

### Negative

- A new infrastructure convention must be documented and consistently
  enforced.
- Some providers span integrations and a provider-neutral owner, so their
  composition still crosses infrastructure folders intentionally.
- Moving existing modules requires coordinated import and Jest mock-path
  updates even though runtime behavior is unchanged.
