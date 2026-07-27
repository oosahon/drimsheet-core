import makeCreateOpeningBalanceUseCase from '../../../app/journal-entry/usecases/create-opening-balance.usecase';
import messaging from '../../messaging';
import ledgerRepos from '../../persistence/repos/ledger';
import appContext from '../../runtime/app-context';
import bookkeepingServices from '../services/bookkeeping';
import repoService from '../services/repo';

const journalEntryUseCases = {
  createOpeningBalance: makeCreateOpeningBalanceUseCase({
    appContext: appContext,
    ledgerAccountRepo: ledgerRepos.ledgerAccount,
    eventBus: messaging.eventBus,
    openingBalanceEntryService: bookkeepingServices.openingBalanceEntry,
    journalEntryPersistenceService: bookkeepingServices.journalEntryPersistence,
    balancePropagationService: bookkeepingServices.balancePropagation,
    repoService: repoService,
  }),
};

export default journalEntryUseCases;
