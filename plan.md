# Entity History Implementation Plan

## 1. Purpose

PurpleLedger needs durable history records for important domain aggregates:

- Ledger accounts
- Subledger accounts
- Journal entries
- Accounting entities
- Accounting contexts
- Accounting periods
- Fiscal years
- User profiles

The history system must answer:

- What changed?
- What was the state before and after the change?
- Who or what performed the action?
- When did the domain action occur?
- Which accounting entity owned the affected aggregate?
- Which request or background operation caused the change?

History records are part of the correctness boundary for audited writes. A
successful aggregate mutation and its history record must commit or roll back
together.

This document is an implementation plan, not an ADR. If the approach becomes a
long-lived architectural constraint, capture the final decision in a dedicated
ADR after the ledger-account reference implementation has validated it.

## 2. Terminology

Use **history** for chronological records of domain aggregate state changes.

Examples:

- `ILedgerAccountHistory`
- `IJournalEntryHistory`
- `audit.ledger_account_history`
- `audit.journal_entry_history`

Use **user activity** for operational and security activity that does not
represent an aggregate state transition.

Examples:

- Login
- Password reset requested
- Email verification sent
- Session created

The existing `audit.user_activities` table remains separate from entity
history. A user profile update may produce both:

- A user profile history record containing a sanitized before/after state.
- A user activity record describing that the user updated their profile.

## 3. Architectural Decisions

### 3.1 History is domain-derived

The domain operation constructs the history record because it knows the
semantic action being performed.

The repository must not infer whether a generic update means:

- `posted`
- `voided`
- `archived`
- `unarchived`
- `closed`
- `reopened`

The repository only validates the relationship between the aggregate and its
history record, maps both to persistence models, and stores them atomically.

### 3.2 History is required for audited repository writes

Audited repositories do not provide an unaudited write path. Bootstrap, seed,
and system operations create history with an appropriate actor type.

Database migrations that manipulate schema or perform controlled data
backfills do not use domain repositories and are outside this repository
contract.

### 3.3 History persistence is synchronous and transactional

The initial implementation stores history in PostgreSQL under the `audit`
schema in the same transaction as the aggregate mutation.

The current in-memory event bus is not the authoritative history mechanism.
Domain events continue to support projections, notifications, and other
post-commit side effects.

### 3.4 Tables are aggregate-specific

Use a dedicated history table for each audited aggregate instead of a single
polymorphic history table.

This provides:

- Aggregate-specific action types
- Purpose-built snapshot schemas
- Smaller and more relevant indexes
- Straightforward Drizzle typing
- Independent retention and access policies
- No polymorphic foreign-key ambiguity

Related subtypes that share one aggregate lifecycle also share one history
table. Asset, liability, equity, revenue, and expense accounts therefore use
`audit.ledger_account_history`.

### 3.5 Snapshots are explicit and sanitized

History records do not serialize complete domain objects automatically. Each
aggregate defines a purpose-built snapshot containing only fields that are
needed to understand its historical business state.

Snapshots must exclude:

- Passwords and password hashes
- Access and refresh tokens
- Session identifiers
- Authentication strategy secrets
- Internal framework metadata
- Unnecessary personal information
- Derived data that can be reconstructed and adds substantial payload size

### 3.6 History is append-only

Application code may insert and read history records. It must not update or
delete them.

Database permissions should eventually enforce this constraint for the
application role. If the current deployment does not yet use separate database
roles, introduce the table structure first and record role-level enforcement as
a required deployment follow-up.

## 4. Repository Option Types

Refactor `src/shared/types/repo.types.ts` so repository options reflect the
operation being performed.

```ts
import { ICorrelationId } from './correlation-id.types';
import { IPaginationParams } from './pagination.types';

export interface ITransactionContext {
  _brand?: 'PurpleLedgerTransactionContext';
}

export interface IRepoOptions extends ICorrelationId {
  tx?: ITransactionContext;
}

export const ERepoLock = {
  Update: 'update',
  NoKeyUpdate: 'no key update',
  Share: 'share',
  KeyShare: 'key share',
} as const;

export type URepoLock = (typeof ERepoLock)[keyof typeof ERepoLock];

export interface IReadRepoOptions extends IRepoOptions {
  lock?: URepoLock;
}

export interface IPaginatedReadRepoOptions
  extends IReadRepoOptions, IPaginationParams {}

interface IBaseWriteRepoOptions extends IRepoOptions {
  expectedVersion?: number;
}

export type IWriteRepoOptions<THistory = never> = IBaseWriteRepoOptions &
  ([THistory] extends [never] ? object : { history: THistory });
```

Usage:

- Point reads use `IReadRepoOptions`.
- Paginated reads use `IPaginatedReadRepoOptions`.
- Non-audited writes use `IWriteRepoOptions`.
- Audited writes use `IWriteRepoOptions<THistory>`, which requires `history`.

This is a breaking refactor across repository contracts. Perform it as a
mechanical first phase and keep behavior unchanged before introducing history
behavior.

## 5. Shared History Types

Create `src/shared/types/history.types.ts`.

```ts
import { IDiff } from './diff.types';
import { IEvent } from './event.types';
import { TEntityId } from './uuid';

export const EHistoryActorType = {
  User: 'user',
  System: 'system',
  Migration: 'migration',
} as const;

export type UHistoryActorType =
  (typeof EHistoryActorType)[keyof typeof EHistoryActorType];

export interface IHistoryActor {
  type: UHistoryActorType;
  userId: TEntityId | null;
}

export interface IHistoryRecord<
  TSnapshot extends object,
  TAction extends string,
> {
  id: TEntityId;
  entityId: TEntityId;
  actor: IHistoryActor;
  action: TAction;
  diff: IDiff<TSnapshot>;
  note: string | null;
  occurredAt: Date;
}

export interface IAuditedDomainResult<TEntity, THistory, TEventPayload> {
  entity: TEntity;
  history: THistory;
  events: IEvent<TEventPayload>[];
}

export interface IHistoryWrite<TEntity, THistory> {
  entity: TEntity;
  history: THistory;
}
```

### 5.1 Diff semantics

Update `src/shared/types/diff.types.ts`:

```ts
export interface IDiff<T extends object> {
  before: T | null;
  after: T | null;
}
```

Meaning:

- Creation: `before` is `null`.
- Deletion, where allowed: `after` is `null`.
- Mutation: both sides are populated.

Snapshots should contain the relevant state, not only the fields that changed.
This makes each record independently understandable and avoids reconstructing a
state from a long chain of partial patches.

### 5.2 History identity

Every history record receives a UUID when the domain action is created.

This identity:

- Prevents duplicate persistence during retries.
- Supports a unique database constraint.
- Becomes an idempotency key if history later moves through an outbox or queue.

### 5.3 Existing type migration

Reconcile and remove overlapping concepts:

- Replace `IAuditTrail<T>` with `IHistoryRecord<TSnapshot, TAction>`.
- Remove `IMakeAuditTrail` after all callers migrate.
- Replace `IJournalEntryHistoryLog` with `IJournalEntryHistory`.
- Replace period-specific ad hoc history shapes with the shared contract.
- Use one naming convention: `History`, not a mix of `AuditTrail`,
  `HistoryLog`, and `History`.

Do not leave old and new abstractions active indefinitely.

## 6. Aggregate-Specific History Design

Each audited aggregate owns:

- History action constants
- History action union
- Snapshot type
- History type
- Snapshot serializer
- History construction as part of domain operations

Example ledger-account types:

```ts
export const ELedgerAccountHistoryAction = {
  Created: 'created',
  Updated: 'updated',
  Archived: 'archived',
  Unarchived: 'unarchived',
} as const;

export type ULedgerAccountHistoryAction =
  (typeof ELedgerAccountHistoryAction)[keyof typeof ELedgerAccountHistoryAction];

export interface ILedgerAccountHistorySnapshot {
  id: TEntityId;
  accountingEntityId: TEntityId;
  code: string;
  materializedPath: string;
  name: string;
  type: ULedgerType;
  normalBalance: UJournalSide;
  subType: string;
  behavior: string;
  isControlAccount: boolean;
  controlAccountId: TEntityId | null;
  currencyCode: UCurrencyCode;
  status: ULedgerAccountStatus;
  contraAccountRule: UContraAccountRule;
  adjunctAccountRule: UAdjunctAccountRule;
}

export type ILedgerAccountHistory = IHistoryRecord<
  ILedgerAccountHistorySnapshot,
  ULedgerAccountHistoryAction
>;
```

Use existing domain unions rather than weakening snapshot fields to `string`.

### 6.1 Snapshot serializers

Snapshot creation belongs in the domain layer and must not depend on
application or infrastructure mappers.

Suggested location:

```text
src/domain/ledger/entities/helpers/ledger-account-history.helpers.ts
```

Suggested API:

```ts
function toHistorySnapshot(
  account: ILedgerAccount
): ILedgerAccountHistorySnapshot;

function makeHistory(params: {
  previous: ILedgerAccount | null;
  current: ILedgerAccount | null;
  action: ULedgerAccountHistoryAction;
  actor: IHistoryActor;
  note?: string | null;
}): ILedgerAccountHistory;
```

The helper validates:

- At least one of `previous` or `current` is present.
- `actor.type === 'user'` requires a `userId`.
- System and migration actors use `userId: null`, unless a future use case has
  a clear reason to preserve both.
- Notes are sanitized and length-limited.

## 7. Domain Operation Results

Audited domain mutations return named results:

```ts
IAuditedDomainResult<TEntity, THistory, TEventPayload>;
```

Example:

```ts
function archive(
  account: ILedgerAccount,
  params: {
    actor: IHistoryActor;
    note?: string | null;
  }
): IAuditedDomainResult<ILedgerAccount, ILedgerAccountHistory, ILedgerAccount> {
  const updatedAccount = Object.freeze({
    ...account,
    status: ELedgerAccountStatus.Archived,
    updatedAt: new Date(),
  });

  const history = ledgerAccountHistoryHelpers.makeHistory({
    previous: account,
    current: updatedAccount,
    action: ELedgerAccountHistoryAction.Archived,
    actor: params.actor,
    note: params.note,
  });

  return {
    entity: updatedAccount,
    history,
    events: [ledgerAccountEvents.archived(updatedAccount)],
  };
}
```

Existing non-audited operations may continue returning
`TEntityWithEvents<TEntity, TEventPayload>`. Do not introduce a three-element
tuple for audited operations.

As aggregates become audited, migrate their mutation operations to the named
result. Creation factories may be migrated at the same time so that every
audited write follows one result convention.

## 8. Actor Propagation

The domain must not access application request context.

HTTP use cases obtain the actor from `IRequestContext` and pass it explicitly:

```ts
const { user } = requestContext.get();

const actor: IHistoryActor = {
  type: EHistoryActorType.User,
  userId: user.id,
};
```

Background jobs use:

```ts
const actor: IHistoryActor = {
  type: EHistoryActorType.System,
  userId: null,
};
```

Controlled data backfills that use domain repositories use:

```ts
const actor: IHistoryActor = {
  type: EHistoryActorType.Migration,
  userId: null,
};
```

The actor is an explicit input to the domain action. It is not read from global
state and is not inferred by the repository.

## 9. Repository Contracts

### 9.1 Single writes

Audited repositories accept one aggregate and one required history record:

```ts
export default interface ILedgerAccountRepo {
  save(
    account: ILedgerAccount,
    options: IHistoryWriteRepoOptions<ILedgerAccountHistory>
  ): Promise<void>;

  saveMany(
    writes: readonly IHistoryWrite<ILedgerAccount, ILedgerAccountHistory>[],
    options: IWriteRepoOptions
  ): Promise<void>;

  findById(
    id: TEntityId,
    options: IReadRepoOptions
  ): Promise<ILedgerAccount | null>;
}
```

Remove `Entity | Entity[]` from audited `save` signatures. Bulk persistence is
an explicit `saveMany` operation.

### 9.2 Bulk writes

Do not use parallel arrays of entities and history records.

Each bulk item pairs the aggregate and history:

```ts
const writes = accounts.map((account) => ({
  entity: account,
  history: makeCreatedHistory(account, actor),
}));

await ledgerAccountRepo.saveMany(writes, {
  correlationId,
  tx,
});
```

The repository validates for every write:

```ts
write.entity.id === write.history.entityId;
```

It should reject:

- Empty bulk writes, unless current repository conventions explicitly allow
  them.
- Duplicate history IDs within the batch.
- A history record associated with the wrong aggregate.
- Multiple histories for one aggregate in a method intended to perform one
  mutation per aggregate.

## 10. Repository Implementation

An audited repository owns atomic persistence for its aggregate and history.

Structure the implementation around a reusable private persistence function:

```ts
async function persistOne(
  query: TDatabaseQuery,
  account: ILedgerAccount,
  history: ILedgerAccountHistory,
  options: IWriteRepoOptions
) {
  validateHistoryAssociation(account, history);

  await persistAccount(query, account, options);
  await persistHistory(query, account, history, options);
}
```

Single-write behavior:

```ts
async function save(account, options) {
  const persist = async (query: TDatabaseQuery) => {
    await persistOne(query, account, options.history, options);
  };

  if (options.tx) {
    await persist(getDbQuery(options));
    return;
  }

  await postgres.transaction(persist);
}
```

Bulk behavior:

```ts
async function saveMany(writes, options) {
  const persist = async (query: TDatabaseQuery) => {
    validateWrites(writes);

    for (const write of writes) {
      await persistOne(query, write.entity, write.history, options);
    }
  };

  if (options.tx) {
    await persist(getDbQuery(options));
    return;
  }

  await postgres.transaction(persist);
}
```

The implementation may batch inserts for performance after the reference
behavior is correct. Correct association and atomicity come first.

### 10.1 Existing transaction participation

When a use case already spans several repositories, it continues using
`repoService.runInTransaction`.

```ts
await repoService.runInTransaction(async (tx) => {
  await ledgerAccountRepo.save(accountResult.entity, {
    tx,
    correlationId,
    history: accountResult.history,
  });

  await journalEntryRepo.save(entryResult.entity, {
    tx,
    correlationId,
    history: entryResult.history,
  });
});
```

Both repositories use the supplied transaction. They must not open nested
transactions.

### 10.2 Events

Publish domain events only after the transaction commits:

```ts
await repoService.runInTransaction(...);

await eventBus.publish(
  eventValue.enrichAll(events, { correlationId })
);
```

History persistence does not depend on event delivery.

## 11. Database Schema

Leave `db/migrations/1777324463604_audit-schema.ts` unchanged. Add new
chronological migrations for history tables.

### 11.1 Common columns

Tenant-owned financial aggregate tables generally contain:

```text
id                    UUID PRIMARY KEY
<aggregate>_id        UUID NOT NULL
accounting_entity_id  UUID NOT NULL
actor_user_id         UUID NULL
actor_type            VARCHAR(...) NOT NULL
action                VARCHAR(...) NOT NULL
before_state          JSONB NULL
after_state           JSONB NULL
note                  TEXT NULL
correlation_id        VARCHAR(...) NULL
entity_version        INTEGER NULL, only where versioning exists
occurred_at           TIMESTAMPTZ NOT NULL
recorded_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

`accounting_entity_id` is not universal. User profile history does not contain
it unless a later profile model becomes tenant-scoped.

### 11.2 Example ledger-account table

```sql
CREATE TABLE audit.ledger_account_history (
  id UUID PRIMARY KEY,
  ledger_account_id UUID NOT NULL,
  accounting_entity_id UUID NOT NULL,
  actor_user_id UUID,
  actor_type VARCHAR(20) NOT NULL,
  action VARCHAR(50) NOT NULL,
  before_state JSONB,
  after_state JSONB,
  note TEXT,
  correlation_id VARCHAR(255),
  occurred_at TIMESTAMPTZ NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT ledger_account_history_state_check
    CHECK (before_state IS NOT NULL OR after_state IS NOT NULL),

  CONSTRAINT ledger_account_history_actor_check
    CHECK (
      (actor_type = 'user' AND actor_user_id IS NOT NULL)
      OR
      (
        actor_type IN ('system', 'migration')
        AND actor_user_id IS NULL
      )
    )
);
```

Whether `actor_user_id` receives a non-cascading foreign key should be decided
consistently across all history tables:

- A soft reference maximizes durability and avoids deletion coupling.
- A foreign key with `ON DELETE SET NULL` preserves database validation while
  allowing user deletion.

Do not use `ON DELETE CASCADE` for history.

### 11.3 Indexes

Every aggregate table receives a timeline index:

```sql
CREATE INDEX ledger_account_history_timeline_idx
ON audit.ledger_account_history
  (ledger_account_id, occurred_at DESC, id DESC);
```

Tenant-owned tables also receive:

```sql
CREATE INDEX ledger_account_history_tenant_timeline_idx
ON audit.ledger_account_history
  (accounting_entity_id, occurred_at DESC, id DESC);
```

Add actor indexes only when supported by a concrete query. Avoid indexing every
column speculatively.

### 11.4 Action representation

Use application-level action unions initially unless the project explicitly
chooses PostgreSQL enums for history actions.

`VARCHAR` is easier to evolve during early development. Add check constraints
when the allowed values must be enforced by the database.

### 11.5 Drizzle schema

After migrations are established:

- Update or regenerate `src/infra/config/drizzle/schema.ts`.
- Add typed JSONB model shapes for before and after snapshots.
- Add application mappers between domain history and repository models.
- Regenerate database documentation using the existing project workflow.

## 12. Optimistic Concurrency and Versions

Do not make `entity_version` mandatory across every history table.

Use it only for aggregates with a defined versioning contract:

- Journal entries already expose a version.
- Other human-mutated aggregates can add versioning as ADR 0013 is rolled out.

For a versioned mutation:

1. The caller supplies `expectedVersion`.
2. The repository updates the aggregate using the expected version predicate.
3. A zero-row update throws the established concurrency error.
4. The history row is inserted only if the aggregate update succeeds.
5. The history row stores the new committed aggregate version.

Because both operations share one transaction, a history insertion failure also
rolls back the aggregate version increment.

## 13. Journal Entry History

Treat a journal entry and its journal lines as one aggregate for history.

### 13.1 One record per semantic operation

Create one `journal_entry_history` record for:

- Created
- Updated while edits are permitted
- Posted
- Voided
- Archived
- Unarchived

Do not create independent journal-line history while journal lines cannot
change outside the journal-entry aggregate.

### 13.2 Snapshot shape

The journal-entry snapshot includes a curated header and serialized lines:

```ts
export interface IJournalLineHistorySnapshot {
  id: TEntityId;
  accountId: TEntityId;
  sequenceOrder: number;
  side: UJournalSide;
  amountMinorUnit: string;
  currencyCode: UCurrencyCode;
  functionalAmountMinorUnit: string;
  functionalCurrencyCode: UCurrencyCode;
  exchangeRate: string;
  description: string | null;
}

export interface IJournalEntryHistorySnapshot {
  id: TEntityId;
  accountingEntityId: TEntityId;
  sourceType: UJournalEntrySourceType;
  counterpartyId: TEntityId | null;
  memo: string | null;
  status: UJournalEntryStatus;
  effectiveDate: string;
  postedAt: string | null;
  voidedAt: string | null;
  voidingEntryId: TEntityId | null;
  version: number;
  lines: IJournalLineHistorySnapshot[];
}
```

Use the project's canonical money and exchange-rate serialization. The exact
scalar types must be confirmed against existing repository mappers before
implementation.

Line additions, removals, reordering, and edits appear in the before and after
entry snapshots.

### 13.3 Append-only accounting behavior

History does not replace the append-only rules in ADR 0003:

- Posted financial meaning is not silently rewritten.
- Corrections use voiding or reversal flows.
- History records explain lifecycle transitions and permitted metadata changes.

## 14. User Profile History

User profile history remains distinct from `audit.user_activities`.

The snapshot may include:

- User ID
- First name
- Last name
- Email, if the retention and privacy policy permits it
- Email verification status
- Deleted status or deletion timestamp

It must exclude:

- Password hashes
- Password-reset tokens
- Authentication strategies containing secrets
- Refresh tokens
- Sessions
- Failed-login security details unless stored in a separate security audit
  system

Before implementation, decide whether historical email values must be retained
in full, masked, encrypted, or omitted. This is a privacy and retention policy
decision, not only a TypeScript decision.

## 15. Initial Aggregate Scope

Implement these history tables and domain contracts:

| Aggregate          | History table                      | Initial actions                                        |
| ------------------ | ---------------------------------- | ------------------------------------------------------ |
| Ledger account     | `audit.ledger_account_history`     | created, updated, archived, unarchived                 |
| Journal entry      | `audit.journal_entry_history`      | created, updated, posted, voided, archived, unarchived |
| Accounting entity  | `audit.accounting_entity_history`  | created, updated                                       |
| Accounting context | `audit.accounting_context_history` | created, updated                                       |
| Accounting period  | `audit.accounting_period_history`  | created, opened, updated, closed, reopened             |
| Fiscal year        | `audit.fiscal_year_history`        | created, opened, updated, closed, reopened             |
| User profile       | `audit.user_profile_history`       | created, updated, deleted, restored                    |

Defer `audit.sub_ledger_account_history` until subledger persistence and
aggregate boundaries are established.

Reporting contexts and reporting periods should be evaluated during the
accounting-context phase. Add them if they have independently mutable business
state rather than automatically assuming every persisted table needs history.

## 16. Query Contracts

Add read-only history repositories or query repositories separately from
aggregate write repositories.

Example:

```ts
export interface ILedgerAccountHistoryQueryRepo {
  findByLedgerAccountId(
    ledgerAccountId: TEntityId,
    options: IPaginatedReadRepoOptions
  ): Promise<IPaginatedResponse<ILedgerAccountHistory>>;
}
```

History queries must:

- Scope tenant-owned records by the active accounting entity.
- Sort by `occurredAt DESC, id DESC`.
- Use deterministic cursor or offset pagination consistent with current API
  conventions.
- Never expose snapshots containing fields the caller is not authorized to
  view.

Do not add a universal cross-aggregate history endpoint in the first phase.
Aggregate-specific timelines are easier to authorize and type correctly.

## 17. Testing Strategy

### 17.1 Shared history unit tests

Test:

- User actor requires a user ID.
- System and migration actors are accepted.
- Creation permits `before: null`.
- Deletion permits `after: null`.
- Both states cannot be null.
- History IDs and occurrence timestamps are created once.
- Notes are sanitized and bounded.

### 17.2 Domain operation tests

For each action, verify:

- The returned aggregate state is correct.
- The semantic action is correct.
- Before snapshot matches the original aggregate.
- After snapshot matches the updated aggregate.
- Actor and note are preserved.
- Expected domain events are still produced.
- Input aggregate objects remain immutable.

### 17.3 Repository contract tests

Test:

- Aggregate and history are stored together.
- Aggregate failure writes no history.
- History failure rolls back the aggregate write.
- A supplied external transaction is used.
- No nested transaction is opened when `tx` is supplied.
- Duplicate history IDs fail without duplicating the aggregate mutation.
- Entity/history ID mismatch is rejected.
- Bulk writes associate each history with the correct aggregate.
- Bulk failure rolls back the entire batch.
- Expected-version conflicts write no history.

### 17.4 Query tests

Test:

- Single-aggregate history lookup.
- Reverse chronological ordering.
- Deterministic ordering when timestamps match.
- Pagination.
- Tenant isolation.
- Actor and action filtering only where supported.

### 17.5 Use-case tests

Update mocks and assertions to verify:

- Request users become explicit history actors.
- System workflows use system actors.
- Repositories receive required history.
- Events publish only after persistence succeeds.
- Persistence failures prevent event publication.

## 18. Rollout Phases

### Phase 1: Repository option refactor

1. Add `IReadRepoOptions`.
2. Add `IPaginatedReadRepoOptions`.
3. Add `IWriteRepoOptions`.
4. Migrate repository interfaces and implementations mechanically.
5. Migrate mocks and tests.
6. Run type checking and the full test suite.

No history behavior is introduced in this phase.

### Phase 2: Shared history foundation

1. Add shared history types.
2. Update nullable diff semantics.
3. Add shared actor and history validation.
4. Add history ID generation.
5. Begin deprecating existing audit-trail and history-log types.

### Phase 3: Ledger-account reference implementation

1. Define ledger-account actions and snapshot.
2. Add ledger-account history helpers.
3. Update creation and mutation domain operations to return audited results.
4. Change the repository to `save` and `saveMany`.
5. Add the ledger-account history migration.
6. Add Drizzle schema and mapper.
7. Persist aggregate and history atomically.
8. Add timeline query repository.
9. Add unit, repository, and use-case tests.
10. Document lessons before duplicating the pattern.

### Phase 4: Journal-entry implementation

1. Finalize entry and line snapshot serialization.
2. Define lifecycle actions.
3. Add the history migration and Drizzle mapping.
4. Update repository transactions so entry, lines, and history commit together.
5. Integrate optimistic concurrency.
6. Add lifecycle and rollback tests.

### Phase 5: Accounting aggregates

Implement in this order:

1. Accounting entity
2. Accounting context
3. Accounting period
4. Fiscal year
5. Reporting context and reporting period, if independently mutable

Review whether multi-aggregate setup workflows create one history record per
created aggregate. The accounting-entity bootstrap transaction should either
commit every aggregate and its history or roll back all of them.

### Phase 6: User profile

1. Decide PII retention rules.
2. Define the sanitized snapshot.
3. Add user-profile history without changing user activity behavior.
4. Ensure deletion does not cascade history.
5. Add authorization tests for profile-history reads.

### Phase 7: Subledger

Implement only after:

- Subledger persistence exists.
- Aggregate ownership is explicit.
- Independent versus ledger-owned lifecycle is decided.

## 19. Future Outbox and External Audit Storage

The initial repository writes directly to PostgreSQL history tables.

If history later moves to MongoDB or a separate audit service, preserve the
domain history contract and change infrastructure persistence:

```text
Current:
PostgreSQL transaction
  - aggregate write
  - history write

Future:
PostgreSQL transaction
  - aggregate write
  - outbox write containing the history record

Outbox relay
  - queue publication

Audit consumer
  - MongoDB or audit-service write
```

Requirements for the future path:

- History ID is the consumer idempotency key.
- The outbox stores the full sanitized snapshot and actor metadata.
- Consumers never fetch previous state from the source database.
- Delivery is assumed to be at least once.
- The consumer enforces uniqueness on history ID.
- Per-aggregate ordering uses aggregate ID, occurrence time, and version where
  available.
- Dead-letter handling and replay are operational requirements.

The use case and domain contracts should not change when this migration occurs.

## 20. Documentation Reconciliation

`docs/08_cross_cutting_concepts.md` currently says that database triggers or
repository base classes automatically capture state changes.

After the reference implementation is accepted, update that section to state
that:

- The domain constructs semantic history.
- Audited repositories persist aggregate and history atomically.
- Domain events are not the authoritative history mechanism.

Consider adding an ADR documenting this decision and linking it from the
cross-cutting concepts document.

## 21. Non-Goals

This implementation does not:

- Implement event sourcing.
- Reconstruct aggregate state by replaying history.
- Replace domain events.
- Replace operational user activity logs.
- Audit every database table indiscriminately.
- Introduce MongoDB or a separate audit service immediately.
- Add independent journal-line history.
- Make every aggregate versioned as part of the history work.
- Define final regulatory retention periods.

## 22. Definition of Done

The history foundation is complete when:

- Read and write repository options are separated.
- Existing overlapping history/audit types are reconciled.
- The ledger-account reference implementation is complete.
- Every ledger-account write requires a history record at compile time.
- Aggregate and history writes are atomic with and without an external
  transaction.
- Bulk writes cannot misassociate histories and aggregates.
- History records are append-only from the application perspective.
- Tenant-scoped history queries are indexed and authorized.
- Domain events publish only after successful persistence.
- Tests prove rollback behavior and actor propagation.
- The pattern is documented well enough to implement journal-entry history
  without inventing a second approach.

The broader rollout is complete when all in-scope aggregates have:

- Purpose-built snapshots
- Semantic action unions
- Domain-generated history
- Atomic repository persistence
- Timeline queries
- Tenant and authorization tests
- No cascading deletion of history

## 23. Implementation Checklist

Work through this checklist in order. Check an item only after its tests and
dependent call sites have been updated.

### 23.1 Database foundation

- [x] Add chronological migrations for the seven in-scope history tables.
- [x] Add timeline and tenant-timeline indexes to the history tables.
- [x] Regenerate the Drizzle schema, relations, SQL snapshot, and metadata.
- [x] Add the `migration` value to `audit.history_actor_type`.
- [x] Tighten every actor constraint so a `user` actor requires a non-null
      `user_id`, while non-user actors require `user_id` to be null.
- [x] Keep the actor reference column named `user_id`; system and migration
      actors do not have user IDs.
- [x] Run all migrations down and up against a clean database, then run
      `npm run drizzle:pull`.
- [x] Verify duplicate history IDs, invalid diffs, and invalid actor
      combinations are rejected by PostgreSQL.
- [x] Regenerate and review database documentation.

### 23.2 Repository option refactor

- [x] Add `ITransactionContext`, `IReadRepoOptions`,
      `IPaginatedReadRepoOptions`, and generic `IWriteRepoOptions<THistory>`.
- [x] Remove pagination and locking concerns from the base `IRepoOptions`.
- [x] Migrate point-read repository contracts and implementations to
      `IReadRepoOptions`.
- [x] Migrate paginated query contracts and implementations to
      `IPaginatedReadRepoOptions`.
- [x] Migrate non-audited writes to `IWriteRepoOptions`.
- [x] Update repository helpers, services, use cases, mocks, and tests for the
      new option types.
- [x] Run type checking and the full test suite before adding history behavior.

### 23.3 Shared history foundation

- [ ] Update `IDiff<T>` so `before` and `after` are independently nullable.
- [ ] Add the shared actor, history record, audited result, and history-write
      types.
- [ ] Add shared validation for actor identity, non-empty diffs, notes, history
      IDs, and occurrence timestamps.
- [ ] Replace `IAuditTrail`, `IMakeAuditTrail`,
      `IJournalEntryHistoryLog`, and period-specific history shapes.
- [ ] Add shared history unit tests.

### 23.4 Ledger-account reference implementation

- [ ] Define ledger-account history actions and the sanitized snapshot type.
- [ ] Add ledger-account snapshot and history-construction helpers.
- [ ] Update ledger-account creation and mutation operations to return audited
      domain results.
- [ ] Propagate explicit user and system actors from use cases to domain
      operations.
- [ ] Change the ledger-account repository contract to audited `save` and
      paired `saveMany` writes.
- [ ] Add ledger-account history persistence mapping.
- [ ] Persist the ledger account and history atomically with and without an
      external transaction.
- [ ] Validate entity/history association, duplicate IDs, empty batches, and
      bulk-write pairing.
- [ ] Publish ledger-account events only after persistence commits.
- [ ] Add the tenant-scoped ledger-account timeline query repository.
- [ ] Add domain, repository rollback, bulk-write, query, and use-case tests.
- [ ] Document lessons from the reference implementation before copying the
      pattern to other aggregates.

### 23.5 Journal-entry implementation

- [ ] Finalize canonical serialization for money, exchange rates, dates, and
      journal lines.
- [ ] Define journal-entry history actions, snapshots, and helpers.
- [ ] Update journal-entry operations to return audited domain results.
- [ ] Persist the entry, lines, attachments where applicable, and one semantic
      history record in the same transaction.
- [ ] Integrate `expectedVersion` checks and store the committed entity version
      in history.
- [ ] Add the tenant-scoped journal-entry timeline query repository.
- [ ] Add lifecycle, concurrency, transaction rollback, query, and use-case
      tests.

### 23.6 Accounting aggregates

- [ ] Implement accounting-entity history end to end.
- [ ] Implement accounting-context history end to end.
- [ ] Decide whether reporting contexts and reporting periods have independent
      mutable lifecycles that require history.
- [ ] Implement accounting-period history end to end.
- [ ] Implement fiscal-year history end to end.
- [ ] Ensure accounting bootstrap workflows commit every aggregate and history
      record together or roll back the complete setup.
- [ ] Add tenant isolation, lifecycle, transaction, and timeline-query tests
      for each accounting aggregate.

### 23.7 User-profile history

- [ ] Decide whether historical email values are retained, masked, encrypted,
      or omitted.
- [ ] Define a sanitized user-profile snapshot that excludes authentication
      and session data.
- [ ] Add user-profile actions, helpers, actor propagation, and audited domain
      results.
- [ ] Persist user-profile changes and history atomically without changing
      `audit.user_activities` behavior.
- [ ] Verify user deletion cannot cascade or erase profile history.
- [ ] Add profile-history query authorization and privacy tests.

### 23.8 Final verification and documentation

- [ ] Add aggregate-specific timeline endpoints only where required by the
      application.
- [ ] Verify deterministic ordering by `occurred_at DESC, id DESC` and
      pagination for every timeline query.
- [ ] Verify no audited repository exposes an unaudited write path.
- [ ] Verify history rows cannot be updated or deleted through application
      repositories.
- [ ] Verify persistence failures prevent domain-event publication.
- [ ] Update `docs/08_cross_cutting_concepts.md` to describe domain-generated,
      transactionally persisted history.
- [ ] Decide whether to capture the accepted pattern in an ADR.
- [ ] Run formatting, type checking, the full test suite, and migration tests.
- [ ] Defer subledger history until its persistence and aggregate ownership are
      established.
