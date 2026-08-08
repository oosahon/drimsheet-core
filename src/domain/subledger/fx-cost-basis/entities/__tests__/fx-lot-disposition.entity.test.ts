import { TCreationOmits } from '@shared/types/creation-omits.types';
import generateUUID from '@shared/utils/uuid-generator';

import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';
import {
  EExchangeRateType,
  IExchangeRate,
} from '@domain/money/types/exchange-rate.types';
import moneyValue from '@domain/money/values/money.vo';
import fxCostBasisLotDispositionEntity from '@domain/subledger/fx-cost-basis/entities/disposition.entity';
import fxCostBasisLotDispositionError from '@domain/subledger/fx-cost-basis/errors/disposition.error';
import { EFxCostBasisLotDispositionEvent } from '@domain/subledger/fx-cost-basis/events/disposition.events';
import {
  EFxCostBasisLotDispositionAuditAction,
  IFxCostBasisLotDisposition,
} from '@domain/subledger/fx-cost-basis/types/disposition.types';

describe('fxCostBasisLotDispositionEntity', () => {
  const MOCK_DATE = new Date('2026-04-01T00:00:00.000Z');
  let dispositionRate: IExchangeRate;
  let officialRate: IExchangeRate;
  let validPayload: TCreationOmits<IFxCostBasisLotDisposition>;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(MOCK_DATE);

    dispositionRate = {
      currencyPair: 'USD/NGN',
      baseCurrencyCode: 'USD',
      targetCurrencyCode: 'NGN',
      rate: 1500,
      type: EExchangeRateType.Negotiated,
      asOf: new Date('2026-03-31T00:00:00.000Z'),
      source: 'bank',
      createdAt: new Date('2026-03-31T00:00:00.000Z'),
    };

    officialRate = {
      currencyPair: 'USD/NGN',
      baseCurrencyCode: 'USD',
      targetCurrencyCode: 'NGN',
      rate: 1490,
      type: EExchangeRateType.Official,
      asOf: new Date('2026-03-31T00:00:00.000Z'),
      source: 'central bank',
      createdAt: new Date('2026-03-31T00:00:00.000Z'),
    };

    validPayload = {
      ledgerAccountId: generateUUID(),
      accountingEntityId: generateUUID(),
      journalEntryId: generateUUID(),
      quantity: moneyValue.make(100, SYSTEM_CURRENCIES.USD, false),
      costBasisConsumed: moneyValue.make(150000, SYSTEM_CURRENCIES.NGN, false),
      proceeds: moneyValue.make(160000, SYSTEM_CURRENCIES.NGN, false),
      realizedGainLoss: moneyValue.make(10000, SYSTEM_CURRENCIES.NGN, false),
      dispositionRate,
      officialRate,
      dispositionDate: new Date('2026-03-31T00:00:00.000Z'),
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('make', () => {
    it('creates a validated fx lot disposition with event and audit', () => {
      const [entity, events, audit] =
        fxCostBasisLotDispositionEntity.make(validPayload);

      expect(entity.id).toBeDefined();
      expect(entity.ledgerAccountId).toBe(validPayload.ledgerAccountId);
      expect(entity.accountingEntityId).toBe(validPayload.accountingEntityId);
      expect(entity.journalEntryId).toBe(validPayload.journalEntryId);
      expect(entity.quantity).toBe(validPayload.quantity);
      expect(entity.costBasisConsumed).toBe(validPayload.costBasisConsumed);
      expect(entity.proceeds).toBe(validPayload.proceeds);
      expect(entity.realizedGainLoss).toBe(validPayload.realizedGainLoss);
      expect(entity.dispositionRate).toBe(validPayload.dispositionRate);
      expect(entity.officialRate).toBe(validPayload.officialRate);
      expect(entity.dispositionDate).toBe(validPayload.dispositionDate);
      expect(entity.createdAt).toEqual(MOCK_DATE);
      expect(Object.isFrozen(entity)).toBe(true);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(EFxCostBasisLotDispositionEvent.Created);
      expect(events[0].data).toEqual(entity);
      expect(events[0].occurredAt).toEqual(MOCK_DATE);

      expect(audit).toEqual({
        entityId: entity.id,
        action: EFxCostBasisLotDispositionAuditAction.Created,
        diff: {
          before: null,
          after: entity,
        },
        occurredAt: entity.createdAt,
      });
      expect(Object.isFrozen(audit)).toBe(true);
    });

    it('allows nullable official rate fields', () => {
      const [entity] = fxCostBasisLotDispositionEntity.make({
        ...validPayload,
        officialRate: null,
      });

      expect(entity.journalEntryId).toBe(validPayload.journalEntryId);
      expect(entity.officialRate).toBeNull();
    });

    it('throws when ledger account id validation fails', () => {
      const invalidPayload = {
        ...validPayload,
        ledgerAccountId: 'invalid-id',
      };

      expect(() =>
        // @ts-expect-error testing invalid ledger account id
        fxCostBasisLotDispositionEntity.make(invalidPayload)
      ).toThrow(fxCostBasisLotDispositionError.InvalidLedgerAccountId);
    });

    it('throws when accounting entity id validation fails', () => {
      const invalidPayload = {
        ...validPayload,
        accountingEntityId: 'invalid-id',
      };

      expect(() =>
        // @ts-expect-error testing invalid accounting entity id
        fxCostBasisLotDispositionEntity.make(invalidPayload)
      ).toThrow(fxCostBasisLotDispositionError.InvalidAccountingEntityId);
    });

    it('throws when journal entry id validation fails', () => {
      const invalidPayload = {
        ...validPayload,
        journalEntryId: 'invalid-id',
      };

      expect(() =>
        // @ts-expect-error testing invalid journal entry id
        fxCostBasisLotDispositionEntity.make(invalidPayload)
      ).toThrow(fxCostBasisLotDispositionError.InvalidJournalEntryId);
    });

    it('throws when disposition rate validation fails', () => {
      expect(() =>
        fxCostBasisLotDispositionEntity.make({
          ...validPayload,
          dispositionRate: {
            ...validPayload.dispositionRate,
            rate: -1,
          },
        })
      ).toThrow();
    });

    it('throws when disposition date is in the future', () => {
      expect(() =>
        fxCostBasisLotDispositionEntity.make({
          ...validPayload,
          dispositionDate: new Date('2026-04-02T00:00:00.000Z'),
        })
      ).toThrow(fxCostBasisLotDispositionError.InvalidDispositionDate);
    });
  });

  describe('helpers', () => {
    it('validates money shape', () => {
      expect(
        fxCostBasisLotDispositionEntity.isValidMoney(validPayload.quantity)
      ).toBe(true);
      expect(
        fxCostBasisLotDispositionEntity.isValidMoney({
          amount: 100n,
          currency: { ...SYSTEM_CURRENCIES.USD, code: 'INVALID' },
        })
      ).toBe(false);
    });

    it('validates quantity', () => {
      expect(() =>
        fxCostBasisLotDispositionEntity.validateQuantity(validPayload.quantity)
      ).not.toThrow();
      expect(() =>
        fxCostBasisLotDispositionEntity.validateQuantity(
          moneyValue.make(0, SYSTEM_CURRENCIES.USD, false)
        )
      ).toThrow(fxCostBasisLotDispositionError.InvalidQuantity);
    });

    it('validates cost basis consumed', () => {
      expect(() =>
        fxCostBasisLotDispositionEntity.validateCostBasisConsumed(
          validPayload.costBasisConsumed
        )
      ).not.toThrow();
      expect(() =>
        fxCostBasisLotDispositionEntity.validateCostBasisConsumed(
          moneyValue.make(0, SYSTEM_CURRENCIES.NGN, false)
        )
      ).toThrow(fxCostBasisLotDispositionError.InvalidCostBasisConsumed);
    });

    it('validates proceeds', () => {
      expect(() =>
        fxCostBasisLotDispositionEntity.validateProceeds(validPayload.proceeds)
      ).not.toThrow();
      expect(() =>
        fxCostBasisLotDispositionEntity.validateProceeds(
          moneyValue.make(0, SYSTEM_CURRENCIES.NGN, false)
        )
      ).toThrow(fxCostBasisLotDispositionError.InvalidProceeds);
    });

    it('validates realized gain loss', () => {
      expect(() =>
        fxCostBasisLotDispositionEntity.validateRealizedGainLoss(
          validPayload.realizedGainLoss
        )
      ).not.toThrow();
      expect(() =>
        fxCostBasisLotDispositionEntity.validateRealizedGainLoss({
          amount: 100n,
        })
      ).toThrow(fxCostBasisLotDispositionError.InvalidRealizedGainLoss);
    });

    it('validates official rate', () => {
      expect(() =>
        fxCostBasisLotDispositionEntity.validateOfficialRate(officialRate)
      ).not.toThrow();
      expect(() =>
        fxCostBasisLotDispositionEntity.validateOfficialRate(null)
      ).not.toThrow();
      expect(() =>
        fxCostBasisLotDispositionEntity.validateOfficialRate({
          ...officialRate,
          rate: -1,
        })
      ).toThrow();
    });
  });
});
