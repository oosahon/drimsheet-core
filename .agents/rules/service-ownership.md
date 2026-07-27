# Service Ownership

Follow [Service Philosophy](service-philosophy.md) for the doctrine, layer
questions, and disposition vocabulary.

Extract a service only when it represents a named capability with a clear
owner. Do not create a service merely to shorten a use case.

## Domain Services

- Own business invariants, domain decisions, and coordinated creation within
  one bounded context.
- Remain dependency-free by default.
- Depend on a repository only when persisted state is required to enforce an
  invariant. Use that repository for the invariant check, not to turn the
  domain service into a persistence workflow.
- Do not own application transactions, context updates, event publication, or
  cross-domain workflow orchestration.

## Application Services

- Own reusable application capabilities that coordinate domain behavior or
  ports, such as bootstrapping all ledger account families.
- Have an independently meaningful contract and focused tests.
- Define failure semantics in the service contract: whether the capability
  rejects or is best-effort.
- May own transactions when the reusable capability protects a multi-repository
  atomicity boundary.
- For best-effort capabilities, the implementation catches and reports failures
  exactly once. Callers await the capability without repeating catches or
  reporter calls.
- Do not duplicate a single use case or hide its workflow behind a generic
  `onboarding`, `manager`, or `persistence` name.

## Factories And Implementations

- Service factories construct capabilities and bind dependencies.
- Service implementation functions own runtime behavior, including error
  handling, reporting policy, retries, and best-effort semantics.
- Do not move catches or reporting into a factory to make a call site shorter.
- When changing reusable failure semantics, inspect every caller and remove
  redundant reporting, impossible rejection tests, and stale reporter
  dependencies.

## Use Cases

- Own the request-specific workflow and ordering.
- May coordinate repository writes, transaction boundaries, history creation,
  application context updates, and event publication when those steps belong
  only to that workflow.
- Extract persistence only when it is a reusable capability with an independent
  contract. Services with one production caller are allowed in a growing
  application, but must be highlighted and scrutinized during review.

## Decision Check

1. Business invariant or coordinated domain creation? Domain service.
2. Reusable application capability? Application service.
3. Request-specific orchestration or transaction? Use case.
4. Storage or retrieval only? Repository.
5. Extraction only makes a function shorter? Keep it with the current owner.
