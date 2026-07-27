# Implementation Workflow

Use this for ordinary code changes.

1. Read the relevant skill, rule, and workflow files completely.
2. Inspect nearby entities, services, contracts, mocks, tests, repositories, and
   IoC before adding files or abstractions.
3. Revalidate any saved plan against durable rules and the current repository.
   Plans do not override current rules or established local patterns.
4. Name the owner of every invariant, decision, side effect, transaction, and
   new behavior: domain, app, interface, infra, or shared.
5. Before editing, run the ownership checks that match the change:
   - For HTTP outputs, search for an existing app DTO and mapper before adding
     response contracts or exposing domain entities.
   - For reusable failure behavior, inspect every caller before assigning
     rejection, best-effort handling, or reporting ownership.
   - For transactions, review callback shape separately for responsibility
     creep and name preparation versus persistence phases.
   - For owner APIs, reject expansions that only re-export another helper for
     call-site convenience.
6. Justify each proposed service as a named capability. If it only shortens a
   use case, do not extract it.
7. Keep orchestration, policy, mapping, persistence, and delivery concerns
   distinct without forcing each concern into a separate service.
8. Make the smallest coherent change and follow nearby readability patterns.
9. Add or update tests at the owning layer.
10. Run focused validation, then broader validation when risk is higher.

Follow [Service Ownership](../rules/service-ownership.md),
[Service Philosophy](../rules/service-philosophy.md),
[Inversion of Control](../rules/ioc.md), and
[Readability](../rules/readability.md) when those concerns are in scope. Follow
[DTOs](../rules/dto.md) and [Mappers](../rules/mapper.md) for HTTP outputs or
cross-layer conversion, and [Use Cases](../rules/usecase.md) for transactions.
