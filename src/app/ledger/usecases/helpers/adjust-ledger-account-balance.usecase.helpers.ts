import { IReadRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';

import journalEntryError from '@domain/journal-entry/errors/journal-entry.error';
import IJournalEntryRepo from '@domain/journal-entry/repos/journal-entry.repo';
import {
  EJournalEntryStatus,
  IJournalEntry,
} from '@domain/journal-entry/types/journal-entry.types';
import ledgerAccountBalanceEntity from '@domain/ledger/entities/ledger-account-balance.entity';
import ledgerAccountEntity from '@domain/ledger/entities/ledger-account.entity';
import ILedgerAccountBalanceRepo from '@domain/ledger/repos/ledger-account-balance.repo';
import ILedgerAccountRepo from '@domain/ledger/repos/ledger-account.repo';
import ILedgerAccountBalanceAdjustmentService, {
  ILedgerAccountBalanceDelta,
} from '@domain/ledger/types/ledger-account-balance-adjustment.service.types';
import {
  ILedgerAccountBalance,
  INewLedgerAccountBalanceAndAdjustment,
} from '@domain/ledger/types/ledger-account-balance.types';

import ledgerAppError from '@app/ledger/errors/ledger.error';

interface IAdjustLedgerAccountBalanceHelperDependencies {
  journalEntryRepo: IJournalEntryRepo;
  ledgerAccountRepo: ILedgerAccountRepo;
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo;
  ledgerAccountBalanceAdjustmentService: ILedgerAccountBalanceAdjustmentService;
}

interface IBalancePropagation {
  journalEntry: IJournalEntry;
  balanceDeltas: ILedgerAccountBalanceDelta[];
  ledgerAccountIds: TEntityId[];
}

interface IPreparedBalanceAdjustment {
  balanceAdjustment: INewLedgerAccountBalanceAndAdjustment;
  expectedVersion: number;
}

/**
 * Prepares the complete balance propagation from the posted journal.
 *
 * Resolves the journal's directly affected accounts and their ancestors, then
 * calculates one aggregated delta per account. Deltas and account IDs are
 * returned in account-ID order so the use case processes them consistently.
 */
async function prepareBalancePropagation(
  deps: IAdjustLedgerAccountBalanceHelperDependencies,
  journalEntryId: TEntityId,
  repoOptions: IReadRepoOptions
): Promise<IBalancePropagation> {
  const journalEntry = await deps.journalEntryRepo.findById(
    journalEntryId,
    repoOptions
  );

  if (journalEntry?.status !== EJournalEntryStatus.Posted) {
    throw new journalEntryError.InvalidJournalEntry({ journalEntryId });
  }

  const directAccountIds = Array.from(
    new Set(journalEntry.lines.map((line) => line.accountId))
  );

  const directAccountsPage = await deps.ledgerAccountRepo.findAll(
    journalEntry.accountingEntityId,
    {
      ...repoOptions,
      ids: directAccountIds,
      limit: directAccountIds.length,
    }
  );

  const materializedPaths = ledgerAccountEntity.getRequiredMaterializedPaths(
    directAccountsPage.data
  );
  const accounts = await deps.ledgerAccountRepo.findAllByMaterializedPath(
    journalEntry.accountingEntityId,
    materializedPaths,
    repoOptions
  );

  const balanceDeltas = deps.ledgerAccountBalanceAdjustmentService.calculate(
    journalEntry,
    accounts
  );
  const orderedBalanceDeltas = [...balanceDeltas];
  orderedBalanceDeltas.sort((left, right) =>
    left.ledgerAccountId.localeCompare(right.ledgerAccountId)
  );

  const ledgerAccountIds = orderedBalanceDeltas.map(
    (balanceDelta) => balanceDelta.ledgerAccountId
  );

  return {
    journalEntry,
    balanceDeltas: orderedBalanceDeltas,
    ledgerAccountIds,
  };
}

/**
 * Applies calculated deltas to the current balance entities in memory.
 *
 * Each prepared write includes the balance version that was read so the
 * repository can enforce optimistic concurrency. Missing required balances
 * fail preparation before any adjustment is persisted.
 */
function prepareBalanceAdjustments(
  propagation: IBalancePropagation,
  balances: ILedgerAccountBalance[]
): IPreparedBalanceAdjustment[] {
  const { journalEntry, balanceDeltas, ledgerAccountIds } = propagation;
  const balancesByAccountId = new Map(
    balances.map((balance) => [balance.ledgerAccountId, balance])
  );

  if (balancesByAccountId.size !== ledgerAccountIds.length) {
    throw new ledgerAppError.BalanceNotFound();
  }

  const preparedAdjustments: IPreparedBalanceAdjustment[] = [];

  for (const balanceDelta of balanceDeltas) {
    const existingBalance = balancesByAccountId.get(
      balanceDelta.ledgerAccountId
    );

    if (!existingBalance) {
      throw new ledgerAppError.BalanceNotFound();
    }

    const balanceAdjustment = ledgerAccountBalanceEntity.adjust(
      existingBalance,
      {
        ledgerAccountId: balanceDelta.ledgerAccountId,
        amount: balanceDelta.amount,
        functionalAmount: balanceDelta.functionalAmount,
        journalEntryId: journalEntry.id,
        createdBy: journalEntry.createdBy,
      }
    );

    preparedAdjustments.push({
      balanceAdjustment,
      expectedVersion: existingBalance.version,
    });
  }

  return preparedAdjustments;
}

const adjustLedgerAccountBalanceUseCaseHelpers = Object.freeze({
  prepareBalancePropagation,
  prepareBalanceAdjustments,
});

export default adjustLedgerAccountBalanceUseCaseHelpers;
