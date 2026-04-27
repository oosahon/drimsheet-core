import ILedgerAccountBalanceRepo from '../../../domain/bookkeeping/repos/ledger-account-balance.repo';
import makeBookkeepingService from '../../../domain/bookkeeping/services/bookkeeping.service';
import IExchangeRateRepo from '../../../domain/currency/repos/exchange-rate.repo';
import makeExchangeRateService from '../../../domain/currency/services/exchange-rate.service';
import IJournalEntryRepo from '../../../domain/journal-entry/repos/journal-entry.repo';
import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import { TEntityId } from '../../../shared/types/uuid';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import { ErrorResourceNotFound } from '../../../shared/value-objects/error';
import eventValue from '../../../shared/value-objects/event.vo';
import IRequestContext from '../../contracts/app/request-context.contract';
import {
  IOpeningBalanceCreationReq,
  openingBalanceCreationReqValidation,
} from '../../contracts/dto/accounting.dto';
import IEventBus from '../../contracts/infra/event-bus.contract';
import moneyMapper from '../../mappers/money.mapper';

export default function makeRecordOpeningBalanceUseCase(
  requestContext: IRequestContext,
  exchangeRateRepo: IExchangeRateRepo,
  ledgerAccountRepo: ILedgerAccountRepo,
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo,
  journalEntryRepo: IJournalEntryRepo,
  eventBus: IEventBus
) {
  const domainServices = {
    accounting: makeBookkeepingService(
      ledgerAccountRepo,
      ledgerAccountBalanceRepo
    ),
    exchangeRate: makeExchangeRateService(exchangeRateRepo),
  };

  return async (payload: IOpeningBalanceCreationReq) => {
    zodValidationRunner(openingBalanceCreationReqValidation, payload);

    const { accountingEntity, correlationId } = requestContext.get();
    const trace = { correlationId };

    const account = await ledgerAccountRepo.findById(
      payload.accountId as TEntityId,
      trace
    );

    if (!account) throw new ErrorResourceNotFound('Account not found.');

    const amount = moneyMapper.fromDto(payload.amount);
    const exchangeRate = await domainServices.exchangeRate.getExchangeRate(
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
      await domainServices.accounting.createOpeningBalanceJournalEntry(
        openingBalancePayload,
        trace
      );

    await journalEntryRepo.save(journalEntries, trace);

    eventBus.publish(eventValue.enrichAll(journalEntryEvents, trace));
  };
}
