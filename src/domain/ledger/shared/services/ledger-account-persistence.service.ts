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
interface IDependencies {
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo;
  ledgerAccountRepo: ILedgerAccountRepo;
  repoService: IRepoService;
  logger: ILogger;
}

export default function makeLedgerAccountPersistenceService(
  deps: IDependencies
): ILedgerAccountPersistenceService {
  return {
    async create(account, functionalCurrencyCode, repoOptions) {
      const isExisting = await deps.ledgerAccountBalanceRepo.findByAccountId(
        account.id,
        account.accountingEntityId,
        repoOptions
      );

      if (isExisting) {
        deps.logger.info(
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
        await deps.ledgerAccountRepo.create(account, { ...repoOptions, tx });
        await deps.ledgerAccountBalanceRepo.create(balance, {
          ...repoOptions,
          tx,
        });
      };

      await deps.repoService.runInTransaction(transactionFn, repoOptions.tx);
    },
  };
}
