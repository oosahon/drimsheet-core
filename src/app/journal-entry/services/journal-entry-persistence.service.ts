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

/**
  Creates a new journal line and header in the persistence layer.
  Ensures there are no invariance.
 */

function makeCreate(
  deps: IDependencies
): IJournalEntryPersistenceService['create'] {
  return async (entry, headerHistory, linesHistory, repoOptions) => {
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
  };
}

export default function makeJournalEntryPersistenceService(
  deps: IDependencies
) {
  const service: IJournalEntryPersistenceService = Object.freeze({
    create: makeCreate(deps),
  });

  return service;
}
