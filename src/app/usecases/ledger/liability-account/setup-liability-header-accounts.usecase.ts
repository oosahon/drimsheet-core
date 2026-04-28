import { IAccountingEntity } from '../../../../domain/accounting/types/accounting-entity.types';
import currencyEntity from '../../../../domain/currency/entities/currency.entity';
import { LIABILITY_LEDGER_CODES } from '../../../../domain/ledger/config/liability-codes.config';
import shortTermLoanAccountEntity from '../../../../domain/ledger/entities/02-liability-account/00-short-term-loan.entity';
import payableAccountEntity from '../../../../domain/ledger/entities/02-liability-account/03-payables.entity';
import ILedgerAccountRepo from '../../../../domain/ledger/repos/ledger-account.repo';
import {
  TLiabilityLedgerCode,
  TPayablesLedgerCode,
} from '../../../../domain/ledger/types/ledger-code.types';
import {
  ILiabilityLedgerAccount,
  IPayableAccount,
} from '../../../../domain/ledger/types/liability-account.types';
import {
  IEvent,
  TEntityWithEvents,
} from '../../../../shared/types/event.types';
import IRequestContext from '../../../contracts/app/request-context.contract';

export default function makeSetupLiabilityHeaderAccountsUseCase(
  requestContext: IRequestContext,
  ledgerAccountRepo: ILedgerAccountRepo
) {
  /**
   * Sets up the following liability accounts for an individual:
   *  - Short Term Debt:              200000
   *  - Payables:                     201000
   *    - Trade Payables:             201001
   *    - Statutory Payables:         201002
   */
  return async (accountingEntity: IAccountingEntity) => {
    const { user, correlationId } = requestContext.get();
    const accountingEntityId = accountingEntity.id;
    const createdBy = user.id;
    const functionalCurrency = currencyEntity.getByCode(
      accountingEntity.functionalCurrencyCode
    );

    const trace = { correlationId };

    const getExistingAccounts = async <T extends ILiabilityLedgerAccount>(
      code: TLiabilityLedgerCode
    ) => {
      return (await ledgerAccountRepo.findByCode(
        code,
        accountingEntityId,
        trace
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
}
