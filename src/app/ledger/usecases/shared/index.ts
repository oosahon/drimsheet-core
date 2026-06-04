import observability from '../../../../infra/observability';
import repos from '../../../../infra/persistence/repos';
import appContext from '../../../shared/context';
import makeGetLedgerAccountUseCase from './get-ledger-account.usecase';
import makeGetLedgerAccountsUsecase from './get-ledger-accounts.usecase';

const ledgerAccountUsecases = {
  getLedgerAccounts: makeGetLedgerAccountsUsecase(
    appContext.request,
    observability.reporter,
    repos.ledgerAccount,
    repos.ledgerAccountBalance
  ),

  getLedgerAccount: makeGetLedgerAccountUseCase(
    appContext.request,
    repos.ledgerAccount,
    observability.reporter,
    repos.ledgerAccountBalance
  ),
};

export default ledgerAccountUsecases;
