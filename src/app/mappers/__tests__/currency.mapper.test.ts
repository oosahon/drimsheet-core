import { ICurrency } from '../../../domain/currency/types/currency.types';
import currencyMapper, { ICurrencyModel } from '../currency.mapper';

describe('Currency Mapper', () => {
  describe('toRepo', () => {
    it('should map a domain currency to a repo model', () => {
      const domainCurrency: ICurrency = {
        code: 'USD',
        symbol: '$',
        name: 'US Dollar',
        minorUnit: 2n,
      };

      const expectedRepoModel = {
        code: 'USD',
        symbol: '$',
        name: 'US Dollar',
        minorUnit: 2,
      };

      expect(currencyMapper.toRepo(domainCurrency)).toEqual(expectedRepoModel);
    });
  });

  describe('toDomain', () => {
    it('should map a repo model to a domain currency', () => {
      const repoModel = {
        code: 'NGN',
        symbol: '₦',
        name: 'Nigerian Naira',
        minorUnit: 2,
      };

      const expectedDomainCurrency: ICurrency = {
        code: 'NGN',
        symbol: '₦',
        name: 'Nigerian Naira',
        minorUnit: 2n,
      };

      expect(currencyMapper.toDomain(repoModel as ICurrencyModel)).toEqual(
        expectedDomainCurrency
      );
    });
  });

  describe('fromInterface', () => {
    it('should map a valid currency code to a domain currency', () => {
      const code = 'USD';

      const expectedDomainCurrency: ICurrency = {
        code: 'USD',
        symbol: '$',
        name: 'US Dollar',
        minorUnit: 2n,
      };

      expect(currencyMapper.fromInterface(code)).toEqual(
        expectedDomainCurrency
      );
    });

    it('should throw an error for an invalid currency code', () => {
      const invalidCode = 'INVALID_CODE';

      expect(() => currencyMapper.fromInterface(invalidCode)).toThrow(
        'Currency INVALID_CODE does not exist'
      );
    });
  });
});
