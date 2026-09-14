import accountingContextEntity from '@domain/accounting/entities/accounting-context.entity';
import accountingContextValidation from '@domain/accounting/entities/validations/accounting-context.validation';

describe('accountingContextValidation', () => {
  it('exposes the frozen accounting-context validators', () => {
    expect(Object.isFrozen(accountingContextValidation)).toBe(true);
    expect(accountingContextEntity.validateAccountingStandardCode).toBe(
      accountingContextValidation.validateAccountingStandardCode
    );
    expect(Object.keys(accountingContextValidation)).toEqual([
      'isValidAccountingStandardCode',
      'validateAccountingStandardCode',
      'validateStandardCode',
      'validateStandardCodeAndJurisdiction',
    ]);
    expect(Object.values(accountingContextValidation)).toEqual(
      expect.arrayContaining([expect.any(Function)])
    );
  });
});
