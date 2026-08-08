import { ledgerAccountBalanceAdjustmentDtoSchema } from '@app/ledger/dtos/ledger-account-balance-adjustment/ledger-account-balance-adjustment.dto.validation';

describe('Ledger Account Balance Adjustment DTO Validation', () => {
  it('should validate a correct balance adjustment DTO payload', () => {
    const payload = {
      journalEntry: {
        id: '2b4c1064-a09e-4e4f-b6a3-23945cc87f74',
        createdBy: '1c4c1064-a09e-4e4f-b6a3-23945cc87f75',
      },
      balanceDelta: {
        amount: 2500,
        currencyCode: 'USD',
        isMinorUnit: true,
      },
      functionalBalanceDelta: {
        amount: 2500,
        currencyCode: 'USD',
        isMinorUnit: true,
      },
      ledgerAccountId: '3c4c1064-a09e-4e4f-b6a3-23945cc87f76',
      accountingEntityId: '4c4c1064-a09e-4e4f-b6a3-23945cc87f77',
    };

    const result = ledgerAccountBalanceAdjustmentDtoSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('should fail if fields are invalid', () => {
    const payload = {
      journalEntry: {
        id: 'invalid-uuid',
        createdBy: '1c4c1064-a09e-4e4f-b6a3-23945cc87f75',
      },
      balanceDelta: {
        amount: '2500', // invalid type
        currencyCode: 'USD',
        isMinorUnit: true,
      },
      functionalBalanceDelta: {
        amount: 2500,
        currencyCode: 'USD',
        isMinorUnit: true,
      },
      ledgerAccountId: '3c4c1064-a09e-4e4f-b6a3-23945cc87f76',
      accountingEntityId: '4c4c1064-a09e-4e4f-b6a3-23945cc87f77',
    };

    const result = ledgerAccountBalanceAdjustmentDtoSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });
});
