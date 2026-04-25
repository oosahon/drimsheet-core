import repos from '../../../infra/persistence/repos';
import appContext from '../../context';
import makeCreateLedgerAccountBalanceUseCase from './create-ledger-account-balance.usecase';

const accountingUsecases = {
  createLedgerAccountBalance: makeCreateLedgerAccountBalanceUseCase(
    appContext.request,
    repos.ledgerAccountBalance
  ),
};

export default accountingUsecases;
