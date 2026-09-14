import fxCostBasisLotAcquisitionEntity from '@domain/subledger/fx-cost-basis/entities/acquisition.entity';
import acquisitionValidation from '@domain/subledger/fx-cost-basis/entities/validations/acquisition.validation';

describe('acquisitionValidation', () => {
  it('exposes the frozen acquisition validators', () => {
    expect(Object.isFrozen(acquisitionValidation)).toBe(true);
    expect(fxCostBasisLotAcquisitionEntity.validateQuantity).toBe(
      acquisitionValidation.validateQuantity
    );
    expect(Object.keys(acquisitionValidation)).toEqual([
      'isValidMoney',
      'validateQuantity',
      'validateCostBasis',
      'validateOfficialRate',
    ]);
    expect(Object.values(acquisitionValidation)).toEqual(
      expect.arrayContaining([expect.any(Function)])
    );
  });
});
