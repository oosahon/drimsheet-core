import fiscalYearEntity from '@domain/accounting/entities/fiscal-year.entity';
import fiscalYearValidation from '@domain/accounting/entities/validations/fiscal-year.validation';

describe('fiscalYearValidation', () => {
  it('exposes the frozen fiscal-year validators', () => {
    expect(Object.isFrozen(fiscalYearValidation)).toBe(true);
    expect(fiscalYearEntity.validateStartAndEndDate).toBe(
      fiscalYearValidation.validateStartAndEndDate
    );
    expect(Object.keys(fiscalYearValidation)).toEqual([
      'validateStartAndEndDate',
      'validateStatus',
    ]);
    expect(Object.values(fiscalYearValidation)).toEqual(
      expect.arrayContaining([expect.any(Function)])
    );
  });
});
