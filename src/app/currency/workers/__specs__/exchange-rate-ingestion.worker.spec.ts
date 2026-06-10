import { SYSTEM_CURRENCIES } from '../../../../domain/currency/config/currencies.config';
import { EExchangeRateType } from '../../../../domain/currency/types/exchange-rate.types';
import mockLogger from '../../../../infra/observability/__mocks__/logger.mock';
import mockReporter from '../../../../infra/observability/__mocks__/reporter.mock';
import mockRequestContext from '../../../shared/contracts/__mocks__/request-context.mock';
import IExchangeRateIngestion from '../../contracts/exchange-rate-ingestion.contract';
import currencyUseCase from '../../usecases';
import makeExchangeRateIngestionWorker from '../exchange-rate-ingestion.worker';

jest.mock('../../usecases', () => ({
  __esModule: true,
  default: {
    ingest: jest.fn(),
  },
}));

describe('makeExchangeRateIngestionWorker', () => {
  const correlationId = 'test-correlation-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const getValidPayload = (): IExchangeRateIngestion['message']['payload'] => ({
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
  });

  it('should successfully ingest exchange rates', async () => {
    const worker = makeExchangeRateIngestionWorker(
      mockReporter,
      mockRequestContext,
      mockLogger
    );

    const payload = getValidPayload();
    (currencyUseCase.ingest as jest.Mock).mockResolvedValue(undefined);

    mockRequestContext.init.mockImplementation((store, cb) => {
      cb();
    });

    await worker(payload);

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Initiating currency exchange rate ingestion'
    );
    expect(mockRequestContext.init).toHaveBeenCalledWith(
      { correlationId },
      expect.any(Function)
    );
    expect(currencyUseCase.ingest).toHaveBeenCalledWith(payload);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Currency exchange rate ingested successfully'
    );
    expect(mockReporter.report).not.toHaveBeenCalled();
  });

  it('should generate a correlationId if correlation_id is missing from payload', async () => {
    const worker = makeExchangeRateIngestionWorker(
      mockReporter,
      mockRequestContext,
      mockLogger
    );

    const payload = getValidPayload() as unknown as Omit<
      IExchangeRateIngestion['message']['payload'],
      'correlation_id'
    > & { correlation_id?: string };
    delete payload.correlation_id;

    (currencyUseCase.ingest as jest.Mock).mockResolvedValue(undefined);
    mockRequestContext.init.mockImplementation((store, cb) => {
      cb();
    });

    await worker(
      payload as unknown as IExchangeRateIngestion['message']['payload']
    );

    expect(mockLogger.warn).toHaveBeenCalledWith(
      'Exchange rate ingestion message was sent without a correlation_id'
    );
    expect(mockRequestContext.init).toHaveBeenCalledWith(
      { correlationId: expect.any(String) },
      expect.any(Function)
    );
    expect(currencyUseCase.ingest).toHaveBeenCalledWith(payload);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Currency exchange rate ingested successfully'
    );
  });

  it('should report an error if use case ingestion rejects', async () => {
    const worker = makeExchangeRateIngestionWorker(
      mockReporter,
      mockRequestContext,
      mockLogger
    );

    const payload = getValidPayload();
    const ingestError = new Error('Usecase failed');
    (currencyUseCase.ingest as jest.Mock).mockRejectedValue(ingestError);

    mockRequestContext.init.mockImplementation((store, cb) => {
      cb();
    });

    await worker(payload);

    expect(mockReporter.report).toHaveBeenCalledWith(ingestError);
    expect(mockLogger.info).toHaveBeenCalledWith(
      'Currency exchange rate ingested successfully'
    );
  });

  it('should report error and log context if requestContext.init throws synchronous error', async () => {
    const worker = makeExchangeRateIngestionWorker(
      mockReporter,
      mockRequestContext,
      mockLogger
    );

    const payload = getValidPayload();
    const initError = new Error('Init failed');
    mockRequestContext.init.mockImplementation(() => {
      throw initError;
    });

    await worker(payload);

    expect(mockReporter.report).toHaveBeenCalledWith(initError, {
      context: 'Failed to ingest exchange rate',
    });
  });
});
