import ledgerAccountEntity from '@domain/ledger/entities/ledger-account.entity';
import ledgerAccountValidation from '@domain/ledger/entities/validations/ledger-account.validation';

describe('ledgerAccountValidation', () => {
  it('exposes the frozen ledger-account validators', () => {
    expect(Object.isFrozen(ledgerAccountValidation)).toBe(true);
    expect(ledgerAccountEntity.validateCode).toBe(
      ledgerAccountValidation.validateCode
    );
    expect(Object.keys(ledgerAccountValidation)).toEqual([
      'validateCode',
      'validateType',
      'validateStatus',
      'validateContraRule',
      'validateAdjunctRule',
      'validateNormalBalance',
      'validateSubType',
      'validateBehavior',
      'validateIsControlAccount',
      'validateMeta',
      'validateMaterializedPath',
    ]);
    expect(Object.values(ledgerAccountValidation)).toEqual(
      expect.arrayContaining([expect.any(Function)])
    );
  });
});
