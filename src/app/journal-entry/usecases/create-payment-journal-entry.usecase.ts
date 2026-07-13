import { EJournalEntrySourceType } from '../../../domain/journal-entry/types/journal-entry.types';
import { IJournalLineInput } from '../../../domain/journal-entry/types/journal-line.types';
import currencyEntity from '../../../domain/money/entities/currency.entity';
import exchangeRateValue from '../../../domain/money/value-objects/exchange-rate.vo';
import IAppContext from '../../../shared/contracts/app-context.contract';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import { TEntityId } from '../../../shared/types/uuid';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import eventValue from '../../../shared/value-objects/event.vo';
import historyValue from '../../../shared/value-objects/history.vo';
import IJournalEntryPersistenceService from '../../bookkeeping/contracts/journal-entry-persistence.service.contract';
import ITransactionEntryService from '../../bookkeeping/contracts/transaction-entry.service.contract';
import moneyMapper from '../../money/dtos/money/money.dto.mapper';
import { ITransactionJournalEntryReq } from '../dtos/transaction-journal-entry/transaction-journal-entry.dto';
import { transactionJournalEntryReqValidation } from '../dtos/transaction-journal-entry/transaction-journal-entry.dto.validation';

interface IDependencies {
  appContext: IAppContext;
  transactionEntryService: ITransactionEntryService;
  journalEntryPersistenceService: IJournalEntryPersistenceService;
  eventBus: IEventBus;
}

export default function makeCreatePaymentJournalEntryUseCase(
  deps: IDependencies
) {
  return async (payload: ITransactionJournalEntryReq) => {
    zodValidationRunner(transactionJournalEntryReqValidation, payload);

    const { accountingEntity, user, correlationId } = deps.appContext.get();
    const trace = { correlationId };

    const functionalCurrency = currencyEntity.getByCode(
      accountingEntity.functionalCurrencyCode
    );

    const sourceLineExchangeRate = payload.sourceLine.exchangeRate
      ? exchangeRateValue.make(payload.sourceLine.exchangeRate)
      : null;
    const sourceLine: IJournalLineInput = {
      accountId: payload.sourceLine.accountId as TEntityId,
      sequenceOrder: payload.sourceLine.sequenceOrder,
      amount: moneyMapper.fromDto(payload.sourceLine.amount),
      exchangeRate: sourceLineExchangeRate,
      functionalCurrency,
      description: payload.sourceLine.description,
    };

    const destinationLines: IJournalLineInput[] = [];

    for (const line of payload.destinationLines) {
      const destinationLineExchangeRate = line.exchangeRate
        ? exchangeRateValue.make(line.exchangeRate)
        : null;

      destinationLines.push({
        accountId: line.accountId as TEntityId,
        sequenceOrder: line.sequenceOrder,
        amount: moneyMapper.fromDto(line.amount),
        exchangeRate: destinationLineExchangeRate,
        functionalCurrency,
        description: line.description,
      });
    }

    const header = {
      accountingEntityId: accountingEntity.id,
      sourceType: EJournalEntrySourceType.Payment,
      counterPartyId: null, // TODO: determine counterparty based on transaction type
      status: payload.status,
      effectiveDate: payload.effectiveDate,
      postedAt: payload.postedAt,
      voidedAt: null,
      voidingEntryId: null,
      memo: payload.memo,
      createdBy: user.id,
      functionalCurrency,
    };

    const [journalEntry, events, audit] =
      await deps.transactionEntryService.create(
        sourceLine,
        destinationLines,
        header,
        trace
      );

    const actor = historyValue.getUserActor(user.id);
    const headerHistory = historyValue.make(audit.header, actor, correlationId);
    const lineHistories = audit.lines.map((lineAudit) =>
      historyValue.make(lineAudit, actor, correlationId)
    );

    await deps.journalEntryPersistenceService.create(
      journalEntry,
      headerHistory,
      lineHistories,
      trace
    );

    deps.eventBus.publish(eventValue.enrichAll(events, trace));
  };
}
