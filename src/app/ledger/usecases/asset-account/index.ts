import messaging from '../../../../infra/messaging';
import journalEntryRepos from '../../../../infra/persistence/repos/journal-entry';
import ledgerRepos from '../../../../infra/persistence/repos/ledger';
import services from '../../../../infra/services';
import bookkeepingDomainServices from '../../../../infra/services/domain/bookkeeping.domain.service';
import currencyDomainServices from '../../../../infra/services/domain/currency.domain.service';
import ledgerDomainServices from '../../../../infra/services/domain/ledger.domain.service';
import appContext from '../../../shared/context';
import makeCreatePettyCashSubAccountUseCase from './create-petty-cash-sub-account.usecase';

const assetAccountUseCase = {
  makePettyCashSubAccount: makeCreatePettyCashSubAccountUseCase(
    appContext.request,
    messaging.eventBus,
    ledgerRepos.ledgerAccount,
    journalEntryRepos.journalEntry,
    ledgerDomainServices.assetAccount,
    bookkeepingDomainServices.bookkeeping,
    currencyDomainServices.exchangeRate,
    services.repo
  ),
};

export default assetAccountUseCase;
