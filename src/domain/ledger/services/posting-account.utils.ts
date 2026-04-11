import { IRepoOptions } from '../../../app/contracts/infra/repo.contract';
import { TEntityId } from '../../../shared/types/uuid';
import { AppError } from '../../../shared/value-objects/error';
import ILedgerAccountRepo from '../repos/ledger-account.repo';
import { ULedgerType } from '../types/ledger.types';

export interface ICanMakeAccountParams {
  accountingEntityId: TEntityId;
  type: ULedgerType;
  subType: string;
  controlLedgerCode: string;
}

export async function canMakePostingAccount(
  params: ICanMakeAccountParams,
  repo: ILedgerAccountRepo,
  repoOptions: IRepoOptions
) {
  const { accountingEntityId, type, subType, controlLedgerCode } = params;

  const existingAccounts = await repo.findBySubType(
    accountingEntityId,
    type,
    subType,
    repoOptions
  );

  const controlAccount = await repo.findByCode(
    controlLedgerCode,
    accountingEntityId,
    repoOptions
  );

  if (!controlAccount) {
    throw new AppError('Control account not found', {
      cause: { controlLedgerCode },
    });
  }

  if (controlAccount.type !== type) {
    throw new AppError('Control account type does not match', {
      cause: { controlLedgerCode, type },
    });
  }

  const nonControlAccountInType = existingAccounts.filter(
    (account) => !account.isControlAccount
  );

  return {
    canMake: !nonControlAccountInType.length,
    controlAccount,
  };
}
