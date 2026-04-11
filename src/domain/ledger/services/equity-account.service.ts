import { IRepoOptions } from '../../../app/contracts/infra/repo.contract';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import { IAccountingEntity } from '../../accounting-entity/types/accounting-entity.types';
import { EQUITY_LEDGER_CODES } from '../config/equity-codes.config';
import retainedEarningAccountEntity from '../entities/03-equity-account/01-retained-earning.entity';
import openingBalanceEquityLedgerEntity from '../entities/03-equity-account/99-opening-balance.equity';
import ILedgerAccountRepo from '../repos/ledger-account.repo';
import { IEquityLedgerAccount } from '../types/equity-account.types';

export interface IEquityAccountService {
  setupBaseIndividualAccounts(
    accountingEntity: IAccountingEntity,
    repoOptions: IRepoOptions
  ): Promise<TEntityWithEvents<IEquityLedgerAccount, IEquityLedgerAccount>[]>;

  bootstrapNonPowerUserAccounts(
    accountingEntity: IAccountingEntity,
    repoOptions: IRepoOptions
  ): Promise<TEntityWithEvents<IEquityLedgerAccount, IEquityLedgerAccount>[]>;
}

export default function equityAccountService(
  repo: ILedgerAccountRepo
): IEquityAccountService {
  const service: IEquityAccountService = {
    /**
     * Sets up the following equity accounts for an individual:
     *  - Retained Earnings:         301000
     *  - Opening Balance Equity:    399000
     * @param accountingEntity: The individual entity account
     * @param repoOptions:      The repository options
     */
    async setupBaseIndividualAccounts(accountingEntity, repoOptions) {
      const {
        ownerId,
        id: accountingEntityId,
        functionalCurrency,
      } = accountingEntity;
      const equityAccounts: TEntityWithEvents<
        IEquityLedgerAccount,
        IEquityLedgerAccount
      >[] = [];

      const retainedEarningsCode = EQUITY_LEDGER_CODES.RETAINED_EARNINGS.HEADER;
      const openingBalanceEquityCode =
        EQUITY_LEDGER_CODES.OPENING_BALANCE_EQUITY.HEADER;

      /**
       * Retained Earnings
       */
      const existingRetainedEarnings = await repo.findByCode(
        retainedEarningsCode,
        accountingEntityId,
        repoOptions
      );
      if (!existingRetainedEarnings) {
        const retainedEarningsAccount = retainedEarningAccountEntity.make(
          {
            name: 'Retained Earnings',
            createdBy: ownerId,
            accountingEntityId,
            currency: functionalCurrency,
          },
          null
        );
        equityAccounts.push(retainedEarningsAccount);
      }

      /**
       * Opening Balance Equity
       */
      const existingOpeningBalanceEquity = await repo.findByCode(
        openingBalanceEquityCode,
        accountingEntityId,
        repoOptions
      );
      if (!existingOpeningBalanceEquity) {
        const openingBalanceEquityAccount =
          openingBalanceEquityLedgerEntity.make(
            {
              name: 'Opening Balance Equity',
              createdBy: ownerId,
              accountingEntityId,
              currency: functionalCurrency,
            },
            null
          );
        equityAccounts.push(openingBalanceEquityAccount);
      }

      return equityAccounts;
    },

    /**
     * Sets up the following equity accounts for a non-power user:
     * @param accountingEntity: The individual entity account
     * @param repoOptions:      The repository options
     */
    async bootstrapNonPowerUserAccounts() {
      // Equity accounts are not bootstrapped for non-power users
      return [];
    },
  };

  return Object.freeze(service);
}
