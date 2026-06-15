# Repo Consistency: Split save → create/update + Standardize History Repos

Refactor all repository implementations to replace `save()` with explicit `create()` and `update()` methods, eliminate `onConflictDoUpdate`, and standardize history tracking via dedicated history repos.

## Resolved Decisions

- ✅ **Reporting Context & Reporting Period** — Will create DB migration schemas for both history tables, then sync Drizzle via `drizzle:pull`. Full history plumbing (mappers, repo interfaces, repo impls) added in Phase 2e
- ✅ **Bootstrap transaction bug** — Will be fixed in Phase 2g (pass `tx` in `repoOptions`)
- ✅ **`userPreferencesRepo.save`** — Dead code, will be removed (Phase 5d)
- ✅ **Journal Entry Persistence Service** — Will be deleted (Option A). Entity repos handle their own history internally. Callers will use repos directly (Phase 4c)

---

## Current State Inventory

### Entities using `onConflictDoUpdate` (need create/update split)

| Entity           | File                                                                                                                                                    | Has History?             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Journal Entry    | [journal-entry.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/journal-entry/journal-entry.repo.impl.ts) | Separate history repo ✅ |
| Journal Line     | [journal-line.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/journal-entry/journal-line.repo.impl.ts)   | Separate history repo ✅ |
| User             | [user.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/user/user.repo.impl.ts)                            | Inline in save() ⚠️      |
| User Auth        | [user-auth.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/user/user-auth.repo.impl.ts)                  | No history               |
| User Preferences | [user-preferences.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/user/user-preferences.repo.impl.ts)    | No history               |
| User Session     | [user-session.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/user/user-session.repo.impl.ts)            | No history               |

### Entities using `onConflictDoNothing` (rename save → create, keep idempotent behavior)

| Entity                     | File                                                                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Currency                   | [currency.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/currency/currency.repo.impl.ts)                                                   |
| Exchange Rate              | [exchange-rate.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/currency/exchange-rate.repo.impl.ts)                                         |
| Jurisdiction               | [jurisdiction.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/accounting/jurisdiction.repo.impl.ts)                                         |
| Accounting Standards       | [accounting-standards.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/accounting/accounting-standards.repo.impl.ts)                         |
| Jurisdiction Acct Standard | [jurisdiction-accounting-standard.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/accounting/jurisdiction-accounting-standard.repo.impl.ts) |

### Entities using plain insert (rename save → create, add history)

| Entity              | File                                                                                                                                                               | Has Schema? | Has Mapper? | Has Repo? | History Written?          |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- | ----------- | --------- | ------------------------- |
| Accounting Context  | [accounting-context.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/accounting/accounting-context.repo.impl.ts)     | ✅          | ✅          | ❌        | ✅ (inline)               |
| Accounting Entity   | [accounting-entity.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/accounting/accounting-entity.repo.impl.ts)       | ✅          | ❌          | ❌        | ❌                        |
| Accounting Period   | [accounting-period.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/accounting/accounting-period.repo.impl.ts)       | ✅          | ❌          | ❌        | ❌                        |
| Fiscal Year         | [fiscal-year.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/accounting/fiscal-year.repo.impl.ts)                   | ✅          | ❌          | ❌        | ❌                        |
| Reporting Context   | [reporting-context.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/accounting/reporting-context.repo.impl.ts)       | ❌ → ✅     | ❌          | ❌        | ❌                        |
| Reporting Period    | [reporting-period.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/accounting/reporting-period.repo.impl.ts)         | ❌ → ✅     | ❌          | ❌        | ❌                        |
| Ledger Account      | [ledger-account.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/ledger/ledger-account.repo.impl.ts)                 | ✅          | ✅          | ❌        | ✅ (inline)               |
| Ledger Acct Balance | [ledger-account-balance.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/ledger/ledger-account-balance.repo.impl.ts) | —           | —           | —         | — (already uses `create`) |

---

## Proposed Changes

### Phase 0: DB Migrations — Create History Tables for Reporting Context & Reporting Period

Using the [migration skill](file:///Users/osahon/work/purple-ledger/code/pl-core/.agents/shared/skills/migration.skill.md) (`node-pg-migrate`).

##### [NEW] `db/config/accounting.ts` — Add table config entries

- Add `reportingContextHistoryTable` → `{ name: 'reporting_context_history', schema: auditSchema }`
- Add `reportingPeriodHistoryTable` → `{ name: 'reporting_period_history', schema: auditSchema }`

##### [NEW] `db/migrations/<timestamp>_reporting-context-history.ts`

Create migration following the exact pattern of [accounting-context-history migration](file:///Users/osahon/work/purple-ledger/code/pl-core/db/migrations/1781173813413_accounting-context-history.ts):

- Columns: `id` (bigserial PK), `reporting_context_id` (uuid NOT NULL), `accounting_entity_id` (uuid NOT NULL), `user_id` (uuid, references users), `actor_type` (history_actor_type NOT NULL), `action` (varchar(50) NOT NULL), `diff` (jsonb NOT NULL), `correlation_id` (varchar(255)), `occurred_at` (timestamptz NOT NULL), `recorded_at` (timestamptz NOT NULL, default now())
- Constraints: diff check (before/after jsonb structure), actor check (user requires user_id, system/migration requires null)
- Indexes: `reporting_context_history_timeline_idx` on (reporting_context_id, occurred_at DESC, id DESC), `reporting_context_history_tenant_timeline_idx` on (accounting_entity_id, occurred_at DESC, id DESC)

##### [NEW] `db/migrations/<timestamp>_reporting-period-history.ts`

Same pattern, but with `reporting_period_id` (uuid NOT NULL) instead of `reporting_context_id`:

- Columns: same structure as above with `reporting_period_id` as the entity ID column
- Constraints: same diff and actor checks
- Indexes: `reporting_period_history_timeline_idx`, `reporting_period_history_tenant_timeline_idx`

##### Post-migration

```bash
npm run db:migrate up      # Run the new migrations
npm run drizzle:pull        # Sync Drizzle schema from DB
```

> [!IMPORTANT]
> `src/infra/config/drizzle` is auto-generated — do NOT edit it directly. The `drizzle:pull` command will generate the new `reportingContextHistoryInAudit` and `reportingPeriodHistoryInAudit` schema exports.

---

### Phase 1: Foundation — Shared Types

No changes needed to [repo.types.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/shared/types/repo.types.ts). The `IWriteRepoOptions<THistory>` generic already works perfectly for what we need.

---

### Phase 2: Accounting Domain

#### 2a. Accounting Entity — Fill the history gap

##### [NEW] `src/app/accounting/mappers/accounting-entity-history.mapper.ts`

Create a history mapper following the pattern of [accounting-context-history.mapper.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/app/accounting/mappers/accounting-context-history.mapper.ts). Maps `IAccountingEntity` + `IAccountingEntityAuditHistory` → drizzle insert values for `accountingEntityHistoryInAudit`.

##### [NEW] `src/domain/accounting/repos/accounting-entity-history.repo.ts`

Create history repo interface with a single `create` method.

##### [NEW] `src/infra/persistence/repos/accounting/accounting-entity-history.repo.impl.ts`

Implement the history repo — insert-only, using the new mapper.

##### [MODIFY] [accounting-entity.repo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/accounting/repos/accounting-entity.repo.ts)

- Rename `save` → `create`
- Update options type: `IWriteRepoOptions` → `IWriteRepoOptions<IAccountingEntityAuditHistory>`

##### [MODIFY] [accounting-entity.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/accounting/accounting-entity.repo.impl.ts)

- Rename `save` → `create`
- Add internal call to the new history repo within a transaction
- Import and use the new history repo

##### [MODIFY] [accounting-entity.repo.impl.mock.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/accounting/__mocks__/accounting-entity.repo.impl.mock.ts)

- Rename `save` → `create`

##### [NEW] `src/infra/persistence/repos/accounting/__mocks__/accounting-entity-history.repo.impl.mock.ts`

Create mock for the new history repo.

---

#### 2b. Accounting Period — Fill the history gap

##### [NEW] `src/app/accounting/mappers/accounting-period-history.mapper.ts`

History mapper for `IAccountingPeriod` + `IAccountingPeriodHistory` → `accountingPeriodHistoryInAudit`.

##### [NEW] `src/domain/accounting/repos/accounting-period-history.repo.ts`

History repo interface — `create` only.

##### [NEW] `src/infra/persistence/repos/accounting/accounting-period-history.repo.impl.ts`

Insert-only implementation.

##### [MODIFY] [accounting-period.repo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/accounting/repos/accounting-period.repo.ts)

- Rename `save` → `create`
- Update options: `IWriteRepoOptions` → `IWriteRepoOptions<IAccountingPeriodHistory | IAccountingPeriodHistory[]>` (since payload accepts single or array)

##### [MODIFY] [accounting-period.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/accounting/accounting-period.repo.impl.ts)

- Rename `save` → `create`
- Add history repo call inside transaction

##### [MODIFY] [accounting-period.repo.impl.mock.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/accounting/__mocks__/accounting-period.repo.impl.mock.ts)

- Rename `save` → `create`

##### [NEW] `src/infra/persistence/repos/accounting/__mocks__/accounting-period-history.repo.impl.mock.ts`

---

#### 2c. Fiscal Year — Fill the history gap

##### [NEW] `src/app/accounting/mappers/fiscal-year-history.mapper.ts`

History mapper for `IFiscalYear` + `IFiscalYearHistory` → `fiscalYearHistoryInAudit`.

##### [NEW] `src/domain/accounting/repos/fiscal-year-history.repo.ts`

History repo interface — `create` only.

##### [NEW] `src/infra/persistence/repos/accounting/fiscal-year-history.repo.impl.ts`

Insert-only implementation.

##### [MODIFY] [fiscal-year.repo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/accounting/repos/fiscal-year.repo.ts)

- Rename `save` → `create`
- Update options: `IWriteRepoOptions` → `IWriteRepoOptions<IFiscalYearHistory>`

##### [MODIFY] [fiscal-year.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/accounting/fiscal-year.repo.impl.ts)

- Rename `save` → `create`
- Add history repo call inside transaction

##### [MODIFY] [fiscal-year.repo.impl.mock.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/accounting/__mocks__/fiscal-year.repo.impl.mock.ts)

- Rename `save` → `create`

##### [NEW] `src/infra/persistence/repos/accounting/__mocks__/fiscal-year-history.repo.impl.mock.ts`

---

#### 2d. Accounting Context — Extract inline history to dedicated repo

##### [NEW] `src/domain/accounting/repos/accounting-context-history.repo.ts`

History repo interface — `create` only.

##### [NEW] `src/infra/persistence/repos/accounting/accounting-context-history.repo.impl.ts`

Extract the inline history insert from [accounting-context.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/accounting/accounting-context.repo.impl.ts#L19-L23) into a dedicated repo. Reuse existing [accounting-context-history.mapper.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/app/accounting/mappers/accounting-context-history.mapper.ts).

##### [MODIFY] [accounting-context.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/accounting/accounting-context.repo.impl.ts)

- Rename `save` → `create`
- Replace inline history insert with call to the new history repo

##### [MODIFY] [accounting-context.repo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/accounting/repos/accounting-context.repo.ts)

- Rename `save` → `create`

##### [MODIFY] [accounting-context.repo.impl.mock.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/accounting/__mocks__/accounting-context.repo.impl.mock.ts)

- Rename `save` → `create`

##### [NEW] `src/infra/persistence/repos/accounting/__mocks__/accounting-context-history.repo.impl.mock.ts`

---

#### 2e. Reporting Context & Reporting Period — rename save → create + add full history plumbing

##### [NEW] `src/app/accounting/mappers/reporting-context-history.mapper.ts`

History mapper for `IReportingContext` + `IReportingContextHistory` → `reportingContextHistoryInAudit` (auto-generated by `drizzle:pull` in Phase 0).

##### [NEW] `src/app/accounting/mappers/reporting-period-history.mapper.ts`

History mapper for `IReportingPeriod` + `IReportingPeriodHistory` → `reportingPeriodHistoryInAudit`.

##### [NEW] `src/domain/accounting/repos/reporting-context-history.repo.ts`

History repo interface — `create` only.

##### [NEW] `src/domain/accounting/repos/reporting-period-history.repo.ts`

History repo interface — `create` only.

##### [NEW] `src/infra/persistence/repos/accounting/reporting-context-history.repo.impl.ts`

Insert-only implementation using the new mapper.

##### [NEW] `src/infra/persistence/repos/accounting/reporting-period-history.repo.impl.ts`

Insert-only implementation using the new mapper.

##### [MODIFY] [reporting-context.repo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/accounting/repos/reporting-context.repo.ts)

- Rename `save` → `create`
- Update options: `IWriteRepoOptions` → `IWriteRepoOptions<IReportingContextHistory>`

##### [MODIFY] [reporting-context.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/accounting/reporting-context.repo.impl.ts)

- Rename `save` → `create`
- Add history repo call inside transaction

##### [MODIFY] [reporting-context.repo.impl.mock.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/accounting/__mocks__/reporting-context.repo.impl.mock.ts)

- Rename `save` → `create`

##### [MODIFY] [reporting-period.repo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/accounting/repos/reporting-period.repo.ts)

- Rename `save` → `create`
- Update options: `IWriteRepoOptions` → `IWriteRepoOptions<IReportingPeriodHistory | IReportingPeriodHistory[]>` (since payload accepts single or array)

##### [MODIFY] [reporting-period.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/accounting/reporting-period.repo.impl.ts)

- Rename `save` → `create`
- Add history repo call inside transaction

##### [MODIFY] [reporting-period.repo.impl.mock.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/accounting/__mocks__/reporting-period.repo.impl.mock.ts)

- Rename `save` → `create`

##### [NEW] `src/infra/persistence/repos/accounting/__mocks__/reporting-context-history.repo.impl.mock.ts`

##### [NEW] `src/infra/persistence/repos/accounting/__mocks__/reporting-period-history.repo.impl.mock.ts`

---

#### 2f. Reference Data Repos — rename save → create (no history needed)

##### [MODIFY] [accounting-standards.repo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/accounting/repos/accounting-standards.repo.ts) + [impl](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/accounting/accounting-standards.repo.impl.ts) + mock

- Rename `save` → `create` (keep `onConflictDoNothing`)

##### [MODIFY] [jurisdiction.repo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/accounting/repos/jurisdiction.repo.ts) + [impl](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/accounting/jurisdiction.repo.impl.ts) + mock

- Rename `save` → `create` (keep `onConflictDoNothing`)

##### [MODIFY] [jurisdiction-accounting-standard.repo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/accounting/repos/jurisdiction-accounting-standard.repo.ts) + [impl](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/accounting/jurisdiction-accounting-standard.repo.impl.ts) + mock

- Rename `save` → `create` (keep `onConflictDoNothing`)

---

#### 2g. Accounting Domain Callers

##### [MODIFY] [create-accounting-entity.usecase.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/app/accounting/usecases/create-accounting-entity.usecase.ts)

Update all `.save(` calls to `.create(`:

- L245: `accountingEntityRepo.save` → `.create` — **must now pass `history` in options** (currently missing!)
- L246: `fiscalYearRepo.save` → `.create` — **must now pass `history` in options** (currently missing!)
- L247: `accountingPeriodRepo.save` → `.create` — **must now pass `history` in options** (currently missing!)
- L248: `accountingContextRepo.save` → `.create` (history already passed ✅)
- L256: `reportingPeriodRepo.save` → `.create`
- L257: `reportingContextRepo.save` → `.create`
- L258: `ledgerAccountRepo.save` → `.create` (history already passed ✅)

This usecase will need to construct audit/history objects for accounting entity, fiscal year, and accounting period (these entities already produce audit events from their `.make()` calls — we just need to capture those audits and pass them through).

> [!IMPORTANT]
> We need to check if `accountingEntityEntity.make()`, `fiscalYearEntity.make()`, and `accountingPeriodEntity.make()` return audit objects. If they don't, their entity constructors may need to be updated to return audits. This is the same pattern used by `accountingContextEntity.make()` which already returns `[entity, events, audit]`.

##### [MODIFY] [accounting-context.bootstrap.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/app/_bootstrap/accounting-context.bootstrap.ts)

- Update `.save(` calls to `.create(` for `accountingStandards`, `jurisdiction`, and `jurisdictionAccountingStandard`
- **Fix transaction bug**: change `repoOptions` from `{ correlationId }` to `{ correlationId, tx }` so that all repo calls participate in the transaction

##### [MODIFY] [index.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/accounting/index.ts)

- Export new history repos

---

### Phase 3: Ledger Domain

#### 3a. Ledger Account — Extract inline history to dedicated repo

##### [NEW] `src/domain/ledger/repos/ledger-account-history.repo.ts`

History repo interface — `create` only.

##### [NEW] `src/infra/persistence/repos/ledger/ledger-account-history.repo.impl.ts`

Extract the inline history insert from [ledger-account.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/ledger/ledger-account.repo.impl.ts#L35-L37). Reuse existing [ledger-account-history.mapper.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/app/ledger/mappers/ledger-account-history.mapper.ts).

##### [MODIFY] [ledger-account.repo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/ledger/repos/ledger-account.repo.ts)

- Rename `save` → `create`

##### [MODIFY] [ledger-account.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/ledger/ledger-account.repo.impl.ts)

- Rename `save` → `create`
- Replace inline `tx.insert(ledgerAccountHistoryInAudit)` with call to the dedicated history repo

##### [MODIFY] [ledger-account.repo.impl.mock.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/ledger/__mocks__/ledger-account.repo.impl.mock.ts)

- Rename `save` → `create`

##### [NEW] `src/infra/persistence/repos/ledger/__mocks__/ledger-account-history.repo.impl.mock.ts`

#### 3b. Ledger Domain Callers

##### [MODIFY] [create-accounting-entity.usecase.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/app/accounting/usecases/create-accounting-entity.usecase.ts)

- L258: `ledgerAccountRepo.save` → `.create` (already covered in Phase 2g)

##### [MODIFY] [create-petty-cash-account.usecase.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/app/ledger/usecases/create-petty-cash-account.usecase.ts)

- Update `ledgerAccountRepo.save` → `.create` (two call sites: with and without opening balance)

##### [MODIFY] [index.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/ledger/index.ts)

- Export new history repo

---

### Phase 4: Journal Entry Domain

#### 4a. Journal Entry — rename save → create, extract to own history repo pattern

##### [MODIFY] [journal-entry.repo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/journal-entry/repos/journal-entry.repo.ts)

- Rename `save` → `create`
- Update options type: `IWriteRepoOptions` → `IWriteRepoOptions<IJournalEntryHistory>` (or `IJournalEntryCreationAudit` if keeping persistence service)

##### [MODIFY] [journal-entry.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/journal-entry/journal-entry.repo.impl.ts)

- Rename `save` → `create`
- **Remove `onConflictDoUpdate`** — replace with plain `.insert()`
- Add internal call to the existing [journal-entry-history.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/journal-entry/journal-entry-history.repo.impl.ts) within a transaction

##### [MODIFY] [journal-entry.repo.impl.mock.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/journal-entry/__mocks__/journal-entry.repo.impl.mock.ts)

- Rename `save` → `create`

##### [MODIFY] [journal-entry-history.repo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/journal-entry/repos/journal-entry-history.repo.ts)

- Rename `save` → `create`

##### [MODIFY] [journal-entry-history.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/journal-entry/journal-entry-history.repo.impl.ts)

- Rename `save` → `create`

##### [MODIFY] [journal-entry-history.repo.impl.mock.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/journal-entry/__mocks__/journal-entry-history.repo.impl.mock.ts)

- Rename `save` → `create`

---

#### 4b. Journal Line — same treatment

##### [MODIFY] [journal-line.repo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/journal-entry/repos/journal-line.repo.ts)

- Rename `save` → `create`
- Update options: `IWriteRepoOptions` → `IWriteRepoOptions<IJournalLineHistory | IJournalLineHistory[]>`

##### [MODIFY] [journal-line.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/journal-entry/journal-line.repo.impl.ts)

- Rename `save` → `create`
- **Remove `onConflictDoUpdate`** — replace with plain `.insert()`
- Add internal call to the existing [journal-line-history.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/journal-entry/journal-line-history.repo.impl.ts) within a transaction

##### [MODIFY] [journal-line.repo.impl.mock.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/journal-entry/__mocks__/journal-line.repo.impl.mock.ts)

- Rename `save` → `create`

##### [MODIFY] [journal-line-history.repo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/journal-entry/repos/journal-line-history.repo.ts)

- Rename `save` → `create`

##### [MODIFY] [journal-line-history.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/journal-entry/journal-line-history.repo.impl.ts)

- Rename `save` → `create`

##### [MODIFY] [journal-line-history.repo.impl.mock.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/journal-entry/__mocks__/journal-line-history.repo.impl.mock.ts)

- Rename `save` → `create`

---

#### 4c. Delete Journal Entry Persistence Service + Refactor Callers

##### [DELETE] [journal-entry-persistence.service.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/journal-entry/services/journal-entry-persistence.service.ts)

Delete entirely. With this refactor, `journalEntryRepo.create()` and `journalLineRepo.create()` each handle their own history internally via `IWriteRepoOptions<History>`.

##### [DELETE] [journal-entry-persistence.service.types.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/journal-entry/types/journal-entry-persistence.service.types.ts)

Delete the interface — no longer needed.

##### [DELETE] [journal-entry-persistence.service.test.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/journal-entry/services/__tests__/journal-entry-persistence.service.test.ts)

Delete the tests for the removed service.

##### [MODIFY] [record-opening-balance.usecase.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/app/journal-entry/usecases/record-opening-balance.usecase.ts)

- Remove `journalEntryPersistenceService` dependency from constructor
- Replace `journalEntryPersistenceService.save(journalEntry, audit, actor, trace)` with direct repo calls:
  - Construct `headerHistory` and `lineHistories` from `audit` + `actor` using `historyValue.make()`
  - Call `journalEntryRepo.create(header, { ...trace, history: headerHistory })`
  - Call `journalLineRepo.create(lines, { ...trace, history: lineHistories })`
- Add `journalEntryRepo`, `journalLineRepo`, and `repoService` as new dependencies
- Wrap the two repo calls in `repoService.runInTransaction()` to maintain atomicity

##### [MODIFY] [record-transfer-journal-entry.usecase.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/app/journal-entry/usecases/record-transfer-journal-entry.usecase.ts)

- Same refactor as `record-opening-balance.usecase.ts`:
  - Remove `journalEntryPersistenceService` dependency
  - Add `journalEntryRepo`, `journalLineRepo`, `repoService` dependencies
  - Replace `journalEntryPersistenceService.save()` with direct repo `create()` calls in a transaction

##### [MODIFY] [create-petty-cash-account.usecase.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/app/ledger/usecases/create-petty-cash-account.usecase.ts)

- Remove `journalEntryPersistenceService` dependency
- Add `journalEntryRepo`, `journalLineRepo` as new dependencies
- In the opening balance flow (L85-103), replace `journalEntryPersistenceService.save()` with:
  - `journalEntryRepo.create(header, { ...repoOptions, history: headerHistory })`
  - `journalLineRepo.create(lines, { ...repoOptions, history: lineHistories })`
  - These are already inside `repoService.runInTransaction()` so atomicity is preserved
- Update `ledgerAccountRepo.save` → `.create` (two call sites)

##### [MODIFY] [index.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/journal-entry/index.ts)

- Update exports

> [!NOTE]
> All three callers follow the same pattern: they receive `[journalEntry, events, audit]` from a journal entry service method, then currently delegate to the persistence service. After this refactor, they construct the history objects themselves and call the repos directly. The `IJournalEntryCreationAudit` type (containing `header: IJournalEntryAudit` and `lines: IJournalLineAudit[]`) remains useful for the callers to destructure from.

---

### Phase 5: User Domain

#### 5a. User — Extract inline history to dedicated repo

##### [NEW] `src/domain/user/repos/user-history.repo.ts`

History repo interface — `create` only.

##### [NEW] `src/infra/persistence/repos/user/user-history.repo.impl.ts`

Extract the inline history insert from [user.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/user/user.repo.impl.ts#L24-L26). Reuse existing [user-history.mapper.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/app/user/mappers/user-history.mapper.ts).

##### [MODIFY] [user.repo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/user/repos/user.repo.ts)

- Rename `save` → `create`
- Keep `IWriteRepoOptions<IUserHistory>` on `create` ✅
- Add `update` method: `update(user: IUser, options: IWriteRepoOptions<IUserHistory>): Promise<void>`
  - Takes the same options shape as `create` (both create and update produce history records)
  - Uses `drizzle.update()` with a `where` clause on `users.id`

##### [MODIFY] [user.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/user/user.repo.impl.ts)

- Rename `save` → `create`
- **Remove `onConflictDoUpdate`** — replace with plain `.insert()`
- Replace inline history insert with call to the new history repo
- Add `update` method:
  - Uses `drizzle.update(users).set(...).where(eq(users.id, user.id))`
  - Calls history repo within a transaction (same as `create`)

##### [MODIFY] [user.repo.impl.mock.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/user/__mocks__/user.repo.impl.mock.ts)

- Rename `save` → `create`
- Add `update: jest.fn()`

##### [NEW] `src/infra/persistence/repos/user/__mocks__/user-history.repo.impl.mock.ts`

---

#### 5b. User Auth — split save → create/update

##### [MODIFY] [user-auth.repo.contract.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/app/auth/contracts/user-auth.repo.contract.ts)

- Rename `save` → `create`
- **Remove `onConflictDoUpdate`** from create — use plain `.insert()`
- Keep existing `update` method

##### [MODIFY] [user-auth.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/user/user-auth.repo.impl.ts)

- Rename `save` → `create`
- **Remove `onConflictDoUpdate`** — use plain `.insert()`
- Keep existing `update`, `incrementFailedLoginAttempts`, `resetFailedLoginAttempts` methods

##### [MODIFY] [user-auth.repo.impl.mock.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/user/__mocks__/user-auth.repo.impl.mock.ts)

- Rename `save` → `create`

---

#### 5c. User Session — split save → create

##### [MODIFY] [user-session.repo.contract.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/app/auth/contracts/user-session.repo.contract.ts)

- Rename `save` → `create`

##### [MODIFY] [user-session.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/user/user-session.repo.impl.ts)

- Rename `save` → `create`
- **Remove `onConflictDoUpdate`** — use plain `.insert()`

##### [MODIFY] [user-session.repo.impl.mock.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/user/__mocks__/user-session.repo.impl.mock.ts)

- Rename `save` → `create`

---

#### 5d. User Preferences — remove dead `save` method

##### [MODIFY] [user-preferences.repo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/user/repos/user-preferences.repo.ts)

- Remove `save` method from interface (dead code — no callers exist)

##### [MODIFY] [user-preferences.repo.impl.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/user/user-preferences.repo.impl.ts)

- Remove `save` method implementation

##### [MODIFY] [user-preferences.repo.impl.mock.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/user/__mocks__/user-preferences.repo.impl.mock.ts)

- Remove `save: jest.fn()`

---

#### 5e. User Domain Callers

##### [MODIFY] [signup-with-email.usecase.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/app/auth/usecases/signup-with-email.usecase.ts)

- `userRepo.save` → `.create`
- `userAuthRepo.save` → `.create`

##### [MODIFY] [oauth-handler-google.helper.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/app/auth/usecases/helpers/oauth-handler-google.helper.ts)

- `userRepo.save` → `.create`
- `userAuthRepo.save` → `.create` (2 call sites)

##### [MODIFY] [verify-email.usecase.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/app/auth/usecases/verify-email.usecase.ts)

- `userRepo.save` → `.update` (this is an update to an existing user — setting `emailVerified = true`)

##### [MODIFY] [issue-user-session.helper.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/app/auth/usecases/helpers/issue-user-session.helper.ts)

- `userSessionRepo.save` → `.create`

##### [MODIFY] [index.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/user/index.ts)

- Export new history repo

---

### Phase 6: Currency Domain

##### [MODIFY] [currency.repo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/currency/repos/currency.repo.ts) + [impl](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/currency/currency.repo.impl.ts) + mock

- Rename `save` → `create` (keep `onConflictDoNothing`)

##### [MODIFY] [exchange-rate.repo.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/domain/currency/repos/exchange-rate.repo.ts) + [impl](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/currency/exchange-rate.repo.impl.ts) + mock

- Rename `save` → `create` (keep `onConflictDoNothing`)

##### [MODIFY] [setup-currencies.bootstrap.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/app/_bootstrap/setup-currencies.bootstrap.ts)

- `currencyRepo.save` → `.create`

##### [MODIFY] [ingest-exchange-rate.usecase.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/app/currency/usecases/ingest-exchange-rate.usecase.ts)

- `exchangeRateRepo.save` → `.create`

##### [MODIFY] [index.ts](file:///Users/osahon/work/purple-ledger/code/pl-core/src/infra/persistence/repos/currency/index.ts)

- Update exports if needed

---

## Summary of New Files

| #     | File                                                                         | Purpose                                          |
| ----- | ---------------------------------------------------------------------------- | ------------------------------------------------ |
| 1     | `db/migrations/<ts>_reporting-context-history.ts`                            | DB migration for reporting context history table |
| 2     | `db/migrations/<ts>_reporting-period-history.ts`                             | DB migration for reporting period history table  |
| 3     | `app/accounting/mappers/accounting-entity-history.mapper.ts`                 | Map accounting entity + history → Drizzle        |
| 4     | `app/accounting/mappers/accounting-period-history.mapper.ts`                 | Map accounting period + history → Drizzle        |
| 5     | `app/accounting/mappers/fiscal-year-history.mapper.ts`                       | Map fiscal year + history → Drizzle              |
| 6     | `app/accounting/mappers/reporting-context-history.mapper.ts`                 | Map reporting context + history → Drizzle        |
| 7     | `app/accounting/mappers/reporting-period-history.mapper.ts`                  | Map reporting period + history → Drizzle         |
| 8     | `domain/accounting/repos/accounting-entity-history.repo.ts`                  | History repo interface                           |
| 9     | `domain/accounting/repos/accounting-period-history.repo.ts`                  | History repo interface                           |
| 10    | `domain/accounting/repos/fiscal-year-history.repo.ts`                        | History repo interface                           |
| 11    | `domain/accounting/repos/accounting-context-history.repo.ts`                 | History repo interface                           |
| 12    | `domain/accounting/repos/reporting-context-history.repo.ts`                  | History repo interface                           |
| 13    | `domain/accounting/repos/reporting-period-history.repo.ts`                   | History repo interface                           |
| 14    | `domain/ledger/repos/ledger-account-history.repo.ts`                         | History repo interface                           |
| 15    | `domain/user/repos/user-history.repo.ts`                                     | History repo interface                           |
| 16    | `infra/persistence/repos/accounting/accounting-entity-history.repo.impl.ts`  | History repo impl                                |
| 17    | `infra/persistence/repos/accounting/accounting-period-history.repo.impl.ts`  | History repo impl                                |
| 18    | `infra/persistence/repos/accounting/fiscal-year-history.repo.impl.ts`        | History repo impl                                |
| 19    | `infra/persistence/repos/accounting/accounting-context-history.repo.impl.ts` | History repo impl                                |
| 20    | `infra/persistence/repos/accounting/reporting-context-history.repo.impl.ts`  | History repo impl                                |
| 21    | `infra/persistence/repos/accounting/reporting-period-history.repo.impl.ts`   | History repo impl                                |
| 22    | `infra/persistence/repos/ledger/ledger-account-history.repo.impl.ts`         | History repo impl                                |
| 23    | `infra/persistence/repos/user/user-history.repo.impl.ts`                     | History repo impl                                |
| 24-31 | 8 mock files for the new history repo impls                                  | Test mocks                                       |

## Deleted Files

| #   | File                                                                                | Reason                                        |
| --- | ----------------------------------------------------------------------------------- | --------------------------------------------- |
| 1   | `domain/journal-entry/services/journal-entry-persistence.service.ts`                | Replaced by entity repos handling own history |
| 2   | `domain/journal-entry/types/journal-entry-persistence.service.types.ts`             | Interface for deleted service                 |
| 3   | `domain/journal-entry/services/__tests__/journal-entry-persistence.service.test.ts` | Tests for deleted service                     |

## Summary of Modified Files

~55 files across interface renames (`save` → `create`), impl changes (remove `onConflictDoUpdate`, add history calls), mock updates, caller updates, and DB config additions.

---

## Verification Plan

### Automated Tests

```bash
# Run DB migrations
npm run db:migrate up

# Sync Drizzle schema from DB
npm run drizzle:pull

# Verify TypeScript compilation
npx tsc --noEmit

# Run the full test suite to catch all breaking changes
npm run test

# Run with coverage to ensure history repos are tested
npm run test -- --coverage
```

### Manual Verification

- Grep for any remaining `.save(` calls on entity repos to confirm completeness
- Verify no remaining `onConflictDoUpdate` except in `user-auth.repo.impl.ts` `update` method
- Confirm the two new history tables exist in the `audit` schema after migration
