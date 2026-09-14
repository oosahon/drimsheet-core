import fxCostBasisLotEntity from '@domain/subledger/fx-cost-basis/entities/lot.entity';
import lotValidation from '@domain/subledger/fx-cost-basis/entities/validations/lot.validation';

describe('lotValidation', () => {
  it('exposes the frozen lot validators', () => {
    expect(Object.isFrozen(lotValidation)).toBe(true);
    expect(fxCostBasisLotEntity.validateStatus).toBe(
      lotValidation.validateStatus
    );
    expect(Object.keys(lotValidation)).toEqual([
      'isValidStatus',
      'validateStatus',
      'isValidMoney',
      'validateQuantity',
      'validateCostBasis',
      'validateConsumption',
      'validateConsumptionRemainder',
    ]);
    expect(Object.values(lotValidation)).toEqual(
      expect.arrayContaining([expect.any(Function)])
    );
  });
});
