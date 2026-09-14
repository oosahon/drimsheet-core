import ledgerAccountBalanceAdjustmentValidation from '@domain/accounting/entities/validations/ledger-account-balance-adjustment.validation';

describe('ledgerAccountBalanceAdjustmentValidation', () => {
  it('exposes the frozen balance-adjustment validators', () => {
    expect(Object.isFrozen(ledgerAccountBalanceAdjustmentValidation)).toBe(
      true
    );
    expect(Object.keys(ledgerAccountBalanceAdjustmentValidation)).toEqual([
      'validateAccountId',
    ]);
    expect(Object.values(ledgerAccountBalanceAdjustmentValidation)).toEqual(
      expect.arrayContaining([expect.any(Function)])
    );
  });
});
