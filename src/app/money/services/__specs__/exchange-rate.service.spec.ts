import { IReadRepoOptions } from '@shared/types/repo.types';

import { EExchangeRateType } from '@domain/money/types/exchange-rate.types';
import exchangeRateValue from '@domain/money/values/exchange-rate.vo';

import { mockExchangeRateRepo } from '@app/money/contracts/__mocks__/money.repos.mock';
import makeExchangeRateAppService from '@app/money/services/exchange-rate.service';

describe('ExchangeRateAppService', () => {
  const mockRepoOptions: IReadRepoOptions = { correlationId: 'test-corr-id' };
  const asOfDate = new Date('2026-04-14T00:00:00.000Z');

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-04-15T00:00:00.000Z'));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const getService = () =>
    makeExchangeRateAppService({
      exchangeRateRepo: mockExchangeRateRepo,
    });

  it('should return user-provided rate directly when it is official', async () => {
    const service = getService();
    const userProvided = exchangeRateValue.make({
      baseCurrencyCode: 'EUR',
      targetCurrencyCode: 'USD',
      rate: 1.1,
      type: EExchangeRateType.Official,
      asOf: asOfDate,
      source: 'Test Source',
    });

    const result = await service.getOfficialRate(
      'EUR/USD',
      asOfDate,
      mockRepoOptions,
      userProvided
    );

    expect(result).toBe(userProvided);
    expect(mockExchangeRateRepo.findByPairAndDate).not.toHaveBeenCalled();
  });

  it('should query repository when user-provided rate is null', async () => {
    const service = getService();
    const expectedRate = exchangeRateValue.make({
      baseCurrencyCode: 'EUR',
      targetCurrencyCode: 'USD',
      rate: 1.1,
      type: EExchangeRateType.Official,
      asOf: asOfDate,
      source: 'Repo Source',
    });

    mockExchangeRateRepo.findByPairAndDate.mockResolvedValue(expectedRate);

    const result = await service.getOfficialRate(
      'EUR/USD',
      asOfDate,
      mockRepoOptions,
      null
    );

    expect(result).toBe(expectedRate);
    expect(mockExchangeRateRepo.findByPairAndDate).toHaveBeenCalledWith(
      'EUR/USD',
      asOfDate,
      mockRepoOptions
    );
  });

  it('should query repository when user-provided rate is not official', async () => {
    const service = getService();
    const userProvided = exchangeRateValue.make({
      baseCurrencyCode: 'EUR',
      targetCurrencyCode: 'USD',
      rate: 1.1,
      type: EExchangeRateType.Negotiated,
      asOf: asOfDate,
      source: 'User Source',
    });

    const expectedRate = exchangeRateValue.make({
      baseCurrencyCode: 'EUR',
      targetCurrencyCode: 'USD',
      rate: 1.15,
      type: EExchangeRateType.Official,
      asOf: asOfDate,
      source: 'Repo Source',
    });

    mockExchangeRateRepo.findByPairAndDate.mockResolvedValue(expectedRate);

    const result = await service.getOfficialRate(
      'EUR/USD',
      asOfDate,
      mockRepoOptions,
      userProvided
    );

    expect(result).toBe(expectedRate);
    expect(mockExchangeRateRepo.findByPairAndDate).toHaveBeenCalledWith(
      'EUR/USD',
      asOfDate,
      mockRepoOptions
    );
  });
});
