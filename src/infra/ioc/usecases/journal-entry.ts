import makeCreatePaymentUsecase from '@app/journal-entry/usecases/create-payment.usecase';
import makeCreateReceiptUsecase from '@app/journal-entry/usecases/create-receipt.usecase';

import {
  counterpartyAppService,
  counterpartyPersistenceService,
} from '@infra/ioc/services/counterparty';
import { fileManagementService } from '@infra/ioc/services/file';
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

export const createPaymentUseCase = makeTracedUseCase(
  'journalEntry.createPaymentUseCase',
  makeCreatePaymentUsecase({
    appContext,
    counterpartyAppService,
    fileManagementService,
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

export const createReceiptUseCase = makeTracedUseCase(
  'journalEntry.createReceiptUseCase',
  makeCreateReceiptUsecase({
    appContext,
    counterpartyAppService,
    fileManagementService,
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
