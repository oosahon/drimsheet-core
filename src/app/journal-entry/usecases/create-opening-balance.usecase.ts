import IEventBus from '@shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '@shared/contracts/repo.contract';
import { TEntityId } from '@shared/types/uuid';
import zodValidationRunner from '@shared/utils/zod-validation-runner';
import eventValue from '@shared/values/events/event.vo';
import { IEvent } from '@shared/values/events/types/event.types';
import historyValue from '@shared/values/history/history.vo';

import { IJournalEntryService } from '@domain/journal-entry/types/journal-entry.service.types';
import { EJournalEntryStatus } from '@domain/journal-entry/types/journal-entry.types';
import ledgerAccountEntity from '@domain/ledger/entities/ledger-account.entity';
import ILedgerAccountRepo from '@domain/ledger/repos/ledger-account.repo';
import exchangeRateValue from '@domain/money/values/exchange-rate.vo';

import IAppContext from '@app/context/contracts/app-context.contract';
import IJournalEntryPersistenceService from '@app/journal-entry/contracts/journal-entry-persistence.service.contract';
import { IOpeningBalanceCreationReq } from '@app/journal-entry/dtos/opening-balance/opening-balance.dto';
import { openingBalanceCreationReqValidation } from '@app/journal-entry/dtos/opening-balance/opening-balance.dto.validation';
import ILedgerBalanceAdjustmentQueue from '@app/ledger/contracts/ledger-balance-adjustment-queue.contract';
import ledgerAppError from '@app/ledger/errors/ledger.error';
import moneyMapper from '@app/money/dtos/money/money.dto.mapper';
import IOutboxService from '@app/outbox/contracts/outbox.service.contract';
import IFxCostBasisPersistenceService from '@app/subledger/fx-cost-basis/contracts/fx-cost-basis-persistence.service.contract';
import IFxLotAppService from '@app/subledger/fx-cost-basis/contracts/fx-lot.service.contract';

interface IDependencies {
  appContext: IAppContext;
  ledgerAccountRepo: ILedgerAccountRepo;
  eventBus: IEventBus;
  journalEntryService: IJournalEntryService;
  journalEntryPersistenceService: IJournalEntryPersistenceService;
  outboxService: IOutboxService;
  ledgerBalanceAdjustmentQueue: ILedgerBalanceAdjustmentQueue;
  repoService: IRepoService;
  fxLotAppService: IFxLotAppService;
  fxCostBasisPersistenceService: IFxCostBasisPersistenceService;
}

export default function makeCreateOpeningBalanceUseCase(deps: IDependencies) {
  return async (payload: IOpeningBalanceCreationReq) => {
    zodValidationRunner(openingBalanceCreationReqValidation, payload);

    const { accountingEntity, correlationId, user } = deps.appContext.get([
      'user',
      'accountingEntity',
    ]);
    const repoOptions = { correlationId };

    const account = await deps.ledgerAccountRepo.findById(
      payload.accountId as TEntityId,
      accountingEntity.id,
      repoOptions
    );

    if (!account) throw new ledgerAppError.AccountNotFound();

    const amount = moneyMapper.fromDto(payload.amount);
    const exchangeRate = payload.exchangeRate
      ? exchangeRateValue.make(payload.exchangeRate)
      : null;

    const balanceCreationPayload = {
      accountingEntityId: accountingEntity.id,
      functionalCurrencyCode: accountingEntity.functionalCurrencyCode,
      account,
      amount,
      effectiveDate: payload.date,
      exchangeRate,
      createdBy: account.createdBy,
    };

    const [journalEntry, journalEvents, audit] =
      await deps.journalEntryService.createOpeningBalance(
        balanceCreationPayload,
        repoOptions
      );

    const [updatedAccount, accountEvents, accountAudit] =
      ledgerAccountEntity.updateOpeningBalanceDate(account, payload.date);

    const actor = historyValue.getUserActor(user.id);
    const accountHistory = historyValue.make(
      accountAudit,
      actor,
      correlationId
    );
    const headerHistory = historyValue.make(audit.header, actor, correlationId);
    const lineHistories = audit.lines.map((lineAudit) =>
      historyValue.make(lineAudit, actor, correlationId)
    );

    const shouldUpdateBalance =
      journalEntry.status === EJournalEntryStatus.Posted;

    const fxResult = await deps.fxLotAppService.acquire(
      { journalEntry, account, actor },
      repoOptions
    );

    const transactionFn: TRepoTransactionFn = async (tx) => {
      const writeRepoOptions = { ...repoOptions, tx };

      await deps.ledgerAccountRepo.update(updatedAccount, {
        ...writeRepoOptions,
        history: accountHistory,
      });

      await deps.journalEntryPersistenceService.create(
        journalEntry,
        headerHistory,
        lineHistories,
        writeRepoOptions
      );

      if (fxResult) {
        await deps.fxCostBasisPersistenceService.persistAcquisition(
          fxResult.records,
          writeRepoOptions
        );
      }

      if (shouldUpdateBalance) {
        await deps.outboxService.createBalancePropagation(
          journalEntry.id,
          writeRepoOptions
        );
      }
    };

    await deps.repoService.runInTransaction(transactionFn);

    if (shouldUpdateBalance) {
      await deps.ledgerBalanceAdjustmentQueue.add({
        journalEntryId: journalEntry.id,
        correlationId,
      });
    }

    const allEvents: IEvent<unknown>[] = [
      ...accountEvents,
      ...journalEvents,
      ...(fxResult?.events ?? []),
    ];
    deps.eventBus.publish(eventValue.enrichAll(allEvents, repoOptions));
  };
}
