import { IRepoOptions } from '../../../app/contracts/infra/repo.contract';
import { AppError } from '../../../shared/value-objects/error';
import accountingEntityEntity from '../../accounting-entity/entities/accounting-entity.entity';
import { IAccountingEntity } from '../../accounting-entity/types/accounting-entity.types';
import { ICurrency } from '../../currency/types/currency.types';
import { IUser } from '../../user/types/user.types';
import { ASSET_LEDGER_CODES } from '../config/asset-codes.config';
import cashAndEquivalentAccountEntity from '../entities/01-asset-account/00-cash-and-equivalents.entity';
import ILedgerAccountRepo from '../repos/ledger-account.repo';
import { EAssetSubType } from '../types/asset-account.types';
import { TCashLedgerCode } from '../types/ledger-code.types';
import { ELedgerType } from '../types/ledger.types';

interface IMakePettyCashAccountPayload {
  name: string;
  currency: ICurrency;
  isControlAccount: boolean;
  user: IUser;
  accountingEntity: IAccountingEntity;
  controlAccountCode?: TCashLedgerCode;
}

export default function makeAssetPostingAccountService(
  repo: ILedgerAccountRepo
) {
  return {
    async makePettyCashSubAccount(
      payload: IMakePettyCashAccountPayload,
      repoOptions: IRepoOptions
    ) {
      accountingEntityEntity.validateAccess(
        payload.accountingEntity,
        payload.user
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
        createdBy: payload.user.id,
        controlAccountId: controlAccount.id,
        accountingEntityId: payload.accountingEntity.id,
        accountingContextId: payload.accountingEntity.accountingContextId,
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
    },
  };
}
