# Persisted Actors Plan

## Goal

Make Actor a persisted domain entity with a stable UUID and an entity-generated,
unique username. Reinstate `createdBy` on persisted entities, stored as
`created_by -> core.actors.id`. Store delegation exclusively in action history.

**Status: actor foundation implemented and verified, with one pre-existing test-name
check failure recorded below.** Permission grants and enforcement remain deferred
by the user's explicit instruction. This document is the governing plan and
execution ledger.

## Implementation Status

Preflight: source baseline captured (1,316 files; existing staged patch preserved),
baseline TypeScript check passed. The configured local DB now has tables; use a
separate empty local verification database, not a reset of existing data. This
preserves the plan's disposable-database validation boundary.

| Slice / owner                                | Basis and precedent                                                                  | Intended files and verification                                                                 | Status                                                                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Actor identity / user domain                 | User review; `userEntity.make`, `userAudit.make`                                     | Actor types/entity/validation/events/audit; focused domain tests                                | Complete; factory branches, invariants, immutable returns and username generation verified                                       |
| Creator attribution / existing entity owners | Explicit entity creator requirement; ledger/journal patterns                         | Inventory types/factories/transitions and creation contracts; typecheck/domain tests            | Complete; all 26 persisted tables have non-null actor creator FKs; transition/regression tests pass                              |
| History references / shared history          | History-only delegation requirement; `historyValue.make`                             | Shared history and all history mappers; history tests                                           | Complete; UUID references and history-only delegation verified; legacy shared actor module removed                               |
| Schema/storage / infrastructure              | Fresh-schema authorization; existing migration/repo patterns                         | Migrations/configs, actor repo/mappers, generated Drizzle; disposable DB constraints/up-down-up | Complete; up/down/up, generated Drizzle, repository tests and 19 DB assertions pass                                              |
| Identity workflows / auth and user domain    | `makeCounterpartyService`, `makeAccountingPeriodService`; existing auth transactions | Identity/resolution services, signup/auth/context/IoC; component tests                          | Complete; actor-first signup, session/context resolution, missing/disabled identities and forged headers tested                  |
| Creator propagation/access / application     | Existing accounting access and creation workflows                                    | Bootstrap, child creation, rectification, rate ingestion, DTOs; regression tests                | Complete; actual performers, retained creators, new journal lines/reversals, accounting-owner access and API generation verified |
| Reconciliation / all owners                  | Plan completion criteria                                                             | Focused/full tests, typecheck/lint/routes, baseline preservation                                | Complete; evidence and the pre-existing naming exception recorded below; staged patch unchanged                                  |

### Verification evidence and reconciliation

- `npx tsc --noEmit -p tsconfig.json`, `npm run lint`, `npm run build:routes`,
  and `git diff --check` pass.
- Regression coverage passed in batches: domain/shared (129 suites, 1,810 tests),
  application plus actor resolver (108 suites, 833 tests), persistence (67 suites,
  265 tests), HTTP/interface (55 suites, 408 tests), and remaining infrastructure
  (49 suites, 321 tests). Additional focused tests cover new actor repositories,
  missing/disabled contexts, accounting-owner access and rectification attribution.
  The initial single-process whole-suite run exited 139; it is not reported as a
  passing full-suite invocation. The split batches cover the suite instead.
- Focused actor entity/validation/events/audit, identity/resolution services,
  actor repositories/mappers and shared history coverage: 22 suites, 143 tests,
  100% statements, branches, functions and lines.
- Fresh migration up/down/up and Drizzle generation succeeded against isolated
  local database `codex_actors_1790318163383`. Nineteen rollback-only SQL assertions
  verified built-in names/creators/history, all 26 creator columns, canonical and
  owner-qualified uniqueness, dangling-reference rejection, restrictive deletion,
  readable disabled identities, history-only delegation, and actor/user/history
  rollback when auth creation fails. The configured database and `.env` were not
  changed. The rewritten migrations require a fresh database for application use.
- `npm run test:names` reports one pre-existing violation:
  `src/infra/persistence/helpers/__tests__/get-db-query.test.ts` belongs under
  `__specs__` according to the checker. Its content matches the captured baseline;
  unrelated test reorganization was left outside this implementation.
- Final searches found no legacy actor value construction, JSONB actor attribution,
  or entity/outbox delegation. Remaining delegation fields belong to shared
  history, history mappers and generated audit-table definitions/relations.
- The staged binary patch matches the original baseline byte-for-byte. Authored
  changes are confined to the plan's actor/creator/history/auth/access propagation,
  corresponding fixtures/tests, migrations and generated schema/API contracts.
  Existing unrelated staged work was not reset, staged again or committed.
- Implementation adjustments: isolated DB validation avoids resetting the populated
  configured DB; the users email column now permits 254 characters to match its
  existing validator and generated username contract. Existing seed write owners
  were retained, with explicit system attribution; new domain services are pure
  creation or read-only resolution. No architectural deviation, grants, registration
  APIs, compatibility layer or email-change workflow was introduced.

Recreated at this path with the user's approval after the previous file was no
longer present. It incorporates both review corrections: Actor owns username
generation, and entity creation attribution is required independently of history.
Preserve unrelated staged and working-tree changes during implementation.

## Context

- The database has been dropped. The user permits editing/reordering migrations
  directly. No backfills, legacy JSONB readers, compatibility aliases, or staged
  deployment are required.
- Use the existing `src/domain/user` directory, singular, for Actor alongside User.
- Actor creation methods generate usernames; there is no `actor-username.vo.ts`.
  Built-ins are `drimsheet-core`, `drimsheet-migration`, and `drimsheet-core-ai`.
- Humans receive their normalized email as their username without an extra signup
  field. Owned agents use `user@email.com/normalized-agent-name`.
- The latest user correction expands creation attribution beyond the three tables
  that already have `created_by`. Having a history table does not exempt an entity
  from retaining its creator.
- Relevant rules: [folder ownership](../rules/folder-responsibility.md),
  [domain modeling](../rules/domain-modeling.md),
  [domain validation](../rules/domain-validations.md),
  [service ownership](../rules/service-ownership.md),
  [scope](../rules/scope-and-simplicity.md),
  [precedent](../rules/precedent-and-deviation.md),
  [IoC](../rules/ioc.md), and [migrations](../skills/migration/SKILL.md).

## Domain Language And Existing Guarantees

- **Actor:** persistent identity of a performer. UUIDs are permanent references;
  usernames support lookup and do not authenticate or authorize anyone.
- **User:** a human profile/authentication subject linked one-to-one to an actor.
  User IDs and actor IDs remain distinct.
- **Owner:** the explicit user-actor relationship of an owned agent. Ownership is
  not reconstructed from a username and does not identify every action's performer.
- **Creation attribution:** an entity's immutable `createdBy` actor UUID. Entity
  updates preserve it; a newly created replacement/reversal has its own creator.
- **History attribution:** `actorId` identifies the performer of a specific action.
  Optional `onBehalfOf` identifies the represented actor for that action. Both are
  actor references, independent of entity ownership and original creator.
- **Authoritative state:** `core.actors` stores identities; `core.users` stores
  human profiles and their actor link. Entity rows store creator FKs; history rows
  store action attribution. Username changes do not rewrite historical UUIDs.
- **Existing guarantees:** immutable entity/event/audit returns, entity versions,
  optimistic repository checks, caller-owned transactions, and post-commit event
  publication. Reuse these without new locks, schedulers, or recovery mechanisms.
- **Access:** human authentication and accounting ownership remain authoritative
  until permission grants are implemented separately. Neither creator attribution
  nor a delegation record is a permission grant.

## Confirmed Findings

1. `src/shared/values/actor/actor.types.ts` models actors as a value union. System
   actors have a null ID, migration actors have no ID, and AI actors embed
   `onBehalfOf.userId`. Validation checks shape, not persistent existence.
2. Migrations `0029_ledger-accounts`, `0035_journal-entries`, and
   `0040_ledger-account-balance-adjustments` store JSONB `created_by`. Fourteen
   history migrations store JSONB `actor` values. Other persisted entities,
   including User, Counterparty, accounting entities/periods/contexts, journal
   lines, and FX lots/acquisitions/dispositions/allocations, lack creator fields.
3. `IHistory` and `historyValue.make()` depend on the shared actor value. Importing
   a new domain Actor into shared history would violate layer boundaries.
4. Email signup and Google first-login currently prepare a user, then write
   user/profile history and authentication in one transaction. Profile creation
   history is attributed to the new user. Verification resolves a user from a
   claimed token rather than depending on authenticated request context.
5. `IAppContextData` has a user/accounting entity but no actor. HTTP enrichment
   resolves authenticated users; MCP reuses application reads. No independent
   authenticated-agent flow, owned-agent registration flow, or email-change flow
   was found. User profile updates support first and last name only.
6. `get-ledger-account`, `get-account-transactions`, and
   `journalEntryMutationPolicy.validate()` use creator comparisons for access.
   `IAccountingEntityService.grantUserAccess()` / `validateAccess()` already define
   accounting-owner access independently of creator.
7. Header/posting/suspense bootstrap services manufacture actors from owner IDs.
   Journal rectification copies the original creator into new reversal/replacement
   rows. Both need explicit performer propagation when actor identities differ.
8. `emailValue.make()` trims/lowercases emails and accepts slash in the local part.
   `TCreationOmits` omits identity/version/timestamp fields, not `createdBy`.
9. Currency entity reads use static currency definitions; persisted currency/rate
   rows are separate. `ingest-exchange-rate.usecase.ts` initiates rate writes.
   Keep creator metadata on persisted records without adding it to embedded money,
   exchange-rate values, or static currency definitions.
10. Resource permission definitions exist, but no persisted grant model was found.
    Grants remain explicitly out of scope.
11. Drizzle artifacts are generated with `npm run drizzle:pull`, not hand-edited.
    `test:ci` and `setup:test:db` reference missing scripts. Existing HTTP specs
    frequently mock persistence and cannot prove database constraints.

## Implementation Basis

| Decision                                     | Basis                                        | Present consumer                                          | Evidence or rationale                                                                                               |
| -------------------------------------------- | -------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Actor entity in `domain/user`                | User requirement; domain-modeling rule       | Signup, identity resolution, attribution                  | `userEntity.make` in `src/domain/user/entities/user.entity.ts` supplies the immutable entity/event/audit pattern    |
| Entity-owned username factories              | Explicit user review                         | Human signup, built-in lookup, owned-agent representation | `makeSystem`, `makeMigration`, `makeUser`, and both `makeAgent` branches; no username value object                  |
| Restore entity creator FKs throughout        | Latest explicit user correction              | Existing persisted entity creation/mutation workflows     | Extend the `createdBy` pattern already present in ledger/journal entities; histories are additional attribution     |
| History-only delegation                      | Latest explicit user correction              | Existing action histories                                 | Primitive actor references in `IHistory`; no delegation on Actor or other entity state                              |
| User actor link and agent owner link         | User-approved identity model                 | Signup and user identity resolution                       | Existing explicit links such as `IUserAuth.userId`; `users.actor_id` permits actor insertion before profile history |
| Pure coordinated user/actor creation service | Service-ownership rule; local precedent      | Email signup and Google first-login                       | Coordinated creation in `makeAccountingEntityService`; capability factory pattern in `makeCounterpartyService`      |
| Read-only persisted actor resolver           | Rule; local precedent                        | Request enrichment and token-driven auth                  | Repository-backed invariant checks in `makeAccountingPeriodService`                                                 |
| Actor repository/history/mappers             | Repository rules; local precedent            | Signup persistence and actor lookup                       | `IUserRepo`, `userRepo`, `userHistoryRepo`, `userMapper`, centralized user repo mocks                               |
| Existing accounting-owner access             | User-approved separation; local precedent    | Ledger reads and journal mutations                        | `IAccountingEntityService.validateAccess`; preserve scope/version checks                                            |
| Fresh migrations and named built-in seeds    | Explicit user authorization; migration rules | All persistent references                                 | `db/config` naming and node-pg-migrate; regenerate Drizzle from the resulting schema                                |
| Existing IoC and transaction boundaries      | Durable rules                                | Auth, context, bookkeeping, ingestion                     | `infra/ioc/services/user.ts`, `services/auth.ts`, `usecases/auth.ts`, `middlewares/http.ts`                         |

No new unapproved architectural pattern is required. Services prepare or resolve
domain state; use cases initiate runtime writes and publication.

## Scope

### Expected Changes

- `src/domain/user` — Actor, entity validation, events/audits, repositories,
  user linkage, identity creation/resolution services, and typed contracts.
- Existing domain entity types/factories/transitions across accounting, user,
  counterparty, ledger, journal-entry, and FX cost basis — creator attribution.
- Persisted currency/rate records and their ingestion/seeding paths — creator
  metadata, distinct from embedded value objects and static definitions.
- Application creation/preparation contracts, auth workflows, bootstrap services,
  entity DTOs, context, and typed test fixtures — propagate actor UUIDs.
- `src/shared/values/history` and every history mapper — actor references and
  history-only delegation. Remove the obsolete shared actor value after conversion.
- Actor and affected existing repositories/mappers, database configs/migrations,
  generated Drizzle/TSOA artifacts, IoC, and focused regression tests.
- Creator-based access checks — reuse accounting-owner access.

### Out of Scope

- Permission grants, roles, grant administration, and new authorization machinery.
- Agent registration/authentication APIs, credentials, agent OAuth, delegation
  approval/enforcement, and client-selectable actor/delegation headers.
- Email-change, agent rename/transfer, lifecycle administration, and public actor
  directory endpoints. The future verified-email-change workflow must atomically
  update the user actor and its agents' usernames while preserving their UUIDs.
- Username aliases, compatibility readers, production backfills, frontend changes,
  and unrelated architectural cleanup.
- Creator metadata on pure value objects, static definitions, query-only DTOs
  representing computed values, or technical join tables solely because they are
  tables. This does not exempt a persisted entity or owned child entity.
- Delegation fields on entities, entity creation/mutation payloads, entity response
  DTOs, entity event snapshots, or outbox payloads. Only history persists delegation.

## Proposed Approach

### 1. Actor generates its usernames

Use an immutable, versioned `IActor` with `id`, `type`, `username`, `displayName`,
`ownerActorId`, `agentName`, `status`, `createdBy`, `version`, `createdAt`, and
`updatedAt`. Nullable owner/name fields describe owned agents; status is active or
disabled. Type and ownership are immutable in this foundation. Retain disabled
rows and provide no hard-delete path.

The entity API owns username generation:

| Creation method                  | Generated username                                      | Ownership      |
| -------------------------------- | ------------------------------------------------------- | -------------- |
| `makeSystem`                     | Hardcoded `drimsheet-core`                              | None           |
| `makeMigration`                  | Hardcoded `drimsheet-migration`                         | None           |
| `makeUser`                       | `emailValue.make(email)`                                | None           |
| `makeAgent` without a user       | Hardcoded `drimsheet-core-ai`                           | None           |
| `makeAgent` with a user and name | `${emailValue.make(user.email)}/${normalizedAgentName}` | `user.actorId` |

Each returns the entity/events/audit delta and derives the username internally.
Do not create `actor-username.vo.ts` or a username-generation service. Keep
normalization/construction helpers file-private in `actor.entity.ts`; reusable
validity checks live in `entities/validations/actor.validation.ts` and are exposed
through the entity's frozen API. Reuse the existing email value.

The table describes identity-generation branches; supply creator attribution
separately as an actor UUID where required. It never includes delegation. Ordinary
actor creation records its actual creator, not an owner inferred as the performer.
The explicit signup and migration bootstrap cases use self-attribution as described
below, resolving the first-actor dependency without nullable creator fields.

- Owned-agent creation receives the resolved user's email and actor ID; a bare
  user ID cannot provide an email. The entity never reads a repository.
- An invalid supplied user must fail rather than fall back to platform identity.
  Owned-agent creation requires a name; the platform branch uses its fixed name.
- Normalize agent names by trimming/lowercasing, turning whitespace/underscores
  into hyphens, collapsing repeated hyphens, and trimming edge hyphens. Require
  1–64 ASCII letters/digits/hyphens; reject unsupported characters and conflicts.
  Do not silently append suffixes.
- Enforce canonical username uniqueness globally and normalized agent-name
  uniqueness per owner. Different owners can both have an `assistant`.
- The explicit owner link is authoritative. Never parse ownership from usernames;
  in particular, email local parts may contain slash. Agent names cannot contain
  slash or `@`. Support up to 319 username characters (254 + 1 + 64).
- Reserve bare built-in names for platform identities, without rejecting valid
  emails whose local part starts with `drimsheet-`. Seed no aliases for earlier
  names such as `drimsheet-ai` or `drimsheet-core-migration`.
- Owner/name fields are present together only for owned AI agents. Owner identity
  must be a user actor. Display names are presentation data, not identity keys.

### 2. Restore entity creation attribution throughout

Use `createdBy: TEntityId` on persisted entity state and non-null
`created_by UUID REFERENCES core.actors(id)` in storage. Apply this even where an
entity already has a creation history. Do not replace user ownership fields with
creator fields, and do not default a missing creator to system identity.

The mandatory entity inventory is:

| Area                             | Entities/records and migration owners                                                                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity                         | New actors; users (`0006`); existing persisted auth/session/preferences records (`0007`, `0008`, `0018`)                                                                |
| Accounting                       | Accounting entities (`0016`), fiscal years (`0019`), accounting periods (`0021`), accounting contexts (`0023`), reporting periods (`0025`), reporting contexts (`0027`) |
| Ledger                           | Accounts (`0029`), balances (`0031`), persisted bank details (`0032`), balance adjustments (`0040`)                                                                     |
| Counterparty                     | Counterparties (`0033`)                                                                                                                                                 |
| Journal                          | Entries (`0035`) and lines (`0038`), including lines newly created during rectification                                                                                 |
| FX cost basis                    | Lots (`0041`), acquisitions (`0043`), dispositions (`0045`), disposition allocations (`0047`)                                                                           |
| Persisted reference/rate records | Currencies (`0010`), exchange rates (`0011`), accounting standards (`0012`), jurisdictions (`0014`); seed/import creator attribution belongs to the persisted record    |

Pure association tables such as journal-entry attachment links and jurisdiction/
standard links remain associations; do not introduce an entity abstraction for
them. Audit history uses its performer columns rather than a redundant `created_by`.
The outbox remains a delivery record, with its existing typed originating-actor
reference where used, not an entity with delegation state.

For each entity in the inventory, update its type, creation inputs, validation,
construction, mutation/reconstruction paths, mapper, database definition, relevant
DTO projection, and fixtures together. Require a creator UUID at construction and
preserve it during every update. Do not add `createdBy` to `TCreationOmits` or
otherwise make it disappear from ordinary creation inputs.

Audit owned-child creation explicitly: journal lines, newly initialized balances,
FX allocations, and persisted auth/session/preferences records need the actual
creating actor. Pass it through existing preparation contracts. Existing rows
retain their creator during replacement/upsert semantics that update the same
identity; genuinely new rows record the current performer.

### 3. Keep delegation exclusively in history

Replace `IHistory.actor: TActor` with primitive references:

| Location             | Performer/creator                       | Delegation                                          |
| -------------------- | --------------------------------------- | --------------------------------------------------- |
| Entity state/storage | `createdBy` / `created_by -> actors.id` | None                                                |
| History              | `actorId` / `actor_id -> actors.id`     | Nullable `onBehalfOf` / `on_behalf_of -> actors.id` |

The `on_behalf_of` foreign key points to an actor, not directly to a user. Shared
history code validates UUIDs and history shape without importing domain Actor
types, querying storage, or deciding delegation rights. Preserve existing diffs,
versions, timestamps, correlation IDs, and history transaction boundaries.

Keep delegation out of Actor and all other entity interfaces/factories, entity
DTOs, and entity snapshots returned in events or audit diffs. A trusted workflow
may hold transient action context long enough to construct a history record;
pass it separately to history preparation, never into entity state. Current human
requests have null delegation. Agent ownership does not imply delegation.

Remove the previous proposal to serialize represented actor IDs into missing-rate
outbox payloads. Those payloads retain only their originating actor UUID and
existing operation references. The originating history records any delegation in
the existing atomic transaction. A future deferred executor can consult history
when required; do not add a new history lookup/replay framework now. Technical
transport of a history record does not turn its attribution into entity fields.

### 4. Fresh schema, seeds, and repository contracts

Create `core.actors` and `audit.actor_history` using `db/config` table identifiers.
Actor ownership is a nullable self-reference. Add `users.actor_id` as a non-null
unique FK, separate from `users.created_by`. The identity service/resolver enforces
that a user's linked actor is type `user`.

Add canonical username/status/type/owner-field constraints, positive versions,
global username and per-owner name uniqueness, and actor FKs for all creators.
Use restrictive deletion behavior: no cascading deletion of attribution/history.
Add reference indexes where needed by lookup/audit queries.

Rewrite all fourteen history migrations with `actor_id` and nullable
`on_behalf_of`, and use the same columns in actor history. Rewrite the three
existing JSONB creator columns and add creators throughout the entity inventory.
Keep history diffs as JSONB. Edit/reorder migration files directly, maintaining a
valid fresh up/down sequence rather than a deployment compatibility sequence.

Bootstrap the migration actor with its generated UUID as its own `created_by`;
PostgreSQL can check that self-reference on the inserted row. Insert its history
after the actor exists. Seed system/platform-AI actors with the migration actor as
creator and history performer. Attribute migration-created reference rows to that
same actor. Verify seeds match the entity methods' fixed usernames/types.

Runtime code resolves built-ins by username; it does not hardcode UUIDs or
auto-create missing identities. Runtime exchange-rate ingestion resolves the core
system actor and passes its ID with persisted rate records. Embedded rate/money
values and static currency definitions remain free of persistence metadata.

Add `IActorRepo`, actor history persistence, and explicit mappers following user
repository conventions. Include creation-with-history and lookup by ID/username.
Reads must support disabled actors for historical interpretation; active-only
requirements belong to the resolver. Database uniqueness arbitrates concurrent
creation; translate conflicts using existing repository error conventions.

Use `getDbQuery(options)` and caller transactions. Repositories store/retrieve;
they do not generate usernames, choose creators, or publish events. Run migrations
against the replacement local DB and regenerate Drizzle with `npm run drizzle:pull`.
Do not hand-edit generated schema/relations.

### 5. Signup, actor resolution, and transaction ownership

Add `actorId` to User and preserve it alongside `createdBy` through transitions.
A pure `IUserIdentityService.create` prepares user and actor through the existing
entity APIs. It calls `actorEntity.makeUser`, not separate username logic. For
self-signup, the new actor's creator is its own generated ID; the user, auth row,
and their creation histories reference that actor. Generate the ID once and reuse
it; do not assume it equals the independently generated user UUID.

Email signup and Google first-login directly initiate their existing transaction:

1. Insert the prepared actor and its self-attributed creation history.
2. Insert user/profile history with `actorId` and `createdBy` set appropriately.
3. Insert auth state with its creator reference.

Roll back all records on failure; publish events after commit and preserve email/
session behavior. Existing-user flows resolve their actor without creating a
second one or silently repairing inconsistent identity data.

Add read-only `IActorService.resolveUser` and `resolveByUsername` domain
capabilities. They enforce existence/active status, with user-link/type checks for
`resolveUser`, and reject invalid identity through domain errors. Follow the
repository-backed domain invariant pattern and file-private capability factories.
Place contracts under `domain/user/types`, service composition under
`infra/ioc/services/user.ts`, and domain-contract mocks in the app user mock folder.

HTTP enrichment resolves the actor from the authenticated user and places it in
app context. Token-driven verification resolves the actual token user's actor in
its existing transaction. Resolve identities before session preparation in email
login, refresh, password reset, and Google callback. Carry creator IDs into newly
persisted sessions without changing user-based credential semantics. Middleware
coordinates delivery; it does not own identity policy or accept caller-chosen
actor usernames as authentication.

| Runtime write                                                        | Initiating owner                           | Transaction                                                           |
| -------------------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------- |
| Actor/user/auth plus histories                                       | Email signup / Google first-login use case | Existing outer transaction                                            |
| Verification, auth changes, sessions                                 | Existing auth use cases                    | Existing direct writes / directly invoked session persistence service |
| Accounting, ledger, journal, counterparty, FX entities and histories | Existing use cases                         | Existing direct writes / directly invoked persistence bundles         |
| Preferences and other persisted supporting records                   | Their existing use cases                   | Preserve existing atomic workflow; supply creator on initial creation |
| Rate ingestion                                                       | `ingest-exchange-rate.usecase.ts`          | Existing batch write boundary with resolved system actor              |
| Missing-rate outbox and originating history                          | Existing journal/FX use cases              | Existing atomic persistence bundle                                    |

Migration seed SQL is the explicit database-bootstrap path. New domain/application
services never initiate writes or call persistence services. Do not add a generic
actor CRUD workflow or unused persistence service. Avoid copying any pre-existing
service-ownership violations into new work.

### 6. Propagate creators and preserve accounting access

Creation services receive `createdBy` as a primitive UUID. Pass the actual actor
through accounting coordinated creation and all ledger/journal/FX child creation.
Header/posting/suspense bootstrap must stop reconstructing actors from owner IDs.
User-driven onboarding continues to use its initiating actor; service execution
alone does not make an operation system-created.

Updates preserve original creators. Rectification/removal contracts, including
`reverse`, receive the current performer for newly created reversal/replacement
entries and new lines. Retained original entries/lines preserve their `createdBy`;
action histories record the current performer separately.

Remove creator-based access comparisons from ledger-account/account-transaction
reads and journal mutation policy/callers. Reuse
`IAccountingEntityService.validateAccess(accountingEntity, user.id)` in the owning
application workflow. Keep resource-scope and expected-version checks. Accounting
owners can access their records regardless of creator type; this grants no
nonhuman actor access and implements no permission-grant system.

Update DTOs/query mappers to expose creator UUIDs where entity data is returned;
do not hydrate full Actor objects merely to return a reference. Remove `TActor`
casts and the old shared actor module after converting all callers/tests. Regenerate
TSOA artifacts without retaining the old API shape.

## Test Plan

- **Domain:** entity-generated usernames in every factory branch; malformed
  supplied users never fall back to platform identity; normalization, reserved
  names, length, valid email punctuation/slashes, owner-specific names, immutable
  entity/event/audit returns, and user/actor creation consistency.
- **Creator invariants:** every entity in the inventory requires a valid creator
  on creation and preserves it on updates. Distinguish user ID, actor ID, owner ID,
  and previous creator in fixtures. Test new versus retained journal lines,
  reversal/replacement rows, balances, and FX allocations.
- **History-only delegation:** history accepts nullable represented actor IDs;
  entity outputs, entity DTOs, event snapshots, and outbox payloads contain no
  delegation fields. Represented actor changes do not mutate entity creators.
- **Resolution/auth:** missing/disabled/mismatched actor failures, ID/username
  lookup, transaction-scoped reads, session issuance, signup ordering/rollback,
  existing-user behavior, and no forged actor context.
- **Persistence/mappers:** creator round trips across the inventory, actor/history
  mapping, disabled-actor historical reads, initial creator preservation in upserts,
  rate-ingestion attribution, and UUID API projections.
- **Access:** owner reads/mutations succeed for system/migration/agent-created
  records; other users, cross-entity records, and stale versions remain rejected.
- **Real DB:** fresh up/down/up; self-referencing bootstrap actor; seeded creator
  references; FK/non-null/unique violations; signup rollback; non-cascading actor
  deletion; `on_behalf_of` exists only in history tables. Use the disposable DB
  and record SQL checks rather than introducing a new DB test framework.
- **HTTP/MCP:** unchanged signup inputs, creator UUID responses, identity failures,
  history-only delegation, and correct serialized/structured results.

Use existing colocated test conventions and centralized typed mocks. Domain tests
must not import app mocks. Meet the repository's coverage requirements for touched
behavior. Mock-only tests do not establish real database constraint guarantees.

## Verification

For this plan-only change, check Markdown formatting, links, and scope consistency;
do not mutate the DB or run application tests.

During implementation, run focused tests before broader checks:

```bash
npm test -- --runInBand src/domain/user src/shared/values/history
npm test -- --runInBand src/app/auth src/infra/persistence/repos/user
npm test -- --runInBand src/domain/accounting src/domain/counterparty src/domain/journal-entry src/domain/ledger src/domain/subledger
npm test -- --runInBand src/app/accounting src/app/ledger src/app/journal-entry src/app/subledger src/app/money
npm run db:migrate up
npm run drizzle:pull
npm run build:routes
npx tsc --noEmit -p tsconfig.json
npm run test:names
npm run lint
npm test -- --runInBand test/http/auth test/http/ledger test/http/journal-entry test/http/mcp
npm test -- --runInBand
```

Run focused coverage checks and real database checks as well. Inspect generated
schema and `information_schema` to confirm every inventory entity has a non-null
creator FK and only history tables have `on_behalf_of`. Search authored code for
legacy `TActor`, `actorValue`, `createdBy.type`, and `createdBy.id`. Search delegation
spellings and verify occurrences belong only to history, its transient preparation,
or related tests. JSONB history diffs and ordinary outbox data remain intentional.

PostgreSQL must be recreated/configured before migration checks; some test imports
also require Redis and normal local environment configuration. Report missing
infrastructure separately from failures. Do not print secrets, rely on the missing
`test:ci`/`setup:test:db` scripts, or use the source-map-uploading build as a typecheck.

## Risks

- **Partial attribution rollout:** adding only columns or only the original three
  creator fields leaves other entities incomplete. Verify the inventory end to end,
  including child creation and reconstruction paths.
- **Bootstrap cycles:** seed the migration actor with self-reference first; insert
  signup actors before users/auth/history that reference them, atomically.
- **Identity confusion:** test with distinct user/actor/owner/creator UUIDs and never
  infer a creator from ownership or substitute system identity for missing input.
- **Delegation leakage:** do not serialize operation context wholesale into entity
  state, event snapshots, or outbox JSON. Persist delegation only in histories.
- **Concurrent name collisions:** database constraints are authoritative; return
  defined conflicts without silently renaming/selecting another actor.
- **Mutable usernames:** persist UUID relationships; leave coordinated email-change
  renaming to its future workflow, retaining the agreed atomicity requirement.
- **Access changes:** test scope, ownership, and optimistic versions independently
  of creator type. Permission grants remain deferred.
- **Broad existing staged work:** regenerate only required artifacts and preserve
  unrelated changes; never reset the workspace as part of implementation.

## Completion Criteria

- Actor factories own username generation; no username value object exists.
- Fresh seeds include the three current built-in usernames with valid creators.
- Signup/Google first-login atomically create one linked actor per user, with no
  additional username input and distinct user/actor identities.
- Every persisted entity in the inventory has an immutable `createdBy` UUID backed
  by a non-null actor FK, even if it also has a history table.
- Histories store performer and optional represented actor FKs. No entity, entity
  DTO/snapshot, or outbox payload stores delegation.
- Bootstrap and child creation propagate the actual performer; original creators
  remain unchanged on updates, while new reversals/replacements use their creator.
- Missing/disabled identities cannot initiate authenticated operations; historical
  references remain readable and cannot be cascade-deleted.
- Shared history imports no domain entity; generated schema/API artifacts match
  the new contracts and all required checks pass.
- Accounting ownership, resource scope, and version checks remain enforced without
  a permission-grant implementation.
- No compatibility mechanisms, unrequested endpoints, or unrelated behavior changes
  are introduced. Existing staged/working-tree work remains preserved.
