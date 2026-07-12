import { InferSelectModel } from 'drizzle-orm';
import { IJournalLineDto } from '../../../../app/journal-entry/dtos/journal-entry.dto';
import {
  IJournalLine,
  IJournalLineMeta,
} from '../../../../domain/journal-entry/types/journal-line.types';
import { TEntityId } from '../../../../shared/types/uuid';
import { journalLinesInCore } from '../../../config/drizzle/schema';
import exchangeRateMapper, {
  IExchangeRateModel,
} from '../currency/exchange-rate.mapper';
import { fromRepoDate, toRepoDate } from '../shared/date';
import moneyMapper from '../shared/money.mapper';

export interface IJournalLineModel extends InferSelectModel<
  typeof journalLinesInCore
> {}

const journalLineMapper = {
  toDomain(payload: IJournalLineModel): IJournalLine {
    return {
      id: payload.id as TEntityId,
      entryId: payload.entryId as TEntityId,
      accountId: payload.accountId as TEntityId,
      sequenceOrder: payload.sequenceOrder,
      amount: moneyMapper.fromRepo(payload.amount, payload.currencyCode),
      exchangeRate: payload.exchangeRate
        ? exchangeRateMapper.toDomain(
            payload.exchangeRate as IExchangeRateModel
          )
        : null,
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

  toRepo(payload: IJournalLine): IJournalLineModel {
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

  toDto(payload: IJournalLine): IJournalLineDto {
    return {
      id: payload.id,
      entryId: payload.entryId,
      accountId: payload.accountId,
      sequenceOrder: payload.sequenceOrder,
      amount: moneyMapper.toDto(payload.amount),
      exchangeRate: payload.exchangeRate,
      functionalAmount: moneyMapper.toDto(payload.functionalAmount),
      side: payload.side,
      description: payload.description,
      version: payload.version,
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
    };
  },
};

export default journalLineMapper;
