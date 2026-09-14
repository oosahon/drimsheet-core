import ledgerAccountBalanceEntity from '@domain/ledger/entities/ledger-account-balance.entity';
import ledgerAccountBalanceValidation from '@domain/ledger/entities/validations/ledger-account-balance.validation';

describe('ledgerAccountBalanceValidation', () => {
  it('exposes the frozen ledger-account-balance validators', () => {
    expect(Object.isFrozen(ledgerAccountBalanceValidation)).toBe(true);
    expect(ledgerAccountBalanceEntity.validateEffectType).toBe(
      ledgerAccountBalanceValidation.validateEffectType
    );
    expect(Object.keys(ledgerAccountBalanceValidation)).toEqual([
      'validateEffectType',
    ]);
    expect(Object.values(ledgerAccountBalanceValidation)).toEqual(
      expect.arrayContaining([expect.any(Function)])
    );
  });
});
