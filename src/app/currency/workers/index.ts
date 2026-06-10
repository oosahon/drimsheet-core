import observability from '../../../infra/observability';
import makeExchangeRateIngestionWorker from './exchange-rate-ingestion.worker';

const currencyWorkers = {
  exchangeRateIngestion: makeExchangeRateIngestionWorker(
    observability.reporter,
    observability.logger
  ),
};

export default currencyWorkers;
