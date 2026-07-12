import observability from '../../../infra/observability';
import makeExchangeRateIngestionWorker from './exchange-rate-ingestion.worker';

const currencyWorkers = {
  exchangeRateIngestion: makeExchangeRateIngestionWorker({
    reporter: observability.reporter,
    logger: observability.logger,
  }),
};

export default currencyWorkers;
