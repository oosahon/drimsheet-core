import { InferSelectModel } from 'drizzle-orm';
import { IJournalEntry } from '../../domain/journal-entry/types/journal-entry.types';
import {
  IJournalLine,
  IJournalLineMeta,
} from '../../domain/journal-entry/types/journal-line.types';
import {
  journalEntriesInCore,
  journalLinesInCore,
} from '../../infra/config/drizzle/schema';
import { TEntityId } from '../../shared/types/uuid';
import { fromRepoDate, toRepoDate } from './date';
import exchangeRateMapper, { IExchangeRateModel } from './exchange-rate.mapper';
import moneyMapper from './money.mapper';

export interface IJournalEntryModel extends InferSelectModel<
  typeof journalEntriesInCore
> {}

export interface IJournalEntrySelectModel extends IJournalEntryModel {
  journalLinesInCores: IJournalLineModel[];
}

export interface IJournalLineModel extends InferSelectModel<
  typeof journalLinesInCore
> {}

const journalEntryMapper = {
  toDomainEntry(payload: IJournalEntrySelectModel): IJournalEntry {
    return {
      id: payload.id as TEntityId,
      accountingEntityId: payload.accountingEntityId as TEntityId,
      transactionId: payload.transactionId as TEntityId,
      memo: payload.memo,
      status: payload.status,
      lines: payload.journalLinesInCores.map((line) => this.toDomainLine(line)),
      effectiveDate: fromRepoDate(payload.effectiveDate),
      postedAt: payload.postedAt ? fromRepoDate(payload.postedAt) : null,
      voidedAt: payload.voidedAt ? fromRepoDate(payload.voidedAt) : null,
      voidingEntryId: payload.voidingEntryId as TEntityId,
      version: payload.version,
      createdBy: payload.createdBy as TEntityId,
      createdAt: fromRepoDate(payload.createdAt),
      updatedAt: fromRepoDate(payload.updatedAt),
    };
  },

  toDomainLine(payload: IJournalLineModel): IJournalLine {
    return {
      id: payload.id as TEntityId,
      entryId: payload.entryId as TEntityId,
      accountId: payload.accountId as TEntityId,
      sequenceOrder: payload.sequenceOrder,
      amount: moneyMapper.fromRepo(payload.amount, payload.currencyCode),
      exchangeRate: exchangeRateMapper.toDomain(
        payload.exchangeRate as IExchangeRateModel
      ),
      functionalAmount: moneyMapper.fromRepo(
        payload.functionalAmount,
        payload.functionalCurrencyCode
      ),
      side: payload.side,
      description: payload.description,
      meta: payload.meta as IJournalLineMeta,
      version: payload.version,
      createdAt: fromRepoDate(payload.createdAt),
      updatedAt: fromRepoDate(payload.updatedAt),
    };
  },

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
      createdBy: payload.createdBy,
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
      functionalCurrencyCode: payload.functionalAmount.currency.code,
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
