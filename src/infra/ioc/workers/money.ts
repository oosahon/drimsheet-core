import makeExchangeRateIngestionWorker from '@app/money/workers/exchange-rate-ingestion.worker';

import { ingestExchangeRateUseCase } from '@infra/ioc/usecases/money';
import observability from '@infra/observability';

export const exchangeRateIngestionWorker = makeExchangeRateIngestionWorker({
  logger: observability.logger,
  usecase: ingestExchangeRateUseCase,
});
