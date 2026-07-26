# Implementation Workflow

Use this for ordinary code changes.

1. Read the relevant skill, rule, and workflow files completely.
2. Inspect nearby entities, services, contracts, mocks, tests, repositories, and
   IoC before adding files or abstractions.
3. Revalidate any saved plan against durable rules and the current repository.
   Plans do not override current rules or established local patterns.
4. Name the owner of every invariant, decision, side effect, transaction, and
   new behavior: domain, app, interface, infra, or shared.
5. Justify each proposed service as a named capability. If it only shortens a
   use case, do not extract it.
6. Keep orchestration, policy, mapping, persistence, and delivery concerns
   distinct without forcing each concern into a separate service.
7. Make the smallest coherent change and follow nearby readability patterns.
8. Add or update tests at the owning layer.
9. Run focused validation, then broader validation when risk is higher.

Follow [Service Ownership](../rules/service-ownership.md),
[Inversion of Control](../rules/ioc.md), and
[Readability](../rules/readability.md) when those concerns are in scope.
