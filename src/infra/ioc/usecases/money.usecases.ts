import makeGetCurrenciesUseCase from '../../../app/money/usecases/get-currencies.usecase';
import makeGetExchangeRateUseCase from '../../../app/money/usecases/get-exchange-rates.usecase';
import makeIngestExchangeRateUseCase from '../../../app/money/usecases/ingest-exchange-rate.usecase';
import observability from '../../observability';
import currencyRepos from '../../persistence/repos/money';
import appContext from '../../runtime/app-context';
import repoService from '../services/repo.service';

// TODO [PUR-26]: use named exports for all iocs

export const currencyUseCase = Object.freeze({
  getAll: makeGetCurrenciesUseCase({
    currencyRepo: currencyRepos.currency,
    appContext,
  }),
});

export const exchangeRateUseCases = Object.freeze({
  ingest: makeIngestExchangeRateUseCase({
    exchangeRateRepo: currencyRepos.exchangeRate,
    repoService,
    logger: observability.logger,
  }),

  get: makeGetExchangeRateUseCase({
    exchangeRateRepo: currencyRepos.exchangeRate,
    appContext,
  }),
});
