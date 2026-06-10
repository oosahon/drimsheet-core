import currencyEntity from '../../../domain/currency/entities/currency.entity';
import IExchangeRateService from '../../../domain/currency/types/exchange-rate.service.types';
import IJournalEntryRepo from '../../../domain/journal-entry/repos/journal-entry.repo';
import IJournalEntryService from '../../../domain/journal-entry/types/journal-entry.service.types';
import ILedgerAccountRepo from '../../../domain/ledger/repos/ledger-account.repo';
import IAssetAccountService from '../../../domain/ledger/types/asset-account.service.types';
import { TCashLedgerCode } from '../../../domain/ledger/types/ledger-code.types';
import { IEvent } from '../../../shared/types/event.types';
import zodValidationRunner from '../../../shared/utils/zod-validation-runner';
import eventValue from '../../../shared/value-objects/event.vo';
import IEventBus from '../../shared/contracts/event-bus.contract';
import { IRepoService } from '../../shared/contracts/repo.contract';
import IRequestContext from '../../shared/contracts/request-context.contract';
import moneyMapper from '../../shared/mappers/money.mapper';
import {
  IPettyCashAccountCreationReq,
  pettyCashCreationReqValidation,
} from '../dtos/asset-account.dto';

export default function makeCreatePettyCashAccountUseCase(
  requestContext: IRequestContext,
  eventBus: IEventBus,
  ledgerAccountRepo: ILedgerAccountRepo,
  journalEntryRepo: IJournalEntryRepo,
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

    const [account, accountEvents] =
      await assetAccountService.makePettyCashSubAccount(accountPayload, trace);

    if (!payload.openingBalance) {
      await ledgerAccountRepo.save(account, trace);
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

    const [journalEntries, journalEvents] =
      await journalEntryService.recordOpeningBalance(
        openingBalancePayload,
        trace
      );

    await repoService.runInTransaction(async (tx) => {
      const repoOptions = { tx, correlationId };
      await ledgerAccountRepo.save(account, repoOptions);
      await journalEntryRepo.save(journalEntries, repoOptions);
    });

    const allEvents: IEvent<unknown>[] = [...accountEvents, ...journalEvents];
    eventBus.publish(eventValue.enrichAll(allEvents, trace));
  };
}
