import IExchangeRateService from '../../../domain/currency/types/exchange-rate.service.types';
import IJournalEntryRepo from '../../../domain/journal-entry/repos/journal-entry.repo';
import IJournalEntryService from '../../../domain/journal-entry/types/journal-entry.service.types';
import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import { TEntityId } from '../../../shared/types/uuid';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import eventValue from '../../../shared/value-objects/event.vo';
import ledgerAppError from '../../ledger/errors/ledger.error';
import IEventBus from '../../shared/contracts/event-bus.contract';
import IRequestContext from '../../shared/contracts/request-context.contract';
import moneyMapper from '../../shared/mappers/money.mapper';
import {
  IOpeningBalanceCreationReq,
  openingBalanceCreationReqValidation,
} from '../dtos/transfer-transaction.dto';

export default function makeRecordOpeningBalanceUseCase(
  requestContext: IRequestContext,
  ledgerAccountRepo: ILedgerAccountRepo,
  journalEntryRepo: IJournalEntryRepo,
  eventBus: IEventBus,
  journalEntryService: IJournalEntryService,
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
      await journalEntryService.recordOpeningBalance(
        openingBalancePayload,
        trace
      );

    await journalEntryRepo.save(journalEntries, trace);

    eventBus.publish(eventValue.enrichAll(journalEntryEvents, trace));
  };
}
