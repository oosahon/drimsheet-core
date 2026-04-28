import { AppError } from '../../../shared/value-objects/error';
import IAccountingEntityService from '../../accounting/types/accounting-entity.service.types';
import { ASSET_LEDGER_CODES } from '../config/asset-codes.config';
import cashAndEquivalentAccountEntity from '../entities/01-asset-account/00-cash-and-equivalents.entity';
import ILedgerAccountRepo from '../repos/ledger-account.repo';
import IAssetAccountService from '../types/asset-account.service.types';
import { EAssetSubType } from '../types/asset-account.types';
import { TCashLedgerCode } from '../types/ledger-code.types';
import { ELedgerType } from '../types/ledger.types';

type TCreatePettyCashSubAccount =
  IAssetAccountService['createPettyCashSubAccount'];

export default function makeAssetAccountService(
  repo: ILedgerAccountRepo,
  accountingEntityService: IAccountingEntityService
) {
  /**
   * Create a new petty cash account
   */
  const createPettyCashSubAccount: TCreatePettyCashSubAccount = async (
    payload,
    repoOptions
  ) => {
    accountingEntityService.validateAccess(
      payload.accountingEntity,
      payload.userId
    );

    const controlAccountLedgerCode =
      payload.controlAccountCode ??
      ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER;

    const controlAccount = await repo.findByCode(
      controlAccountLedgerCode,
      payload.accountingEntity.id,
      repoOptions
    );

    if (!controlAccount) {
      throw new AppError('Control account not found', {
        cause: { controlAccountLedgerCode },
      });
    }

    const latest = await repo.findLatestBySubType(
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
    createPettyCashSubAccount,
  });
}
