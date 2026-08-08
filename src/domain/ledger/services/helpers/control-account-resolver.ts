import { IReadRepoOptions } from '../../../../shared/types/repo.types';
import { TEntityId } from '../../../../shared/types/uuid';
import { ASSET_LEDGER_CODES } from '../../config/asset-codes.config';
import ledgerAccountError from '../../errors/ledger-account.error';
import ILedgerAccountRepo from '../../repos/ledger-account.repo';
import { EAssetSubType } from '../../types/asset-account.types';
import { ELedgerType, ILedgerAccount } from '../../types/ledger.types';

interface IControlAccountScope<LedgerCode> {
  controlAccount: ILedgerAccount;
  factoryContext: {
    precedingCode: LedgerCode;
    parentMaterializedPath: LedgerCode;
  };
}

interface IPayload<LedgerCode> {
  ledgerAccountRepo: ILedgerAccountRepo;
  accountingEntityId: TEntityId;
  controlAccountCode: LedgerCode | undefined;
  repoOptions: IReadRepoOptions;
  validator(controlAccount: ILedgerAccount): boolean;
}

export default async function controlAccountResolverHelper<LedgerCode>(
  payload: IPayload<LedgerCode>
) {
  const controlAccountLedgerCode =
    payload.controlAccountCode ??
    ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER;

  const controlAccount = await payload.ledgerAccountRepo.findByCode(
    controlAccountLedgerCode as string,
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

  // TODO: prevent currency triangulation

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
