import repos from '../../../infra/persistence/repos';
import appContext from '../../shared/context';
import makeGetCurrenciesUseCase from './get-currencies.usecase';

const currencyUseCase = Object.freeze({
  getAll: makeGetCurrenciesUseCase(repos.currency, appContext.request),
});

export default currencyUseCase;
