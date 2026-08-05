# Journal Line Counterparties Plan

## Goal

Move counterparty attribution from the journal-entry header to individual journal lines so a single balanced entry can represent postings involving multiple counterparties, such as a customer and a tax authority.

The header will no longer expose `counterPartyId`; each line will expose a nullable `counterPartyId`. The persistence schema and generated Drizzle artifacts are already staged; this plan covers the remaining domain and application integration. Preserve all unrelated staged and working-tree changes during implementation.

## Context

`IJournalHeader` and `IJournalEntryMakePayload` currently own `counterPartyId`, while `IJournalLine` and `IJournalLineMakePayload` do not. The journal-entry entity validates the header value and persists it through the header mapper. The receipt service also verifies the single header counterparty through `ICounterpartyRepo`.

The staged baseline migrations now remove `counterparty_id` from `core.journal_entries` and add a nullable foreign key on `core.journal_lines`. The generated Drizzle schema and relations already reflect the same ownership. Persistence mappers and the account-transaction query still read and write the old header field, so the application contract must now catch up.

## Confirmed Findings

1. **The current model cannot faithfully represent multiple parties.** [journal-entry.types.ts](/Users/osahon/work/purple-ledger/code/pl-core/src/domain/journal-entry/types/journal-entry.types.ts:35) exposes one header counterparty, whereas a line is the actual debit or credit posting in [journal-line.types.ts](/Users/osahon/work/purple-ledger/code/pl-core/src/domain/journal-entry/types/journal-line.types.ts:17).

2. **Counterparty validation currently has two separate concerns.** The journal-entry entity performs source-type and UUID validation in [journal-entry.entity.helpers.ts](/Users/osahon/work/purple-ledger/code/pl-core/src/domain/journal-entry/entities/helpers/journal-entry.entity.helpers.ts:106), while the receipt service performs the repository-backed accounting-entity lookup in [journal-entry.service.ts](/Users/osahon/work/purple-ledger/code/pl-core/src/domain/journal-entry/services/journal-entry.service.ts:47). The latter must be applied to all distinct non-null line counterparties.

3. **Line audits and line-created events already snapshot the complete line.** Adding the field to `IJournalLine` automatically carries it into new line events and audit diffs through [journal-line.entity.ts](/Users/osahon/work/purple-ledger/code/pl-core/src/domain/journal-entry/entities/journal-line.entity.ts:64) and [journal-line-audit.vo.ts](/Users/osahon/work/purple-ledger/code/pl-core/src/domain/journal-entry/values/journal-line-audit.vo.ts:10).

4. **Account-transaction reads expose the counterparty from the header.** [account-transaction.types.ts](/Users/osahon/work/purple-ledger/code/pl-core/src/domain/journal-entry/types/account-transaction.types.ts:9) and its mapper nest that field under `header`; after this change it should be a property of the returned transaction line instead.

5. **The persistence changes are already staged.** [0042_journal-entries.ts](/Users/osahon/work/purple-ledger/code/pl-core/db/migrations/0042_journal-entries.ts:1) removes the header column, [0045_journal-lines.ts](/Users/osahon/work/purple-ledger/code/pl-core/db/migrations/0045_journal-lines.ts:1) adds the nullable line column and foreign key, and the regenerated Drizzle artifacts define the line-to-counterparty relation.

## Scope

### Expected Changes

- `src/domain/journal-entry/types/journal-entry.types.ts` and `src/domain/journal-entry/types/journal-line.types.ts` - remove the header property and add nullable line-level `counterPartyId` to the entity and creation/input payload types.
- `src/domain/journal-entry/entities/**` - validate and construct the line property, retain the transfer restriction at aggregate level, and remove header-level construction and transition copying.
- `src/domain/journal-entry/services/**` - change receipt creation contracts and map counterparties from each source/destination line; validate each distinct referenced counterparty belongs to the entry accounting entity.
- `src/app/journal-entry/**` - move request and response counterparty fields from header DTOs to line DTOs and update Zod validation.
- `src/infra/persistence/repos/journal-entry/**` - remove header mapping and map the new line column for normal reads/writes and line-history snapshots.
- `src/domain/journal-entry/types/account-transaction.types.ts`, `src/infra/persistence/repos/ledger/mappers/account-transaction.mapper.ts`, and `src/app/ledger/dtos/account-transaction/**` - expose counterparty as a line property in account-transaction results rather than within `header`.
- Affected nearby domain, mapper, application-service, use-case, and ledger-query tests - update fixtures and expectations to reflect the new ownership.

### Completed Prerequisites

- `db/migrations/0042_journal-entries.ts` and `db/migrations/0045_journal-lines.ts` - staged baseline schema change from header to line ownership.
- `src/infra/config/drizzle/schema.ts` and `relations.ts` - staged generated schema and relations for the line-level foreign key.

### Out of Scope

- New counterparty-based search/filter endpoints or reporting screens.
- Reclassifying counterparties by role, tax jurisdiction, or subledger settlement behavior.
- Retaining a separate document-level `primaryCounterpartyId` convenience field; that is a different product requirement and should not duplicate the line-level accounting fact.

## Proposed Approach

### 1. Relocate The Domain State And Invariants

- Remove `counterPartyId` from `IJournalHeader`, `IJournalEntry`, and the header portion of `IJournalEntryMakePayload`.
- Add `counterPartyId: TEntityId | null` to `IJournalLine`, `IJournalLineMakePayload`, and `IJournalLineInput`. Keep the existing domain spelling (`counterPartyId`) and translate it to transport/storage `counterpartyId` at the existing mapper boundaries.
- Move nullable UUID validation into `journalLineEntity`/its helper, because the line owns the state. The journal-entry aggregate continues to own the source-type rule: a `transfer` entry cannot contain a non-null counterparty on any line. Validate this after line construction and before events/audits are produced.
- Do not add a new service for this relocation. The aggregate remains dependency-free and owns syntax/state invariants; the existing journal-entry domain service owns the repository-backed existence and tenant checks.
- Existing opening-balance construction should explicitly create two counterparty-free lines and should no longer set any header counterparties.

### 2. Update Creation Contracts And Counterparty Validation

- Replace the receipt service header `counterpartyId` with a nullable counterparties field on each internal source/destination line payload. Map those values into `IJournalLineMakePayload` when creating the entry.
- In `createReceipt`, collect distinct non-null IDs from both source and destination lines and validate each with `counterpartyRepo.findById(id, accountingEntityId, repoOptions)`. Reject with the existing `InvalidCounterpartyId` error when any lookup fails. This preserves current error behavior while allowing repeated use of the same counterparty without redundant reads.
- Update request DTOs and Zod schemas so `IJournalLineReq.counterpartyId` is a nullable UUID. Remove `counterpartyId` from journal-header DTOs. Map DTO values into the internal/domain spelling at the app boundary.
- Update every current producer, including opening-balance and receipt fixtures, to provide `null` when a line has no external counterparty.

### 3. Integrate The Staged Persistence Contract

- Treat the staged journal-line column and generated Drizzle relation as the fixed persistence contract for this change. Do not recreate, hand-edit, or regenerate those files while implementing the remaining application work.
- Update persistence mappers so a journal header no longer reads or writes `counterpartyId`, while every journal line round-trips the already-generated `counterpartyId` column. Line history snapshots then include the new field automatically.
- Rebuild the disposable local database from the edited migration history before verification, so the persisted schema and generated Drizzle contract are exercised together.

### 4. Align Mappers, Queries, Audits, And API Shapes

- Remove `counterpartyId` from journal-entry persistence, DTO, and header audit mapping. Add it to journal-line persistence and DTO mapping so new line history diffs include the line attribution.
- Update entry retrieval to hydrate counterparties entirely through mapped lines. Update the generated Drizzle relationships from `counterparty -> journal entries` to `counterparty -> journal lines` and add the reciprocal line relation.
- Simplify `IAccountTransaction` so it inherits `counterPartyId` from `IJournalLine`; remove it from the nested header shape. Update its infrastructure and app mappers so existing account-transaction consumers receive `counterpartyId` alongside `accountId`, `side`, and `amount`.
- Preserve entry and line audit history as immutable records. Existing header history snapshots retain their historical header field; new line history snapshots contain the field. No rewrite of audit history is needed.

### 5. Cover The Relocated Behavior

- Update journal-entry entity tests to assert no header counterparty is produced, valid and invalid line UUID handling, null line values, and that a transfer with any line counterparty is rejected.
- Update journal-line entity tests to assert the field is retained in the immutable line, event payload, and audit snapshot.
- Update journal-entry service tests for multiple counterparties across a receipt's lines, deduplicated repository lookups, missing/wrong-tenant counterparties, and unchanged account/period validation ordering.
- Update mapper and account-transaction tests to prove the database column, line DTO, and query response round-trip both non-null and null values.
- Update application persistence, opening-balance, balance-propagation, and ledger use-case fixtures that currently set `counterPartyId` on the header.

## Test Plan

- **Domain unit:** `journal-entry.entity.test.ts` and `journal-line.entity.test.ts` cover ownership, syntax validation, transfer policy, line events, and audit snapshots.
- **Domain service:** `journal-entry.service.test.ts` covers multiple line counterparties, deduplication, tenant-aware lookup failures, and receipt creation.
- **Mapper unit:** journal-entry, journal-line, journal-history, and account-transaction mapper tests cover nullable and populated mappings.
- **Application/infra specs:** journal-entry persistence, opening-balance, ledger balance propagation, and account-transaction query/use-case specs cover updated contracts.
- **Schema integration:** run the focused persistence mapper tests against the staged Drizzle model and rebuild a clean local database from the edited migration history before release.

## Verification

```bash
npm test -- --runInBand src/domain/journal-entry/entities/__tests__/journal-entry.entity.test.ts src/domain/journal-entry/entities/__tests__/journal-line.entity.test.ts src/domain/journal-entry/services/__tests__/journal-entry.service.test.ts
npm test -- --runInBand src/infra/persistence/repos/journal-entry/mappers/__tests__/journal-entry.mapper.test.ts src/infra/persistence/repos/journal-entry/mappers/__tests__/journal-line.mapper.test.ts src/infra/persistence/repos/ledger/mappers/__tests__/account-transaction.mapper.test.ts
npm test -- --runInBand
npm run lint
npm run build
```

A clean-database migration check requires a configured `POSTGRES_URL` and must run only against the dedicated test database.

## Assumptions

- A journal line may legitimately have no counterparty; this remains `null`.
- Counterparties are not restricted to one side of an entry. A receipt, sale, purchase, or tax posting may attribute different debit and credit lines to different counterparties.
- The existing transfer restriction remains valid and applies to all lines of a transfer entry.
- A valid counterparty must belong to the entry's `accountingEntityId`, as enforced today by the receipt service.
- The database is pre-launch, local, and disposable; editing the existing baseline migrations is the intended rollout strategy.

## Open Decisions

- **API compatibility:** Moving `counterpartyId` from `header` to each line is a breaking response-contract change. Decide whether this ships as a single coordinated API change or needs a versioned/deprecation window. The plan assumes coordinated client deployment.

## Risks

- **Unrelated in-progress journal work:** Relevant journal service files are currently modified in the working tree. Re-read their final state before implementation and apply this plan without reverting or overwriting those changes.

## Completion Criteria

- `counterPartyId` exists on journal lines and no longer exists on the journal entry header, request header DTO, response header DTO, or header persistence model.
- A journal entry can create, persist, retrieve, emit, audit, and return lines with two or more distinct counterparties.
- Every non-null line counterparty is syntactically valid and repository validated against the entry accounting entity; transfer entries reject all non-null line counterparties.
- The remaining code reads and writes the staged journal-line foreign key, while no remaining production path accesses the removed header column.
- A clean local database rebuilt from the staged migrations has the same journal-line ownership as the generated Drizzle schema.
- Focused tests, the full test suite, lint, and build pass; unrelated working-tree changes remain untouched.
