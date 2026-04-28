import IBookkeepingService from '../../../../domain/bookkeeping/types/bookkeeping.service.types';
import currencyEntity from '../../../../domain/currency/entities/currency.entity';
import IExchangeRateService from '../../../../domain/currency/types/exchange-rate.service.types';
import IJournalEntryRepo from '../../../../domain/journal-entry/repos/journal-entry.repo';
import ILedgerAccountRepo from '../../../../domain/ledger/repos/ledger-account.repo';
import IAssetAccountService from '../../../../domain/ledger/types/asset-account.service.types';
import { TCashLedgerCode } from '../../../../domain/ledger/types/ledger-code.types';
import zodValidationRunner from '../../../../shared/utils/zod-validation-runner';
import eventValue from '../../../../shared/value-objects/event.vo';
import IRequestContext from '../../../contracts/app/request-context.contract';
import {
  IPettyCashAccountCreationReq,
  pettyCashCreationReqValidation,
} from '../../../contracts/dto/asset-account.dto';
import IEventBus from '../../../contracts/infra/event-bus.contract';
import makeRecordOpeningBalanceUseCase from '../../bookkeeping/record-opening-balance.usecase';

export default function makeCreatePettyCashSubAccountUseCase(
  requestContext: IRequestContext,
  eventBus: IEventBus,
  ledgerAccountRepo: ILedgerAccountRepo,
  journalEntryRepo: IJournalEntryRepo,
  assetAccountService: IAssetAccountService,
  bookkeepingService: IBookkeepingService,
  exchangeRateService: IExchangeRateService
) {
  return async (payload: IPettyCashAccountCreationReq) => {
    zodValidationRunner(pettyCashCreationReqValidation, payload);

    const { correlationId, user, accountingEntity } = requestContext.get();
    const trace = { correlationId };

    /**
     * Create petty cash domain entity
     */
    const accountPayload = {
      name: payload.name,
      currency: currencyEntity.getByCode(payload.currencyCode),
      isControlAccount: payload.isControlAccount,
      userId: user.id,
      accountingEntity,
      controlAccountCode: payload.controlAccountCode as TCashLedgerCode,
    };

    const [account, accountEvents] =
      await assetAccountService.createPettyCashSubAccount(
        accountPayload,
        trace
      );

    await ledgerAccountRepo.save(account, trace);

    eventBus.publish(eventValue.enrichAll(accountEvents, trace));

    if (payload.openingBalance) {
      const recordOpeningBalanceUseCase = makeRecordOpeningBalanceUseCase(
        requestContext,
        ledgerAccountRepo,
        journalEntryRepo,
        eventBus,
        bookkeepingService,
        exchangeRateService
      );

      await recordOpeningBalanceUseCase({
        ...payload.openingBalance,
        accountId: account.id,
      });
    }
  };
}
