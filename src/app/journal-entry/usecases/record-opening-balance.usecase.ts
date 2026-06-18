import IExchangeRateService from '../../../domain/currency/types/exchange-rate.service.types';
import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import { TEntityId } from '../../../shared/types/uuid';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import eventValue from '../../../shared/value-objects/event.vo';
import historyValue from '../../../shared/value-objects/history.vo';
import IJournalEntryPersistenceService from '../../bookkeeping/contracts/journal-entry-persistence.service.contract';
import IOpeningBalanceEntryService from '../../bookkeeping/contracts/opening-balance-entry.service.contract';
import ledgerAppError from '../../ledger/errors/ledger.error';
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
  openingBalanceEntryService: IOpeningBalanceEntryService,
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

    const [journalEntry, journalEvents, audit] =
      await openingBalanceEntryService.create(
        accountingEntity,
        account,
        amount,
        exchangeRate,
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

    eventBus.publish(eventValue.enrichAll(journalEvents, trace));
  };
}
