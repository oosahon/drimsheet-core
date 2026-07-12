import ILedgerAccountRepo from '../repos/ledger-account.repo';
import { ILedgerAccountService } from '../types/ledger-account.service.types';

type TvalidateAccountAccess = ILedgerAccountService['validateAccountAccess'];

interface IDependencies {
  ledgerAccountRepo: ILedgerAccountRepo;
}

export default function makeLedgerAccountService(
  deps: IDependencies
): ILedgerAccountService {
  const validateAccountAccess: TvalidateAccountAccess = async (
    accountId,
    userId,
    repoOptions
  ) => {
    const account = await deps.ledgerAccountRepo.findById(
      accountId,
      repoOptions
    );
    return account?.createdBy === userId;
  };

  return Object.freeze({
    validateAccountAccess,
  });
}
