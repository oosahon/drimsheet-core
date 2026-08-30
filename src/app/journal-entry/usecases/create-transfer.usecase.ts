import IEventBus from '@shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '@shared/contracts/repo.contract';
import { TEntityId } from '@shared/types/uuid';
import zodValidationRunner from '@shared/utils/zod-validation-runner';
import eventValue from '@shared/values/events/event.vo';
import historyValue from '@shared/values/history/history.vo';

import {
  ICreateTransferEntryPayload,
  IJournalEntryService,
} from '@domain/journal-entry/types/journal-entry.service.types';
import { EJournalEntryStatus } from '@domain/journal-entry/types/journal-entry.types';
import ILedgerAccountRepo from '@domain/ledger/repos/ledger-account.repo';
import { ILedgerAccount } from '@domain/ledger/types/ledger.types';
import exchangeRateValue from '@domain/money/values/exchange-rate.vo';

import IAppContext from '@app/context/contracts/app-context.contract';
import IFileManagementService from '@app/file/contracts/file-management.service.contract';
import { EFileUploadPurpose } from '@app/file/types/file.types';
import IJournalEntryPersistenceService from '@app/journal-entry/contracts/journal-entry-persistence.service.contract';
import { IJournalEntryDto } from '@app/journal-entry/dtos/journal-entry/journal-entry.dto';
import journalEntryDtoMapper from '@app/journal-entry/dtos/journal-entry/journal-entry.dto.mapper';
import { ITransferEntryReq } from '@app/journal-entry/dtos/transfer-entry/transfer-entry.dto';
import { transferEntryReqValidation } from '@app/journal-entry/dtos/transfer-entry/transfer-entry.dto.validation';
import ILedgerBalanceAdjustmentQueue from '@app/ledger/contracts/ledger-balance-adjustment-queue.contract';
import ledgerAppError from '@app/ledger/errors/ledger.error';
import moneyMapper from '@app/money/dtos/money/money.dto.mapper';
import IOutboxService from '@app/outbox/contracts/outbox.service.contract';

interface IDependencies {
  appContext: IAppContext;
  fileManagementService: IFileManagementService;
  journalEntryService: IJournalEntryService;
  ledgerAccountRepo: ILedgerAccountRepo;
  journalEntryPersistenceService: IJournalEntryPersistenceService;
  repoService: IRepoService;
  eventBus: IEventBus;
  outboxService: IOutboxService;
  ledgerBalanceAdjustmentQueue: ILedgerBalanceAdjustmentQueue;
}

export default function makeCreateTransferUsecase(deps: IDependencies) {
  return async (payload: ITransferEntryReq): Promise<IJournalEntryDto> => {
    zodValidationRunner(transferEntryReqValidation, payload);

    const { correlationId, accountingEntity, user, idempotencyKey } =
      deps.appContext.get(['user', 'accountingEntity']);
    const repoOptions = { correlationId, idempotencyKey };

    const headerPayload: ICreateTransferEntryPayload['header'] = {
      accountingEntityId: accountingEntity.id,
      memo: payload.memo,
      effectiveDate: payload.effectiveDate,
      postedAt: payload.postedAt,
      functionalCurrencyCode: accountingEntity.functionalCurrencyCode,
      createdBy: user.id,
    };

    const sourceAccount = await deps.ledgerAccountRepo.findById(
      payload.sourceLine.accountId as TEntityId,
      accountingEntity.id,
      repoOptions
    );

    if (!sourceAccount) {
      throw new ledgerAppError.AccountNotFound({
        id: payload.sourceLine.accountId,
      });
    }

    const destinationAccounts: ILedgerAccount[] = [];

    for (const destinationLine of payload.destinationLines) {
      const destinationAccount = await deps.ledgerAccountRepo.findById(
        destinationLine.accountId as TEntityId,
        accountingEntity.id,
        repoOptions
      );

      if (!destinationAccount) {
        throw new ledgerAppError.AccountNotFound({
          id: destinationLine.accountId,
        });
      }

      destinationAccounts.push(destinationAccount);
    }

    const sourceExchangeRate = payload.sourceLine.exchangeRate
      ? exchangeRateValue.make(payload.sourceLine.exchangeRate)
      : null;
    const sourceLinePayload: ICreateTransferEntryPayload['sourceLine'] = {
      account: sourceAccount,
      sequenceOrder: payload.sourceLine.sequenceOrder,
      amount: moneyMapper.fromDto(payload.sourceLine.amount),
      exchangeRate: sourceExchangeRate,
      description: payload.sourceLine.description,
      meta: null,
    };
    const destinationLinesPayload: ICreateTransferEntryPayload['destinationLines'] =
      payload.destinationLines.map((destinationLine, index) => ({
        account: destinationAccounts[index],
        sequenceOrder: destinationLine.sequenceOrder,
        amount: moneyMapper.fromDto(destinationLine.amount),
        exchangeRate: destinationLine.exchangeRate
          ? exchangeRateValue.make(destinationLine.exchangeRate)
          : null,
        description: destinationLine.description,
        meta: null,
      }));

    const attachments = await deps.fileManagementService.claimUploads({
      userId: user.id,
      purpose: EFileUploadPurpose.JournalEntryAttachment,
      references: payload.attachmentReferences ?? [],
    });
    const transferPayload: ICreateTransferEntryPayload = {
      attachments,
      header: headerPayload,
      sourceLine: sourceLinePayload,
      destinationLines: destinationLinesPayload,
    };

    const [journalEntry, journalEntryEvents, journalEntryAudit] =
      await deps.journalEntryService.createTransfer(
        transferPayload,
        repoOptions
      );

    const userActor = historyValue.getUserActor(user.id);
    const journalHeaderHistory = historyValue.make(
      journalEntryAudit.header,
      userActor,
      correlationId
    );
    const journalLinesHistory = journalEntryAudit.lines.map((line) =>
      historyValue.make(line, userActor, correlationId)
    );
    const shouldUpdateBalance =
      journalEntry.status === EJournalEntryStatus.Posted;
    const dbTransactionFn: TRepoTransactionFn = async (tx) => {
      const writeOptions = { correlationId, tx };

      await deps.journalEntryPersistenceService.create(
        journalEntry,
        journalHeaderHistory,
        journalLinesHistory,
        writeOptions
      );

      if (shouldUpdateBalance) {
        await deps.outboxService.createBalancePropagation(
          journalEntry.id,
          writeOptions
        );
      }
    };

    await deps.repoService.runInTransaction(dbTransactionFn);

    if (shouldUpdateBalance) {
      await deps.ledgerBalanceAdjustmentQueue.add({
        journalEntryId: journalEntry.id,
        correlationId,
      });
    }

    await deps.eventBus.publish(
      eventValue.enrichAll(journalEntryEvents, repoOptions)
    );

    return journalEntryDtoMapper.toDto(journalEntry);
  };
}
