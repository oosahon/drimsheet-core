import { TCreationOmits } from '../../../../../shared/types/creation-omits.types';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import moneyValue from '../../../../../shared/value-objects/money.vo';
import { SYSTEM_CURRENCIES } from '../../../../currency/config/currencies.config';
import { EExchangeRateType } from '../../../../currency/types/exchange-rate.types';
import fxCostBasisLotError from '../../errors/lot.error';
import { EFxCostBasisLotEvent } from '../../events/lot.events';
import {
  EFxCostBasisLotAuditAction,
  EFxCostBasisLotStatus,
  IFxCostBasisLot,
} from '../../types/lot.types';
import fxCostBasisLotEntity from '../lot.entity';

describe('fxCostBasisLotEntity', () => {
  const MOCK_DATE = new Date('2026-04-01T00:00:00.000Z');
  let validPayload: TCreationOmits<IFxCostBasisLot, 'version'>;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(MOCK_DATE);

    validPayload = {
      ledgerAccountId: generateUUID(),
      accountingEntityId: generateUUID(),
      status: EFxCostBasisLotStatus.Open,
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
      const [entity, events, audit] = fxCostBasisLotEntity.make(validPayload);

      expect(entity.id).toBeDefined();
      expect(entity.ledgerAccountId).toBe(validPayload.ledgerAccountId);
      expect(entity.accountingEntityId).toBe(validPayload.accountingEntityId);
      expect(entity.status).toBe(EFxCostBasisLotStatus.Open);
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
      expect(events[0].type).toBe(EFxCostBasisLotEvent.Created);
      expect(events[0].data).toEqual(entity);
      expect(events[0].occurredAt).toEqual(MOCK_DATE);

      expect(audit).toEqual({
        entityId: entity.id,
        action: EFxCostBasisLotAuditAction.Created,
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
        fxCostBasisLotEntity.make(invalidPayload)
      ).toThrow(fxCostBasisLotError.InvalidLedgerAccountId);
    });

    it('throws when accounting entity id validation fails', () => {
      const invalidPayload = {
        ...validPayload,
        accountingEntityId: 'invalid-id',
      };

      expect(() =>
        // @ts-expect-error testing invalid accounting entity id
        fxCostBasisLotEntity.make(invalidPayload)
      ).toThrow(fxCostBasisLotError.InvalidAccountingEntityId);
    });

    it('throws when acquisition rate validation fails', () => {
      expect(() =>
        fxCostBasisLotEntity.make({
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
        fxCostBasisLotEntity.make({
          ...validPayload,
          acquisitionDate: new Date('2026-04-02T00:00:00.000Z'),
        })
      ).toThrow(fxCostBasisLotError.InvalidAcquisitionDate);
    });
  });

  describe('helpers', () => {
    it('validates status', () => {
      expect(
        fxCostBasisLotEntity.isValidStatus(EFxCostBasisLotStatus.Open)
      ).toBe(true);
      expect(
        fxCostBasisLotEntity.isValidStatus(EFxCostBasisLotStatus.Closed)
      ).toBe(true);
      expect(fxCostBasisLotEntity.isValidStatus('invalid-status')).toBe(false);
      expect(() =>
        fxCostBasisLotEntity.validateStatus(EFxCostBasisLotStatus.Open)
      ).not.toThrow();
      expect(() =>
        fxCostBasisLotEntity.validateStatus('invalid-status')
      ).toThrow(fxCostBasisLotError.InvalidStatus);
    });

    it('validates money shape', () => {
      expect(
        fxCostBasisLotEntity.isValidMoney(validPayload.originalQuantity)
      ).toBe(true);
      expect(
        fxCostBasisLotEntity.isValidMoney({
          amount: 100n,
          currency: { ...SYSTEM_CURRENCIES.USD, code: 'INVALID' },
        })
      ).toBe(false);
    });

    it('validates quantity values and invariants', () => {
      expect(() =>
        fxCostBasisLotEntity.validateQuantity(
          validPayload.originalQuantity,
          validPayload.remainingQuantity
        )
      ).not.toThrow();
      expect(() =>
        fxCostBasisLotEntity.validateQuantity(
          moneyValue.make(0, SYSTEM_CURRENCIES.USD, false),
          validPayload.remainingQuantity
        )
      ).toThrow(fxCostBasisLotError.InvalidOriginalQuantity);
      expect(() =>
        fxCostBasisLotEntity.validateQuantity(
          validPayload.originalQuantity,
          moneyValue.make(0, SYSTEM_CURRENCIES.USD, false)
        )
      ).not.toThrow();
      expect(() =>
        fxCostBasisLotEntity.validateQuantity(validPayload.originalQuantity, {
          ...validPayload.remainingQuantity,
          amount: -1n,
        })
      ).toThrow(fxCostBasisLotError.InvalidRemainingQuantity);
      expect(() =>
        fxCostBasisLotEntity.validateQuantity(
          validPayload.originalQuantity,
          moneyValue.make(100, SYSTEM_CURRENCIES.EUR, false)
        )
      ).toThrow(fxCostBasisLotError.MismatchedQuantityCurrency);
      expect(() =>
        fxCostBasisLotEntity.validateQuantity(
          validPayload.originalQuantity,
          moneyValue.make(101, SYSTEM_CURRENCIES.USD, false)
        )
      ).toThrow(fxCostBasisLotError.ExcessRemainingQuantity);
    });

    it('validates cost basis values and invariants', () => {
      expect(() =>
        fxCostBasisLotEntity.validateCostBasis(
          validPayload.costBasis,
          validPayload.remainingCostBasis
        )
      ).not.toThrow();
      expect(() =>
        fxCostBasisLotEntity.validateCostBasis(
          moneyValue.make(0, SYSTEM_CURRENCIES.NGN, false),
          validPayload.remainingCostBasis
        )
      ).toThrow(fxCostBasisLotError.InvalidCostBasis);
      expect(() =>
        fxCostBasisLotEntity.validateCostBasis(
          validPayload.costBasis,
          moneyValue.make(0, SYSTEM_CURRENCIES.NGN, false)
        )
      ).not.toThrow();
      expect(() =>
        fxCostBasisLotEntity.validateCostBasis(validPayload.costBasis, {
          ...validPayload.remainingCostBasis,
          amount: -1n,
        })
      ).toThrow(fxCostBasisLotError.InvalidRemainingCostBasis);
      expect(() =>
        fxCostBasisLotEntity.validateCostBasis(
          validPayload.costBasis,
          moneyValue.make(150000, SYSTEM_CURRENCIES.USD, false)
        )
      ).toThrow(fxCostBasisLotError.MismatchedCostBasisCurrency);
      expect(() =>
        fxCostBasisLotEntity.validateCostBasis(
          validPayload.costBasis,
          moneyValue.make(150001, SYSTEM_CURRENCIES.NGN, false)
        )
      ).toThrow(fxCostBasisLotError.ExcessRemainingCostBasis);
    });
  });
});
