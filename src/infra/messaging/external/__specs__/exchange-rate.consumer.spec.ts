import mockReporter from '@shared/contracts/__mocks__/reporter.mock';
import { TEntityId } from '@shared/types/uuid';
import generateUUID from '@shared/utils/uuid-generator';

import mockAppContext from '@app/context/contracts/__mocks__/app-context.mock';
import IExchangeRateIngestion from '@app/money/contracts/exchange-rate-ingestion.contract';

import {
  connectRabbitMQ,
  registerRabbitMQConsumer,
} from '@infra/config/rabbitmq.config';
import registerExchangeRateConsumer from '@infra/messaging/external/exchange-rate.consumer';

jest.mock('../../../../shared/utils/uuid-generator');

jest.mock('../../../config/rabbitmq.config', () => ({
  connectRabbitMQ: jest.fn(),
  registerRabbitMQConsumer: jest.fn(),
}));

jest.mock('../../../ioc/workers/money', () => ({
  exchangeRateIngestionWorker: jest.fn(),
}));

describe('registerExchangeRateConsumer', () => {
  const connection = { connection: 'rabbitmq' };
  const payload: IExchangeRateIngestion['message']['payload'] = {
    correlation_id: 'payload-correlation',
    event_type: 'exchange-rate.ingested.v1',
    occurred_at: '2026-08-15T00:00:00.000Z',
    producer: 'pl-ingestion',
    data: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(connectRabbitMQ).mockResolvedValue(connection as never);
    jest
      .mocked(generateUUID)
      .mockReturnValue('generated-correlation' as TEntityId);
  });

  it('registers the exchange-rate consumer with the app context', async () => {
    await registerExchangeRateConsumer(mockReporter, mockAppContext);

    expect(connectRabbitMQ).toHaveBeenCalledWith(mockReporter);
    expect(registerRabbitMQConsumer).toHaveBeenCalledWith(
      connection,
      expect.objectContaining({
        exchange: 'ingestion.exchange-rate',
        queue: 'pl-core.exchange-rate.ingested',
        routingKey: 'exchange-rate.ingested',
      }),
      mockReporter,
      mockAppContext
    );
  });

  it('maps the external correlation and existing idempotency default', async () => {
    await registerExchangeRateConsumer(mockReporter, mockAppContext);
    const config = jest.mocked(registerRabbitMQConsumer).mock.calls[0][1];

    const initialStore = config.getInitialStore(payload);

    expect(initialStore).toEqual({
      correlationId: 'payload-correlation',
      idempotencyKey: '',
    });
  });

  it('generates a correlation when an unvalidated payload omits it', async () => {
    await registerExchangeRateConsumer(mockReporter, mockAppContext);
    const config = jest.mocked(registerRabbitMQConsumer).mock.calls[0][1];

    const initialStore = config.getInitialStore({
      ...payload,
      correlation_id: '',
    });

    expect(initialStore.correlationId).toBe('generated-correlation');
  });
});
