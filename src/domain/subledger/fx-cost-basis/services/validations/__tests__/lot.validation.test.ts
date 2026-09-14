import lotServiceValidation from '@domain/subledger/fx-cost-basis/services/validations/lot.validation';

describe('lotServiceValidation', () => {
  it('exposes the frozen lot-service validators', () => {
    expect(Object.isFrozen(lotServiceValidation)).toBe(true);
    expect(Object.keys(lotServiceValidation)).toEqual([
      'hasFxCostBasisEffect',
      'validateJournalStatus',
      'validateFxLine',
    ]);
    expect(Object.values(lotServiceValidation)).toEqual(
      expect.arrayContaining([expect.any(Function)])
    );
  });
});
