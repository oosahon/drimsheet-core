import IExchangeRateService from '../../../domain/currency/types/exchange-rate.service.types';
import IJournalEntryPersistenceService from '../../../domain/journal-entry/types/journal-entry-persistence.service.types';
import IJournalEntryService from '../../../domain/journal-entry/types/journal-entry.service.types';
import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import { TEntityId } from '../../../shared/types/uuid';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import eventValue from '../../../shared/value-objects/event.vo';
import historyValue from '../../../shared/value-objects/history.vo';
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
  eventBus: IEventBus,
  journalEntryService: IJournalEntryService,
  journalEntryPersistenceService: IJournalEntryPersistenceService,
  exchangeRateService: IExchangeRateService
) {
  return async (payload: IOpeningBalanceCreationReq) => {
    zodValidationRunner(openingBalanceCreationReqValidation, payload);

    const { accountingEntity, correlationId, user } = requestContext.get();
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

    const [journalEntry, journalEntryEvents, audit] =
      await journalEntryService.recordOpeningBalance(
        openingBalancePayload,
        trace
      );

    await journalEntryPersistenceService.save(
      journalEntry,
      audit,
      historyValue.getUserActor(user.id),
      trace
    );

    eventBus.publish(eventValue.enrichAll(journalEntryEvents, trace));
  };
}
