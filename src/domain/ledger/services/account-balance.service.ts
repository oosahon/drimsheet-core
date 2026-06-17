import { IReadRepoOptions } from '../../../shared/types/repo.types';
import { ICurrency } from '../../currency/types/currency.types';
import ledgerAccountBalanceEntity from '../entities/shared/ledger-account-balance.entity';
import ILedgerAccountBalanceRepo from '../repos/ledger-account-balance.repo';
import IAccountBalanceService from '../types/account-balance.service.types';
import { ILedgerAccount } from '../types/ledger.types';

type TCreateBalance = IAccountBalanceService['createBalance'];

export default function makeLedgerAccountBalanceService(
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo
): IAccountBalanceService {
  const createBalance: TCreateBalance = async (
    ledgerAccount: ILedgerAccount,
    functionalCurrency: ICurrency,
    repoOptions: IReadRepoOptions
  ) => {
    const existing = await ledgerAccountBalanceRepo.findByAccountId(
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
