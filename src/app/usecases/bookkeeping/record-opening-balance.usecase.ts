import IBookkeepingService from '../../../domain/bookkeeping/types/bookkeeping.service.types';
import IExchangeRateService from '../../../domain/currency/types/exchange-rate.service.types';
import IJournalEntryRepo from '../../../domain/journal-entry/repos/journal-entry.repo';
import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import { TEntityId } from '../../../shared/types/uuid';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import eventValue from '../../../shared/value-objects/event.vo';
import IRequestContext from '../../contracts/app/request-context.contract';
import {
  IOpeningBalanceCreationReq,
  openingBalanceCreationReqValidation,
} from '../../contracts/dto/bookkeeping.dto';
import IEventBus from '../../contracts/infra/event-bus.contract';
import ledgerAppError from '../../errors/ledger.error';
import moneyMapper from '../../mappers/money.mapper';

export default function makeRecordOpeningBalanceUseCase(
  requestContext: IRequestContext,
  ledgerAccountRepo: ILedgerAccountRepo,
  journalEntryRepo: IJournalEntryRepo,
  eventBus: IEventBus,
  bookkeepingService: IBookkeepingService,
  exchangeRateService: IExchangeRateService
) {
  return async (payload: IOpeningBalanceCreationReq) => {
    zodValidationRunner(openingBalanceCreationReqValidation, payload);

    const { accountingEntity, correlationId } = requestContext.get();
    const trace = { correlationId };

    const account = await ledgerAccountRepo.findById(
      payload.accountId as TEntityId,
      trace
    );

    if (!account) throw new ledgerAppError.AccountNotFound();

    const amount = moneyMapper.fromDto(payload.amount);
    const exchangeRate = await exchangeRateService.getExchangeRate(
      payload.exchangeRate,
      trace
    );

    const openingBalancePayload = {
      account,
      amount,
      accountingEntity,
      exchangeRate,
    };

    const [journalEntries, journalEntryEvents] =
      await bookkeepingService.createOpeningBalanceJournalEntry(
        openingBalancePayload,
        trace
      );

    await journalEntryRepo.save(journalEntries, trace);

    eventBus.publish(eventValue.enrichAll(journalEntryEvents, trace));
  };
}
