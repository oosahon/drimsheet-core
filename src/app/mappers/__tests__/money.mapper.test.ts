import httpError from '../../../app/errors/http.errors';
import { ICurrency } from '../../../domain/currency/types/currency.types';
import { IMoney } from '../../../shared/types/money.types';
import { IMoneyDto } from '../../contracts/dto/money.dto';
import moneyMapper from '../money.mapper';

describe('Money Mapper', () => {
  const currency: ICurrency = {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    minorUnit: 2n,
  };

  const moneyDomain: IMoney = {
    amount: 1000n,
    currency,
  };

  const moneyDto: IMoneyDto = {
    amount: 1000,
    currencyCode: 'USD',
    isMinorUnit: true,
  };

  describe('toDto', () => {
    it('should map domain money to a DTO', () => {
      expect(moneyMapper.toDto(moneyDomain)).toEqual(moneyDto);
    });
  });

  describe('fromDto', () => {
    it('should map a DTO to domain money', () => {
      // It uses SYSTEM_CURRENCIES for the reverse lookup.
      // USD is in SYSTEM_CURRENCIES, so it should match correctly.
      const result = moneyMapper.fromDto(moneyDto);
      expect(result.amount).toStrictEqual(moneyDomain.amount);
      expect(result.currency.code).toBe(moneyDomain.currency.code);
    });

    it('should throw AppError if currency code is an invalid format', () => {
      const invalidDto: IMoneyDto = {
        amount: 1000,
        currencyCode: 'usd', // lowercase is invalid format
        isMinorUnit: true,
      };

      expect(() => moneyMapper.fromDto(invalidDto)).toThrow(
        httpError.UnprocessableEntity
      );
    });

    it('should throw AppError if currency format is valid but not in system currencies', () => {
      const invalidDto: IMoneyDto = {
        amount: 1000,
        currencyCode: 'BBD', // BBD is not in SYSTEM_CURRENCIES
        isMinorUnit: true,
      };

      expect(() => moneyMapper.fromDto(invalidDto)).toThrow(Error);
    });
  });

  describe('toRepo', () => {
    it('should map domain money to a repo object', () => {
      const repoObject = moneyMapper.toRepo(moneyDomain);
      expect(repoObject).toEqual({
        amount: 1000,
        currencyCode: 'USD',
      });
    });
  });

  describe('fromRepo', () => {
    it('should map a repo object to domain money', () => {
      const result = moneyMapper.fromRepo(1000, 'USD');
      expect(result.amount).toStrictEqual(moneyDomain.amount);
      expect(result.currency.code).toBe(moneyDomain.currency.code);
    });
  });
});
