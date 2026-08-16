import mockLogger from '@shared/contracts/__mocks__/logger.mock';

import IExchangeRateIngestion from '@app/money/contracts/exchange-rate-ingestion.contract';
import makeExchangeRateIngestionWorker from '@app/money/workers/exchange-rate-ingestion.worker';

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
    const usecase = jest.fn().mockResolvedValue(undefined);
    const worker = makeExchangeRateIngestionWorker({
      logger: mockLogger,
      usecase,
    });

    await worker(payload);

    expect(usecase).toHaveBeenCalledWith(payload);
    expect(mockLogger.info).toHaveBeenNthCalledWith(
      1,
      'exchange_rate.ingestion.started'
    );
    expect(mockLogger.info).toHaveBeenNthCalledWith(
      2,
      'exchange_rate.ingestion.completed',
      { outcome: 'success' }
    );
  });

  it('propagates processing failures without logging success', async () => {
    const processingError = new Error('processing failed');
    const usecase = jest.fn().mockRejectedValue(processingError);
    const worker = makeExchangeRateIngestionWorker({
      logger: mockLogger,
      usecase,
    });

    await expect(worker(payload)).rejects.toBe(processingError);

    expect(mockLogger.info).not.toHaveBeenCalledWith(
      'exchange_rate.ingestion.completed',
      expect.anything()
    );
  });
});
