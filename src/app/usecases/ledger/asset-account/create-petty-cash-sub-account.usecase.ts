import makeAccountingService from '../../../../domain/accounting/services/accounting.service';
import currencyEntity from '../../../../domain/currency/entities/currency.entity';
import IExchangeRateRepo from '../../../../domain/currency/repos/exchange-rate.repo';
import makeExchangeRateService from '../../../../domain/currency/services/exchange-rate.service';
import { IExchangeRate } from '../../../../domain/currency/types/exchange-rate.types';
import IJournalEntryRepo from '../../../../domain/journal-entry/repos/journal-entry.repo';
import ILedgerAccountRepo from '../../../../domain/ledger/repos/ledger-account.repo';
import makeAssetPostingAccountService from '../../../../domain/ledger/services/asset-account.service';
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
  repoService: IRepoService,
  journalEntryRepo: IJournalEntryRepo,
  exchangeRateRepo: IExchangeRateRepo
) {
  return async (payload: IPettyCashAccountCreationReq) => {
    zodValidationRunner(pettyCashCreationReqValidation, payload);
    const openingBalance = moneyMapper.fromDto(payload.openingBalance);
    const currency = currencyEntity.getByCode(openingBalance.currency.code);

    const assetPostingAccountService =
      makeAssetPostingAccountService(ledgerAccountRepo);
    const accountingService = makeAccountingService(ledgerAccountRepo);
    const exchangeRateService = makeExchangeRateService(exchangeRateRepo);

    const { correlationId, user, accountingEntity } = requestContext.get();
    const trace = { correlationId };

    let exchangeRate: IExchangeRate | null = null;

    if (payload.exchangeRate !== null) {
      exchangeRate = await exchangeRateService.getExchangeRate(
        payload.exchangeRate,
        trace
      );
    }

    const accountPayload = {
      name: payload.name,
      currency,
      isControlAccount: payload.isControlAccount,
      user,
      accountingEntity,
      controlAccountCode: payload.controlAccountCode as TCashLedgerCode,
    };

    const [account, accountEvents] =
      await assetPostingAccountService.makePettyCashSubAccount(
        accountPayload,
        trace
      );

    const openingBalancePayload = {
      account,
      amount: openingBalance,
      accountingEntity,
      exchangeRate,
    };

    const [journalEntries, journalEntryEvents] =
      await accountingService.recordOpeningBalanceTransaction(
        openingBalancePayload,
        trace
      );

    await repoService.runInTransaction(async (tx) => {
      const options = { correlationId, tx };

      await ledgerAccountRepo.save(account, options);
      await journalEntryRepo.save(journalEntries, options);
    });

    const allEvents: IEvent<unknown>[] = [
      ...accountEvents,
      ...journalEntryEvents,
    ];

    eventBus.publish(eventValue.enrichAll(allEvents, trace));
  };
}
