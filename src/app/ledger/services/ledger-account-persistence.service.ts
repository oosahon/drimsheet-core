import ILedgerAccountBalanceRepo from '../../../domain/ledger/account-balance/repos/ledger-account-balance.repo';
import { ledgerAccountBalanceEntity } from '../../../domain/ledger/shared/entities';
import ILedgerAccountRepo from '../../../domain/ledger/shared/repos/ledger-account.repo';
import currencyEntity from '../../../domain/money/entities/currency.entity';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../../shared/contracts/repo.contract';
import ILedgerAccountPersistenceService from '../contracts/ledger-account-persistence.service.contract';

interface IDependencies {
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo;
  ledgerAccountRepo: ILedgerAccountRepo;
  repoService: IRepoService;
}

/**
 * Creates a ledger account and its initial balance in the persistence layer.
 * Ensures both records are created within the same transaction.
 */
function makeCreate(
  deps: IDependencies
): ILedgerAccountPersistenceService['create'] {
  return async (account, functionalCurrencyCode, repoOptions) => {
    const functionalCurrency = currencyEntity.getByCode(functionalCurrencyCode);

    const balance = ledgerAccountBalanceEntity.make({
      ledgerAccountId: account.id,
      accountingEntityId: account.accountingEntityId,
      accountMaterializedPath: account.materializedPath,
      currencyCode: account.currency.code,
      functionalCurrencyCode: functionalCurrency.code,
    });

    const transactionFn: TRepoTransactionFn = async (tx) => {
      const writeOptions = { ...repoOptions, tx };

      await deps.ledgerAccountRepo.create(account, writeOptions);
      await deps.ledgerAccountBalanceRepo.create(balance, writeOptions);
    };

    await deps.repoService.runInTransaction(transactionFn, repoOptions.tx);
  };
}

export default function makeLedgerAccountPersistenceService(
  deps: IDependencies
) {
  const service: ILedgerAccountPersistenceService = Object.freeze({
    create: makeCreate(deps),
  });

  return service;
}
