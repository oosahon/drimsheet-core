import makeGetCurrenciesUseCase from '../../../app/money/usecases/get-currencies.usecase';
import makeGetExchangeRateUseCase from '../../../app/money/usecases/get-exchange-rates.usecase';
import makeIngestExchangeRateUseCase from '../../../app/money/usecases/ingest-exchange-rate.usecase';
import observability from '../../observability';
import currencyRepos from '../../persistence/repos/money';
import appContext from '../../runtime/app-context';
import { repoService } from '../services/repo';

export const getAllCurrenciesUseCase = makeGetCurrenciesUseCase({
  currencyRepo: currencyRepos.currency,
  appContext,
});

export const ingestExchangeRateUseCase = makeIngestExchangeRateUseCase({
  exchangeRateRepo: currencyRepos.exchangeRate,
  repoService,
  logger: observability.logger,
});

export const getExchangeRateUseCase = makeGetExchangeRateUseCase({
  exchangeRateRepo: currencyRepos.exchangeRate,
  appContext,
});
