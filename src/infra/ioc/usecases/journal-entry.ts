import makeCreateOpeningBalanceUseCase from '@app/journal-entry/usecases/create-opening-balance.usecase';
import makeCreateReceiptUsecase from '@app/journal-entry/usecases/create-receipt.usecase';

import {
  counterpartyAppService,
  counterpartyPersistenceService,
} from '@infra/ioc/services/counterparty';
import {
  journalEntryPersistenceService,
  journalEntryService,
} from '@infra/ioc/services/journal-entry';
import { ledgerAccountBalancePropagationService } from '@infra/ioc/services/ledger';
import { repoService } from '@infra/ioc/services/repo';
import messaging from '@infra/messaging';
import ledgerRepos from '@infra/persistence/repos/ledger';
import appContext from '@infra/runtime/app-context';

export const createOpeningBalanceUseCase = makeCreateOpeningBalanceUseCase({
  appContext: appContext,
  ledgerAccountRepo: ledgerRepos.ledgerAccount,
  eventBus: messaging.eventBus,
  journalEntryService,
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
