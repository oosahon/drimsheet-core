import makeCreatePaymentUsecase from '@app/journal-entry/usecases/create-payment.usecase';
import makeCreateReceiptUsecase from '@app/journal-entry/usecases/create-receipt.usecase';
import makeCreateTransferUsecase from '@app/journal-entry/usecases/create-transfer.usecase';
import makeGetJournalEntriesUsecase from '@app/journal-entry/usecases/get-journal-entries.usecase';

import {
  counterpartyAppService,
  counterpartyPersistenceService,
} from '@infra/ioc/services/counterparty';
import { fileManagementService } from '@infra/ioc/services/file';
import {
  fxCostBasisPersistenceService,
  fxLotAppService,
} from '@infra/ioc/services/fx-lot-cost-basis';
import {
  journalEntryPersistenceService,
  journalEntryService,
} from '@infra/ioc/services/journal-entry';
import outboxService from '@infra/ioc/services/outbox';
import { repoService } from '@infra/ioc/services/repo';
import messaging from '@infra/messaging';
import { makeTracedUseCase } from '@infra/observability/usecase-tracing';
import journalEntryRepos from '@infra/persistence/repos/journal-entry';
import ledgerRepos from '@infra/persistence/repos/ledger';
import appContext from '@infra/runtime/app-context';

export const getJournalEntriesUseCase = makeTracedUseCase(
  'journalEntry.getJournalEntriesUseCase',
  makeGetJournalEntriesUsecase({
    appContext,
    journalEntryQueryRepo: journalEntryRepos.queries.journalEntry,
  })
);

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
    fxLotAppService,
    fxCostBasisPersistenceService,
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
    fxLotAppService,
    fxCostBasisPersistenceService,
  })
);

export const createTransferUseCase = makeTracedUseCase(
  'journalEntry.createTransferUseCase',
  makeCreateTransferUsecase({
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
    fxLotAppService,
    fxCostBasisPersistenceService,
  })
);
