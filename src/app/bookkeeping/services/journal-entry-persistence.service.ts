import IJournalEntryRepo from '../../../domain/journal-entry/repos/journal-entry.repo';
import IJournalLineRepo from '../../../domain/journal-entry/repos/journal-line.repo';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../../shared/contracts/repo.contract';
import IJournalEntryPersistenceService from '../contracts/journal-entry-persistence.service.contract';

interface IDependencies {
  repoService: IRepoService;
  journalEntryRepo: IJournalEntryRepo;
  journalLineRepo: IJournalLineRepo;
}

export default function makeJournalEntryPersistenceService(
  deps: IDependencies
): IJournalEntryPersistenceService {
  return {
    async create(entry, headerHistory, linesHistory, repoOptions) {
      const transactionFn: TRepoTransactionFn = async (tx) => {
        const writeOptions = { ...repoOptions, tx };
        const { lines, ...header } = entry;

        await deps.journalEntryRepo.create(header, {
          ...writeOptions,
          history: headerHistory,
        });

        await deps.journalLineRepo.create(lines, {
          ...writeOptions,
          history: linesHistory,
          accountingEntityId: header.accountingEntityId,
        });
      };

      await deps.repoService.runInTransaction(transactionFn, repoOptions.tx);
    },
  };
}
