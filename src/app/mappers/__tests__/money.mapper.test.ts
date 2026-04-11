import { ICurrency } from '../../../domain/currency/types/currency.types';
import { IMoney } from '../../../shared/types/money.types';
import { AppError } from '../../../shared/value-objects/error';
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
    currency: 'USD',
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

    it('should throw AppError if currency is not found', () => {
      const invalidDto: IMoneyDto = {
        amount: 1000,
        currency: 'XYZ',
      };

      expect(() => moneyMapper.fromDto(invalidDto)).toThrow(AppError);
      expect(() => moneyMapper.fromDto(invalidDto)).toThrow(
        'Currency not found'
      );
    });
  });

  describe('toInterface', () => {
    it('should map domain money to interface representaton (DTO)', () => {
      expect(moneyMapper.toInterface(moneyDomain)).toEqual(moneyDto);
    });
  });
});
