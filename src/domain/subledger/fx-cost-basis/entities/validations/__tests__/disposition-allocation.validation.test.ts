import fxCostBasisLotDispositionAllocationEntity from '@domain/subledger/fx-cost-basis/entities/disposition-allocation.entity';
import dispositionAllocationValidation from '@domain/subledger/fx-cost-basis/entities/validations/disposition-allocation.validation';

describe('dispositionAllocationValidation', () => {
  it('exposes the frozen disposition-allocation validators', () => {
    expect(Object.isFrozen(dispositionAllocationValidation)).toBe(true);
    expect(fxCostBasisLotDispositionAllocationEntity.validateQuantity).toBe(
      dispositionAllocationValidation.validateQuantity
    );
    expect(Object.keys(dispositionAllocationValidation)).toEqual([
      'isValidMoney',
      'validateQuantity',
      'validateCostBasisConsumed',
      'validateProceeds',
      'validateFunctionalCurrency',
      'validateRealizedGainLossFormula',
    ]);
    expect(Object.values(dispositionAllocationValidation)).toEqual(
      expect.arrayContaining([expect.any(Function)])
    );
  });
});
