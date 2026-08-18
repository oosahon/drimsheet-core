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
import outboxService from '@infra/ioc/services/outbox';
import { repoService } from '@infra/ioc/services/repo';
import messaging from '@infra/messaging';
import { makeTracedUseCase } from '@infra/observability/usecase-tracing';
import ledgerRepos from '@infra/persistence/repos/ledger';
import appContext from '@infra/runtime/app-context';

export const createOpeningBalanceUseCase = makeTracedUseCase(
  'journalEntry.createOpeningBalanceUseCase',
  makeCreateOpeningBalanceUseCase({
    appContext: appContext,
    ledgerAccountRepo: ledgerRepos.ledgerAccount,
    eventBus: messaging.eventBus,
    journalEntryService,
    journalEntryPersistenceService,
    outboxService,
    ledgerBalanceAdjustmentQueue: messaging.queues.ledgerBalanceAdjustment,
    repoService: repoService,
  })
);

export const createReceiptUseCase = makeTracedUseCase(
  'journalEntry.createReceiptUseCase',
  makeCreateReceiptUsecase({
    appContext,
    counterpartyAppService,
    journalEntryService,
    ledgerAccountRepo: ledgerRepos.ledgerAccount,
    counterpartyPersistenceService,
    journalEntryPersistenceService,
    repoService,
    eventBus: messaging.eventBus,
    outboxService,
    ledgerBalanceAdjustmentQueue: messaging.queues.ledgerBalanceAdjustment,
  })
);
