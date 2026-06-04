import ILedgerAccountRepo from '../repos/ledger-account.repo';
import { ILedgerAccountService } from '../types/ledger-account.service.types';

type TvalidateAccountAccess = ILedgerAccountService['validateAccountAccess'];

export default function makeLedgerAccountService(
  ledgerAccountRepo: ILedgerAccountRepo
): ILedgerAccountService {
  const validateAccountAccess: TvalidateAccountAccess = async (
    accountId,
    userId,
    repoOptions
  ) => {
    const account = await ledgerAccountRepo.findById(accountId, repoOptions);
    return account?.createdBy === userId;
  };

  return Object.freeze({
    validateAccountAccess,
  });
}
