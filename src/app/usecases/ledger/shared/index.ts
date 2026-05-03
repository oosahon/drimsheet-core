import observability from '../../../../infra/observability';
import repos from '../../../../infra/persistence/repos';
import appContext from '../../../context';
import makeGetLedgerAccountsUsecase from './get-ledger-accounts.usecase';

const ledgerAccountUsecases = {
  getLedgerAccounts: makeGetLedgerAccountsUsecase(
    appContext.request,
    observability.reporter,
    repos.ledgerAccount,
    repos.ledgerAccountBalance
  ),
};

export default ledgerAccountUsecases;
