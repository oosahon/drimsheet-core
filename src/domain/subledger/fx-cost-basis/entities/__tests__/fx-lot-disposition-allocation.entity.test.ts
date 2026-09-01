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
});
