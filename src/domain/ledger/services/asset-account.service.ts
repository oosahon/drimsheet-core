import { IRepoOptions } from '../../../shared/types/repo.types';
import { AppError } from '../../../shared/value-objects/error';
import IAccountingEntityService from '../../accounting/types/accounting-entity.service.types';
import { IAccountingEntity } from '../../accounting/types/accounting-entity.types';
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
  repo: ILedgerAccountRepo,
  accountingEntityService: IAccountingEntityService
) {
  return {
    async makePettyCashSubAccount(
      payload: IMakePettyCashAccountPayload,
      repoOptions: IRepoOptions
    ) {
      accountingEntityService.validateAccess(
        payload.accountingEntity,
        payload.user.id
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
