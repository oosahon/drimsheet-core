import repos from '../../../infra/persistence/repos';
import appContext from '../../context';
import getCurrenciesUseCase from './get-currencies.usecase';

const currencyUseCase = Object.freeze({
  getAll: getCurrenciesUseCase(repos.currency, appContext.request),
});

export default currencyUseCase;
