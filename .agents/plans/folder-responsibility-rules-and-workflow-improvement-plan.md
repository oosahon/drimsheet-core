# Folder responsibility rules and workflow improvement plan

## Objective

Create a clear folder-responsibility rule set for `purple-ledger` so agents and
contributors put behavior in the layer that owns it. The immediate goal is to
prevent "wrong drawer" changes such as adding a URL sanitization helper to
`src/infra/config/rate-limiter.config.ts`, and the larger goal is to make every
implementation workflow start by deciding which layer owns each decision,
policy, adapter, DTO, mapper, and helper.

## Problem statement

The current rules are strong for specific artifact shapes: use cases, DTOs,
mappers, repositories, errors, and tests. The missing guidance is an explicit
responsibility map for folders and layers. Without that map, an agent can obey
file naming rules while still putting a concern in the wrong folder, or can
silently move business/application decisions into controllers, middlewares,
config modules, or use case glue.

There is also a broader agent-system problem: the current skills, rules, and
workflows are not structured clearly enough for reliable use. Skills mixed
persona, contribution setup, mandatory rule loading, and task-specific guidance.
The improvement should therefore audit the whole `.agents` structure instead of
adding one more isolated rule.

## Implementation decisions

1. Remove `.rule.md` and `.workflow.md` suffixes. The folder names already carry
   the artifact type.
2. Convert skills to directories with `SKILL.md` files and YAML frontmatter.
3. Do not add per-skill rule folders by default. Keep rules centralized.
4. Add root `AGENTS.md` as the cross-agent entrypoint.
5. Keep skills short. Skills should load rules/workflows, not duplicate them.
6. Keep rules short. Rules should state constraints, not explain architecture at
   length.

## Current boundary facts

1. `eslint.config.mjs` already defines the primary source layers:
   - `src/domain`
   - `src/app`
   - `src/infra`
   - `src/interface`
   - `src/shared`
2. ESLint currently enforces these dependency directions:
   - Domain may import only from `src/domain` or `src/shared`.
   - App may import only from `src/shared`, `src/domain`, or `src/app`.
   - Infra may import only from `src/shared`, `src/app`, `src/domain`, or
     `src/infra`.
   - Shared may import only from `src/shared`.
3. The dependency rule does not describe ownership. It can block some bad
   imports, but it cannot reliably detect a helper, policy, validation rule, or
   business decision placed in the wrong layer.

## Proposed folder responsibility model

### `src/domain`

- Owns business invariants, domain state transitions, domain errors, domain
  events, value objects, entity behavior, domain service contracts, and
  repository contracts.
- Must not import from `src/app`, `src/infra`, or `src/interface`.
- Must not know HTTP, Express, TSOA, Redis, Drizzle, queues, env vars, cookies,
  logging, request metadata, or framework-specific concerns.
- Must not contain orchestration code whose real job is to call adapters or
  coordinate external systems.
- Domain decisions must be testable without infrastructure.

### `src/app`

- Owns application workflows, use cases, policies, application DTOs,
  application services, application errors, mapper functions that translate
  between domain/application/interface shapes, worker intent, and port
  contracts used by infrastructure.
- Use cases orchestrate domain behavior and application services, but must not
  invent domain/business decisions inline. If a rule decides what is allowed,
  valid, billable, visible, reversible, state-changing, or policy-driven, that
  rule belongs in domain or a named application policy/service.
- Application code may depend on domain and shared abstractions, but not infra
  implementations or interface framework code.
- Application services may coordinate technical capabilities through injected
  ports, but must not reach directly into framework/runtime modules.

### `src/interface`

- Owns delivery adapters: HTTP controllers, routes, middlewares, handlers,
  request/response shaping, status-code mapping, TSOA annotations, request
  context assembly, and interface-specific validation/parsing.
- Controllers and middlewares must orchestrate only. They may parse input, call
  app use cases/services, map output, set response metadata, and translate
  errors, but they must not make business or application policy decisions.
- Interface helpers are only for interface concerns. A helper used to redact an
  HTTP URL for logging can live here if it is specifically HTTP/request
  presentation logic; a generic URL helper belongs in `src/shared`; an auth
  policy belongs in `src/app/auth/policies` or domain as appropriate.

### `src/infra`

- Owns concrete adapters and runtime wiring: database implementations, cache
  implementations, queue implementations, external service clients, config
  loading, IoC composition, server bootstrap, observability transports, and
  framework runtime setup.
- Infra modules implement ports/contracts defined by domain or app. They should
  not own business/application decisions merely because the decision is used by
  an infra adapter.
- Repositories are only for data storage and retrieval. They may translate
  domain/app models to persistence models, execute queries, honor transaction
  options, and return results. They must not decide business behavior, compose
  workflows, apply policy, emit domain/application events, call external
  services, or perform multi-step operations that belong in an application or
  persistence service.
- `src/infra/config` is for configuration values and adapter configuration. It
  must not become a general helper drawer. Helpers placed here should be tightly
  coupled to configuring the specific adapter in that file.
- Repository implementations must keep persistence mapping explicit and must
  not leak Drizzle or storage models back across the boundary.

### `src/shared`

- Owns framework-neutral utilities, base types, generic errors, shared event
  primitives, history helpers, pagination, and small pure helpers that are safe
  for every layer.
- Shared code may import only from shared.
- Shared must not contain product-specific business rules, application policy,
  infrastructure knowledge, or interface/framework assumptions.
- A helper should be promoted to shared only when at least two layers need the
  same pure, framework-neutral behavior and the behavior has no domain owner.

### Tests

- Domain tests prove invariants and state transitions without infrastructure.
- App/use case tests prove orchestration and policy delegation with mocked
  ports.
- Interface tests prove request parsing, response mapping, status codes,
  middleware behavior, logging redaction, and generated route contracts.
- Infra tests prove adapter behavior against fakes or real dependencies as
  appropriate.
- Integration tests should cross boundaries intentionally and document which
  assembled behavior they protect.

## Placement decision checklist

Every implementation task should answer these questions before creating or
moving code:

1. Is this a business invariant or state transition? Put it in `src/domain`.
2. Is this an application workflow, policy, or use case decision? Put it in
   `src/app`, preferably under a named `policies`, `services`, or `usecases`
   folder.
3. Is this HTTP/request/response/framework delivery logic? Put it in
   `src/interface`.
4. Is this a concrete adapter, persistence implementation, runtime config, or
   IoC/server wiring? Put it in `src/infra`.
5. Is this pure, framework-neutral, non-business utility code needed by
   multiple layers? Put it in `src/shared`.
6. If the answer is "it is just a helper", identify the owning concern before
   creating it. Helpers inherit the responsibility of the behavior they contain.
7. Does this database action need orchestration beyond one storage/retrieval
   operation? Put the orchestration in an app service, domain service, or
   persistence service, and keep the repository method narrow.
8. Does this model have identity and lifecycle? It is probably an entity. Is it
   identified only by its attributes and used as part of an entity? It is
   probably a value.

## Entity versus value guidance

### Entities

- Use an entity when the concept has a stable unique identifier and lifecycle.
- Entities own behavior that changes their state while preserving invariants.
- Entities may contain values, emit domain events, and expose state transitions.
- Entity equality is usually based on identity, not every field being equal.
- Examples: a user, ledger account, journal entry, session, or other object that
  can be created, updated, soft-deleted, verified, posted, closed, or otherwise
  tracked over time.

### Values

- Use a value when the concept is described by its attributes and has no
  independent lifecycle.
- Values should be immutable or treated as immutable.
- Values validate and protect small domain concepts used by entities or
  services.
- Value equality is usually based on the contained attributes.
- Examples: money amount, currency, email address, date range, percentage,
  account code, token digest, or structured metadata that belongs to a parent
  entity.

### Placement questions

- If the concept can be referenced independently by ID, make it an entity.
- If changing one field means it is conceptually a different object, make it a
  value.
- If the behavior changes or protects aggregate state, put it on an entity or
  domain service.
- If the behavior validates a small reusable concept, put it on a value.
- If the behavior only coordinates storing or loading models, put it in a
  service above repositories, not inside `*.repo.impl.ts`.

## Anti-patterns to call out explicitly

1. Putting generic helpers in config files, such as `sanitizeUrl` inside
   `src/infra/config/rate-limiter.config.ts`.
2. Letting controllers, middlewares, or handlers decide whether an operation is
   allowed instead of delegating to app/domain policy.
3. Letting use cases embed business rules inline when the rule should live in a
   domain entity/value/service or named application policy.
4. Letting infrastructure implementations shape domain behavior because a
   database, cache, queue, or external API happens to require a certain format.
5. Adding orchestration, cascading operations, audit/event emission,
   application policy, or business rules to `*.repo.impl.ts`.
6. Adding "convenience" repository methods that combine multiple use-case steps
   instead of creating a service that coordinates narrow repository operations.
7. Treating values as entities just because they are stored in a table, or
   treating entities as values just because they are nested in a payload.
8. Promoting project-specific rules to `src/shared` just because multiple files
   need them.
9. Hiding side effects in mappers, DTOs, validators, or helper functions.
10. Creating a new folder or helper before searching for an existing owner.

## Implementation plan

### 1. Audit the current agent-system structure

- Review every file under `.agents/skills`, `.agents/rules`, `.agents/workflow`,
  and `.agents/plans`.
- Classify each file by purpose:
  - skill: role/capability entrypoint that tells an agent what context to load;
  - rule: durable project constraint that applies across tasks;
  - workflow: ordered task procedure;
  - plan: one-time implementation or investigation artifact.
- Identify overlap, stale guidance, weak wording, missing mandatory links, and
  rules that are hidden in skills or workflows.
- Remove redundant `.rule.md` and `.workflow.md` suffixes and update links.
- Propose a normalized structure before editing the existing files.

### 2. Redesign the skill structure

- Keep skills small and composable. A skill should answer "what role or
  capability is active?" and then link to the required rules/workflows.
- Store each skill as `.agents/skills/<name>/SKILL.md`.
- Give each skill YAML frontmatter with `name` and `description`.
- Do not create per-skill rule folders unless a rule is truly private to that
  skill.
- Move durable constraints out of skills and into rules.
- Move ordered procedures out of skills and into workflows.
- Add a top-level implementation skill or workflow entrypoint if agents need a
  single place to start for ordinary code changes.
- Ensure `.agents/skills/pair-programmer/SKILL.md` does not become a dumping
  ground for every rule. It should load a curated baseline and defer
  task-specific rules to the relevant workflow.
- Ensure PR review, repo implementation, testing, migrations, error handling,
  and domain modeling have clear entrypoints and do not duplicate each other.
- Add root `AGENTS.md` to tell all agents how to enter the system.

### 3. Add a dedicated folder responsibility rule

- Create `.agents/rules/folder-responsibility.md`.
- Include the layer responsibility model above.
- Include the placement decision checklist.
- Include the anti-pattern list.
- Link to `eslint.config.mjs` as the enforced dependency boundary source of
  truth.
- Add examples of correct placement for common concerns:
  - URL redaction/sanitization for HTTP logging.
  - OAuth state policy and token consumption.
  - Rate limiter configuration versus limiter key derivation policy.
  - Cookie/session response details.
  - Domain entity state transitions.
  - Entity versus value placement.
  - Narrow repository storage methods versus application/persistence services.
  - Drizzle persistence mapping.

### 4. Update mandatory skills and workflows to load the rule

- Update `.agents/skills/pair-programmer/SKILL.md` so the folder
  responsibility rule is mandatory for code changes.
- Update `.agents/workflow/repo-implementation.md` to require a
  boundary/ownership check before adding repositories, mappers, or helper code.
- Consider adding a general implementation workflow if repository work is not
  the only workflow agents use for code changes.
- Update `.agents/skills/pr-reviewer/SKILL.md` and
  `.agents/rules/pr-review.md` so reviews check for misplaced
  responsibilities, not only import-boundary violations.

### 5. Tighten existing artifact rules where ownership matters

- Update `.agents/rules/usecase.md`:
  - Use cases orchestrate injected dependencies and domain/application services.
  - Use cases must not make unowned business decisions inline.
  - New policy decisions must be extracted to domain or app policy/service
    modules before the use case calls them.
- Update `.agents/rules/dto.md`:
  - DTO validation handles input shape and primitive constraints.
  - Business validity must be delegated to domain/app logic.
- Update `.agents/rules/mapper.md`:
  - Mappers are explicit, pure translation only.
  - Mappers must not normalize, sanitize, authorize, fetch, persist, emit
    events, or apply business policy.
- Update `.agents/rules/repo-implementation.md`:
  - Repositories persist and retrieve domain/app models.
  - Repositories must not contain business decisions, application policy,
    workflow orchestration, event emission, or service calls.
  - If a storage operation needs multi-step coordination, place that
    coordination in an application service, domain service, or persistence
    service and inject narrow repository methods into it.
- Update `.agents/skills/domain-entity-creation/SKILL.md` and add a domain
  modeling rule:
  - Define when to create an entity versus a value.
  - Require entity behavior to protect invariants and lifecycle transitions.
  - Require values to remain small, attribute-based, and side-effect free.

### 6. Add an implementation preflight checklist

- Add a checklist section to the pair-programmer or implementation workflow:
  - Read the relevant rules before editing.
  - Inspect nearby folder patterns before creating a new file.
  - Name the owning layer for each new behavior.
  - Check whether the behavior is a domain rule, app policy, interface concern,
    infra adapter detail, or shared pure utility.
  - Check whether a new domain model should be an entity or a value.
  - Check whether repository changes are storage/retrieval only, or whether the
    work belongs in a service above the repository.
  - Confirm the dependency direction allowed by `eslint.config.mjs`.
  - Run `npm run lint` or the repo's equivalent validation command after edits
    that affect source boundaries.

### 7. Add lightweight enforcement where feasible

- Review whether ESLint boundaries should add stricter element definitions for
  common folders such as `controllers`, `middlewares`, `usecases`, `policies`,
  `mappers`, `config`, and `persistence`.
- Add or update lint rules only when they catch real mistakes without fighting
  the architecture.
- Consider a small architecture test or script that reports suspicious helper
  placement, for example:
  - exported functions from `src/infra/config` that are not config factories or
    constants;
  - imports from controllers/middlewares into infra config modules;
  - mappers importing non-type dependencies or side-effectful services.
  - repository implementation methods calling services, event buses, mailers,
    queues, HTTP clients, or unrelated repositories.
  - repository implementation methods performing broad orchestration that should
    be in a persistence service.
- Keep enforcement advisory at first if false positives are likely.

### 8. Use the verify-email work as a QA fixture

- Re-review the verify-email implementation against the new rule.
- Move misplaced helpers to their owning folders:
  - generic URL/query redaction to `src/shared` if it is framework-neutral;
  - HTTP-specific redaction to `src/interface/http/helpers`;
  - rate-limit key policy to `src/app/auth/policies` or an app service when it
    encodes application/security policy;
  - concrete limiter configuration to `src/infra/config`.
- Add tests at the owning layer after moving behavior.
- Confirm the final code still satisfies ESLint boundaries.

## Acceptance criteria

1. A new folder responsibility rule exists and clearly covers domain, app,
   interface, infra, shared, and tests.
2. The `.agents` folder has been audited and each skill, rule, workflow, and
   plan has a clear purpose.
3. `.rule.md` and `.workflow.md` suffixes are removed, and all links match that
   decision.
4. Skills are directories with `SKILL.md` files and `name`/`description`
   frontmatter.
5. Root `AGENTS.md` exists and points agents to `.agents/README.md`, skills,
   rules, and workflows.
6. The skill structure is simplified so skills load rules/workflows instead of
   becoming large mixed-purpose documents.
7. Pair-programmer and review workflows require the rule for implementation and
   review work.
8. Use case, DTO, mapper, and repository rules are updated to prevent business
   or application decisions from hiding in orchestration/translation/persistence
   code.
9. Repository implementation guidance explicitly states that repositories are
   only for data storage and retrieval, and that multi-step persistence behavior
   belongs in a service.
10. Domain modeling guidance distinguishes entities from values and gives agents
    a placement checklist before creating either.
11. The new workflow asks agents to identify the owning layer before creating
    helpers or new files.
12. The plan identifies feasible automated checks without requiring brittle
    enforcement up front.
13. The verify-email changes are used as a regression fixture for the new
    guidance, including the `sanitizeUrl` placement issue.

## Open questions

1. Should `src/app/mappers` remain the canonical mapper location, or should
   infra-specific persistence mappers under `src/infra/persistence/mappers`
   receive their own explicit rule?
2. Should `src/shared/utils` be allowed for broadly useful helpers, or should
   new shared helpers be grouped by capability to avoid a utility junk drawer?
3. Should architecture checks be advisory CI output first, or should new
   boundary violations fail CI immediately?
4. Should interface-level request validation be limited to primitive transport
   validation, with all semantic validation moved to app/domain?
5. Should persistence services live under `src/app/<domain>/services`,
   `src/infra/persistence/services`, or a dedicated folder that makes their
   orchestration role obvious while preserving dependency direction?
6. What was the intended third concern after "All our current..."?
