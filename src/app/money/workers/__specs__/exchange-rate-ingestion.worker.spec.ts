import mockLogger from '../../../../shared/contracts/__mocks__/logger.mock';
import mockReporter from '../../../../shared/contracts/__mocks__/reporter.mock';
import IExchangeRateIngestion from '../../contracts/exchange-rate-ingestion.contract';
import makeExchangeRateIngestionWorker from '../exchange-rate-ingestion.worker';

describe('makeExchangeRateIngestionWorker', () => {
  const payload: IExchangeRateIngestion['message']['payload'] = {
    correlation_id: 'correlation-id',
    event_type: 'exchange-rate.ingested.v1',
    occurred_at: '2026-07-25T00:00:00.000Z',
    producer: 'pl-ingestion',
    data: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs successful ingestion only after processing completes', async () => {
    const ingestExchangeRate = jest.fn().mockResolvedValue(undefined);
    const worker = makeExchangeRateIngestionWorker({
      reporter: mockReporter,
      logger: mockLogger,
      ingestExchangeRate,
    });

    await worker(payload);

    expect(ingestExchangeRate).toHaveBeenCalledWith(payload);
    expect(mockReporter.report).not.toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenNthCalledWith(
      1,
      'Initiating currency exchange rate ingestion'
    );
    expect(mockLogger.info).toHaveBeenNthCalledWith(
      2,
      'Currency exchange rate ingested successfully'
    );
  });

  it('reports safe metadata and propagates processing failures', async () => {
    const processingError = new Error('processing failed');
    const ingestExchangeRate = jest.fn().mockRejectedValue(processingError);
    const worker = makeExchangeRateIngestionWorker({
      reporter: mockReporter,
      logger: mockLogger,
      ingestExchangeRate,
    });

    await expect(worker(payload)).rejects.toBe(processingError);

    expect(mockReporter.report).toHaveBeenCalledWith(processingError, {
      type: 'exchange-rate-ingestion',
      correlationId: payload.correlation_id,
    });
    expect(mockLogger.info).not.toHaveBeenCalledWith(
      'Currency exchange rate ingested successfully'
    );
  });
});
