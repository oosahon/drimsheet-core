import ILogger from '../../../../shared/contracts/logger.contract';
import {
  IRepoService,
  TRepoTransactionFn,
} from '../../../../shared/contracts/repo.contract';
import currencyEntity from '../../../currency/entities/currency.entity';
import ILedgerAccountBalanceRepo from '../../account-balance/repos/ledger-account-balance.repo';
import { ledgerAccountBalanceEntity } from '../entities';
import ILedgerAccountRepo from '../repos/ledger-account.repo';
import ILedgerAccountPersistenceService from '../types/ledger-account-persistence.service.types';

// TODO: move this service to the application layer. It shouldn't be touching persistence
export default function makeLedgerAccountPersistenceService(
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo,
  ledgerAccountRepo: ILedgerAccountRepo,
  repoService: IRepoService,
  logger: ILogger
): ILedgerAccountPersistenceService {
  return {
    async create(account, functionalCurrencyCode, repoOptions) {
      const isExisting = await ledgerAccountBalanceRepo.findByAccountId(
        account.id,
        account.accountingEntityId,
        repoOptions
      );

      if (isExisting) {
        logger.info(
          `Skipping creation of ledger account balance (${account.id}) because it already exists`,
          { correlationId: repoOptions.correlationId }
        );
        return;
      }

      const functionalCurrency = currencyEntity.getByCode(
        functionalCurrencyCode
      );

      const balance = ledgerAccountBalanceEntity.make({
        ledgerAccountId: account.id,
        accountingEntityId: account.accountingEntityId,
        accountMaterializedPath: account.materializedPath,
        currencyCode: account.currency.code,
        functionalCurrencyCode: functionalCurrency.code,
      });

      const transactionFn: TRepoTransactionFn = async (tx) => {
        await ledgerAccountRepo.create(account, { ...repoOptions, tx });
        await ledgerAccountBalanceRepo.create(balance, { ...repoOptions, tx });
      };

      await repoService.runInTransaction(transactionFn, repoOptions.tx);
    },
  };
}
