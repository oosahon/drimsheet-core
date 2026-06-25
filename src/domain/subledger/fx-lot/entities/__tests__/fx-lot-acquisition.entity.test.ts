import { TCreationOmits } from '../../../../../shared/types/creation-omits.types';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import moneyValue from '../../../../../shared/value-objects/money.vo';
import { SYSTEM_CURRENCIES } from '../../../../currency/config/currencies.config';
import {
  EExchangeRateType,
  IExchangeRate,
} from '../../../../currency/types/exchange-rate.types';
import fxLotAcquisitionError from '../../errors/fx-lot-acquisition.error';
import { EFxLotAcquisitionEvent } from '../../events/fx-lot-acquisition.events';
import { EFxLotAcquisitionAuditAction } from '../../types/fx-lot-audit.types';
import { IFxLotAcquisition } from '../../types/fx-lot.types';
import fxLotAcquisitionEntity from '../fx-lot-acquisition.entity';

describe('fxLotAcquisitionEntity', () => {
  const MOCK_DATE = new Date('2026-04-01T00:00:00.000Z');
  let acquisitionRate: IExchangeRate;
  let officialRate: IExchangeRate;
  let validPayload: TCreationOmits<IFxLotAcquisition>;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(MOCK_DATE);

    acquisitionRate = {
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
      lotId: generateUUID(),
      journalEntryId: generateUUID(),
      quantity: moneyValue.make(100, SYSTEM_CURRENCIES.USD, false),
      costBasis: moneyValue.make(150000, SYSTEM_CURRENCIES.NGN, false),
      acquisitionRate,
      officialRate,
      officialRateId: 1,
      acquisitionDate: new Date('2026-03-31T00:00:00.000Z'),
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('make', () => {
    it('creates a validated fx lot acquisition with event and audit', () => {
      const [entity, events, audit] = fxLotAcquisitionEntity.make(validPayload);

      expect(entity.id).toBeDefined();
      expect(entity.ledgerAccountId).toBe(validPayload.ledgerAccountId);
      expect(entity.accountingEntityId).toBe(validPayload.accountingEntityId);
      expect(entity.lotId).toBe(validPayload.lotId);
      expect(entity.journalEntryId).toBe(validPayload.journalEntryId);
      expect(entity.quantity).toBe(validPayload.quantity);
      expect(entity.costBasis).toBe(validPayload.costBasis);
      expect(entity.acquisitionRate).toBe(validPayload.acquisitionRate);
      expect(entity.officialRate).toBe(validPayload.officialRate);
      expect(entity.officialRateId).toBe(validPayload.officialRateId);
      expect(entity.acquisitionDate).toBe(validPayload.acquisitionDate);
      expect(entity.createdAt).toEqual(MOCK_DATE);
      expect(Object.isFrozen(entity)).toBe(true);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(EFxLotAcquisitionEvent.Created);
      expect(events[0].data).toEqual(entity);
      expect(events[0].occurredAt).toEqual(MOCK_DATE);

      expect(audit).toEqual({
        entityId: entity.id,
        action: EFxLotAcquisitionAuditAction.Created,
        diff: {
          before: null,
          after: entity,
        },
        occurredAt: entity.createdAt,
      });
      expect(Object.isFrozen(audit)).toBe(true);
    });

    it('allows nullable official rate fields', () => {
      const [entity] = fxLotAcquisitionEntity.make({
        ...validPayload,
        officialRate: null,
        officialRateId: null,
      });

      expect(entity.journalEntryId).toBe(validPayload.journalEntryId);
      expect(entity.officialRate).toBeNull();
      expect(entity.officialRateId).toBeNull();
    });

    it('throws when id validation fails', () => {
      const invalidPayload = {
        ...validPayload,
        lotId: 'invalid-id',
      };

      expect(() =>
        // @ts-expect-error testing invalid lot id
        fxLotAcquisitionEntity.make(invalidPayload)
      ).toThrow(fxLotAcquisitionError.InvalidLotId);
    });

    it('throws when journal entry id validation fails', () => {
      const invalidPayload = {
        ...validPayload,
        journalEntryId: 'invalid-id',
      };

      expect(() =>
        // @ts-expect-error testing invalid journal entry id
        fxLotAcquisitionEntity.make(invalidPayload)
      ).toThrow(fxLotAcquisitionError.InvalidJournalEntryId);
    });

    it('throws when acquisition rate validation fails', () => {
      expect(() =>
        fxLotAcquisitionEntity.make({
          ...validPayload,
          acquisitionRate: {
            ...validPayload.acquisitionRate,
            rate: -1,
          },
        })
      ).toThrow();
    });

    it('throws when acquisition date is in the future', () => {
      expect(() =>
        fxLotAcquisitionEntity.make({
          ...validPayload,
          acquisitionDate: new Date('2026-04-02T00:00:00.000Z'),
        })
      ).toThrow(fxLotAcquisitionError.InvalidAcquisitionDate);
    });
  });

  describe('helpers', () => {
    it('validates money shape', () => {
      expect(fxLotAcquisitionEntity.isValidMoney(validPayload.quantity)).toBe(
        true
      );
      expect(
        fxLotAcquisitionEntity.isValidMoney({
          amount: 100n,
          currency: { ...SYSTEM_CURRENCIES.USD, code: 'INVALID' },
        })
      ).toBe(false);
    });

    it('validates quantity', () => {
      expect(() =>
        fxLotAcquisitionEntity.validateQuantity(validPayload.quantity)
      ).not.toThrow();
      expect(() =>
        fxLotAcquisitionEntity.validateQuantity(
          moneyValue.make(0, SYSTEM_CURRENCIES.USD, false)
        )
      ).toThrow(fxLotAcquisitionError.InvalidQuantity);
    });

    it('validates cost basis', () => {
      expect(() =>
        fxLotAcquisitionEntity.validateCostBasis(validPayload.costBasis)
      ).not.toThrow();
      expect(() =>
        fxLotAcquisitionEntity.validateCostBasis(
          moneyValue.make(0, SYSTEM_CURRENCIES.NGN, false)
        )
      ).toThrow(fxLotAcquisitionError.InvalidCostBasis);
    });

    it('validates official rate and id together', () => {
      expect(() =>
        fxLotAcquisitionEntity.validateOfficialRate(officialRate, 1)
      ).not.toThrow();
      expect(() =>
        fxLotAcquisitionEntity.validateOfficialRate(null, null)
      ).not.toThrow();
      expect(() =>
        fxLotAcquisitionEntity.validateOfficialRate(officialRate, null)
      ).toThrow(fxLotAcquisitionError.MismatchedOfficialRate);
      expect(() =>
        fxLotAcquisitionEntity.validateOfficialRate(null, 1)
      ).toThrow(fxLotAcquisitionError.MismatchedOfficialRate);
      expect(() =>
        fxLotAcquisitionEntity.validateOfficialRate(officialRate, 0)
      ).toThrow(fxLotAcquisitionError.InvalidOfficialRateId);
    });
  });
});
