import { TCreationOmits } from '../../../../../shared/types/creation-omits.types';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import moneyValue from '../../../../../shared/value-objects/money.vo';
import { SYSTEM_CURRENCIES } from '../../../../currency/config/currencies.config';
import { EExchangeRateType } from '../../../../currency/types/exchange-rate.types';
import fxLotError from '../../errors/fx-lot.error';
import { EFxLotEvent } from '../../events/fx-lot.events';
import { EFxLotAuditAction } from '../../types/fx-lot-audit.types';
import { EFxLotStatus, IFxLot } from '../../types/fx-lot.types';
import fxLotEntity from '../fx-lot.entity';

describe('fxLotEntity', () => {
  const MOCK_DATE = new Date('2026-04-01T00:00:00.000Z');
  let validPayload: TCreationOmits<IFxLot>;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(MOCK_DATE);

    validPayload = {
      ledgerAccountId: generateUUID(),
      accountingEntityId: generateUUID(),
      status: EFxLotStatus.Open,
      originalQuantity: moneyValue.make(100, SYSTEM_CURRENCIES.USD, false),
      remainingQuantity: moneyValue.make(100, SYSTEM_CURRENCIES.USD, false),
      costBasis: moneyValue.make(150000, SYSTEM_CURRENCIES.NGN, false),
      remainingCostBasis: moneyValue.make(150000, SYSTEM_CURRENCIES.NGN, false),
      acquisitionRate: {
        currencyPair: 'USD/NGN',
        baseCurrencyCode: 'USD',
        targetCurrencyCode: 'NGN',
        rate: 1500,
        type: EExchangeRateType.Negotiated,
        asOf: new Date('2026-03-31T00:00:00.000Z'),
        source: 'bank',
        createdAt: new Date('2026-03-31T00:00:00.000Z'),
      },
      acquisitionDate: new Date('2026-03-31T00:00:00.000Z'),
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('make', () => {
    it('creates a validated fx lot with event and audit', () => {
      const [entity, events, audit] = fxLotEntity.make(validPayload);

      expect(entity.id).toBeDefined();
      expect(entity.ledgerAccountId).toBe(validPayload.ledgerAccountId);
      expect(entity.accountingEntityId).toBe(validPayload.accountingEntityId);
      expect(entity.status).toBe(EFxLotStatus.Open);
      expect(entity.originalQuantity).toBe(validPayload.originalQuantity);
      expect(entity.remainingQuantity).toBe(validPayload.remainingQuantity);
      expect(entity.costBasis).toBe(validPayload.costBasis);
      expect(entity.remainingCostBasis).toBe(validPayload.remainingCostBasis);
      expect(entity.acquisitionRate).toBe(validPayload.acquisitionRate);
      expect(entity.acquisitionDate).toBe(validPayload.acquisitionDate);
      expect(entity.createdAt).toEqual(MOCK_DATE);
      expect(entity.updatedAt).toEqual(MOCK_DATE);
      expect(Object.isFrozen(entity)).toBe(true);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(EFxLotEvent.Created);
      expect(events[0].data).toEqual(entity);
      expect(events[0].occurredAt).toEqual(MOCK_DATE);

      expect(audit).toEqual({
        entityId: entity.id,
        action: EFxLotAuditAction.Created,
        diff: {
          before: null,
          after: entity,
        },
        occurredAt: entity.updatedAt,
      });
      expect(Object.isFrozen(audit)).toBe(true);
    });

    it('throws when ledger account id validation fails', () => {
      const invalidPayload = {
        ...validPayload,
        ledgerAccountId: 'invalid-id',
      };

      expect(() =>
        // @ts-expect-error testing invalid ledger account id
        fxLotEntity.make(invalidPayload)
      ).toThrow(fxLotError.InvalidLedgerAccountId);
    });

    it('throws when accounting entity id validation fails', () => {
      const invalidPayload = {
        ...validPayload,
        accountingEntityId: 'invalid-id',
      };

      expect(() =>
        // @ts-expect-error testing invalid accounting entity id
        fxLotEntity.make(invalidPayload)
      ).toThrow(fxLotError.InvalidAccountingEntityId);
    });

    it('throws when acquisition rate validation fails', () => {
      expect(() =>
        fxLotEntity.make({
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
        fxLotEntity.make({
          ...validPayload,
          acquisitionDate: new Date('2026-04-02T00:00:00.000Z'),
        })
      ).toThrow(fxLotError.InvalidAcquisitionDate);
    });
  });

  describe('helpers', () => {
    it('validates status', () => {
      expect(fxLotEntity.isValidStatus(EFxLotStatus.Open)).toBe(true);
      expect(fxLotEntity.isValidStatus(EFxLotStatus.Closed)).toBe(true);
      expect(fxLotEntity.isValidStatus('invalid-status')).toBe(false);
      expect(() => fxLotEntity.validateStatus(EFxLotStatus.Open)).not.toThrow();
      expect(() => fxLotEntity.validateStatus('invalid-status')).toThrow(
        fxLotError.InvalidStatus
      );
    });

    it('validates money shape', () => {
      expect(fxLotEntity.isValidMoney(validPayload.originalQuantity)).toBe(
        true
      );
      expect(
        fxLotEntity.isValidMoney({
          amount: 100n,
          currency: { ...SYSTEM_CURRENCIES.USD, code: 'INVALID' },
        })
      ).toBe(false);
    });

    it('validates quantity values and invariants', () => {
      expect(() =>
        fxLotEntity.validateQuantity(
          validPayload.originalQuantity,
          validPayload.remainingQuantity
        )
      ).not.toThrow();
      expect(() =>
        fxLotEntity.validateQuantity(
          moneyValue.make(0, SYSTEM_CURRENCIES.USD, false),
          validPayload.remainingQuantity
        )
      ).toThrow(fxLotError.InvalidOriginalQuantity);
      expect(() =>
        fxLotEntity.validateQuantity(
          validPayload.originalQuantity,
          moneyValue.make(0, SYSTEM_CURRENCIES.USD, false)
        )
      ).not.toThrow();
      expect(() =>
        fxLotEntity.validateQuantity(validPayload.originalQuantity, {
          ...validPayload.remainingQuantity,
          amount: -1n,
        })
      ).toThrow(fxLotError.InvalidRemainingQuantity);
      expect(() =>
        fxLotEntity.validateQuantity(
          validPayload.originalQuantity,
          moneyValue.make(100, SYSTEM_CURRENCIES.EUR, false)
        )
      ).toThrow(fxLotError.MismatchedQuantityCurrency);
      expect(() =>
        fxLotEntity.validateQuantity(
          validPayload.originalQuantity,
          moneyValue.make(101, SYSTEM_CURRENCIES.USD, false)
        )
      ).toThrow(fxLotError.ExcessRemainingQuantity);
    });

    it('validates cost basis values and invariants', () => {
      expect(() =>
        fxLotEntity.validateCostBasis(
          validPayload.costBasis,
          validPayload.remainingCostBasis
        )
      ).not.toThrow();
      expect(() =>
        fxLotEntity.validateCostBasis(
          moneyValue.make(0, SYSTEM_CURRENCIES.NGN, false),
          validPayload.remainingCostBasis
        )
      ).toThrow(fxLotError.InvalidCostBasis);
      expect(() =>
        fxLotEntity.validateCostBasis(
          validPayload.costBasis,
          moneyValue.make(0, SYSTEM_CURRENCIES.NGN, false)
        )
      ).not.toThrow();
      expect(() =>
        fxLotEntity.validateCostBasis(validPayload.costBasis, {
          ...validPayload.remainingCostBasis,
          amount: -1n,
        })
      ).toThrow(fxLotError.InvalidRemainingCostBasis);
      expect(() =>
        fxLotEntity.validateCostBasis(
          validPayload.costBasis,
          moneyValue.make(150000, SYSTEM_CURRENCIES.USD, false)
        )
      ).toThrow(fxLotError.MismatchedCostBasisCurrency);
      expect(() =>
        fxLotEntity.validateCostBasis(
          validPayload.costBasis,
          moneyValue.make(150001, SYSTEM_CURRENCIES.NGN, false)
        )
      ).toThrow(fxLotError.ExcessRemainingCostBasis);
    });
  });
});
