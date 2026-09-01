import generateUUID from '@shared/utils/uuid-generator';

import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';
import moneyValue from '@domain/money/values/money.vo';
import fxCostBasisLotDispositionAllocationEntity from '@domain/subledger/fx-cost-basis/entities/disposition-allocation.entity';
import fxCostBasisLotDispositionAllocationError from '@domain/subledger/fx-cost-basis/errors/disposition-allocation.error';

describe('fxCostBasisLotDispositionAllocationEntity', () => {
  const payload = {
    dispositionId: generateUUID(),
    lotId: generateUUID(),
    quantity: moneyValue.make(10, SYSTEM_CURRENCIES.USD, false),
    costBasisConsumed: moneyValue.make(14000, SYSTEM_CURRENCIES.NGN, false),
    proceeds: moneyValue.make(15000, SYSTEM_CURRENCIES.NGN, false),
    realizedGainLoss: moneyValue.make(1000, SYSTEM_CURRENCIES.NGN, false),
  };

  it('creates an immutable allocation with a derived-consistent result', () => {
    const allocation = fxCostBasisLotDispositionAllocationEntity.make(payload);

    expect(allocation).toMatchObject(payload);
    expect(allocation.id).toBeDefined();
    expect(Object.isFrozen(allocation)).toBe(true);
  });

  it('rejects an inconsistent realized result', () => {
    expect(() =>
      fxCostBasisLotDispositionAllocationEntity.make({
        ...payload,
        realizedGainLoss: moneyValue.make(999, SYSTEM_CURRENCIES.NGN, false),
      })
    ).toThrow(
      fxCostBasisLotDispositionAllocationError.InvalidRealizedGainLossFormula
    );
  });

  describe('helpers', () => {
    it('identifies malformed money', () => {
      const malformedMoney = {
        amount: 100n,
        currency: { ...SYSTEM_CURRENCIES.USD, code: 'INVALID' },
      };

      expect(
        fxCostBasisLotDispositionAllocationEntity.isValidMoney(malformedMoney)
      ).toBe(false);
    });

    it.each([
      [
        'malformed quantity',
        () =>
          fxCostBasisLotDispositionAllocationEntity.validateQuantity({
            amount: 10n,
          }),
        fxCostBasisLotDispositionAllocationError.InvalidQuantity,
      ],
      [
        'zero quantity',
        () =>
          fxCostBasisLotDispositionAllocationEntity.validateQuantity(
            moneyValue.makeZeroAmount(SYSTEM_CURRENCIES.USD)
          ),
        fxCostBasisLotDispositionAllocationError.InvalidQuantity,
      ],
      [
        'malformed cost basis',
        () =>
          fxCostBasisLotDispositionAllocationEntity.validateCostBasisConsumed({
            amount: 14_000n,
          }),
        fxCostBasisLotDispositionAllocationError.InvalidCostBasisConsumed,
      ],
      [
        'zero cost basis',
        () =>
          fxCostBasisLotDispositionAllocationEntity.validateCostBasisConsumed(
            moneyValue.makeZeroAmount(SYSTEM_CURRENCIES.NGN)
          ),
        fxCostBasisLotDispositionAllocationError.InvalidCostBasisConsumed,
      ],
      [
        'malformed proceeds',
        () =>
          fxCostBasisLotDispositionAllocationEntity.validateProceeds({
            amount: 15_000n,
          }),
        fxCostBasisLotDispositionAllocationError.InvalidProceeds,
      ],
      [
        'zero proceeds',
        () =>
          fxCostBasisLotDispositionAllocationEntity.validateProceeds(
            moneyValue.makeZeroAmount(SYSTEM_CURRENCIES.NGN)
          ),
        fxCostBasisLotDispositionAllocationError.InvalidProceeds,
      ],
    ])('rejects %s', (_, validate, ErrorClass) => {
      expect(validate).toThrow(ErrorClass);
    });

    it('rejects a cost-basis and proceeds currency mismatch', () => {
      expect(() =>
        fxCostBasisLotDispositionAllocationEntity.validateFunctionalCurrency({
          ...payload,
          proceeds: moneyValue.make(15_000, SYSTEM_CURRENCIES.USD, false),
        })
      ).toThrow(
        fxCostBasisLotDispositionAllocationError.MismatchedFunctionalCurrency
      );
    });

    it('rejects a proceeds and realized-result currency mismatch', () => {
      expect(() =>
        fxCostBasisLotDispositionAllocationEntity.validateFunctionalCurrency({
          ...payload,
          realizedGainLoss: moneyValue.make(
            1_000,
            SYSTEM_CURRENCIES.USD,
            false
          ),
        })
      ).toThrow(
        fxCostBasisLotDispositionAllocationError.MismatchedFunctionalCurrency
      );
    });
  });
});
