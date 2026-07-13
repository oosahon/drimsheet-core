import { SYSTEM_CURRENCIES } from '../../../../../domain/money/config/currencies.config';
import moneyValue from '../../../../../domain/money/values/money.vo';
import appError from '../../../../../shared/errors/app.error';
import { IMoneyDto } from '../money.dto';
import moneyMapper from '../money.dto.mapper';

describe('Money DTO Mapper', () => {
  describe('toDto', () => {
    it('should map domain money to money DTO correctly', () => {
      const money = moneyValue.make(1000n, SYSTEM_CURRENCIES.USD, true);
      const dto = moneyMapper.toDto(money);
      expect(dto).toEqual({
        amount: 1000,
        currencyCode: 'USD',
        isMinorUnit: true,
      });
    });
  });

  describe('fromDto', () => {
    it('should map valid money DTO to domain money correctly', () => {
      const dto: IMoneyDto = {
        amount: 1000,
        currencyCode: 'USD',
        isMinorUnit: true,
      };
      const result = moneyMapper.fromDto(dto);
      expect(result.amount).toBe(1000n);
      expect(result.currency.code).toBe('USD');
    });

    it('should map DTO to domain money using isMinorUnit as false', () => {
      const dto: IMoneyDto = {
        amount: 10,
        currencyCode: 'USD',
        isMinorUnit: false,
      };
      const result = moneyMapper.fromDto(dto);
      expect(result.amount).toBe(1000n);
      expect(result.currency.code).toBe('USD');
    });

    it('should throw UnprocessableEntity for invalid currency code format', () => {
      const dto: IMoneyDto = {
        amount: 1000,
        currencyCode: 'usd', // invalid format (lowercase)
        isMinorUnit: true,
      };
      expect(() => moneyMapper.fromDto(dto)).toThrow(
        appError.UnprocessableEntity
      );
    });

    it('should throw an error for valid format but unsupported currency code', () => {
      const dto: IMoneyDto = {
        amount: 1000,
        currencyCode: 'ZZZ', // invalid/unsupported code format or not in SYSTEM_CURRENCIES
        isMinorUnit: true,
      };
      expect(() => moneyMapper.fromDto(dto)).toThrow();
    });
  });
});
