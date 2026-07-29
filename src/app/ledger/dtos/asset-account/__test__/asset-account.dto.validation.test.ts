import {
  bankAccountCreationReqValidation,
  pettyCashCreationReqValidation,
} from '../asset-account.dto.validation';

describe('Asset Account DTO Validation', () => {
  describe('pettyCashCreationReqValidation', () => {
    it('should validate a correct petty cash creation payload with matching currency', () => {
      const payload = {
        name: 'Petty Cash USD',
        currencyCode: 'USD',
        isControlAccount: false,
        openingBalance: {
          amount: {
            amount: 5000,
            currencyCode: 'USD',
            isMinorUnit: true,
          },
          exchangeRate: null,
          date: new Date('2026-07-13T18:00:00.000Z'),
        },
      };

      const result = pettyCashCreationReqValidation.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should validate correctly when openingBalance is null', () => {
      const payload = {
        name: 'Petty Cash GBP',
        currencyCode: 'GBP',
        isControlAccount: false,
        openingBalance: null,
      };

      const result = pettyCashCreationReqValidation.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should fail validation if openingBalance currency does not match account currency', () => {
      const payload = {
        name: 'Petty Cash USD',
        currencyCode: 'USD',
        isControlAccount: false,
        openingBalance: {
          amount: {
            amount: 5000,
            currencyCode: 'GBP', // mismatch!
            isMinorUnit: true,
          },
          exchangeRate: null,
          date: new Date('2026-07-13T18:00:00.000Z'),
        },
      };

      const result = pettyCashCreationReqValidation.safeParse(payload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          'ledger_error_asset_account_opening_balance_currency_mismatch'
        );
      }
    });

    it('should fail validation if name is empty', () => {
      const payload = {
        name: '',
        currencyCode: 'USD',
        isControlAccount: false,
        openingBalance: null,
      };

      const result = pettyCashCreationReqValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should fail validation if name exceeds 100 characters', () => {
      const payload = {
        name: 'a'.repeat(101),
        currencyCode: 'USD',
        isControlAccount: false,
        openingBalance: null,
      };

      const result = pettyCashCreationReqValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('bankAccountCreationReqValidation', () => {
    const validPayload = {
      name: 'Operations Bank Account',
      currencyCode: 'NGN',
      bankAccount: {
        bankName: 'First Bank of Nigeria',
        accountName: 'Company Operating Account',
        accountNumber: '0123456789',
      },
      openingBalance: null,
    };

    it('should validate a valid bank account creation payload', () => {
      const result = bankAccountCreationReqValidation.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should reject strict unknown fields at root level', () => {
      const result = bankAccountCreationReqValidation.safeParse({
        ...validPayload,
        isControlAccount: true,
      });
      expect(result.success).toBe(false);
    });

    it('should reject strict unknown fields inside bankAccount object', () => {
      const result = bankAccountCreationReqValidation.safeParse({
        ...validPayload,
        bankAccount: {
          ...validPayload.bankAccount,
          bankCode: '011',
        },
      });
      expect(result.success).toBe(false);
    });

    it('should fail validation if openingBalance currency does not match account currency', () => {
      const payload = {
        ...validPayload,
        openingBalance: {
          amount: {
            amount: 5000,
            currencyCode: 'USD', // mismatch!
            isMinorUnit: true,
          },
          exchangeRate: null,
          date: new Date('2026-07-13T18:00:00.000Z'),
        },
      };

      const result = bankAccountCreationReqValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });
});
