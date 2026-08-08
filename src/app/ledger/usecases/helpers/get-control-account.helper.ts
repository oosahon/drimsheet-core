import ledgerAccountError from '../../../../domain/ledger/errors/ledger-account.error';
import ILedgerAccountRepo from '../../../../domain/ledger/repos/ledger-account.repo';
import { ILedgerAccount } from '../../../../domain/ledger/types/ledger.types';
import { IReadRepoOptions } from '../../../../shared/types/repo.types';
import { TEntityId } from '../../../../shared/types/uuid';
import ledgerAppError from '../../errors/ledger.error';

interface IPayload<TLedgerCodeType extends string> {
  ledgerAccountRepo: ILedgerAccountRepo;
  controlAccountId?: string;
  defaultControlAccountCode: TLedgerCodeType;
  accountingEntityId: TEntityId;
  repoOptions: IReadRepoOptions;
}

type TControlAccount<TLedgerCodeType extends string> = ILedgerAccount & {
  code: TLedgerCodeType;
};

export default async function getControlAccountHelper<
  TLedgerCodeType extends string,
>(
  payload: IPayload<TLedgerCodeType>
): Promise<TControlAccount<TLedgerCodeType>> {
  let controlAccount: ILedgerAccount | null;

  if (payload.controlAccountId) {
    controlAccount = await payload.ledgerAccountRepo.findById(
      payload.controlAccountId as TEntityId,
      payload.accountingEntityId,
      payload.repoOptions
    );

    if (!controlAccount) {
      throw new ledgerAppError.AccountNotFound({
        id: payload.controlAccountId,
      });
    }
  } else {
    controlAccount = await payload.ledgerAccountRepo.findByCode(
      payload.defaultControlAccountCode,
      payload.accountingEntityId,
      payload.repoOptions
    );

    if (!controlAccount) {
      throw new ledgerAccountError.ControlAccountNotFound({
        controlAccountLedgerCode: payload.defaultControlAccountCode,
      });
    }
  }

  return controlAccount as TControlAccount<TLedgerCodeType>;
}
