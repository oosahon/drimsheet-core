# Relocate Transactional Email Templates Plan

## Goal

Move the transactional email MJML sources, generated TypeScript renderers, and
their focused specs from the application layer to
`src/infra/templates/email`, while preserving the current queued email
subjects, recipients, rendered HTML, and failure behavior.

Implementation is complete. Unrelated staged and working-tree changes,
including the staged template redesign and generated renderers, were preserved.

## Context

`makeTransactionalEmailService` currently imports generated renderers from
`src/app/notification/templates` and uses them before adding fully rendered
HTML to `ITransactionalEmailQueue`. The MJML compiler in
`scripts/mjml-to-ts.ts` recursively discovers `.mjml` files and writes each
generated `.ts` renderer beside its source, so relocating a source also
relocates its generated artifact without requiring a configured template path.

Repository ownership rules place concrete adapters in `src/infra`, prohibit
`src/app` from importing `src/infra`, and explicitly document email templates
under `src/infra/templates`. The existing notification IoC module already
constructs the application service and is the correct composition point for
infrastructure renderers.

## Implementation Status

Preflight confirmed that the plan remains implementation-ready. The baseline
contains staged user changes to `generated/routes.ts`, `generated/swagger.json`,
`package-lock.json`, and the six existing template artifacts/specs under
`src/app/notification/templates`; the plan itself is untracked. The service,
service spec, and notification IoC module were clean before implementation.

| Slice                               | Owner and outcome                                                                                                       | Basis and precedent                                                                       | Intended files and tests                                                                    | Status                                                                                                                |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Preflight                           | Repository workflow: validate the plan, generator behavior, dependency direction, and staged baseline                   | Plan implementation workflow; `scripts/mjml-to-ts.ts`; `eslint.config.mjs`                | Saved plan and read-only repository inspection                                              | Completed: assumptions validated; later user-approved contract deviation recorded below                               |
| Relocate templates                  | Infrastructure: own MJML sources, generated renderers, and renderer specs under `src/infra/templates/email`             | Folder-responsibility rule and `CONTRIBUTING.md`                                          | Six files moved from `src/app/notification/templates`; relocated renderer specs             | Completed: all six baseline hashes matched after the move; spec imports use `@infra`                                  |
| Define template port                | Application: expose one cohesive transactional email template contract and typed shared mock                            | Explicit user instruction on 2026-08-18; application port ownership and shared-mock rules | New application contract and adjacent mock; application service spec                        | Completed: contract and typed shared mock added under the notification application contracts                          |
| Inject template port                | Application: consume `ITransactionalEmailTemplate` without importing infrastructure                                     | Explicit user instruction; local contract-backed dependency pattern                       | `transaction-email.service.ts`; application service spec                                    | Completed: the service receives one contract dependency and focused orchestration/failure tests pass                  |
| Implement and compose template port | Infrastructure and IoC: implement the contract with generated renderers and inject it into the existing service factory | User instruction, folder ownership, and IoC rules                                         | New template implementation; `src/infra/ioc/services/notification.ts`; infrastructure specs | Completed: frozen implementation delegates to both generated renderers and IoC injects it; focused adapter tests pass |
| Verify behavior                     | Application and infrastructure tests: preserve queued payload behavior and renderer interpolation                       | Application/infrastructure testing rules                                                  | Focused notification specs, MJML generation, typecheck, lint, full test suite               | Completed: generator, 3 focused suites/6 tests, TypeScript, lint, and 328 suites/2,656 tests pass                     |

### Approved Plan Deviation

On 2026-08-18, after the initial renderer-function injection was implemented,
the user explicitly required dependencies to rely on a transactional email
template contract rather than bare renderer methods. This approved change adds
an application-owned contract and mock plus one infrastructure implementation;
it does not add dynamic keys, a registry, persistence, or another rendering
implementation.

## Confirmed Findings

1. **The templates are in the wrong documented layer.**
   `CONTRIBUTING.md` assigns MJML sources and compiled TypeScript email
   templates to `src/infra/templates`, while both current templates live under
   `src/app/notification/templates`.
2. **A direct move would violate dependency direction.**
   `src/app/notification/services/transaction-email.service.ts` imports both
   generated renderers. After relocation, retaining those imports would make
   application code depend on infrastructure, which is prohibited by
   `.agents/rules/folder-responsibility.md` and enforced by
   `eslint.config.mjs`.
3. **The existing factory is the injection seam for a template contract.**
   `makeTransactionalEmailService` accepts a local `IDependencies` object, and
   `src/infra/ioc/services/notification.ts` supplies its production
   dependencies. The application service will depend on an
   `ITransactionalEmailTemplate` port implemented by infrastructure.
4. **Template lookup is static.** The service has two explicit workflows and
   selects each renderer in code. There is no current configuration, persisted
   template identifier, localization lookup, or tenant-specific selection that
   requires string keys or a template map.
5. **There are overlapping staged changes.** The two MJML files, their
   generated TypeScript renderers, and their specs currently have staged edits.
   Relocation must carry those exact edits forward and must not regenerate or
   replace unrelated staged files such as generated API artifacts.

## Implementation Basis

| Decision or structural change                                                                                            | Basis                                                        | Current requirement and production consumer                                                                                    | Evidence or rationale                                                                                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Place email template sources, generated renderers, and adjacent specs in `src/infra/templates/email`                     | User-resolved placement and durable folder-ownership rule    | Correct template ownership; `makeTransactionalEmailService` is the current production consumer                                 | `CONTRIBUTING.md` documents `src/infra/templates` for email templates; `.agents/rules/folder-responsibility.md` assigns concrete adapters to infrastructure                                                                                                                                                           |
| Inject an application-owned `ITransactionalEmailTemplate` contract through the service's local `IDependencies` interface | Explicit user requirement and local port/adapter precedent   | Prevent an app-to-infra import while continuing to render the two current transactional emails through one cohesive dependency | User correction on 2026-08-18 requires dependencies to rely on the transactional email template contract; `src/shared/contracts/token-codec.contract.ts#ITokenCodec` and `src/infra/auth/json-web-token-codec.impl.ts#makeJsonWebTokenCodec` demonstrate a consumer-facing port with an infrastructure implementation |
| Wire renderer implementations in the existing notification IoC module                                                    | Durable IoC rule and local precedent                         | Construct the existing transactional email application service with its production queue and renderers                         | `.agents/rules/ioc.md`; `src/infra/ioc/services/notification.ts#transactionalEmailService` is the current composition point                                                                                                                                                                                           |
| Keep email intent, subjects, recipient selection, queueing, and current escaping behavior in the application service     | Durable ownership rule and behavior-preservation requirement | The transactional email service remains the current owner and callers continue to depend on `ITransactionalEmailService`       | `src/app/notification/services/transaction-email.service.ts#makeTransactionalEmailService`; no service contract or queue DTO change is needed for relocation                                                                                                                                                          |
| Keep renderer specs adjacent to the relocated generated renderers and mock renderers in the service spec                 | Durable testing rule                                         | Preserve template interpolation coverage and verify application orchestration independently of infrastructure rendering        | `.agents/rules/testing/general.md` requires dependency-bearing specs under adjacent `__specs__`; existing specs are under `src/app/notification/templates/__specs__` and `src/app/notification/services/__specs__`                                                                                                    |

## Scope

### Expected Changes

- `src/app/notification/templates/**` to
  `src/infra/templates/email/**` — relocate both MJML sources, both generated
  TypeScript renderers, and their existing specs without losing staged edits.
- `src/app/notification/services/transaction-email.service.ts` — remove direct
  template imports, depend on `ITransactionalEmailTemplate`, and invoke its
  methods for the corresponding workflows.
- `src/app/notification/contracts/transactional-email-template.contract.ts`
  and adjacent `__mocks__` — define the application-owned rendering port and
  its typed shared test mock.
- `src/infra/templates/email/transactional-email-template.impl.ts` — implement
  the application contract with the two generated infrastructure renderers.
- `src/infra/ioc/services/notification.ts` — import the infrastructure
  renderers and inject them when constructing the transactional email service.
- `src/app/notification/services/__specs__/transaction-email.service.spec.ts`
  — provide typed renderer mocks, assert the parameters passed to each
  renderer, assert the returned HTML is queued, and remove touched uses of
  `any`.
- `src/infra/templates/email/__specs__/*.spec.ts` — update imports after the
  relocation while retaining the currently staged content assertions.

### Conditional Changes

- `scripts/mjml-to-ts.ts` — change only if focused verification demonstrates
  that recursive discovery or adjacent output does not work from the new
  directory. Current inspection indicates no change is necessary.

### Out of Scope

- A shared or application-level template registry, template-key enum, or
  template map.
- Changing the queue payload from rendered HTML to a semantic notification
  command.
- Localization, tenant-specific templates, runtime template selection, or
  storing template keys in persistence.
- Redesigning interpolation or HTML/URL escaping semantics. Existing escaping
  behavior will be preserved by this structural change and can be addressed in
  a separately scoped security change.
- Changes to generated routes, generated OpenAPI output, dependencies, or the
  package lock.

## Proposed Approach

### 1. Relocate the infrastructure-owned artifacts

- Move each `.mjml` file and its generated `.ts` renderer into
  `src/infra/templates/email` with the existing base filenames.
- Move the renderer specs into an adjacent
  `src/infra/templates/email/__specs__` directory and update imports to use the
  `@infra` alias.
- Preserve the currently staged template design and assertions exactly; treat
  this as a path/ownership change, not a template redesign.

### 2. Define and inject the transactional email template contract

- Define `ITransactionalEmailTemplate` in the application notification
  contracts with explicitly typed email-verification and password-reset
  rendering methods, plus the adjacent typed shared mock required by tests.
- Implement that contract in `src/infra/templates/email` by delegating each
  method to its corresponding generated renderer. Do not use template keys, a
  generic lookup method, or a registry.
- Extend the local `IDependencies` in `transaction-email.service.ts` with one
  `transactionalEmailTemplate` dependency and call its methods where the
  imported renderers were previously called. Preserve subjects, recipient
  arrays, correlation IDs, parameter values, queue ordering, rejection
  propagation, and the existing reset-name escaping call.

### 3. Compose the template implementation in infrastructure IoC

- Import the concrete transactional email template implementation in
  `src/infra/ioc/services/notification.ts`.
- Pass it into `makeTransactionalEmailService` alongside the existing
  transactional email queue. Keep IoC limited to composition; no rendering
  behavior belongs in the IoC module.

### 4. Separate application and renderer verification

- Update the transactional email service spec to inject the shared typed
  template-contract mock with deterministic HTML return values.
- Assert that each workflow calls only its corresponding renderer with the
  correct parameters and queues the renderer's returned HTML with the existing
  subject, recipient, and correlation ID.
- Retain focused infrastructure specs that compile/interpolate representative
  values and verify that placeholders are removed from the produced HTML.

## Test Plan

- **Application service:** verify renderer selection and arguments for email
  verification and password reset, current reset-name escaping, queued payload
  construction, single queue invocation, and unchanged propagation of renderer
  or queue failures where covered by the service contract.
- **Infrastructure renderers:** retain the relocated specs for parameter
  interpolation, expected branded links/assets, and absence of unresolved
  placeholders.
- **Regression:** confirm the MJML build regenerates TypeScript beside the
  relocated sources and produces no `src/app/notification/templates` output;
  confirm application-layer imports do not target `@infra`.

## Verification

Run focused generation and tests first, then static checks and the broader test
suite. Before and after generation, inspect the diff so unrelated staged files
remain untouched.

```bash
npm run mjml:build
npm test -- --runInBand src/app/notification/services/__specs__/transaction-email.service.spec.ts src/infra/templates/email/__specs__/email-verification-email.spec.ts src/infra/templates/email/__specs__/password-reset-request-email.spec.ts
npx tsc --noEmit
npm run lint
npm test -- --runInBand
```

The MJML build should use the repository-local binary already present in
`node_modules`. If it falls back to `npx --yes mjml`, network access may require
approval; do not replace or upgrade dependencies as part of this work.

## Risks

- **Loss of staged template work during relocation or regeneration.** Capture
  the staged diff before editing, move rather than recreate the artifacts, and
  compare the post-change content and index state before completion.
- **Generated renderer drift.** Run the existing generator after relocation and
  verify that only the expected new paths change.
- **Tests accidentally continue exercising real infrastructure from the app
  layer.** Inject deterministic renderer mocks in the application service spec
  and keep content assertions in the relocated infrastructure specs.
- **Raw interpolation remains a security concern.** Preserve current behavior
  for this ownership-only change and record escaping hardening as separate
  work, because changing encoding rules can alter links and rendered content.

## Completion Criteria

- No email template source, generated renderer, or renderer spec remains under
  `src/app/notification/templates`.
- Both template families live under `src/infra/templates/email` and regenerate
  successfully beside their MJML sources.
- Application code has no `@infra` imports and no direct import of an
  infrastructure renderer.
- `makeTransactionalEmailService` receives and calls one application-owned
  `ITransactionalEmailTemplate` dependency; no template keys, maps, generic
  registry, or shared-layer contract is introduced.
- Verification and password-reset emails retain their current subjects,
  recipients, correlation IDs, template parameters, rendered output, and
  failure behavior.
- Focused tests, TypeScript compilation, lint, and the broader test suite pass.
- All pre-existing staged and unrelated working-tree changes remain preserved.
