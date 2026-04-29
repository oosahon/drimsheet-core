import { IEvent, TEntityWithEvents } from '../../../shared/types/event.types';
import currencyEntity from '../../currency/entities/currency.entity';
import { LIABILITY_LEDGER_CODES } from '../config/liability-codes.config';
import shortTermLoanAccountEntity from '../entities/02-liability-account/00-short-term-loan.entity';
import payableAccountEntity from '../entities/02-liability-account/03-payables.entity';
import ILedgerAccountRepo from '../repos/ledger-account.repo';
import {
  TLiabilityLedgerCode,
  TPayablesLedgerCode,
} from '../types/ledger-code.types';
import ILiabilityAccountService from '../types/liability-account.service.types';
import {
  ILiabilityLedgerAccount,
  IPayableAccount,
} from '../types/liability-account.types';

type TBootstrapHeaders = ILiabilityAccountService['bootstrapHeaderAccounts'];

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
    repoOptions
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

    const allAccounts: TEntityWithEvents<
      ILiabilityLedgerAccount,
      ILiabilityLedgerAccount
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
      allAccounts.push(statutoryPayables);
    }

    const accounts: ILiabilityLedgerAccount[] = [];
    const events: IEvent<ILiabilityLedgerAccount>[] = [];

    for (const [account, accountEvents] of allAccounts) {
      accounts.push(account);
      events.push(...accountEvents);
    }

    return { accounts, events };
  };

  return Object.freeze({
    bootstrapHeaderAccounts,
  });
}
