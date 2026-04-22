import accountingEntityEntity from '../../../../domain/accounting-entity/entities/accounting-entity.entity';
import currencyEntity from '../../../../domain/currency/entities/currency.entity';
import { ASSET_LEDGER_CODES } from '../../../../domain/ledger/config/asset-codes.config';
import cashAndEquivalentAccountEntity from '../../../../domain/ledger/entities/01-asset-account/00-cash-and-equivalents.entity';
import ILedgerAccountRepo from '../../../../domain/ledger/repos/ledger-account.repo';
import { EAssetSubType } from '../../../../domain/ledger/types/asset-account.types';
import { TCashLedgerCode } from '../../../../domain/ledger/types/ledger-code.types';
import { ELedgerType } from '../../../../domain/ledger/types/ledger.types';
import zodValidationRunner from '../../../../shared/utils/zod-validation-runner';
import { ErrorBadRequest } from '../../../../shared/value-objects/error';
import eventValue from '../../../../shared/value-objects/event.vo';
import IRequestContext from '../../../contracts/app/request-context.contract';
import {
  IPettyCashAccountCreationReq,
  pettyCashCreationReqValidation,
} from '../../../contracts/dto/asset-account.dto';
import IEventBus from '../../../contracts/infra/event-bus.contract';

export default function makeCreatePettyCashAccountUseCase(
  requestContext: IRequestContext,
  eventBus: IEventBus
) {
  return async (
    payload: IPettyCashAccountCreationReq,
    ledgerAccountRepo: ILedgerAccountRepo
  ) => {
    const { correlationId, user, accountingEntity } = requestContext.get();
    accountingEntityEntity.validateAccess(accountingEntity, user);

    zodValidationRunner(pettyCashCreationReqValidation, payload);

    const ledgerCode =
      payload.controlAccountCode ??
      ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER;

    const repoOptions = { correlationId };

    const controlAccount = await ledgerAccountRepo.findByCode(
      ledgerCode,
      accountingEntity.id,
      repoOptions
    );

    if (!controlAccount)
      throw new ErrorBadRequest('Control account not found.');

    const latestPettyCashAccount = await ledgerAccountRepo.findLatestBySubType(
      accountingEntity.id,
      ELedgerType.Asset,
      EAssetSubType.CashAndCashEquivalent,
      repoOptions
    );

    if (!latestPettyCashAccount) {
      throw new ErrorBadRequest('Latest petty cash account not found.');
    }

    const makePayload = {
      name: payload.name,
      currency: currencyEntity.getByCode(payload.openingBalance.currency),
      isControlAccount: payload.isControlAccount,
      controlAccountId: controlAccount.id,
      createdBy: user.id,
      accountingEntityId: accountingEntity.id,
    };

    const scope = {
      precedingCode: latestPettyCashAccount.code as TCashLedgerCode,
      parentMaterializedPath:
        controlAccount.materializedPath as TCashLedgerCode,
    };

    const [account, events] =
      cashAndEquivalentAccountEntity.makePettyCashAccount(makePayload, scope);

    await ledgerAccountRepo.save(account, repoOptions);

    eventBus.publish(eventValue.enrichAll(events, { correlationId }));
  };
}
