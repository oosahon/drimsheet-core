import currencyEntity from '../../../../domain/currency/entities/currency.entity';
import ILedgerAccountRepo from '../../../../domain/ledger/repos/ledger-account.repo';
import makeAssetPostingAccountService from '../../../../domain/ledger/services/asset-account.service';
import { TCashLedgerCode } from '../../../../domain/ledger/types/ledger-code.types';
import zodValidationRunner from '../../../../shared/utils/zod-validation-runner';
import eventValue from '../../../../shared/value-objects/event.vo';
import IRequestContext from '../../../contracts/app/request-context.contract';
import {
  IPettyCashAccountCreationReq,
  pettyCashCreationReqValidation,
} from '../../../contracts/dto/asset-account.dto';
import IEventBus from '../../../contracts/infra/event-bus.contract';

export default function makeCreatePettyCashSubAccountUseCase(
  requestContext: IRequestContext,
  eventBus: IEventBus
) {
  return async (
    payload: IPettyCashAccountCreationReq,
    ledgerAccountRepo: ILedgerAccountRepo
  ) => {
    zodValidationRunner(pettyCashCreationReqValidation, payload);

    const { correlationId, user, accountingEntity } = requestContext.get();

    const currency = currencyEntity.getByCode(payload.openingBalance.currency);

    const makePayload = {
      name: payload.name,
      currency,
      isControlAccount: payload.isControlAccount,
      user,
      accountingEntity,
      controlAccountCode: payload.controlAccountCode as TCashLedgerCode,
    };

    const assetPostingAccountService =
      makeAssetPostingAccountService(ledgerAccountRepo);

    const trace = { correlationId };

    const [account, events] =
      await assetPostingAccountService.makePettyCashSubAccount(
        makePayload,
        trace
      );

    await ledgerAccountRepo.save(account, trace);

    eventBus.publish(eventValue.enrichAll(events, trace));
  };
}
