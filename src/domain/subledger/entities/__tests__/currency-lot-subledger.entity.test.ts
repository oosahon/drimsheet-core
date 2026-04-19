import { TCreationOmits } from '../../../../shared/types/creation-omits.types';
import { TEntityId } from '../../../../shared/types/uuid';
import { AppError } from '../../../../shared/value-objects/error';
import { ICurrency } from '../../../currency/types/currency.types';
import { EAdjustmentType } from '../../../ledger/types/ledger.types';
import { ECurrencyLotEvent } from '../../events/currency-lot.events';
import {
  ICurrencyLot,
  ICurrencyLotAdjustment,
  ICurrencyLotSale,
} from '../../types/currency-lot-subledger.types';
import currencyLotSubledgerEntity from '../currency-lot-subledger.entity';

describe('Currency Lot Subledger Entity', () => {
  let validCurrencyUSD: ICurrency;
  let validCurrencyEUR: ICurrency;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-15T00:00:00.000Z'));

    validCurrencyUSD = {
      code: 'USD',
      name: 'US Dollar',
      symbol: '$',
      minorUnit: 2n,
    };

    validCurrencyEUR = {
      code: 'EUR',
      name: 'Euro',
      symbol: '€',
      minorUnit: 2n,
    };
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('validateAdjustmentType', () => {
    it('should not throw if the adjustment type is valid', () => {
      expect(() =>
        currencyLotSubledgerEntity.validateAdjustmentType(
          EAdjustmentType.Contra
        )
      ).not.toThrow();
    });

    it('should throw an AppError if the adjustment type is invalid', () => {
      expect(() =>
        // @ts-expect-error Testing invalid runtime value
        currencyLotSubledgerEntity.validateAdjustmentType('INVALID_TYPE')
      ).toThrow(AppError);
    });
  });

  describe('makeLot', () => {
    it('should successfully create a lot with valid inputs', () => {
      const payload: TCreationOmits<ICurrencyLot> = {
        journalEntryId: '550e8400-e29b-41d4-a716-446655440000' as TEntityId,
        accountId: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
        amount: 1000,
        balance: 1000,
        currency: validCurrencyEUR,
        functionalCurrency: validCurrencyUSD,
        spotRate: 1.1,
        adjustedFunctionalBalanceImpact: 1100,
      };

      const [lot, events] = currencyLotSubledgerEntity.makeLot(payload);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(ECurrencyLotEvent.LotCreated);
      expect(events[0].data).toEqual(lot);

      expect(typeof lot.id).toBe('string');
      expect(lot.id.length).toBeGreaterThan(0);
      expect(lot.journalEntryId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(lot.accountId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(lot.amount).toBe(1000);
      expect(lot.balance).toBe(1000);
      expect(lot.currency).toEqual(validCurrencyEUR);
      expect(lot.functionalCurrency).toEqual(validCurrencyUSD);
      expect(lot.spotRate).toBe(1.1);
      expect(lot.adjustedFunctionalBalanceImpact).toBe(1100);
      expect(lot.createdAt).toEqual(new Date('2026-03-15T00:00:00.000Z'));
      expect(lot.updatedAt).toEqual(new Date('2026-03-15T00:00:00.000Z'));
      expect(Object.isFrozen(lot)).toBe(true);
    });

    it('should throw an AppError if journalEntryId is invalid', () => {
      const payload: TCreationOmits<ICurrencyLot> = {
        journalEntryId: 'invalid-uuid' as TEntityId,
        accountId: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
        amount: 1000,
        balance: 1000,
        currency: validCurrencyEUR,
        functionalCurrency: validCurrencyUSD,
        spotRate: 1.1,
        adjustedFunctionalBalanceImpact: 1100,
      };

      expect(() => currencyLotSubledgerEntity.makeLot(payload)).toThrow(
        AppError
      );
    });

    it('should throw an AppError if accountId is invalid', () => {
      const payload: TCreationOmits<ICurrencyLot> = {
        journalEntryId: '550e8400-e29b-41d4-a716-446655440000' as TEntityId,
        accountId: 'invalid-uuid' as TEntityId,
        amount: 1000,
        balance: 1000,
        currency: validCurrencyEUR,
        functionalCurrency: validCurrencyUSD,
        spotRate: 1.1,
        adjustedFunctionalBalanceImpact: 1100,
      };

      expect(() => currencyLotSubledgerEntity.makeLot(payload)).toThrow(
        AppError
      );
    });

    it('should throw an AppError if currency code is invalid', () => {
      const payload: TCreationOmits<ICurrencyLot> = {
        journalEntryId: '550e8400-e29b-41d4-a716-446655440000' as TEntityId,
        accountId: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
        amount: 1000,
        balance: 1000,
        currency: { ...validCurrencyEUR, code: 'INVALID' },
        functionalCurrency: validCurrencyUSD,
        spotRate: 1.1,
        adjustedFunctionalBalanceImpact: 1100,
      };

      expect(() => currencyLotSubledgerEntity.makeLot(payload)).toThrow();
    });

    it('should throw an AppError if functionalCurrency code is invalid', () => {
      const payload: TCreationOmits<ICurrencyLot> = {
        journalEntryId: '550e8400-e29b-41d4-a716-446655440000' as TEntityId,
        accountId: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
        amount: 1000,
        balance: 1000,
        currency: validCurrencyEUR,
        functionalCurrency: { ...validCurrencyUSD, code: 'INVALID' },
        spotRate: 1.1,
        adjustedFunctionalBalanceImpact: 1100,
      };

      expect(() => currencyLotSubledgerEntity.makeLot(payload)).toThrow();
    });
  });

  describe('updateLot', () => {
    let baseLot: ICurrencyLot;

    beforeEach(() => {
      [baseLot] = currencyLotSubledgerEntity.makeLot({
        journalEntryId: '550e8400-e29b-41d4-a716-446655440000' as TEntityId,
        accountId: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
        amount: 1000,
        balance: 1000,
        currency: validCurrencyEUR,
        functionalCurrency: validCurrencyUSD,
        spotRate: 1.1,
        adjustedFunctionalBalanceImpact: 1100,
      });

      jest.setSystemTime(new Date('2026-03-16T00:00:00.000Z'));
    });

    it('should successfully update balance and adjustedFunctionalBalanceImpact', () => {
      const [updatedLot, events] = currencyLotSubledgerEntity.updateLot(
        baseLot,
        {
          balance: 500,
          adjustedFunctionalBalanceImpact: 550,
        }
      );

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(ECurrencyLotEvent.LotUpdated);
      expect(events[0].data).toEqual(updatedLot);

      expect(updatedLot.balance).toBe(500);
      expect(updatedLot.adjustedFunctionalBalanceImpact).toBe(550);
      expect(updatedLot.updatedAt).toEqual(
        new Date('2026-03-16T00:00:00.000Z')
      );
      expect(Object.isFrozen(updatedLot)).toBe(true);
    });

    it('should return the original lot with no events if no changes are made', () => {
      const [updatedLot, events] = currencyLotSubledgerEntity.updateLot(
        baseLot,
        {
          balance: 1000,
          adjustedFunctionalBalanceImpact: 1100,
        }
      );

      expect(events).toHaveLength(0);
      expect(updatedLot).toEqual(baseLot);
    });

    it('should return the original lot with no events if options are empty', () => {
      const [updatedLot, events] = currencyLotSubledgerEntity.updateLot(
        baseLot,
        {}
      );

      expect(events).toHaveLength(0);
      expect(updatedLot).toEqual(baseLot);
    });
  });

  describe('makeLotAdjustment', () => {
    it('should successfully create a lot adjustment with valid inputs', () => {
      const payload: TCreationOmits<ICurrencyLotAdjustment> = {
        targetLotId: '550e8400-e29b-41d4-a716-446655440000' as TEntityId,
        adjustmentType: EAdjustmentType.Contra,
        spotRate: 1.15,
        newFunctionalBalanceImpact: 1150,
        balanceImpactDelta: 50,
        postedAt: null,
      };

      const [adjustment, events] =
        currencyLotSubledgerEntity.makeLotAdjustment(payload);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(ECurrencyLotEvent.LotAdjustmentCreated);
      expect(events[0].data).toEqual(adjustment);

      expect(typeof adjustment.id).toBe('string');
      expect(adjustment.targetLotId).toBe(
        '550e8400-e29b-41d4-a716-446655440000'
      );
      expect(adjustment.adjustmentType).toBe(EAdjustmentType.Contra);
      expect(adjustment.spotRate).toBe(1.15);
      expect(adjustment.newFunctionalBalanceImpact).toBe(1150);
      expect(adjustment.balanceImpactDelta).toBe(50);
      expect(adjustment.postedAt).toBeNull();
      expect(adjustment.createdAt).toEqual(
        new Date('2026-03-15T00:00:00.000Z')
      );
      expect(adjustment.updatedAt).toEqual(
        new Date('2026-03-15T00:00:00.000Z')
      );
      expect(Object.isFrozen(adjustment)).toBe(true);
    });

    it('should throw an AppError if targetLotId is invalid', () => {
      const payload: TCreationOmits<ICurrencyLotAdjustment> = {
        targetLotId: 'invalid-uuid' as TEntityId,
        adjustmentType: EAdjustmentType.Contra,
        spotRate: 1.15,
        newFunctionalBalanceImpact: 1150,
        balanceImpactDelta: 50,
        postedAt: null,
      };

      expect(() =>
        currencyLotSubledgerEntity.makeLotAdjustment(payload)
      ).toThrow(AppError);
    });

    it('should throw an AppError if adjustmentType is invalid', () => {
      const payload: TCreationOmits<ICurrencyLotAdjustment> = {
        targetLotId: '550e8400-e29b-41d4-a716-446655440000' as TEntityId,
        // @ts-expect-error Testing invalid runtime value
        adjustmentType: 'INVALID_TYPE',
        spotRate: 1.15,
        newFunctionalBalanceImpact: 1150,
        balanceImpactDelta: 50,
        postedAt: null,
      };

      expect(() =>
        currencyLotSubledgerEntity.makeLotAdjustment(payload)
      ).toThrow(AppError);
    });
  });

  describe('updateLotAdjustment', () => {
    let baseAdjustment: ICurrencyLotAdjustment;

    beforeEach(() => {
      [baseAdjustment] = currencyLotSubledgerEntity.makeLotAdjustment({
        targetLotId: '550e8400-e29b-41d4-a716-446655440000' as TEntityId,
        adjustmentType: EAdjustmentType.Contra,
        spotRate: 1.15,
        newFunctionalBalanceImpact: 1150,
        balanceImpactDelta: 50,
        postedAt: null,
      });

      jest.setSystemTime(new Date('2026-03-16T00:00:00.000Z'));
    });

    it('should successfully update postedAt', () => {
      const postedDate = new Date('2026-03-16T00:00:00.000Z');
      const [updatedAdjustment, events] =
        currencyLotSubledgerEntity.updateLotAdjustment(baseAdjustment, {
          postedAt: postedDate,
        });

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(ECurrencyLotEvent.LotAdjustmentUpdated);
      expect(events[0].data).toEqual(updatedAdjustment);

      expect(updatedAdjustment.postedAt).toEqual(postedDate);
      expect(updatedAdjustment.updatedAt).toEqual(postedDate);
      expect(Object.isFrozen(updatedAdjustment)).toBe(true);
    });

    it('should returning the original adjustment with no events if no changes are made', () => {
      const [updatedAdjustment, events] =
        currencyLotSubledgerEntity.updateLotAdjustment(baseAdjustment, {
          postedAt: null,
        });

      expect(events).toHaveLength(0);
      expect(updatedAdjustment).toEqual(baseAdjustment);
    });

    it('should return the original adjustment with no events if options are empty', () => {
      const [updatedAdjustment, events] =
        currencyLotSubledgerEntity.updateLotAdjustment(baseAdjustment, {});

      expect(events).toHaveLength(0);
      expect(updatedAdjustment).toEqual(baseAdjustment);
    });
  });

  describe('makeLotSale', () => {
    it('should successfully create a lot sale with valid inputs', () => {
      const payload: TCreationOmits<ICurrencyLotSale> = {
        journalEntryId: '550e8400-e29b-41d4-a716-446655440000' as TEntityId,
        targetLotId: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
        spotRate: 1.2,
        wacSpotRateAtSale: 1.15,
        amount: 500,
        fifoRealizedImpact: 50,
        wacRealizedImpact: 25,
      };

      const [sale, events] = currencyLotSubledgerEntity.makeLotSale(payload);

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe(ECurrencyLotEvent.LotSaleCreated);
      expect(events[0].data).toEqual(sale);

      expect(typeof sale.id).toBe('string');
      expect(sale.journalEntryId).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(sale.targetLotId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(sale.spotRate).toBe(1.2);
      expect(sale.wacSpotRateAtSale).toBe(1.15);
      expect(sale.amount).toBe(500);
      expect(sale.fifoRealizedImpact).toBe(50);
      expect(sale.wacRealizedImpact).toBe(25);
      expect(sale.createdAt).toEqual(new Date('2026-03-15T00:00:00.000Z'));
      expect(sale.updatedAt).toEqual(new Date('2026-03-15T00:00:00.000Z'));
      expect(Object.isFrozen(sale)).toBe(true);
    });

    it('should throw an AppError if journalEntryId is invalid', () => {
      const payload: TCreationOmits<ICurrencyLotSale> = {
        journalEntryId: 'invalid-uuid' as TEntityId,
        targetLotId: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
        spotRate: 1.2,
        wacSpotRateAtSale: 1.15,
        amount: 500,
        fifoRealizedImpact: 50,
        wacRealizedImpact: 25,
      };

      expect(() => currencyLotSubledgerEntity.makeLotSale(payload)).toThrow(
        AppError
      );
    });

    it('should throw an AppError if targetLotId is invalid', () => {
      const payload: TCreationOmits<ICurrencyLotSale> = {
        journalEntryId: '550e8400-e29b-41d4-a716-446655440000' as TEntityId,
        targetLotId: 'invalid-uuid' as TEntityId,
        spotRate: 1.2,
        wacSpotRateAtSale: 1.15,
        amount: 500,
        fifoRealizedImpact: 50,
        wacRealizedImpact: 25,
      };

      expect(() => currencyLotSubledgerEntity.makeLotSale(payload)).toThrow(
        AppError
      );
    });
  });
});
