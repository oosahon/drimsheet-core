import IJournalEntryRepo from '../../../domain/journal-entry/repos/journal-entry.repo';
import IJournalLineRepo from '../../../domain/journal-entry/repos/journal-line.repo';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../../shared/contracts/repo.contract';
import IJournalEntryPersistenceService from '../contracts/journal-entry-persistence.service.contract';
import { ILedgerAccountBalancePropagationService } from '../contracts/ledger-account-balance-adjustment-service.contract';

export default function makeJournalEntryPersistenceService(
  repoService: IRepoService,
  journalEntryRepo: IJournalEntryRepo,
  journalLineRepo: IJournalLineRepo,
  balancePropagationService: ILedgerAccountBalancePropagationService
): IJournalEntryPersistenceService {
  return {
    async create(entry, headerHistory, linesHistory, repoOptions) {
      const transactionFn: TRepoTransactionFn = async (tx) => {
        const writeOptions = { ...repoOptions, tx };
        const { lines, ...header } = entry;

        await journalEntryRepo.create(header, {
          ...writeOptions,
          history: headerHistory,
        });

        await journalLineRepo.create(lines, {
          ...writeOptions,
          history: linesHistory,
          accountingEntityId: header.accountingEntityId,
        });

        await balancePropagationService.propagate(entry, writeOptions);
      };

      await repoService.runInTransaction(transactionFn, repoOptions.tx);
    },
  };
}
