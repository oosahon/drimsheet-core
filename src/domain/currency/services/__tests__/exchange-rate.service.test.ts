import mockExchangeRateRepo from '../../../../infra/persistence/repos/currency/__mocks__/exchange-rate-repo.impl.mock';
import { IRepoOptions } from '../../../../shared/types/repo.types';
import {
  EExchangeRateType,
  IExchangeRate,
  UExchangeRateType,
} from '../../types/exchange-rate.types';
import makeExchangeRateService from '../exchange-rate.service';

describe('exchangeRateService', () => {
  const service = makeExchangeRateService(mockExchangeRateRepo);
  const mockOptions: IRepoOptions = { correlationId: 'test-correlation-id' };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-15T00:00:00.000Z'));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getExchangeRate', () => {
    const validPayload = {
      baseCurrencyCode: 'USD',
      targetCurrencyCode: 'NGN',
      rate: 1500,
      type: EExchangeRateType.Official,
      asOf: new Date('2026-03-14T00:00:00.000Z'),
      source: 'Central Bank',
    };

    const existingExchangeRate: IExchangeRate & { id: number } = {
      id: 1,
      currencyPair: 'USD/NGN',
      baseCurrencyCode: 'USD',
      targetCurrencyCode: 'NGN',
      rate: 1500,
      type: EExchangeRateType.Official,
      asOf: new Date('2026-03-14T00:00:00.000Z'),
      source: 'Central Bank',
      createdAt: new Date('2026-03-14T00:00:00.000Z'),
    };

    describe('when no ID is provided', () => {
      it('should create and return a new exchange rate value object', async () => {
        const result = await service.getExchangeRate(validPayload, mockOptions);

        expect(result).not.toBeNull();
        if (!result) return;

        expect(result.currencyPair).toBe('USD/NGN');
        expect(result.baseCurrencyCode).toBe('USD');
        expect(result.targetCurrencyCode).toBe('NGN');
        expect(result.rate).toBe(1500);
        expect(result.type).toBe(EExchangeRateType.Official);
        expect(result.asOf).toEqual(validPayload.asOf);
        expect(result.source).toBe('Central Bank');
        expect(result.createdAt).toEqual(new Date('2026-03-15T00:00:00.000Z'));
      });

      describe('Payload Validation', () => {
        it('should throw if exchange rate type is invalid', async () => {
          const payload = {
            ...validPayload,
            type: 'INVALID_TYPE' as UExchangeRateType,
          };

          await expect(
            service.getExchangeRate(payload, mockOptions)
          ).rejects.toThrow();
        });

        it('should throw if date is in the future', async () => {
          const payload = {
            ...validPayload,
            asOf: new Date('2026-03-16T00:00:00.000Z'),
          };

          await expect(
            service.getExchangeRate(payload, mockOptions)
          ).rejects.toThrow();
        });

        it('should throw if base currency code is invalid', async () => {
          const payload = {
            ...validPayload,
            baseCurrencyCode: 'INVALID',
          };

          await expect(
            service.getExchangeRate(payload, mockOptions)
          ).rejects.toThrow();
        });

        it('should throw if target currency code is invalid', async () => {
          const payload = {
            ...validPayload,
            targetCurrencyCode: 'INVALID',
          };

          await expect(
            service.getExchangeRate(payload, mockOptions)
          ).rejects.toThrow();
        });

        it('should throw if source is empty or invalid string', async () => {
          const payload = {
            ...validPayload,
            source: '   ',
          };

          await expect(
            service.getExchangeRate(payload, mockOptions)
          ).rejects.toThrow();
        });
      });
    });

    describe('when ID is provided', () => {
      it('should throw AppError if exchange rate is not found', async () => {
        mockExchangeRateRepo.getById.mockResolvedValueOnce(null);

        await expect(
          service.getExchangeRate({ ...validPayload, id: 999 }, mockOptions)
        ).rejects.toThrow();
        expect(mockExchangeRateRepo.getById).toHaveBeenCalledWith(
          999,
          mockOptions
        );
      });

      it('should throw AppError if diff has changes', async () => {
        mockExchangeRateRepo.getById.mockResolvedValueOnce(
          existingExchangeRate
        );

        const alteredPayload = {
          ...validPayload,
          id: 1,
          rate: 1600,
        };

        await expect(
          service.getExchangeRate(alteredPayload, mockOptions)
        ).rejects.toThrow();
      });

      it('should return existing exchange rate if diff has no changes', async () => {
        mockExchangeRateRepo.getById.mockResolvedValueOnce(
          existingExchangeRate
        );

        const payloadWithId = {
          ...validPayload,
          id: 1,
        };

        const result = await service.getExchangeRate(
          payloadWithId,
          mockOptions
        );

        expect(result).toEqual(existingExchangeRate);
        expect(mockExchangeRateRepo.getById).toHaveBeenCalledWith(
          1,
          mockOptions
        );
      });
    });

    describe('when payload is null', () => {
      it('should return null', async () => {
        const result = await service.getExchangeRate(null, mockOptions);
        expect(result).toBeNull();
      });
    });
  });
});
