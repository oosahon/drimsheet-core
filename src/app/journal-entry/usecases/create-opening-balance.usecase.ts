import ledgerAccountEntity from '../../../domain/ledger/shared/entities/ledger-account.entity';
import ILedgerAccountRepo from '../../../domain/ledger/shared/repos/ledger-account.repo';
import exchangeRateValue from '../../../domain/money/values/exchange-rate.vo';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../../shared/contracts/repo.contract';
import IReporter from '../../../shared/contracts/reporter.contract';
import eventValue from '../../../shared/events/event.vo';
import { IEvent } from '../../../shared/events/types/event.types';
import historyValue from '../../../shared/history/history.vo';
import { TEntityId } from '../../../shared/types/uuid';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import IAppContext from '../../_internal/contracts/app-context.contract';
import IJournalEntryPersistenceService from '../../bookkeeping/contracts/journal-entry-persistence.service.contract';
import { ILedgerAccountBalancePropagationService } from '../../bookkeeping/contracts/ledger-account-balance-adjustment-service.contract';
import IOpeningBalanceEntryService from '../../bookkeeping/contracts/opening-balance-entry.service.contract';
import ledgerAppError from '../../ledger/errors/ledger.error';
import moneyMapper from '../../money/dtos/money/money.dto.mapper';
import { IOpeningBalanceCreationReq } from '../dtos/opening-balance/opening-balance.dto';
import { openingBalanceCreationReqValidation } from '../dtos/opening-balance/opening-balance.dto.validation';

interface IDependencies {
  appContext: IAppContext;
  ledgerAccountRepo: ILedgerAccountRepo;
  eventBus: IEventBus;
  openingBalanceEntryService: IOpeningBalanceEntryService;
  journalEntryPersistenceService: IJournalEntryPersistenceService;
  balancePropagationService: ILedgerAccountBalancePropagationService;
  reporter: IReporter;
  repoService: IRepoService;
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
        payload.date,
        exchangeRate,
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

    await deps.balancePropagationService
      .propagate(journalEntry, trace)
      .catch(deps.reporter.report);

    const allEvents: IEvent<unknown>[] = [...accountEvents, ...journalEvents];
    deps.eventBus.publish(eventValue.enrichAll(allEvents, trace));
  };
}
