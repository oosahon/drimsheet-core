import repos from '../../../infra/persistence/repos';
import services from '../../../infra/services';
import appContext from '../../shared/context';
import makeGetCurrenciesUseCase from './get-currencies.usecase';
import makeIngestExchangeRateUseCase from './ingest-exchange-rate.usecase';

const currencyUseCase = Object.freeze({
  getAll: makeGetCurrenciesUseCase(repos.currency, appContext.request),
  ingest: makeIngestExchangeRateUseCase(
    appContext.request,
    repos.exchangeRate,
    services.repo
  ),
});

export default currencyUseCase;
