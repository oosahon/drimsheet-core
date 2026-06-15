import IExchangeRateService from '../../../domain/currency/types/exchange-rate.service.types';
import IJournalEntryHistoryRepo from '../../../domain/journal-entry/repos/journal-entry-history.repo';
import IJournalEntryRepo from '../../../domain/journal-entry/repos/journal-entry.repo';
import IJournalLineHistoryRepo from '../../../domain/journal-entry/repos/journal-line-history.repo';
import IJournalLineRepo from '../../../domain/journal-entry/repos/journal-line.repo';
import IJournalEntryService from '../../../domain/journal-entry/types/journal-entry.service.types';
import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import { TEntityId } from '../../../shared/types/uuid';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import eventValue from '../../../shared/value-objects/event.vo';
import historyValue from '../../../shared/value-objects/history.vo';
import ledgerAppError from '../../ledger/errors/ledger.error';
import IEventBus from '../../shared/contracts/event-bus.contract';
import { IRepoService } from '../../shared/contracts/repo.contract';
import IRequestContext from '../../shared/contracts/request-context.contract';
import moneyMapper from '../../shared/mappers/money.mapper';
import {
  IOpeningBalanceCreationReq,
  openingBalanceCreationReqValidation,
} from '../dtos/transfer-transaction.dto';

interface IRecordOpeningBalanceRepos {
  journalEntry: IJournalEntryRepo;
  journalEntryHistory: IJournalEntryHistoryRepo;
  journalLine: IJournalLineRepo;
  journalLineHistory: IJournalLineHistoryRepo;
}

export default function makeRecordOpeningBalanceUseCase(
  requestContext: IRequestContext,
  ledgerAccountRepo: ILedgerAccountRepo,
  eventBus: IEventBus,
  journalEntryService: IJournalEntryService,
  repos: IRecordOpeningBalanceRepos,
  exchangeRateService: IExchangeRateService,
  repoService: IRepoService
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

    const actor = historyValue.getUserActor(user.id);

    await repoService.runInTransaction(async (tx) => {
      const writeOptions = { ...trace, tx };
      const { lines, ...header } = journalEntry;
      const headerHistory = historyValue.make(
        audit.header,
        actor,
        correlationId
      );
      const lineHistories = audit.lines.map((lineAudit) =>
        historyValue.make(lineAudit, actor, correlationId)
      );

      await repos.journalEntry.create(header, writeOptions);
      await repos.journalLine.create(lines, writeOptions);
      await repos.journalEntryHistory.create(
        header,
        headerHistory,
        writeOptions
      );
      await repos.journalLineHistory.create(
        lines,
        lineHistories,
        header.accountingEntityId,
        writeOptions
      );
    });

    eventBus.publish(eventValue.enrichAll(journalEntryEvents, trace));
  };
}
