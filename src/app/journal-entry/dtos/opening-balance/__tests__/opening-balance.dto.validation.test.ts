import {
  openingBalanceCreationReqValidation,
  openingBalanceDtoValidation,
} from '@app/journal-entry/dtos/opening-balance/opening-balance.dto.validation';

describe('Opening Balance DTO Validation', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-14T00:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('openingBalanceDtoValidation', () => {
    it('should validate a correct opening balance DTO payload', () => {
      const payload = {
        amount: {
          amount: 1000,
          currencyCode: 'USD',
          isMinorUnit: true,
        },
        exchangeRate: null,
        date: new Date('2026-07-13T18:00:00.000Z'),
      };

      const result = openingBalanceDtoValidation.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should validate correctly with a valid exchangeRate', () => {
      const payload = {
        amount: {
          amount: 1000,
          currencyCode: 'USD',
          isMinorUnit: true,
        },
        exchangeRate: {
          baseCurrencyCode: 'EUR',
          targetCurrencyCode: 'USD',
          rate: 1.1,
          type: 'market',
          asOf: '2026-07-13T18:00:00Z',
          source: 'ExchangeSource',
        },
        date: new Date('2026-07-13T18:00:00.000Z'),
      };

      const result = openingBalanceDtoValidation.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should fail validation if amount is missing or invalid', () => {
      const payload = {
        exchangeRate: null,
        date: new Date('2026-07-13T18:00:00.000Z'),
      };

      const result = openingBalanceDtoValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });

    it('should fail validation if date is in the future', () => {
      const payload = {
        amount: {
          amount: 1000,
          currencyCode: 'USD',
          isMinorUnit: true,
        },
        exchangeRate: null,
        date: new Date('2026-07-14T00:00:00.001Z'),
      };

      const result = openingBalanceDtoValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });

  describe('openingBalanceCreationReqValidation', () => {
    it('should validate a correct creation request payload', () => {
      const payload = {
        amount: {
          amount: 2500,
          currencyCode: 'GBP',
          isMinorUnit: true,
        },
        exchangeRate: null,
        date: new Date('2026-07-13T18:00:00.000Z'),
        accountId: '2b4c1064-a09e-4e4f-b6a3-23945cc87f74',
      };

      const result = openingBalanceCreationReqValidation.safeParse(payload);
      expect(result.success).toBe(true);
    });

    it('should fail validation with invalid accountId UUID', () => {
      const payload = {
        amount: {
          amount: 2500,
          currencyCode: 'GBP',
          isMinorUnit: true,
        },
        exchangeRate: null,
        date: new Date('2026-07-13T18:00:00.000Z'),
        accountId: 'invalid-uuid',
      };

      const result = openingBalanceCreationReqValidation.safeParse(payload);
      expect(result.success).toBe(false);
    });
  });
});
