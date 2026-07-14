import { pettyCashCreationReqValidation } from '../asset-account.dto.validation';

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
          'Opening balance currency must match account currency'
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
});
