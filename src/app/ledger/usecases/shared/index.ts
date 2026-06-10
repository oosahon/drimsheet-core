import observability from '../../../../infra/observability';
import bookkeepingRepos from '../../../../infra/persistence/repos/bookkeeping';
import ledgerRepos from '../../../../infra/persistence/repos/ledger';
import appContext from '../../../shared/context';
import makeGetLedgerAccountUseCase from './get-ledger-account.usecase';
import makeGetLedgerAccountsUsecase from './get-ledger-accounts.usecase';

const ledgerAccountUsecases = {
  getLedgerAccounts: makeGetLedgerAccountsUsecase(
    appContext.request,
    observability.reporter,
    ledgerRepos.ledgerAccount,
    bookkeepingRepos.ledgerAccountBalance
  ),

  getLedgerAccount: makeGetLedgerAccountUseCase(
    appContext.request,
    ledgerRepos.ledgerAccount,
    observability.reporter,
    bookkeepingRepos.ledgerAccountBalance
  ),
};

export default ledgerAccountUsecases;
