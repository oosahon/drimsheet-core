import { IReadRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';

import ledgerAccountError from '@domain/ledger/errors/ledger-account.error';
import ILedgerAccountRepo from '@domain/ledger/repos/ledger-account.repo';
import { EAssetSubType } from '@domain/ledger/types/asset-account.types';
import { ELedgerType, ILedgerAccount } from '@domain/ledger/types/ledger.types';

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
  controlAccountCode: LedgerCode;
  repoOptions: IReadRepoOptions;
  validator(controlAccount: ILedgerAccount): boolean;
}

export default async function controlAccountResolverHelper<LedgerCode>(
  payload: IPayload<LedgerCode>
) {
  const controlAccountLedgerCode = payload.controlAccountCode;

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
