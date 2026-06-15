import currencyEntity from '../../../domain/currency/entities/currency.entity';
import IExchangeRateService from '../../../domain/currency/types/exchange-rate.service.types';
import IJournalEntryHistoryRepo from '../../../domain/journal-entry/repos/journal-entry-history.repo';
import IJournalEntryRepo from '../../../domain/journal-entry/repos/journal-entry.repo';
import IJournalLineHistoryRepo from '../../../domain/journal-entry/repos/journal-line-history.repo';
import IJournalLineRepo from '../../../domain/journal-entry/repos/journal-line.repo';
import IJournalEntryService from '../../../domain/journal-entry/types/journal-entry.service.types';
import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import IAssetAccountService from '../../../domain/ledger/types/asset-account.service.types';
import { TCashLedgerCode } from '../../../domain/ledger/types/ledger-code.types';
import { IEvent } from '../../../shared/types/event.types';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import eventValue from '../../../shared/value-objects/event.vo';
import historyValue from '../../../shared/value-objects/history.vo';
import IEventBus from '../../shared/contracts/event-bus.contract';
import { IRepoService } from '../../shared/contracts/repo.contract';
import IRequestContext from '../../shared/contracts/request-context.contract';
import moneyMapper from '../../shared/mappers/money.mapper';
import {
  IPettyCashAccountCreationReq,
  pettyCashCreationReqValidation,
} from '../dtos/asset-account.dto';

interface ICreatePettyCashAccountRepos {
  ledgerAccount: ILedgerAccountRepo;
  journalEntry: IJournalEntryRepo;
  journalEntryHistory: IJournalEntryHistoryRepo;
  journalLine: IJournalLineRepo;
  journalLineHistory: IJournalLineHistoryRepo;
}

export default function makeCreatePettyCashAccountUseCase(
  requestContext: IRequestContext,
  eventBus: IEventBus,
  repos: ICreatePettyCashAccountRepos,
  assetAccountService: IAssetAccountService,
  journalEntryService: IJournalEntryService,
  exchangeRateService: IExchangeRateService,
  repoService: IRepoService
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

    if (!payload.openingBalance) {
      await repos.ledgerAccount.create(account, {
        ...trace,
        history: accountHistory,
      });
      eventBus.publish(eventValue.enrichAll(accountEvents, trace));
      return;
    }

    const openingBalanceAmount = moneyMapper.fromDto(
      payload.openingBalance.amount
    );
    const exchangeRate = await exchangeRateService.getExchangeRate(
      payload.openingBalance.exchangeRate,
      trace
    );

    const openingBalancePayload = {
      account,
      amount: openingBalanceAmount,
      accountingEntity,
      exchangeRate,
    };

    const [journalEntry, journalEvents, audit] =
      await journalEntryService.recordOpeningBalance(
        openingBalancePayload,
        trace
      );

    await repoService.runInTransaction(async (tx) => {
      const repoOptions = { tx, correlationId };
      await repos.ledgerAccount.create(account, {
        ...repoOptions,
        history: accountHistory,
      });

      const { lines, ...header } = journalEntry;
      const headerHistory = historyValue.make(
        audit.header,
        actor,
        correlationId
      );
      const lineHistories = audit.lines.map((lineAudit) =>
        historyValue.make(lineAudit, actor, correlationId)
      );

      await repos.journalEntry.create(header, repoOptions);
      await repos.journalLine.create(lines, repoOptions);
      await repos.journalEntryHistory.create(
        header,
        headerHistory,
        repoOptions
      );
      await repos.journalLineHistory.create(
        lines,
        lineHistories,
        header.accountingEntityId,
        repoOptions
      );
    });

    const allEvents: IEvent<unknown>[] = [...accountEvents, ...journalEvents];
    eventBus.publish(eventValue.enrichAll(allEvents, trace));
  };
}
