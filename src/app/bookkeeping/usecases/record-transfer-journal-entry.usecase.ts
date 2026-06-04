import IBookkeepingService from '../../../domain/bookkeeping/types/bookkeeping.service.types';
import currencyEntity from '../../../domain/currency/entities/currency.entity';
import IExchangeRateService from '../../../domain/currency/types/exchange-rate.service.types';
import IJournalEntryRepo from '../../../domain/journal-entry/repos/journal-entry.repo';
import {
  EJournalEntrySourceType,
  IjournalEntryMakePayload,
} from '../../../domain/journal-entry/types/journal-entry.types';
import { IJournalLineMakePayload } from '../../../domain/journal-entry/types/journal-line.types';
import { TEntityId } from '../../../shared/types/uuid';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import eventValue from '../../../shared/value-objects/event.vo';
import {
  ITransferTransactionReq,
  transferTransactionReqValidation,
} from '../../bookkeeping/dtos/bookkeeping.dto';
import IEventBus from '../../shared/contracts/event-bus.contract';
import IRequestContext from '../../shared/contracts/request-context.contract';
import moneyMapper from '../../shared/mappers/money.mapper';

export default function makeRecordTransferJournalEntryUseCase(
  requestContext: IRequestContext,
  bookkeepingService: IBookkeepingService,
  exchangeRateService: IExchangeRateService,
  journalEntryRepo: IJournalEntryRepo,
  eventBus: IEventBus
) {
  return async (payload: ITransferTransactionReq) => {
    zodValidationRunner(transferTransactionReqValidation, payload);

    const { accountingEntity, user, correlationId } = requestContext.get();
    const trace = { correlationId };

    const functionalCurrency = currencyEntity.getByCode(
      accountingEntity.functionalCurrencyCode
    );

    const sourceLineExchangeRate = await exchangeRateService.getExchangeRate(
      payload.sourceLine.exchangeRate,
      trace
    );
    const sourceLine: IJournalLineMakePayload = {
      accountId: payload.sourceLine.accountId as TEntityId,
      sequenceOrder: payload.sourceLine.sequenceOrder,
      amount: moneyMapper.fromDto(payload.sourceLine.amount),
      exchangeRate: sourceLineExchangeRate,
      side: payload.sourceLine.side,
      functionalCurrency,
      description: payload.sourceLine.description,
    };

    const destinationLines: IJournalLineMakePayload[] = [];

    for (const line of payload.destinationLines) {
      const destinationLineExchangeRate =
        await exchangeRateService.getExchangeRate(line.exchangeRate, trace);

      const destinationLine: IJournalLineMakePayload = {
        accountId: line.accountId as TEntityId,
        sequenceOrder: line.sequenceOrder,
        amount: moneyMapper.fromDto(line.amount),
        exchangeRate: destinationLineExchangeRate,
        side: line.side,
        functionalCurrency,
        description: line.description,
      };
      destinationLines.push(destinationLine);
    }

    const header: Omit<IjournalEntryMakePayload, 'lines'> = {
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

    const [journalEntries, events] = await bookkeepingService.recordTransaction(
      {
        sourceLine,
        destinationLines,
        header,
      },
      trace
    );

    await journalEntryRepo.save(journalEntries, trace);

    eventBus.publish(eventValue.enrichAll(events, trace));
  };
}
