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

import { ICounterpartyHistory } from '@domain/counterparty/types/counterparty-audit.types';
import { ICounterparty } from '@domain/counterparty/types/counterparty.types';
import {
  ICreateReceiptEntryPayload,
  IJournalEntryService,
} from '@domain/journal-entry/types/journal-entry.service.types';
import ILedgerAccountRepo from '@domain/ledger/repos/ledger-account.repo';
import exchangeRateValue from '@domain/money/values/exchange-rate.vo';

import IAppContext from '@app/context/contracts/app-context.contract';
import ICounterpartyAppService from '@app/counterparty/contracts/counterparty.service.contract';
import ICounterpartyPersistenceService from '@app/counterparty/contracts/persistence.service.contract';
import IJournalEntryPersistenceService from '@app/journal-entry/contracts/journal-entry-persistence.service.contract';
import { IJournalEntryDto } from '@app/journal-entry/dtos/journal-entry/journal-entry.dto';
import journalEntryDtoMapper from '@app/journal-entry/dtos/journal-entry/journal-entry.dto.mapper';
import { IReceiptEntryReq } from '@app/journal-entry/dtos/receipt-entry/receipt-entry.dto';
import { receiptEntryReqValidation } from '@app/journal-entry/dtos/receipt-entry/receipt-entry.dto.validation';
import { ILedgerAccountBalancePropagationService } from '@app/ledger/contracts/ledger-account-balance-propagation.service.contract';
import ledgerAppError from '@app/ledger/errors/ledger.error';
import moneyMapper from '@app/money/dtos/money/money.dto.mapper';

interface IDependencies {
  appContext: IAppContext;
  counterpartyAppService: ICounterpartyAppService;
  journalEntryService: IJournalEntryService;
  ledgerAccountRepo: ILedgerAccountRepo;
  counterpartyPersistenceService: ICounterpartyPersistenceService;
  journalEntryPersistenceService: IJournalEntryPersistenceService;
  repoService: IRepoService;
  eventBus: IEventBus;
  balancePropagationService: ILedgerAccountBalancePropagationService;
}

export default function makeCreateReceiptUsecase(deps: IDependencies) {
  return async (payload: IReceiptEntryReq): Promise<IJournalEntryDto> => {
    zodValidationRunner(receiptEntryReqValidation, payload);

    const { correlationId, accountingEntity, user, idempotencyKey } =
      deps.appContext.get();

    const repoOptions = { correlationId, idempotencyKey };

    const headerPayload: ICreateReceiptEntryPayload['header'] = {
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

    const allCounterpartiesPayload = payload.destinationLines
      .map((dl) => dl.counterparty)
      .concat(payload.sourceLine.counterparty)
      .filter(Boolean);

    const allCounterparties =
      await deps.counterpartyAppService.findOrCreateMany(
        allCounterpartiesPayload,
        accountingEntity.id,
        repoOptions
      );

    const sourceExchangeRate = payload.sourceLine.exchangeRate
      ? exchangeRateValue.make(payload.sourceLine.exchangeRate)
      : null;

    const sourceLineCounterparty =
      deps.counterpartyAppService.getFoundOrCreated(
        payload.sourceLine.counterparty,
        allCounterparties
      )?.data[0] ?? null;

    const sourceLinePayload: ICreateReceiptEntryPayload['sourceLine'] = {
      account: sourceAccount,
      counterparty: sourceLineCounterparty,
      sequenceOrder: payload.sourceLine.sequenceOrder,
      amount: moneyMapper.fromDto(payload.sourceLine.amount),
      exchangeRate: sourceExchangeRate,
      description: payload.sourceLine.description,
      meta: null,
    };

    const destinationLinesPayload: ICreateReceiptEntryPayload['destinationLines'] =
      [];

    for (const line of payload.destinationLines) {
      const lineAccount = await deps.ledgerAccountRepo.findById(
        line.accountId as TEntityId,
        accountingEntity.id,
        repoOptions
      );
      if (!lineAccount) {
        throw new ledgerAppError.AccountNotFound({
          id: line.accountId,
        });
      }

      const lineExchangeRate = line.exchangeRate
        ? exchangeRateValue.make(line.exchangeRate)
        : null;

      const lineCounterparty =
        deps.counterpartyAppService.getFoundOrCreated(
          line.counterparty,
          allCounterparties
        )?.data[0] ?? null;

      destinationLinesPayload.push({
        account: lineAccount,
        counterparty: lineCounterparty,
        sequenceOrder: line.sequenceOrder,
        amount: moneyMapper.fromDto(line.amount),
        exchangeRate: lineExchangeRate,
        description: line.description,
        meta: null,
      });
    }

    const receiptPayload = {
      header: headerPayload,
      sourceLine: sourceLinePayload,
      destinationLines: destinationLinesPayload,
    };

    const [journalEntry, journalEntryEvents, journalEntryAudit] =
      await deps.journalEntryService.createReceipt(receiptPayload, repoOptions);

    const userActor = historyValue.getUserActor(user.id);

    const journalHeaderHistory = historyValue.make(
      journalEntryAudit.header,
      userActor,
      correlationId
    );
    const journalLinesHistory = journalEntryAudit.lines.map((line) =>
      historyValue.make(line, userActor, correlationId)
    );

    const counterpartiesToCreate: [ICounterparty, ICounterpartyHistory][] = [];

    const counterpartyEvents: IEvent<ICounterparty>[][] = [];

    for (const newCounterparty of allCounterparties.values()) {
      if (!newCounterparty.new) continue;

      const [counterparty, events, audit] = newCounterparty.data;

      const history = historyValue.make(audit, userActor, correlationId);
      counterpartiesToCreate.push([counterparty, history]);
      counterpartyEvents.push(events);
    }

    const dbTransactionFn: TRepoTransactionFn = async (tx) => {
      const writeOptions = { correlationId, tx };

      for (const [counterparty, history] of counterpartiesToCreate) {
        await deps.counterpartyPersistenceService.create(counterparty, {
          ...writeOptions,
          history,
        });
      }

      await deps.journalEntryPersistenceService.create(
        journalEntry,
        journalHeaderHistory,
        journalLinesHistory,
        writeOptions
      );
    };

    await deps.repoService.runInTransaction(dbTransactionFn);
    await deps.balancePropagationService.propagate(journalEntry, repoOptions);

    const allEvents: IEvent<unknown>[] = [
      ...counterpartyEvents.flat(),
      ...journalEntryEvents,
    ];

    await deps.eventBus.publish(eventValue.enrichAll(allEvents, repoOptions));

    return journalEntryDtoMapper.toDto(journalEntry);
  };
}
