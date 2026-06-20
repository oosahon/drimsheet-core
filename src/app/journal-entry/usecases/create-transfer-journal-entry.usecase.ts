import currencyEntity from '../../../domain/currency/entities/currency.entity';
import IExchangeRateService from '../../../domain/currency/types/exchange-rate.service.types';
import { EJournalEntrySourceType } from '../../../domain/journal-entry/types/journal-entry.types';
import { IJournalLineInput } from '../../../domain/journal-entry/types/journal-line.types';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import { TEntityId } from '../../../shared/types/uuid';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import eventValue from '../../../shared/value-objects/event.vo';
import historyValue from '../../../shared/value-objects/history.vo';
import IJournalEntryPersistenceService from '../../bookkeeping/contracts/journal-entry-persistence.service.contract';
import ITransactionEntryService from '../../bookkeeping/contracts/transaction-entry.service.contract';
import IRequestContext from '../../shared/contracts/request-context.contract';
import moneyMapper from '../../shared/mappers/money.mapper';
import {
  ITransactionJournalEntryReq,
  transactionJournalEntryReqValidation,
} from '../dtos/transaction-journal-entry.dto';

export default function makeCreateTransferJournalEntryUseCase(
  requestContext: IRequestContext,
  transactionEntryService: ITransactionEntryService,
  journalEntryPersistenceService: IJournalEntryPersistenceService,
  exchangeRateService: IExchangeRateService,
  eventBus: IEventBus
) {
  return async (payload: ITransactionJournalEntryReq) => {
    zodValidationRunner(transactionJournalEntryReqValidation, payload);

    const { accountingEntity, user, correlationId } = requestContext.get();
    const trace = { correlationId };

    const functionalCurrency = currencyEntity.getByCode(
      accountingEntity.functionalCurrencyCode
    );

    const sourceLineExchangeRate = await exchangeRateService.getExchangeRate(
      payload.sourceLine.exchangeRate,
      trace
    );
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
      const destinationLineExchangeRate =
        await exchangeRateService.getExchangeRate(line.exchangeRate, trace);

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
      sourceType: EJournalEntrySourceType.Transfer,
      counterPartyId: null,
      status: payload.status,
      effectiveDate: payload.effectiveDate,
      postedAt: payload.postedAt,
      voidedAt: null,
      voidingEntryId: null,
      memo: payload.memo,
      createdBy: user.id,
      functionalCurrency,
    };

    const [journalEntry, events, audit] = await transactionEntryService.create(
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

    await journalEntryPersistenceService.create(
      journalEntry,
      headerHistory,
      lineHistories,
      trace
    );

    eventBus.publish(eventValue.enrichAll(events, trace));
  };
}
