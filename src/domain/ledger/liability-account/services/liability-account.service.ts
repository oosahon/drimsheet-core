import { IEvent, TAuditedEntity } from '../../../../shared/types/event.types';
import { IEntityDelta } from '../../../../shared/types/history.types';
import currencyEntity from '../../../currency/entities/currency.entity';
import ILedgerAccountRepo from '../../shared/repos/ledger-account.repo';
import {
  TLiabilityLedgerCode,
  TPayablesLedgerCode,
} from '../../shared/types/ledger-code.types';
import { ELedgerType, ILedgerAccount } from '../../shared/types/ledger.types';
import { LIABILITY_LEDGER_CODES } from '../config/liability-codes.config';
import payableAccountEntity from '../entities/payables.entity';
import shortTermLoanAccountEntity from '../entities/short-term-loan.entity';
import liabilitySuspenseAccountEntity from '../entities/suspense-account.entity';
import ILiabilityAccountService from '../types/liability-account.service.types';
import {
  ELiabilityAccountBehavior,
  ELiabilitySubType,
  ILiabilityLedgerAccount,
  IPayableAccount,
  IStatutoryPayableAccount,
} from '../types/liability-account.types';

type TBootstrapHeaders = ILiabilityAccountService['bootstrapHeaderAccounts'];
type TBootstrapIndividualPostingAccounts =
  ILiabilityAccountService['bootstrapIndividualPostingAccounts'];

export default function makeLiabilityAccountService(
  repo: ILedgerAccountRepo
): ILiabilityAccountService {
  /**
   * Bootstraps header liability accounts for a new accounting entity
   *  - Short Term Debt:              200000
   *  - Payables:                     201000
   *    - Trade Payables:             201001
   *    - Statutory Payables:         201002
   */
  const bootstrapHeaderAccounts: TBootstrapHeaders = async (
    accountingEntity,
    repoOptions,
    shouldBootstrapPostingAccounts
  ) => {
    const accountingEntityId = accountingEntity.id;
    const functionalCurrency = currencyEntity.getByCode(
      accountingEntity.functionalCurrencyCode
    );
    const createdBy = accountingEntity.ownerId;

    const getExistingAccounts = async <T extends ILiabilityLedgerAccount>(
      code: TLiabilityLedgerCode
    ) => {
      return (await repo.findByCode(
        code,
        accountingEntityId,
        repoOptions
      )) as T | null;
    };

    const allAccounts: TAuditedEntity<
      ILiabilityLedgerAccount,
      ILiabilityLedgerAccount,
      ILedgerAccount
    >[] = [];

    /**
     * ==================== Short Term Debt ====================
     */
    const shortTermDebtHeaderCode =
      LIABILITY_LEDGER_CODES.SHORT_TERM_DEBT.HEADER;
    const existingShortTermDebtHeader = await getExistingAccounts(
      shortTermDebtHeaderCode
    );

    const stdPayload = {
      name: 'Short Term Debt',
      createdBy,
      accountingEntityId,
      currency: functionalCurrency,
    };

    if (!existingShortTermDebtHeader) {
      const std = shortTermLoanAccountEntity.makeHeader(stdPayload);
      allAccounts.push(std);
    }

    /**
     * ==================== Payables ====================
     */
    const payablesHeaderCode = LIABILITY_LEDGER_CODES.PAYABLES.HEADER;
    let existingPayablesHeader =
      await getExistingAccounts<IPayableAccount>(payablesHeaderCode);

    if (!existingPayablesHeader) {
      const payables = payableAccountEntity.makeHeader({
        name: 'Payables',
        createdBy,
        accountingEntityId,
        currency: functionalCurrency,
      });
      existingPayablesHeader = payables[0];
      allAccounts.push(payables);
    }

    /**
     * ==================== Trade Payables ====================
     */
    const tradePayablesCode = LIABILITY_LEDGER_CODES.PAYABLES.TRADE;
    let existingTradePayables =
      await getExistingAccounts<IPayableAccount>(tradePayablesCode);

    if (!existingTradePayables) {
      const tradePayables = payableAccountEntity.makeTradePayableAccount(
        {
          name: 'Trade Payables',
          createdBy,
          accountingEntityId,
          currency: functionalCurrency,
          isControlAccount: true,
          controlAccountId: existingPayablesHeader.id,
          meta: null,
        },
        {
          precedingCode: existingPayablesHeader.code as TPayablesLedgerCode,
          parentMaterializedPath:
            existingPayablesHeader.materializedPath as TPayablesLedgerCode,
        }
      );
      existingTradePayables = tradePayables[0];
      allAccounts.push(tradePayables);
    }

    /**
     * ==================== Statutory Payables ====================
     */
    const statutoryPayablesCode = LIABILITY_LEDGER_CODES.PAYABLES.STATUTORY;
    const isExistingStatutoryPayables = await getExistingAccounts(
      statutoryPayablesCode
    );

    let statutoryPayablesHeader: IStatutoryPayableAccount;

    if (!isExistingStatutoryPayables) {
      const statutoryPayables =
        payableAccountEntity.makeStatutoryPayableAccount(
          {
            name: 'Statutory Payables',
            createdBy,
            accountingEntityId,
            currency: functionalCurrency,
            isControlAccount: true,
            controlAccountId: existingPayablesHeader.id,
            meta: null,
          },
          {
            precedingCode: existingTradePayables.code as TPayablesLedgerCode,
            parentMaterializedPath:
              existingPayablesHeader.materializedPath as TPayablesLedgerCode,
          }
        );
      statutoryPayablesHeader =
        statutoryPayables[0] as IStatutoryPayableAccount;
      allAccounts.push(statutoryPayables);
    } else {
      statutoryPayablesHeader =
        isExistingStatutoryPayables as IStatutoryPayableAccount;
    }

    if (shouldBootstrapPostingAccounts) {
      const postingAccountsWithEvents =
        await bootstrapIndividualPostingAccounts(
          accountingEntity,
          { statutoryPayablesHeader },
          repoOptions
        );
      allAccounts.push(...postingAccountsWithEvents);
    }

    const accounts: ILiabilityLedgerAccount[] = [];
    const events: IEvent<ILiabilityLedgerAccount>[] = [];
    const audits: IEntityDelta<ILedgerAccount>[] = [];

    for (const [account, accountEvents, audit] of allAccounts) {
      accounts.push(account);
      events.push(...accountEvents);
      audits.push(audit);
    }

    return { accounts, events, audits };
  };

  const bootstrapIndividualPostingAccounts: TBootstrapIndividualPostingAccounts =
    async (accountingEntity, headers, repoOptions) => {
      const {
        ownerId,
        id: accountingEntityId,
        functionalCurrencyCode,
      } = accountingEntity;

      const functionalCurrency = currencyEntity.getByCode(
        functionalCurrencyCode
      );

      const liabilityAccounts: TAuditedEntity<
        ILiabilityLedgerAccount,
        ILiabilityLedgerAccount,
        ILedgerAccount
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
        const account = liabilitySuspenseAccountEntity.make(
          {
            accountingEntityId,
            currency: functionalCurrency,
            name: 'Liability Suspense Account',
            createdBy: ownerId,
          },
          null
        );
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

      // Since the header is also a statutory payable, if length is 1, only the header exists
      if (existingStatutoryPayables.length === 1) {
        const account = payableAccountEntity.makeStatutoryPayableAccount(
          {
            name: 'Statutory Payables (Default)',
            createdBy: ownerId,
            accountingEntityId,
            currency: functionalCurrency,
            isControlAccount: false,
            controlAccountId: headers.statutoryPayablesHeader.id,
            meta: null,
          },
          {
            precedingCode: headers.statutoryPayablesHeader
              .code as TPayablesLedgerCode,
            parentMaterializedPath: headers.statutoryPayablesHeader
              .materializedPath as TPayablesLedgerCode,
          }
        );
        liabilityAccounts.push(account);
      }

      return liabilityAccounts;
    };

  return Object.freeze({
    bootstrapHeaderAccounts,
    bootstrapIndividualPostingAccounts,
  });
}
