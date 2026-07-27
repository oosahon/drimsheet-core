import ILedgerAccountRepo from '../../shared/repos/ledger-account.repo';
import { TCashLedgerCode } from '../../shared/types/ledger-code.types';
import { ELedgerType } from '../../shared/types/ledger.types';
import { ASSET_LEDGER_CODES } from '../config/asset-codes.config';
import cashAndEquivalentAccountEntity from '../entities/cash-and-equivalents.entity';
import assetAccountError from '../errors/asset-account.error';
import IAssetAccountService from '../types/asset-account.service.types';
import { EAssetSubType } from '../types/asset-account.types';

type TCreatePettyCashSubAccount =
  IAssetAccountService['makePettyCashSubAccount'];

interface IDependencies {
  ledgerAccountRepo: ILedgerAccountRepo;
}

export default function makeAssetAccountService(
  deps: IDependencies
): IAssetAccountService {
  /**
   * Create a new petty cash account
   */
  const makePettyCashSubAccount: TCreatePettyCashSubAccount = async (
    payload,
    repoOptions
  ) => {
    const controlAccountLedgerCode =
      payload.controlAccountCode ??
      ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER;

    const controlAccount = await deps.ledgerAccountRepo.findByCode(
      controlAccountLedgerCode,
      payload.accountingEntity.id,
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

    const latest = await deps.ledgerAccountRepo.findLatestBySubType(
      payload.accountingEntity.id,
      ELedgerType.Asset,
      EAssetSubType.CashAndCashEquivalent,
      repoOptions
    );

    const factoryPayload = {
      name: payload.name,
      currency: payload.currency,
      isControlAccount: payload.isControlAccount,
      createdBy: payload.userId,
      controlAccountId: controlAccount.id,
      accountingEntityId: payload.accountingEntity.id,
    };

    const precedingCode = latest?.code ?? controlAccount.code;
    const materializedPath = controlAccount.materializedPath;

    const factoryContext = {
      precedingCode: precedingCode as TCashLedgerCode,
      parentMaterializedPath: materializedPath as TCashLedgerCode,
    };

    return cashAndEquivalentAccountEntity.makePettyCashAccount(
      factoryPayload,
      factoryContext
    );
  };

  return Object.freeze({
    makePettyCashSubAccount,
  });
}
