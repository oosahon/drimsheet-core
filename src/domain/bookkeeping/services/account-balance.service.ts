import { IRepoOptions } from '../../../shared/types/repo.types';
import ILedgerAccountBalanceRepo from '../../bookkeeping/repos/ledger-account-balance.repo';
import { ICurrency } from '../../currency/types/currency.types';
import { ILedgerAccount } from '../../ledger/types/ledger.types';
import ledgerAccountBalanceEntity from '../entities/ledger-account-balance.entity';
import IAccountBalanceService from '../types/account-balance.service.types';

type TCreateBalance = IAccountBalanceService['createBalance'];

export default function makeLedgerAccountBalanceService(
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo
): IAccountBalanceService {
  const createBalance: TCreateBalance = async (
    ledgerAccount: ILedgerAccount,
    functionalCurrency: ICurrency,
    repoOptions: IRepoOptions
  ) => {
    const existing = await ledgerAccountBalanceRepo.findBalanceByAccountId(
      ledgerAccount.id,
      ledgerAccount.accountingEntityId,
      repoOptions
    );

    if (existing) return existing;

    const balance = ledgerAccountBalanceEntity.make({
      ledgerAccountId: ledgerAccount.id,
      accountingEntityId: ledgerAccount.accountingEntityId,
      accountMaterializedPath: ledgerAccount.materializedPath,
      currencyCode: ledgerAccount.currency.code,
      functionalCurrencyCode: functionalCurrency.code,
    });

    return balance;
  };

  return Object.freeze({
    createBalance,
  });
}
