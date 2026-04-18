import { IRepoOptions } from '../../../app/contracts/infra/repo.contract';
import { TEntityWithEvents } from '../../../shared/types/event.types';
import { AppError } from '../../../shared/value-objects/error';
import { IAccountingEntity } from '../../accounting-entity/types/accounting-entity.types';
import { LIABILITY_LEDGER_CODES } from '../config/liability-codes.config';
import shortTermLoanAccountEntity from '../entities/02-liability-account/00-short-term-loan.entity';
import payableAccountEntity from '../entities/02-liability-account/03-payables.entity';
import liabilitySuspenseAccountEntity from '../entities/02-liability-account/99-suspense-account.entity';
import ILedgerAccountRepo from '../repos/ledger-account.repo';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerType,
} from '../types/ledger.types';
import {
  ELiabilityAccountBehavior,
  ELiabilitySubType,
  ILiabilityLedgerAccount,
  IPayableAccount,
  IStatutoryPayableAccount,
} from '../types/liability-account.types';

interface ILiabilityAccountService {
  makeHeaderAccountsForIndividuals(
    accountingEntity: IAccountingEntity,
    repoOptions: IRepoOptions
  ): Promise<
    TEntityWithEvents<ILiabilityLedgerAccount, ILiabilityLedgerAccount>[]
  >;

  makePostingAccountsForIndividuals(
    accountingEntity: IAccountingEntity,
    repoOptions: IRepoOptions
  ): Promise<
    TEntityWithEvents<ILiabilityLedgerAccount, ILiabilityLedgerAccount>[]
  >;
}

export default function liabilityAccountService(
  repo: ILedgerAccountRepo
): ILiabilityAccountService {
  const service: ILiabilityAccountService = {
    /**
     * Sets up the following liability accounts for an individual:
     *  - Short Term Loans:         200000
     *  - Payables:                 201000
     *      - Trade Payables:       201001
     *      - Statutory Payables:   201002
     * @param accountingEntity: The individual entity account
     * @param repoOptions:      The repository options
     */
    async makeHeaderAccountsForIndividuals(accountingEntity, repoOptions) {
      const {
        ownerId,
        id: accountingEntityId,
        functionalCurrency,
      } = accountingEntity;
      const liabilityAccounts: TEntityWithEvents<
        ILiabilityLedgerAccount,
        ILiabilityLedgerAccount
      >[] = [];

      const shortTermLoanCode = LIABILITY_LEDGER_CODES.SHORT_TERM_DEBT.HEADER;
      const payablesCode = LIABILITY_LEDGER_CODES.PAYABLES.HEADER;
      const tradePayablesCode = LIABILITY_LEDGER_CODES.PAYABLES.TRADE;
      const statutoryPayablesCode = LIABILITY_LEDGER_CODES.PAYABLES.STATUTORY;

      /**
       * Short Term Loans / Debts
       */
      const isExistingShortTermLoan = await repo.findByCode(
        shortTermLoanCode,
        accountingEntityId,
        repoOptions
      );
      if (!isExistingShortTermLoan) {
        const shortTermLoan = shortTermLoanAccountEntity.make(
          {
            name: 'Short Term Loans',
            createdBy: ownerId,
            accountingEntityId,
            currency: functionalCurrency,
            isControlAccount: true,
            controlAccountId: null,
            behavior: ELiabilityAccountBehavior.DefaultShortTermDebt,
            meta: null,
          },
          null
        );
        liabilityAccounts.push(shortTermLoan);
      }

      /**
       * Payables
       */
      let existingPayables = (await repo.findByCode(
        payablesCode,
        accountingEntityId,
        repoOptions
      )) as IPayableAccount | null;

      if (!existingPayables) {
        const payables = payableAccountEntity.make(
          {
            name: 'Payables',
            createdBy: ownerId,
            accountingEntityId,
            currency: functionalCurrency,
            isControlAccount: true,
            controlAccountId: null,
            behavior: ELiabilityAccountBehavior.DefaultPayable,
            contraAccountRule: EContraAccountRule.ContraPermitted,
            adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
            meta: null,
          },
          null
        );
        existingPayables = payables[0];
        liabilityAccounts.push(payables);
      }

      /**
       * Trade Payables
       */
      let existingTradePayables = (await repo.findByCode(
        tradePayablesCode,
        accountingEntityId,
        repoOptions
      )) as IPayableAccount | null;

      if (!existingTradePayables) {
        const tradePayables = payableAccountEntity.make(
          {
            name: 'Trade Payables',
            createdBy: ownerId,
            accountingEntityId,
            currency: functionalCurrency,
            isControlAccount: true,
            controlAccountId: existingPayables.id,
            behavior: ELiabilityAccountBehavior.TradePayable,
            contraAccountRule: EContraAccountRule.ContraPermitted,
            adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
            meta: null,
          },
          existingPayables.code
        );
        existingTradePayables = tradePayables[0];
        liabilityAccounts.push(tradePayables);
      }

      /**
       * Statutory Payables
       */
      const isExistingStatutoryPayables = await repo.findByCode(
        statutoryPayablesCode,
        accountingEntityId,
        repoOptions
      );
      if (!isExistingStatutoryPayables) {
        const statutoryPayables = payableAccountEntity.make(
          {
            name: 'Statutory Payables',
            createdBy: ownerId,
            accountingEntityId,
            currency: functionalCurrency,
            isControlAccount: true,
            controlAccountId: existingPayables.id,
            behavior: ELiabilityAccountBehavior.TaxPayable,
            contraAccountRule: EContraAccountRule.ContraNotPermitted,
            adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
            meta: null,
          },
          existingTradePayables.code
        );
        liabilityAccounts.push(statutoryPayables);
      }

      return liabilityAccounts;
    },

    /**
     * Sets up the following liability accounts for a non-power user:
     *  - Suspense Liability Account: 299000
     *  - Default statutory payable account: 201003
     * @param accountingEntity: The individual entity account
     * @param repoOptions:      The repository options
     */
    async makePostingAccountsForIndividuals(accountingEntity, repoOptions) {
      const {
        ownerId,
        id: accountingEntityId,
        functionalCurrency,
      } = accountingEntity;
      const liabilityAccounts: TEntityWithEvents<
        ILiabilityLedgerAccount,
        ILiabilityLedgerAccount
      >[] = [];

      /**
       * Suspense account
       */
      const existingSuspense = await repo.findBySubType(
        accountingEntityId,
        ELedgerType.Liability,
        ELiabilitySubType.Suspense,
        repoOptions
      );

      if (!existingSuspense.length) {
        const account = liabilitySuspenseAccountEntity.make({
          accountingEntityId,
          currency: functionalCurrency,
          name: 'Liability Suspense Account',
          createdBy: ownerId,
        });
        liabilityAccounts.push(account);
      }

      /**
       * Statutory Payables
       */
      const existingStatutoryPayables = (await repo.findByBehavior(
        accountingEntityId,
        ELiabilityAccountBehavior.TaxPayable,
        repoOptions
      )) as IStatutoryPayableAccount[];

      if (!existingStatutoryPayables.length) {
        throw new AppError(
          'Statutory payables header account not found during bootstrap'
        );
      }

      if (existingStatutoryPayables.length === 1) {
        const account = payableAccountEntity.make(
          {
            name: 'Statutory Payables (Default)',
            createdBy: ownerId,
            accountingEntityId,
            currency: functionalCurrency,
            isControlAccount: false,
            controlAccountId: existingStatutoryPayables[0].id,
            behavior: ELiabilityAccountBehavior.TaxPayable,
            meta: null,
            contraAccountRule: EContraAccountRule.ContraNotPermitted,
            adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
          },
          existingStatutoryPayables[0].code
        );
        liabilityAccounts.push(account);
      }

      return liabilityAccounts;
    },
  };

  return Object.freeze(service);
}
