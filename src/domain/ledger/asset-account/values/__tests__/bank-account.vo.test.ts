import ledgerError from '../../../shared/errors/ledger.error';
import bankAccountValue from '../bank-account.vo';

describe('bankAccountValue', () => {
  const validPayload = {
    countryCode: 'NG',
    bankName: 'First Bank of Nigeria',
    accountName: 'Company Operating Account',
    accountNumber: '0123456789',
  };

  describe('make', () => {
    it('creates a frozen bank account value for valid inputs', () => {
      const result = bankAccountValue.make(validPayload);

      expect(result).toEqual({
        countryCode: 'NG',
        bankName: 'First Bank of Nigeria',
        accountName: 'Company Operating Account',
        accountNumber: '0123456789',
      });
      expect(Object.isFrozen(result)).toBe(true);
    });

    it('normalizes country code to uppercase and trims whitespace', () => {
      const result = bankAccountValue.make({
        ...validPayload,
        countryCode: 'ng',
        bankName: '  First Bank  ',
        accountName: '  Company Account  ',
      });

      expect(result.countryCode).toBe('NG');
      expect(result.bankName).toBe('First Bank');
      expect(result.accountName).toBe('Company Account');
    });

    it('preserves leading zeroes in account number', () => {
      const result = bankAccountValue.make({
        ...validPayload,
        accountNumber: '0001234567',
      });

      expect(result.accountNumber).toBe('0001234567');
    });

    it('rejects an invalid country code', () => {
      expect(() =>
        bankAccountValue.make({
          ...validPayload,
          countryCode: 'INVALID',
        })
      ).toThrow(ledgerError.InvalidValue);
    });

    it('rejects short or empty bank name', () => {
      expect(() =>
        bankAccountValue.make({
          ...validPayload,
          bankName: 'A',
        })
      ).toThrow(ledgerError.InvalidValue);
    });

    it('rejects short or empty account name', () => {
      expect(() =>
        bankAccountValue.make({
          ...validPayload,
          accountName: 'A',
        })
      ).toThrow(ledgerError.InvalidValue);
    });

    it('rejects short account number', () => {
      expect(() =>
        bankAccountValue.make({
          ...validPayload,
          accountNumber: '12345',
        })
      ).toThrow(ledgerError.InvalidValue);
    });

    it('rejects null payload or undefined country code', () => {
      expect(() => bankAccountValue.make(null as any)).toThrow(
        ledgerError.InvalidValue
      );

      expect(() =>
        bankAccountValue.make({
          ...validPayload,
          countryCode: undefined as any,
        })
      ).toThrow(ledgerError.InvalidValue);
    });
  });
});
