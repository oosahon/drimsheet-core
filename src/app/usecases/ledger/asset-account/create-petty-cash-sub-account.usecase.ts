import IBookkeepingService from '../../../../domain/bookkeeping/types/bookkeeping.service.types';
import currencyEntity from '../../../../domain/currency/entities/currency.entity';
import IExchangeRateService from '../../../../domain/currency/types/exchange-rate.service.types';
import IJournalEntryRepo from '../../../../domain/journal-entry/repos/journal-entry.repo';
import ILedgerAccountRepo from '../../../../domain/ledger/repos/ledger-account.repo';
import IAssetAccountService from '../../../../domain/ledger/types/asset-account.service.types';
import { TCashLedgerCode } from '../../../../domain/ledger/types/ledger-code.types';
import { IEvent } from '../../../../shared/types/event.types';
import zodValidationRunner from '../../../../shared/utils/zod-validation-runner';
import eventValue from '../../../../shared/value-objects/event.vo';
import IRequestContext from '../../../contracts/app/request-context.contract';
import {
  IPettyCashAccountCreationReq,
  pettyCashCreationReqValidation,
} from '../../../contracts/dto/asset-account.dto';
import IEventBus from '../../../contracts/infra/event-bus.contract';
import { IRepoService } from '../../../contracts/infra/repo.contract';
import moneyMapper from '../../../mappers/money.mapper';

export default function makeCreatePettyCashSubAccountUseCase(
  requestContext: IRequestContext,
  eventBus: IEventBus,
  ledgerAccountRepo: ILedgerAccountRepo,
  journalEntryRepo: IJournalEntryRepo,
  assetAccountService: IAssetAccountService,
  bookkeepingService: IBookkeepingService,
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
      await bookkeepingService.recordOpeningBalance(
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
