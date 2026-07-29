import ledgerError from '../../../shared/errors/ledger.error';
import bankDetailsValue from '../bank-details.vo';

describe('bankDetailsValue', () => {
  const validPayload = {
    countryCode: 'NG',
    bankName: 'First Bank of Nigeria',
    accountName: 'Company Operating Account',
    accountNumber: '0123456789',
  };

  describe('make', () => {
    it('creates a frozen bank account value for valid inputs', () => {
      const result = bankDetailsValue.make(validPayload);

      expect(result).toEqual({
        countryCode: 'NG',
        bankName: 'First Bank of Nigeria',
        accountName: 'Company Operating Account',
        accountNumber: '0123456789',
      });
      expect(Object.isFrozen(result)).toBe(true);
    });

    it('normalizes country code to uppercase and trims whitespace', () => {
      const result = bankDetailsValue.make({
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
      const result = bankDetailsValue.make({
        ...validPayload,
        accountNumber: '0001234567',
      });

      expect(result.accountNumber).toBe('0001234567');
    });

    it('rejects an invalid country code', () => {
      expect(() =>
        bankDetailsValue.make({
          ...validPayload,
          countryCode: 'INVALID',
        })
      ).toThrow(ledgerError.InvalidValue);
    });

    it('rejects short or empty bank name', () => {
      expect(() =>
        bankDetailsValue.make({
          ...validPayload,
          bankName: 'A',
        })
      ).toThrow(ledgerError.InvalidValue);
    });

    it('rejects short or empty account name', () => {
      expect(() =>
        bankDetailsValue.make({
          ...validPayload,
          accountName: 'A',
        })
      ).toThrow(ledgerError.InvalidValue);
    });

    it('rejects short account number', () => {
      expect(() =>
        bankDetailsValue.make({
          ...validPayload,
          accountNumber: '12345',
        })
      ).toThrow(ledgerError.InvalidValue);
    });

    it('rejects null payload or undefined country code', () => {
      expect(() => bankDetailsValue.make(null as any)).toThrow(
        ledgerError.InvalidValue
      );

      expect(() =>
        bankDetailsValue.make({
          ...validPayload,
          countryCode: undefined as any,
        })
      ).toThrow(ledgerError.InvalidValue);
    });
  });
});
