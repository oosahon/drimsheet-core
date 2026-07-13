import {
  EJournalSide,
  IJournalLine,
} from '../../../../../domain/journal-entry/types/journal-line.types';
import { SYSTEM_CURRENCIES } from '../../../../../domain/money/config/currencies.config';
import { EExchangeRateType } from '../../../../../domain/money/types/exchange-rate.types';
import moneyValue from '../../../../../domain/money/values/money.vo';
import { TEntityId } from '../../../../../shared/types/uuid';
import { IExchangeRateModel } from '../../money/exchange-rate.mapper';
import journalLineMapper, { IJournalLineModel } from '../journal-line.mapper';

describe('Journal Line Mapper', () => {
  const createdAt = new Date('2026-05-01T00:00:00.000Z');
  const updatedAt = new Date('2026-05-01T01:00:00.000Z');
  const exchangeRateCreatedAt = new Date('2026-04-30T00:00:00.000Z');
  const exchangeRateAsOf = new Date('2026-04-30T00:00:00.000Z');
  const id = '123e4567-e89b-12d3-a456-426614174001' as TEntityId;
  const entryId = '123e4567-e89b-12d3-a456-426614174002' as TEntityId;
  const accountId = '123e4567-e89b-12d3-a456-426614174003' as TEntityId;
  const amount = moneyValue.make(100_00, SYSTEM_CURRENCIES.USD, true);
  const functionalAmount = moneyValue.make(
    150_000_00,
    SYSTEM_CURRENCIES.NGN,
    true
  );

  const exchangeRateModel: IExchangeRateModel = {
    id: 1n,
    currencyPair: 'USDNGN',
    baseCurrencyCode: 'USD',
    targetCurrencyCode: 'NGN',
    rate: '1500',
    type: EExchangeRateType.Official,
    asOf: exchangeRateAsOf.toISOString(),
    source: 'Central Bank',
    createdAt: exchangeRateCreatedAt.toISOString(),
  };

  const line: IJournalLine = {
    id,
    entryId,
    accountId,
    sequenceOrder: 1,
    amount,
    exchangeRate: {
      currencyPair: 'USDNGN',
      baseCurrencyCode: 'USD',
      targetCurrencyCode: 'NGN',
      rate: 1500,
      type: EExchangeRateType.Official,
      asOf: exchangeRateAsOf,
      source: 'Central Bank',
      createdAt: exchangeRateCreatedAt,
    },
    functionalAmount,
    side: EJournalSide.Debit,
    description: 'Line description',
    meta: { imported: true },
    version: 1,
    createdAt,
    updatedAt,
  };

  const model: IJournalLineModel = {
    id,
    entryId,
    accountId,
    sequenceOrder: 1,
    amount: 100_00,
    currencyCode: SYSTEM_CURRENCIES.USD.code,
    exchangeRate: exchangeRateModel,
    functionalAmount: 150_000_00,
    functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
    side: EJournalSide.Debit,
    description: 'Line description',
    meta: { imported: true },
    version: 1,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };

  describe('toDomain', () => {
    it('maps a journal line repo model with an exchange rate to domain', () => {
      expect(journalLineMapper.toDomain(model)).toEqual(line);
    });

    it('maps a journal line repo model without an exchange rate to domain', () => {
      expect(
        journalLineMapper.toDomain({
          ...model,
          exchangeRate: null,
          description: null,
          meta: null,
        })
      ).toEqual({
        ...line,
        exchangeRate: null,
        description: null,
        meta: null,
      });
    });
  });

  describe('toRepo', () => {
    it('maps a journal line to a repo model', () => {
      expect(journalLineMapper.toRepo(line)).toEqual({
        id,
        entryId,
        accountId,
        sequenceOrder: 1,
        amount: 100_00,
        currencyCode: SYSTEM_CURRENCIES.USD.code,
        exchangeRate: line.exchangeRate,
        functionalAmount: 150_000_00,
        functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
        side: EJournalSide.Debit,
        description: 'Line description',
        meta: { imported: true },
        version: 1,
        createdAt: createdAt.toISOString(),
        updatedAt: updatedAt.toISOString(),
      });
    });
  });

  describe('toDto', () => {
    it('maps a journal line to a DTO', () => {
      expect(journalLineMapper.toDto(line)).toEqual({
        id,
        entryId,
        accountId,
        sequenceOrder: 1,
        amount: {
          amount: 100_00,
          currencyCode: SYSTEM_CURRENCIES.USD.code,
          isMinorUnit: true,
        },
        exchangeRate: line.exchangeRate,
        functionalAmount: {
          amount: 150_000_00,
          currencyCode: SYSTEM_CURRENCIES.NGN.code,
          isMinorUnit: true,
        },
        side: EJournalSide.Debit,
        description: 'Line description',
        version: 1,
        createdAt,
        updatedAt,
      });
    });
  });
});
