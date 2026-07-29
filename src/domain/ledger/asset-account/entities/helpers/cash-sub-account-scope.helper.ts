import { IReadRepoOptions } from '../../../../../shared/types/repo.types';
import { TEntityId } from '../../../../../shared/types/uuid';
import ILedgerAccountRepo from '../../../shared/repos/ledger-account.repo';
import { TCashLedgerCode } from '../../../shared/types/ledger-code.types';
import {
  ELedgerType,
  ILedgerAccount,
} from '../../../shared/types/ledger.types';
import { ASSET_LEDGER_CODES } from '../../config/asset-codes.config';
import assetAccountError from '../../errors/asset-account.error';
import { EAssetSubType } from '../../types/asset-account.types';

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
    throw new assetAccountError.ControlAccountNotFound({
      controlAccountLedgerCode,
    });
  }

  const isValidControlAccount =
    controlAccount.type === ELedgerType.Asset &&
    controlAccount.subType === EAssetSubType.CashAndCashEquivalent &&
    controlAccount.isControlAccount;

  if (!isValidControlAccount) {
    throw new assetAccountError.InvalidControlAccount({
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
