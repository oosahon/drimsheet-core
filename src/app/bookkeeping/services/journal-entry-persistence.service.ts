import IJournalEntryRepo from '../../../domain/journal-entry/repos/journal-entry.repo';
import IJournalLineRepo from '../../../domain/journal-entry/repos/journal-line.repo';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../../shared/contracts/repo.contract';
import IReporter from '../../../shared/contracts/reporter.contract';
import IJournalEntryPersistenceService from '../contracts/journal-entry-persistence.service.contract';
import { ILedgerAccountBalancePropagationService } from '../contracts/ledger-account-balance-adjustment-service.contract';

export default function makeJournalEntryPersistenceService(
  repoService: IRepoService,
  journalEntryRepo: IJournalEntryRepo,
  journalLineRepo: IJournalLineRepo,
  balancePropagationService: ILedgerAccountBalancePropagationService,
  reporter: IReporter
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
      };

      await repoService.runInTransaction(transactionFn, repoOptions.tx);

      // This should not cause the journal entry creation to fail.
      // We can simply run the propagation manually IF it does fail for some reason.
      await balancePropagationService
        .propagate(entry, repoOptions)
        .catch(reporter.report);
    },
  };
}
