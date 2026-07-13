import exchangeRateValue from '../../../domain/currency/value-objects/exchange-rate.vo';
import ILedgerAccountRepo from '../../../domain/ledger/shared/repos/ledger-account.repo';
import IAppContext from '../../../shared/contracts/app-context.contract';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import { TEntityId } from '../../../shared/types/uuid';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import eventValue from '../../../shared/value-objects/event.vo';
import historyValue from '../../../shared/value-objects/history.vo';
import IJournalEntryPersistenceService from '../../bookkeeping/contracts/journal-entry-persistence.service.contract';
import IOpeningBalanceEntryService from '../../bookkeeping/contracts/opening-balance-entry.service.contract';
import ledgerAppError from '../../ledger/errors/ledger.error';
import moneyMapper from '../../shared/dtos/money/money.dto.mapper';
import { IOpeningBalanceCreationReq } from '../dtos/opening-balance/opening-balance.dto';
import { openingBalanceCreationReqValidation } from '../dtos/opening-balance/opening-balance.dto.validation';

interface IDependencies {
  appContext: IAppContext;
  ledgerAccountRepo: ILedgerAccountRepo;
  eventBus: IEventBus;
  openingBalanceEntryService: IOpeningBalanceEntryService;
  journalEntryPersistenceService: IJournalEntryPersistenceService;
}

export default function makeCreateOpeningBalanceUseCase(deps: IDependencies) {
  return async (payload: IOpeningBalanceCreationReq) => {
    zodValidationRunner(openingBalanceCreationReqValidation, payload);

    const { accountingEntity, correlationId, user } = deps.appContext.get();
    const trace = { correlationId };

    const account = await deps.ledgerAccountRepo.findById(
      payload.accountId as TEntityId,
      trace
    );

    if (!account) throw new ledgerAppError.AccountNotFound();

    const amount = moneyMapper.fromDto(payload.amount);
    const exchangeRate = payload.exchangeRate
      ? exchangeRateValue.make(payload.exchangeRate)
      : null;

    const [journalEntry, journalEvents, audit] =
      await deps.openingBalanceEntryService.create(
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

    await deps.journalEntryPersistenceService.create(
      journalEntry,
      headerHistory,
      lineHistories,
      trace
    );

    deps.eventBus.publish(eventValue.enrichAll(journalEvents, trace));
  };
}
