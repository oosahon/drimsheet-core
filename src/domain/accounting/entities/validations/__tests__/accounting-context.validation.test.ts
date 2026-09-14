import accountingContextEntity from '@domain/accounting/entities/accounting-context.entity';
import accountingContextValidation from '@domain/accounting/entities/validations/accounting-context.validation';
import jurisdictionError from '@domain/accounting/errors/jurisdiction.error';

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

  it('rejects an invalid jurisdiction for an accounting standard', () => {
    expect(() =>
      accountingContextValidation.validateStandardCodeAndJurisdiction(
        'IFRS',
        'INVALID',
        'individual'
      )
    ).toThrow(jurisdictionError.Invalid);
  });
});
