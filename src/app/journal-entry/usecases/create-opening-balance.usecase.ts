import { IJournalEntryService } from '../../../domain/journal-entry/types/journal-entry.service.types';
import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import ledgerAccountEntity from '../../../domain/ledger/shared/entities/ledger-account.entity';
import exchangeRateValue from '../../../domain/money/values/exchange-rate.vo';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../../shared/contracts/repo.contract';
import { TEntityId } from '../../../shared/types/uuid';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import eventValue from '../../../shared/values/events/event.vo';
import { IEvent } from '../../../shared/values/events/types/event.types';
import historyValue from '../../../shared/values/history/history.vo';
import IAppContext from '../../context/contracts/app-context.contract';
import { ILedgerAccountBalancePropagationService } from '../../ledger/contracts/ledger-account-balance-propagation.service.contract';
import ledgerAppError from '../../ledger/errors/ledger.error';
import moneyMapper from '../../money/dtos/money/money.dto.mapper';
import IJournalEntryPersistenceService from '../contracts/journal-entry-persistence.service.contract';
import { IOpeningBalanceCreationReq } from '../dtos/opening-balance/opening-balance.dto';
import { openingBalanceCreationReqValidation } from '../dtos/opening-balance/opening-balance.dto.validation';

interface IDependencies {
  appContext: IAppContext;
  ledgerAccountRepo: ILedgerAccountRepo;
  eventBus: IEventBus;
  journalEntryService: IJournalEntryService;
  journalEntryPersistenceService: IJournalEntryPersistenceService;
  balancePropagationService: ILedgerAccountBalancePropagationService;
  repoService: IRepoService;
}

export default function makeCreateOpeningBalanceUseCase(deps: IDependencies) {
  return async (payload: IOpeningBalanceCreationReq) => {
    zodValidationRunner(openingBalanceCreationReqValidation, payload);

    const { accountingEntity, correlationId, user } = deps.appContext.get();
    const trace = { correlationId };

    const account = await deps.ledgerAccountRepo.findById(
      payload.accountId as TEntityId,
      accountingEntity.id,
      trace
    );

    if (!account) throw new ledgerAppError.AccountNotFound();

    const amount = moneyMapper.fromDto(payload.amount);
    const exchangeRate = payload.exchangeRate
      ? exchangeRateValue.make(payload.exchangeRate)
      : null;

    const [journalEntry, journalEvents, audit] =
      await deps.journalEntryService.createOpeningBalance(
        {
          accountingEntityId: accountingEntity.id,
          functionalCurrencyCode: accountingEntity.functionalCurrencyCode,
          account,
          amount,
          effectiveDate: payload.date,
          exchangeRate,
          createdBy: account.createdBy,
        },
        trace
      );

    const [updatedAccount, accountEvents, accountAudit] =
      ledgerAccountEntity.updateOpeningBalanceDate(account, payload.date);

    const actor = historyValue.getUserActor(user.id);
    const accountHistory = historyValue.make(
      accountAudit,
      actor,
      correlationId
    );
    const headerHistory = historyValue.make(audit.header, actor, correlationId);
    const lineHistories = audit.lines.map((lineAudit) =>
      historyValue.make(lineAudit, actor, correlationId)
    );

    const transactionFn: TRepoTransactionFn = async (tx) => {
      const repoOptions = { ...trace, tx };

      await deps.ledgerAccountRepo.update(updatedAccount, {
        ...repoOptions,
        history: accountHistory,
      });

      await deps.journalEntryPersistenceService.create(
        journalEntry,
        headerHistory,
        lineHistories,
        repoOptions
      );
    };

    await deps.repoService.runInTransaction(transactionFn);

    await deps.balancePropagationService.propagate(journalEntry, trace);

    const allEvents: IEvent<unknown>[] = [...accountEvents, ...journalEvents];
    deps.eventBus.publish(eventValue.enrichAll(allEvents, trace));
  };
}
