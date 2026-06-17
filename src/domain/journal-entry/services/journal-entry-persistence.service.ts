import { IRepoService } from '../../../shared/contracts/repo.contract';
import IJournalEntryRepo from '../repos/journal-entry.repo';
import IJournalLineRepo from '../repos/journal-line.repo';
import IService from '../types/journal-entry-persistence.service.types';

interface IJournalEntryPersistenceRepos {
  journalEntry: IJournalEntryRepo;
  journalLine: IJournalLineRepo;
}

export default function makeJournalEntryPersistenceService(
  repoService: IRepoService,
  repos: IJournalEntryPersistenceRepos
): IService {
  const create: IService['create'] = async (
    entry,
    headerHistory,
    linesHistory,
    repoOptions
  ) => {
    await repoService.runInTransaction(async (tx) => {
      const writeOptions = { ...repoOptions, tx };
      const { lines, ...header } = entry;

      await repos.journalEntry.create(header, {
        ...writeOptions,
        history: headerHistory,
      });

      await repos.journalLine.create(lines, {
        ...writeOptions,
        history: linesHistory,
        accountingEntityId: header.accountingEntityId,
      });
    });
  };

  return Object.freeze({ create });
}
