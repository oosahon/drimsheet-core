import { IReadRepoOptions } from '../../../../../shared/types/repo.types';
import { TEntityId } from '../../../../../shared/types/uuid';
import { ASSET_LEDGER_CODES } from '../../../config/asset-codes.config';
import ledgerAccountError from '../../../errors/ledger-account.error';
import ILedgerAccountRepo from '../../../repos/ledger-account.repo';
import { EAssetSubType } from '../../../types/asset-account.types';
import { TCashLedgerCode } from '../../../types/ledger-code.types';
import { ELedgerType, ILedgerAccount } from '../../../types/ledger.types';

export interface ICashSubAccountScope {
  controlAccount: ILedgerAccount;
  factoryContext: {
    precedingCode: TCashLedgerCode;
    parentMaterializedPath: TCashLedgerCode;
  };
}

const resolveCashSubAccountScope = async (
  ledgerAccountRepo: ILedgerAccountRepo,
  accountingEntityId: TEntityId,
  controlAccountCode: TCashLedgerCode | undefined,
  repoOptions: IReadRepoOptions
): Promise<ICashSubAccountScope> => {
  const controlAccountLedgerCode =
    controlAccountCode ?? ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER;

  const controlAccount = await ledgerAccountRepo.findByCode(
    controlAccountLedgerCode,
    accountingEntityId,
    repoOptions
  );

  if (!controlAccount) {
    throw new ledgerAccountError.ControlAccountNotFound({
      controlAccountLedgerCode,
    });
  }

  const isValidControlAccount =
    controlAccount.type === ELedgerType.Asset &&
    controlAccount.subType === EAssetSubType.CashAndCashEquivalent &&
    controlAccount.isControlAccount;

  if (!isValidControlAccount) {
    throw new ledgerAccountError.InvalidControlAccount({
      controlAccountId: controlAccount.id,
      controlAccountLedgerCode,
      type: controlAccount.type,
      subType: controlAccount.subType,
      isControlAccount: controlAccount.isControlAccount,
    });
  }

  const latest = await ledgerAccountRepo.findLatestBySubType(
    accountingEntityId,
    ELedgerType.Asset,
    EAssetSubType.CashAndCashEquivalent,
    repoOptions
  );

  const precedingCode = latest?.code ?? controlAccount.code;
  const materializedPath = controlAccount.materializedPath;

  return {
    controlAccount,
    factoryContext: {
      precedingCode: precedingCode as TCashLedgerCode,
      parentMaterializedPath: materializedPath as TCashLedgerCode,
    },
  };
};

export default resolveCashSubAccountScope;
