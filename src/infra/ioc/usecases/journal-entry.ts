import makeCreateOpeningBalanceUseCase from '../../../app/journal-entry/usecases/create-opening-balance.usecase';
import makeCreateReceiptUsecase from '../../../app/journal-entry/usecases/create-receipt.usecase';
import messaging from '../../messaging';
import ledgerRepos from '../../persistence/repos/ledger';
import appContext from '../../runtime/app-context';
import {
  counterpartyAppService,
  counterpartyPersistenceService,
} from '../services/counterparty';
import {
  journalEntryPersistenceService,
  journalEntryService,
  openingBalanceEntryService,
} from '../services/journal-entry';
import { ledgerAccountBalancePropagationService } from '../services/ledger';
import { repoService } from '../services/repo';

export const createOpeningBalanceUseCase = makeCreateOpeningBalanceUseCase({
  appContext: appContext,
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
  eventBus: messaging.eventBus,
  openingBalanceEntryService,
  journalEntryPersistenceService,
  balancePropagationService: ledgerAccountBalancePropagationService,
  repoService: repoService,
});

export const createReceiptUseCase = makeCreateReceiptUsecase({
  appContext,
  counterpartyAppService,
  journalEntryService,
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
  counterpartyPersistenceService,
  journalEntryPersistenceService,
  repoService,
  eventBus: messaging.eventBus,
  balancePropagationService: ledgerAccountBalancePropagationService,
});
