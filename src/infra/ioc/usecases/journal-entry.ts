import makeCreateOpeningBalanceUseCase from '../../../app/journal-entry/usecases/create-opening-balance.usecase';
import messaging from '../../messaging';
import ledgerRepos from '../../persistence/repos/ledger';
import appContext from '../../runtime/app-context';
import {
  journalEntryPersistenceService,
  journalEntryService,
} from '../services/journal-entry';
import { ledgerAccountBalancePropagationService } from '../services/ledger';
import { repoService } from '../services/repo';

export const createOpeningBalanceUseCase = makeCreateOpeningBalanceUseCase({
  appContext: appContext,
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
  eventBus: messaging.eventBus,
  journalEntryService,
  journalEntryPersistenceService,
  balancePropagationService: ledgerAccountBalancePropagationService,
  repoService: repoService,
});
