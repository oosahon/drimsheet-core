import { TEntityId } from '../../../../shared/types/uuid';
import { AppError } from '../../../../shared/value-objects/error';
import moneyValue from '../../../../shared/value-objects/money.vo';
import { EUR, USD } from '../../../currency/config/currencies.config';
import { EExchangeRateType } from '../../../currency/types/exchange-rate.types';
import exchangeRateValue from '../../../currency/value-objects/exchange-rate.vo';
import { EJournalLineItemEvent } from '../../events/journal-line-item.events';
import { EJournalSide, UJournalSide } from '../../types/journal-line.types';
import journalLineEntity from '../journal-line.entity';

type TMakePayload = Parameters<typeof journalLineEntity.make>[1];
type TEntryPayload = Parameters<typeof journalLineEntity.make>[0];

describe('JournalLineItem Entity', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-15T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('make', () => {
    let validEntryPayload: TEntryPayload;
    let validPayload: TMakePayload;

    beforeEach(() => {
      validEntryPayload = {
        id: '2b4c10ab-5c31-419b-ab29-688001d9f8e4' as TEntityId,
        memo: 'General Memo',
        createdAt: new Date('2026-04-15T00:00:00.000Z'),
      };

      validPayload = {
        accountId: 'd571fba2-d5cb-43dc-8e6c-2f3b97b0a70f' as TEntityId,
        sequenceOrder: 1,
        amount: moneyValue.make(100.0, EUR, false),
        exchangeRate: exchangeRateValue.make({
          baseCurrencyCode: EUR.code,
          targetCurrencyCode: USD.code,
          rate: 1.1,
          type: EExchangeRateType.Official,
          asOf: new Date('2026-04-14T00:00:00.000Z'),
          source: 'Open Exchange Rates',
        }),
        side: EJournalSide.Debit,
        description: 'Line item description',
        functionalCurrency: USD,
      };
    });

    it('should successfully create a journal line item with valid inputs', () => {
      const [lineItem, events] = journalLineEntity.make(
        validEntryPayload,
        validPayload
      );

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(EJournalLineItemEvent.Created);
      expect(events[0].data).toEqual(lineItem);

      expect(typeof lineItem.id).toBe('string');
      expect(lineItem.id.length).toBeGreaterThan(0);
      expect(lineItem.entryId).toBe(validEntryPayload.id);
      expect(lineItem.accountId).toBe(validPayload.accountId);
      expect(lineItem.sequenceOrder).toBe(1);
      expect(lineItem.amount.currency).toEqual(EUR);
      expect(lineItem.exchangeRate?.rate).toBe(1.1);

      expect(lineItem.functionalAmount.currency).toEqual(USD);

      expect(lineItem.side).toBe(EJournalSide.Debit);
      expect(lineItem.description).toBe('Line item description');
      expect(lineItem.meta).toBeNull();
      expect(lineItem.createdAt).toEqual(validEntryPayload.createdAt);
      expect(lineItem.updatedAt).toEqual(validEntryPayload.createdAt);

      expect(Object.isFrozen(lineItem)).toBe(true);
    });

    it('should fall back to entry memo if payload description is missing', () => {
      const payloadWithoutDesc: TMakePayload = {
        ...validPayload,
        description: undefined,
      };

      const [lineItem] = journalLineEntity.make(
        validEntryPayload,
        payloadWithoutDesc
      );

      expect(lineItem.description).toBe('General Memo');
    });

    it('should throw an AppError if side is invalid', () => {
      const invalidPayload = {
        ...validPayload,
        side: 'invalid' as UJournalSide,
      };

      expect(() =>
        journalLineEntity.make(validEntryPayload, invalidPayload)
      ).toThrow(AppError);
    });
  });

  describe('Helpers', () => {
    describe('validateSide', () => {
      it('should not throw for valid sides', () => {
        expect(() =>
          journalLineEntity.validateSide(EJournalSide.Debit)
        ).not.toThrow();
        expect(() =>
          journalLineEntity.validateSide(EJournalSide.Credit)
        ).not.toThrow();
      });

      it('should throw an AppError for an invalid side', () => {
        expect(() =>
          journalLineEntity.validateSide('invalid' as UJournalSide)
        ).toThrow(AppError);
      });
    });

    describe('getDescription', () => {
      it('should return trimmed description', () => {
        expect(journalLineEntity.getDescription('  test desc  ')).toBe(
          'test desc'
        );
      });

      it('should throw if description is too long', () => {
        const longDesc = 'a'.repeat(101);
        expect(() => journalLineEntity.getDescription(longDesc)).toThrow(
          AppError
        );
      });
    });
  });
});
