# Service Philosophy Alignment Plan

## Goal

Agree on a durable service philosophy before continuing service refactors. The
outcome is a shared decision model for when a service should exist, which layer
owns it, and what its contract must communicate.

This plan is not implementation-ready for broad code movement. It is
decision-ready: it should first produce updated guidance and a small set of
agreed examples. Preserve unrelated staged and working-tree changes during any
follow-up implementation.

## Context

- `.agents/rules/service-ownership.md` already says a service must represent a
  named capability with a clear owner, not merely shorten a use case.
- `.agents/rules/folder-responsibility.md` defines layer ownership: domain owns
  business invariants; app owns reusable workflow capabilities and policies;
  infra owns concrete adapters and runtime wiring.
- `CONTRIBUTING.md` currently says all entities, services, repos, and use cases
  are pure functions. That is incorrect: repositories and many application
  services necessarily perform side effects such as persistence, cache claims,
  queueing, transactions, and report-once best-effort work. The guidance should
  distinguish pure domain behavior from controlled side effects.
- The existing `.agents/plans/service-ownership-consolidation-plan.md` proposes
  concrete service dispositions. This plan intentionally sits before that work
  and focuses on philosophy, language, and agreement.

## Confirmed Findings

1. **High — The current service heuristic classifies by ingredients and topic.**
   “Does this require repo data?” and “does this protect an invariant?” are
   useful domain prompts, but repo usage alone does not make something a domain
   service. “Does this group functionality around the same feature?” is useful
   for app discovery, but grouping alone can produce broad buckets such as auth
   token managers or persistence wrappers without clear ownership.
2. **High — Human and agent guidance are not fully aligned.** Agent rules allow
   application services with side effects and explicit failure semantics, while
   `CONTRIBUTING.md` incorrectly describes services as pure and
   side-effect-free.
3. **Medium — The repo has examples worth preserving.** Dependency-injected
   factory construction, nearby service tests, domain services that return
   entities/events/audits without persisting them, and app services such as
   account bootstrap and best-effort balance propagation provide usable local
   patterns.
4. **Medium — The repo also has examples that need disposition language.**
   Domain persistence services, one-workflow persistence wrappers, broad token
   services, and long procedural bootstrap services need a shared vocabulary
   before deciding whether to keep, split, inline, move, or rename them.

## Scope

### Expected Changes

- `.agents/rules/service-ownership.md` — sharpen the service philosophy into a
  creation gate, disposition model, and layer-specific contract expectations.
- `CONTRIBUTING.md` — align human-facing contribution guidance with the same
  philosophy, especially around app-service side effects.
- `.agents/skills/domain-service-creation/SKILL.md` — ensure the skill asks the
  same ownership questions before creating or changing domain services.
- `.agents/workflow/implementation.md` — keep implementation workflow aligned
  with the service creation gate.
- `.agents/plans/service-ownership-consolidation-plan.md` — use as downstream
  refactor input only after the philosophy is accepted.

### Out of Scope

- Moving, deleting, renaming, or refactoring existing service implementations.
- Changing production behavior.
- Introducing a service framework, base class, decorator, registry, or generic
  abstraction.
- Settling every existing service disposition before the philosophy is agreed.

## Proposed Approach

### 1. Adopt The Core Doctrine

- Use this doctrine as the opening rule:
  “A service is a named capability with explicit ownership, not a bucket for
  related functions or a way to shorten a use case.”
- Make every proposed service complete this sentence:
  “This service exists because the system needs a named capability to **_,
  owned by _**, with these invariants, side effects, and failure semantics: \_\_\_.”
- Treat awkward answers as a signal that the behavior may belong in an entity,
  value, rule, policy, use case, repository, adapter, or IoC module instead.

### 2. Replace The Domain Heuristic

- Replace “does this require repo data?” with “what domain decision is being
  made, and who owns that decision?”
- Keep repository-backed domain services only when persisted state is required
  to enforce a domain invariant.
- Keep repository usage narrow: query the state needed for the invariant, then
  return a domain decision or coordinated domain creation result.
- Reject domain services that own application transactions, event publication,
  history construction, queueing, context mutation, logging, or persistence
  workflows.

### 3. Replace The App Heuristic

- Replace “does this group functionality around the same feature?” with “is
  this a reusable application capability with an independently meaningful
  contract?”
- Require every app service contract to document whether it rejects,
  best-efforts, queues, retries, claims exclusive work, composes with an outer
  transaction, or owns a transaction.
- Keep request-specific ordering inside the use case, even when extraction
  would make the use case shorter.
- Allow reusable application persistence services to own transactions when they
  protect a multi-repository atomicity boundary. For example, journal entries
  and journal lines have separate repositories, but the application must ensure
  they are saved together or not at all.
- Allow app services to coordinate domain behavior and ports, but make domain
  decisions visible in entities, values, domain rules, or domain services.

### 4. Add A Service Disposition Vocabulary

- **Keep:** the service has a named capability, correct owner, meaningful
  contract, tests, and clear failure semantics.
- **Narrow:** the service is valid, but contains decisions or side effects owned
  elsewhere.
- **Split:** the service name hides multiple capabilities with different owners
  or failure semantics.
- **Move:** the capability is real, but the file lives in the wrong layer.
- **Scrutinize:** the service has only one production caller. It may still be
  valid in a growing application, but it needs a stronger capability name,
  explicit semantics, and a reason to exist outside the caller.
- **Inline:** the behavior belongs to one request-specific workflow and has no
  independent contract after scrutiny.
- **Delete:** the behavior is dead, redundant, or only re-exports another owner.
- **Rename:** the capability is real, but the name hides what it owns.

### 5. Codify Examples Before Refactoring

- Document one good domain service example: coordinated accounting entity
  creation or posting-period validation.
- Document one good app service example: cross-family account bootstrap or
  best-effort balance propagation.
- Document one non-service example: workflow-specific persistence that should
  stay inside a use case.
- Document one adapter example: bcrypt/JWT/queue/cache behavior belongs behind
  app ports or in infra, not as broad domain or app service buckets.
- Use these examples as review anchors before applying the downstream service
  ownership consolidation plan.

## Test Plan

- No production test changes are required for the philosophy artifact itself.
- Future implementation plans should add or adjust tests at the owner layer
  whenever a service is kept, narrowed, split, moved, scrutinized, inlined, or
  deleted.

## Verification

```bash
rg -n "service|side-effect|pure|named capability|failure semantics" .agents CONTRIBUTING.md
```

Use the search result to confirm the docs no longer contradict each other once
the philosophy changes are implemented.

## Open Decisions

- What suffix convention should replace `.service.ts`, `.handler.ts`, and
  `.usecase.ts` inside IoC? Removing those suffixes from composition modules
  avoids confusing wiring files with behavioral implementations; the remaining
  decision is the new naming scheme and migration order.
- What level of scrutiny should one-caller app services receive? They should
  not be categorically rejected while the application is still growing, but they
  should be highlighted during review and required to justify their independent
  capability.

## Risks

- **Overcorrection:** The team may inline useful capabilities just because they
  have one caller today. Mitigate by treating one-caller services as review
  signals, not automatic deletion candidates.
- **New jargon without behavior change:** A philosophy document can become
  decorative if not connected to review prompts. Mitigate by updating agent
  rules, contribution docs, and future implementation plans together.
- **Too much ceremony:** Service creation could become slower than needed.
  Mitigate by keeping the creation gate short and requiring deeper analysis only
  when the service crosses layers, persists, queues, reports, or transacts.

## Completion Criteria

- The team has agreed to the core service doctrine.
- Domain and app service heuristics have been replaced with ownership-based
  questions.
- Human and agent docs no longer disagree about app-service side effects.
- Future service plans use the keep/narrow/split/move/scrutinize/inline/delete/
  rename disposition vocabulary.
- No production code has changed as part of this philosophy-only plan.
