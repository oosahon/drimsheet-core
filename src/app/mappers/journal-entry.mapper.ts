import { InferSelectModel } from 'drizzle-orm';
import { IJournalEntry } from '../../domain/journal-entry/types/journal-entry.types';
import { IJournalLine } from '../../domain/journal-entry/types/journal-line.types';
import {
  journalEntriesInCore,
  journalLinesInCore,
} from '../../infra/persistence/drizzle/schema';
import { toRepoDate } from './date';
import moneyMapper from './money.mapper';

export interface IJournalEntryModel extends InferSelectModel<
  typeof journalEntriesInCore
> {}

export interface IJournalLineModel extends InferSelectModel<
  typeof journalLinesInCore
> {}

const journalEntryMapper = {
  toRepoEntry(payload: IJournalEntry): IJournalEntryModel {
    return {
      id: payload.id,
      accountingEntityId: payload.accountingEntityId,
      transactionId: payload.transactionId,
      memo: payload.memo,
      status: payload.status,
      effectiveDate: toRepoDate(payload.effectiveDate),
      postedAt: payload.postedAt ? toRepoDate(payload.postedAt) : null,
      voidedAt: payload.voidedAt ? toRepoDate(payload.voidedAt) : null,
      voidingEntryId: payload.voidingEntryId,
      version: payload.version,
      createdAt: toRepoDate(payload.createdAt),
      updatedAt: toRepoDate(payload.updatedAt),
    };
  },

  toRepoLine(payload: IJournalLine): IJournalLineModel {
    return {
      id: payload.id,
      entryId: payload.entryId,
      accountId: payload.accountId,
      sequenceOrder: payload.sequenceOrder,
      ...moneyMapper.toRepo(payload.amount),
      exchangeRate: payload.exchangeRate,
      functionalAmount: moneyMapper.toRepo(payload.functionalAmount).amount,
      side: payload.side,
      description: payload.description,
      meta: payload.meta,
      version: payload.version,
      createdAt: toRepoDate(payload.createdAt),
      updatedAt: toRepoDate(payload.updatedAt),
    };
  },
};

export default journalEntryMapper;
