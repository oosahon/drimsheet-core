import { IRepoService } from '../../../app/shared/contracts/repo.contract';
import historyValue from '../../../shared/value-objects/history.vo';
import IJournalEntryHistoryRepo from '../repos/journal-entry-history.repo';
import IJournalEntryRepo from '../repos/journal-entry.repo';
import IJournalLineHistoryRepo from '../repos/journal-line-history.repo';
import IJournalLineRepo from '../repos/journal-line.repo';
import IJournalEntryPersistenceService from '../types/journal-entry-persistence.service.types';

interface IJournalEntryPersistenceRepos {
  journalEntry: IJournalEntryRepo;
  journalEntryHistory: IJournalEntryHistoryRepo;
  journalLine: IJournalLineRepo;
  journalLineHistory: IJournalLineHistoryRepo;
}

export default function makeJournalEntryPersistenceService(
  repos: IJournalEntryPersistenceRepos,
  repoService: IRepoService
): IJournalEntryPersistenceService {
  const save: IJournalEntryPersistenceService['save'] = async (
    entry,
    audit,
    actor,
    options
  ) => {
    const write = async (writeOptions: typeof options) => {
      const { lines, ...header } = entry;
      const headerHistory = historyValue.make(
        audit.header,
        actor,
        writeOptions.correlationId
      );
      const lineHistories = audit.lines.map((lineAudit) =>
        historyValue.make(lineAudit, actor, writeOptions.correlationId)
      );

      await repos.journalEntry.save(header, writeOptions);
      await repos.journalLine.save(lines, writeOptions);
      await repos.journalEntryHistory.save(header, headerHistory, writeOptions);
      await repos.journalLineHistory.save(
        lines,
        lineHistories,
        header.accountingEntityId,
        writeOptions
      );
    };

    if (options.tx) {
      await write(options);
      return;
    }

    await repoService.runInTransaction(async (tx) => {
      await write({ ...options, tx });
    });
  };

  return Object.freeze({
    save,
  });
}
