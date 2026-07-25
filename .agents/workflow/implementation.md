# Implementation Workflow

Use this for ordinary code changes.

1. Read the relevant skill, rule, and workflow files.
2. Inspect nearby code before adding files.
3. Name the owner of each new behavior: domain, app, interface, infra, or shared.
4. Keep orchestration, policy, mapping, persistence, and delivery concerns separate.
5. Make the smallest coherent change.
6. Add or update tests at the owning layer.
7. Run focused validation, then broader validation when risk is higher.
