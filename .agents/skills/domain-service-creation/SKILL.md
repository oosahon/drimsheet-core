---
name: domain-service-creation
description: Use when creating or changing domain services, coordinated domain creation, business invariant checks, repository-backed invariants, or their service contracts, mocks, tests, and IoC wiring.
---

# Domain Service Creation

## Load

- [Implementation Workflow](../../workflow/implementation.md)
- [Folder Responsibility](../../rules/folder-responsibility.md)
- [Service Philosophy](../../rules/service-philosophy.md)
- [Service Ownership](../../rules/service-ownership.md)
- [Readability](../../rules/readability.md)
- [Domain Modeling](../../rules/domain-modeling.md)
- [Domain Validations And Helpers](../../rules/domain-validations.md)
- [Error Creation](../../rules/error-creation.md)
- [Domain Unit Tests](../../rules/testing/domain.md)
- [Inversion of Control](../../rules/ioc.md) when wiring changes

## Work

- Inspect the nearby service, type contract, mock, tests, repositories, and IoC
  before editing.
- Name the domain capability and the invariants it owns.
- Put reusable service validation in
  `services/validations/<subject>.validation.ts` as a default-exported frozen
  object. Keep each genuine helper as one default-exported function per file.
- Confirm the service can complete the service-philosophy sentence with a clear
  domain owner.
- Keep the service dependency-free unless persisted state is required for an
  invariant.
- Keep workflow persistence, transactions, context updates, event publication,
  and cross-domain orchestration outside the domain service.
- Follow nearby immutable return, event, audit, contract, and mock patterns.
- Test invariants through the public service API at the domain layer.
