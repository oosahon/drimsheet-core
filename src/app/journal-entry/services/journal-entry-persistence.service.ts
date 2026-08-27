import {
  IRepoService,
  TRepoTransactionFn,
} from '@shared/contracts/repo.contract';

import IJournalEntryAttachmentRepo from '@domain/journal-entry/repos/journal-entry-attachment.repo';
import IJournalEntryRepo from '@domain/journal-entry/repos/journal-entry.repo';
import IJournalLineRepo from '@domain/journal-entry/repos/journal-line.repo';

import IJournalEntryPersistenceService from '@app/journal-entry/contracts/journal-entry-persistence.service.contract';

interface IDependencies {
  repoService: IRepoService;
  journalEntryAttachmentRepo: IJournalEntryAttachmentRepo;
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
      const { lines, attachments, ...header } = entry;

      await deps.journalEntryRepo.create(header, {
        ...writeOptions,
        history: headerHistory,
      });

      await deps.journalLineRepo.create(lines, {
        ...writeOptions,
        history: linesHistory,
        accountingEntityId: header.accountingEntityId,
      });

      if (attachments.length) {
        await deps.journalEntryAttachmentRepo.save(
          entry.id,
          attachments,
          writeOptions
        );
      }
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
