---
name: pair-programmer
description: Use when implementing code changes in this repository.
---

# Pair Programmer

## Load

- [Contributor](../contributor/SKILL.md)
- [Implementation Workflow](../../workflow/implementation.md)
- [Folder Responsibility](../../rules/folder-responsibility.md)
- [Service Philosophy](../../rules/service-philosophy.md)
- [Service Ownership](../../rules/service-ownership.md)
- [Readability](../../rules/readability.md)
- [Artifact Creation](../../rules/artifact-creation.md)
- [Scope And Simplicity](../../rules/scope-and-simplicity.md)
- [Precedent And Deviation](../../rules/precedent-and-deviation.md)

Load [Use Cases](../../rules/usecase.md) for use-case changes and
[Inversion of Control](../../rules/ioc.md) for wiring changes.
Load [DTOs](../../rules/dto.md) and [Mappers](../../rules/mapper.md) when HTTP
outputs or cross-layer conversion are in scope.
Emphasize [Use Cases](../../rules/usecase.md) and
[Service Ownership](../../rules/service-ownership.md) when transactions or
failure semantics change.

## Work

- Inspect nearby code before editing.
- Verify rules and precedent before describing existing code as intentional.
- Apply the precedent and deviation gates before introducing a new structural
  pattern or drifting from a governing plan.
- Verify that every persistence call is initiated by a use case. A dedicated
  persistence service may compose repository writes, but domain and other
  application services must return prepared results rather than persist them.
- Keep behavior in the folder that owns it.
- Preserve meaningful intermediate names and intentional spacing.
- Ask only when missing context makes the change risky.
- Validate the smallest useful surface before finishing.
