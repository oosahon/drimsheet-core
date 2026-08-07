import { IReadRepoOptions } from '../../../../shared/types/repo.types';
import { TEntityId } from '../../../../shared/types/uuid';
import { ASSET_LEDGER_CODES } from '../../config/asset-codes.config';
import ledgerAccountError from '../../errors/ledger-account.error';
import ILedgerAccountRepo from '../../repos/ledger-account.repo';
import { EAssetSubType } from '../../types/asset-account.types';
import { TCashLedgerCode } from '../../types/ledger-code.types';
import { ELedgerType, ILedgerAccount } from '../../types/ledger.types';

interface IControlAccountScope<LedgerCode> {
  controlAccount: ILedgerAccount;
  factoryContext: {
    precedingCode: LedgerCode;
    parentMaterializedPath: LedgerCode;
  };
}

interface IPayload {
  ledgerAccountRepo: ILedgerAccountRepo;
  accountingEntityId: TEntityId;
  controlAccountCode: TCashLedgerCode | undefined;
  repoOptions: IReadRepoOptions;
  validator(controlAccount: ILedgerAccount): boolean;
}

export default async function controlAccountResolverHelper<LedgerCode>(
  payload: IPayload
) {
  const controlAccountLedgerCode =
    payload.controlAccountCode ??
    ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER;

  const controlAccount = await payload.ledgerAccountRepo.findByCode(
    controlAccountLedgerCode,
    payload.accountingEntityId,
    payload.repoOptions
  );

  if (!controlAccount) {
    throw new ledgerAccountError.ControlAccountNotFound({
      controlAccountLedgerCode,
    });
  }

  if (!payload.validator(controlAccount)) {
    throw new ledgerAccountError.InvalidControlAccount({
      controlAccountId: controlAccount.id,
      controlAccountLedgerCode,
      type: controlAccount.type,
      subType: controlAccount.subType,
      isControlAccount: controlAccount.isControlAccount,
    });
  }

  const latest = await payload.ledgerAccountRepo.findLatestBySubType(
    payload.accountingEntityId,
    ELedgerType.Asset,
    EAssetSubType.CashAndCashEquivalent,
    payload.repoOptions
  );

  const precedingCode = latest?.code ?? controlAccount.code;
  const materializedPath = controlAccount.materializedPath;

  const scope: IControlAccountScope<LedgerCode> = {
    controlAccount,
    factoryContext: {
      precedingCode: precedingCode as LedgerCode,
      parentMaterializedPath: materializedPath as LedgerCode,
    },
  };

  return scope;
}
