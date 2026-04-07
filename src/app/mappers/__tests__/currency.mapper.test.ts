import currencyMapper from '../currency.mapper';
import { ICurrency } from '../../../domain/currency/types/currency.types';

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

      expect(currencyMapper.toDomain(repoModel as any)).toEqual(
        expectedDomainCurrency
      );
    });
  });
});
