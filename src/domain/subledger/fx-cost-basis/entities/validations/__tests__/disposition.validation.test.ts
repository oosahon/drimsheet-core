import fxCostBasisLotDispositionEntity from '@domain/subledger/fx-cost-basis/entities/disposition.entity';
import dispositionValidation from '@domain/subledger/fx-cost-basis/entities/validations/disposition.validation';

describe('dispositionValidation', () => {
  it('exposes the frozen disposition validators', () => {
    expect(Object.isFrozen(dispositionValidation)).toBe(true);
    expect(fxCostBasisLotDispositionEntity.validateQuantity).toBe(
      dispositionValidation.validateQuantity
    );
    expect(Object.keys(dispositionValidation)).toEqual([
      'isValidMoney',
      'validateQuantity',
      'validateCostBasisConsumed',
      'validateProceeds',
      'validateRealizedGainLoss',
      'validateFunctionalCurrency',
      'validateRealizedGainLossFormula',
      'validateOfficialRate',
    ]);
    expect(Object.values(dispositionValidation)).toEqual(
      expect.arrayContaining([expect.any(Function)])
    );
  });
});
