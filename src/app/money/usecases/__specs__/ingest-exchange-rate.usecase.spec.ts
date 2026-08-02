import { SYSTEM_CURRENCIES } from '../../../../domain/money/config/currencies.config';
import currencyError from '../../../../domain/money/errors/currency.error';
import exchangeRateError from '../../../../domain/money/errors/exchange-rate.error';
import IExchangeRateRepo from '../../../../domain/money/repos/exchange-rate.repo';
import { EExchangeRateType } from '../../../../domain/money/types/exchange-rate.types';
import mockLogger from '../../../../shared/contracts/__mocks__/logger.mock';
import mockRepoService from '../../../../shared/contracts/__mocks__/repo.mock';
import { ITransactionContext } from '../../../../shared/types/repo.types';
import mockAppContext from '../../../context/contracts/__mocks__/app-context.mock';
import { IAppContextData } from '../../../context/contracts/app-context.contract';
import IExchangeRateIngestion from '../../contracts/exchange-rate-ingestion.contract';
import makeIngestExchangeRateUseCase from '../ingest-exchange-rate.usecase';

const exchangeRateRepoMock: jest.Mocked<IExchangeRateRepo> = {
  create: jest.fn(),
  find: jest.fn(),
  findByPairAndDate: jest.fn(),
};

jest.mock('../../../../shared/utils/uuid-generator', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue('mocked-uuid'),
}));

describe('makeIngestExchangeRateUseCase', () => {
  const correlationId = 'test-correlation-id';

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepoService.runInTransaction.mockImplementation(async (cb) => {
      return await cb('mock-tx' as unknown as ITransactionContext);
    });
    exchangeRateRepoMock.create.mockReset();

    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-06-10T12:53:59.000Z'));

    mockAppContext.get.mockReturnValue({
      correlationId,
      idempotencyKey: 'test-idempotency-key',
      user: null,
      accountingEntityType: 'individual',
      clientSession: {
        setRefreshToken: jest.fn(),
        getRefreshToken: jest.fn(),
        clearRefreshToken: jest.fn(),
      },
    } as unknown as IAppContextData);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should batch exchange rates in chunks of 100 and save them', async () => {
    const dataItems = Array.from({ length: 150 }, (_, i) => ({
      base_currency_code: SYSTEM_CURRENCIES.EUR.code,
      target_currency_code: SYSTEM_CURRENCIES.USD.code,
      rate: (1.0 + i * 0.001).toFixed(4),
      rate_class: EExchangeRateType.Official,
      as_of: '2026-06-10T00:00:00.000Z',
      source: 'ECB',
    }));

    const payload: IExchangeRateIngestion['message']['payload'] = {
      correlation_id: correlationId,
      event_type: 'exchange-rate.ingested.v1',
      occurred_at: '2026-06-10T12:00:00.000Z',
      producer: 'pl-ingestion',
      data: dataItems,
    };

    const usecase = makeIngestExchangeRateUseCase({
      exchangeRateRepo: exchangeRateRepoMock,
      repoService: mockRepoService,
      logger: mockLogger,
    });

    await usecase(payload);

    expect(mockRepoService.runInTransaction).toHaveBeenCalledTimes(1);
    expect(exchangeRateRepoMock.create).toHaveBeenCalledTimes(2);

    // First call should have 100 items
    expect(exchangeRateRepoMock.create.mock.calls[0][0].length).toBe(100);
    // Second call should have 50 items
    expect(exchangeRateRepoMock.create.mock.calls[1][0].length).toBe(50);

    // Verify saving params
    expect(exchangeRateRepoMock.create).toHaveBeenNthCalledWith(
      1,
      expect.any(Array),
      { correlationId, tx: 'mock-tx' }
    );
  });

  it('should handle empty exchange rate list', async () => {
    const payload: IExchangeRateIngestion['message']['payload'] = {
      correlation_id: correlationId,
      event_type: 'exchange-rate.ingested.v1',
      occurred_at: '2026-06-10T12:00:00.000Z',
      producer: 'pl-ingestion',
      data: [],
    };

    const usecase = makeIngestExchangeRateUseCase({
      exchangeRateRepo: exchangeRateRepoMock,
      repoService: mockRepoService,
      logger: mockLogger,
    });

    await usecase(payload);

    expect(mockRepoService.runInTransaction).toHaveBeenCalledTimes(1);
    expect(exchangeRateRepoMock.create).not.toHaveBeenCalled();
  });

  it('should throw an error if currency code is invalid', async () => {
    const payload: IExchangeRateIngestion['message']['payload'] = {
      correlation_id: correlationId,
      event_type: 'exchange-rate.ingested.v1',
      occurred_at: '2026-06-10T12:00:00.000Z',
      producer: 'pl-ingestion',
      data: [
        {
          base_currency_code: 'INVALID',
          target_currency_code: SYSTEM_CURRENCIES.USD.code,
          rate: '1.0850',
          rate_class: EExchangeRateType.Official,
          as_of: '2026-06-10T00:00:00.000Z',
          source: 'ECB',
        },
      ],
    };

    const usecase = makeIngestExchangeRateUseCase({
      exchangeRateRepo: exchangeRateRepoMock,
      repoService: mockRepoService,
      logger: mockLogger,
    });

    await expect(usecase(payload)).rejects.toThrow(currencyError.InvalidCode);
  });

  it('should throw an error if rate class is invalid', async () => {
    // We cast rate_class as UExchangeRateType to bypass typescript compilation checks
    // and verify runtime handling of invalid type mapping.
    const payload = {
      correlation_id: correlationId,
      event_type: 'exchange-rate.ingested.v1' as const,
      occurred_at: '2026-06-10T12:00:00.000Z',
      producer: 'pl-ingestion' as const,
      data: [
        {
          base_currency_code: SYSTEM_CURRENCIES.EUR.code,
          target_currency_code: SYSTEM_CURRENCIES.USD.code,
          rate: '1.0850',
          rate_class: 'invalid_rate_class' as unknown as 'official',
          as_of: '2026-06-10T00:00:00.000Z',
          source: 'ECB',
        },
      ],
    };

    const usecase = makeIngestExchangeRateUseCase({
      exchangeRateRepo: exchangeRateRepoMock,
      repoService: mockRepoService,
      logger: mockLogger,
    });

    await expect(usecase(payload)).rejects.toThrow(
      exchangeRateError.InvalidType
    );
  });

  it('should throw an error if date is invalid format', async () => {
    const payload: IExchangeRateIngestion['message']['payload'] = {
      correlation_id: correlationId,
      event_type: 'exchange-rate.ingested.v1',
      occurred_at: '2026-06-10T12:00:00.000Z',
      producer: 'pl-ingestion',
      data: [
        {
          base_currency_code: SYSTEM_CURRENCIES.EUR.code,
          target_currency_code: SYSTEM_CURRENCIES.USD.code,
          rate: '1.0850',
          rate_class: EExchangeRateType.Official,
          as_of: 'invalid-date',
          source: 'ECB',
        },
      ],
    };

    const usecase = makeIngestExchangeRateUseCase({
      exchangeRateRepo: exchangeRateRepoMock,
      repoService: mockRepoService,
      logger: mockLogger,
    });

    await expect(usecase(payload)).rejects.toThrow(
      exchangeRateError.InvalidDate
    );
  });

  it('should throw an error if date is in the future', async () => {
    const payload: IExchangeRateIngestion['message']['payload'] = {
      correlation_id: correlationId,
      event_type: 'exchange-rate.ingested.v1',
      occurred_at: '2026-06-10T12:00:00.000Z',
      producer: 'pl-ingestion',
      data: [
        {
          base_currency_code: SYSTEM_CURRENCIES.EUR.code,
          target_currency_code: SYSTEM_CURRENCIES.USD.code,
          rate: '1.0850',
          rate_class: EExchangeRateType.Official,
          as_of: '2026-06-11T00:00:00.000Z', // Future compared to fake system time of 2026-06-10
          source: 'ECB',
        },
      ],
    };

    const usecase = makeIngestExchangeRateUseCase({
      exchangeRateRepo: exchangeRateRepoMock,
      repoService: mockRepoService,
      logger: mockLogger,
    });

    await expect(usecase(payload)).rejects.toThrow(currencyError.InvalidValue);
  });

  it('should propagate errors from save', async () => {
    const payload: IExchangeRateIngestion['message']['payload'] = {
      correlation_id: correlationId,
      event_type: 'exchange-rate.ingested.v1',
      occurred_at: '2026-06-10T12:00:00.000Z',
      producer: 'pl-ingestion',
      data: [
        {
          base_currency_code: SYSTEM_CURRENCIES.EUR.code,
          target_currency_code: SYSTEM_CURRENCIES.USD.code,
          rate: '1.0850',
          rate_class: EExchangeRateType.Official,
          as_of: '2026-06-10T00:00:00.000Z',
          source: 'ECB',
        },
      ],
    };

    const saveError = new Error('Database save failed');
    exchangeRateRepoMock.create.mockRejectedValue(saveError);

    const usecase = makeIngestExchangeRateUseCase({
      exchangeRateRepo: exchangeRateRepoMock,
      repoService: mockRepoService,
      logger: mockLogger,
    });

    await expect(usecase(payload)).rejects.toThrow(saveError);
  });

  it('should propagate errors from runInTransaction', async () => {
    const payload: IExchangeRateIngestion['message']['payload'] = {
      correlation_id: correlationId,
      event_type: 'exchange-rate.ingested.v1',
      occurred_at: '2026-06-10T12:00:00.000Z',
      producer: 'pl-ingestion',
      data: [
        {
          base_currency_code: SYSTEM_CURRENCIES.EUR.code,
          target_currency_code: SYSTEM_CURRENCIES.USD.code,
          rate: '1.0850',
          rate_class: EExchangeRateType.Official,
          as_of: '2026-06-10T00:00:00.000Z',
          source: 'ECB',
        },
      ],
    };

    const transactionError = new Error('Transaction block failed');
    mockRepoService.runInTransaction.mockRejectedValue(transactionError);

    const usecase = makeIngestExchangeRateUseCase({
      exchangeRateRepo: exchangeRateRepoMock,
      repoService: mockRepoService,
      logger: mockLogger,
    });

    await expect(usecase(payload)).rejects.toThrow(transactionError);
  });

  it('should generate a correlation_id and log a warning if correlation_id is not provided', async () => {
    const payload: Omit<
      IExchangeRateIngestion['message']['payload'],
      'correlation_id'
    > = {
      event_type: 'exchange-rate.ingested.v1',
      occurred_at: '2026-06-10T12:00:00.000Z',
      producer: 'pl-ingestion',
      data: [
        {
          base_currency_code: SYSTEM_CURRENCIES.EUR.code,
          target_currency_code: SYSTEM_CURRENCIES.USD.code,
          rate: '1.0850',
          rate_class: EExchangeRateType.Official,
          as_of: '2026-06-10T00:00:00.000Z',
          source: 'ECB',
        },
      ],
    };

    const usecase = makeIngestExchangeRateUseCase({
      exchangeRateRepo: exchangeRateRepoMock,
      repoService: mockRepoService,
      logger: mockLogger,
    });

    await usecase(
      payload as unknown as IExchangeRateIngestion['message']['payload']
    );

    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Exchange rate ingestion message was sent without a correlation_id'
    );
    expect(mockRepoService.runInTransaction).toHaveBeenCalledTimes(1);
    expect(exchangeRateRepoMock.create).toHaveBeenCalledTimes(1);
    expect(exchangeRateRepoMock.create).toHaveBeenCalledWith(
      expect.any(Array),
      {
        correlationId: 'mocked-uuid',
        tx: 'mock-tx',
      }
    );
  });
});
