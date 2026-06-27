import currencyEntity from '../../../domain/currency/entities/currency.entity';
import exchangeRateValue from '../../../domain/currency/value-objects/exchange-rate.vo';
import IAssetAccountService from '../../../domain/ledger/types/asset-account.service.types';
import ILedgerAccountPersistenceService from '../../../domain/ledger/types/ledger-account-persistence.service.types';
import { TCashLedgerCode } from '../../../domain/ledger/types/ledger-code.types';
import IEventBus from '../../../shared/contracts/event-bus.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../../shared/contracts/repo.contract';
import { IEvent } from '../../../shared/types/event.types';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import eventValue from '../../../shared/value-objects/event.vo';
import historyValue from '../../../shared/value-objects/history.vo';
import IJournalEntryPersistenceService from '../../bookkeeping/contracts/journal-entry-persistence.service.contract';
import IOpeningBalanceEntryService from '../../bookkeeping/contracts/opening-balance-entry.service.contract';
import IRequestContext from '../../shared/contracts/request-context.contract';
import moneyMapper from '../../shared/mappers/money.mapper';
import {
  IPettyCashAccountCreationReq,
  pettyCashCreationReqValidation,
} from '../dtos/asset-account.dto';

export default function makeCreatePettyCashAccountUseCase(
  requestContext: IRequestContext,
  eventBus: IEventBus,
  assetAccountService: IAssetAccountService,
  openingBalanceEntryService: IOpeningBalanceEntryService,
  journalEntryPersistenceService: IJournalEntryPersistenceService,
  repoService: IRepoService,
  ledgerAccountPersistenceService: ILedgerAccountPersistenceService
) {
  return async (payload: IPettyCashAccountCreationReq) => {
    zodValidationRunner(pettyCashCreationReqValidation, payload);

    const { correlationId, user, accountingEntity } = requestContext.get();
    const trace = { correlationId };

    const accountPayload = {
      name: payload.name,
      currency: currencyEntity.getByCode(payload.currencyCode),
      isControlAccount: payload.isControlAccount,
      userId: user.id,
      accountingEntity,
      controlAccountCode: payload.controlAccountCode as TCashLedgerCode,
    };

    const [account, accountEvents, accountAudit] =
      await assetAccountService.makePettyCashSubAccount(accountPayload, trace);

    const actor = historyValue.getUserActor(user.id);
    const accountHistory = [
      historyValue.make(accountAudit, actor, correlationId),
    ];

    const { functionalCurrencyCode } = accountingEntity;

    if (!payload.openingBalance) {
      const repoOptions = {
        ...trace,
        history: accountHistory,
      };

      await ledgerAccountPersistenceService.create(
        account,
        functionalCurrencyCode,
        repoOptions
      );
      eventBus.publish(eventValue.enrichAll(accountEvents, trace));
      return;
    }

    const openingBalanceAmount = moneyMapper.fromDto(
      payload.openingBalance.amount
    );
    const exchangeRate = payload.openingBalance.exchangeRate
      ? exchangeRateValue.make(payload.openingBalance.exchangeRate)
      : null;

    const [journalEntry, journalEvents, audit] =
      await openingBalanceEntryService.create(
        accountingEntity,
        account,
        openingBalanceAmount,
        exchangeRate,
        trace
      );

    const headerHistory = historyValue.make(audit.header, actor, correlationId);
    const lineHistories = audit.lines.map((lineAudit) =>
      historyValue.make(lineAudit, actor, correlationId)
    );

    const dbTransactionFn: TRepoTransactionFn = async (tx) => {
      const repoOptions = { ...trace, tx };

      const accountRepoOptions = {
        ...repoOptions,
        history: accountHistory,
      };

      await ledgerAccountPersistenceService.create(
        account,
        functionalCurrencyCode,
        accountRepoOptions
      );

      await journalEntryPersistenceService.create(
        journalEntry,
        headerHistory,
        lineHistories,
        repoOptions
      );
    };

    await repoService.runInTransaction(dbTransactionFn);

    const allEvents: IEvent<unknown>[] = [...accountEvents, ...journalEvents];
    eventBus.publish(eventValue.enrichAll(allEvents, trace));
  };
}
