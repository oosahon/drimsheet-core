import { IAccountingEntity } from '../../../../domain/accounting/types/accounting-entity.types';
import currencyEntity from '../../../../domain/currency/entities/currency.entity';
import { EQUITY_LEDGER_CODES } from '../../../../domain/ledger/config/equity-codes.config';
import retainedEarningAccountEntity from '../../../../domain/ledger/entities/03-equity-account/01-retained-earning.entity';
import openingBalanceEquityLedgerEntity from '../../../../domain/ledger/entities/03-equity-account/99-opening-balance-equity.entity';
import ILedgerAccountRepo from '../../../../domain/ledger/repos/ledger-account.repo';
import { IEquityLedgerAccount } from '../../../../domain/ledger/types/equity-account.types';
import { TEquityLedgerCode } from '../../../../domain/ledger/types/ledger-code.types';
import {
  IEvent,
  TEntityWithEvents,
} from '../../../../shared/types/event.types';
import IRequestContext from '../../../contracts/app/request-context.contract';

export default function makeSetupEquityHeaderAccountsUseCase(
  requestContext: IRequestContext,
  ledgerAccountRepo: ILedgerAccountRepo
) {
  /**
   * Sets up the following equity accounts for an individual:
   *  - Retained Earnings:         301000
   *  - Opening Balance Equity:    399000
   */
  return async (accountingEntity: IAccountingEntity) => {
    const { user, correlationId } = requestContext.get();
    const accountingEntityId = accountingEntity.id;
    const createdBy = user.id;
    const functionalCurrency = currencyEntity.getByCode(
      accountingEntity.functionalCurrencyCode
    );

    const trace = { correlationId };

    const getExistingAccounts = async <T extends IEquityLedgerAccount>(
      code: TEquityLedgerCode
    ) => {
      return (await ledgerAccountRepo.findByCode(
        code,
        accountingEntityId,
        trace
      )) as T | null;
    };

    const allAccounts: TEntityWithEvents<
      IEquityLedgerAccount,
      IEquityLedgerAccount
    >[] = [];

    /**
     * ==================== Retained Earnings ====================
     */
    const retainedEarningsCode = EQUITY_LEDGER_CODES.RETAINED_EARNINGS.HEADER;
    const existingRetainedEarnings =
      await getExistingAccounts(retainedEarningsCode);

    if (!existingRetainedEarnings) {
      const retainedEarningsAccount = retainedEarningAccountEntity.make(
        {
          name: 'Retained Earnings',
          createdBy,
          accountingEntityId,
          currency: functionalCurrency,
        },
        null
      );
      allAccounts.push(retainedEarningsAccount);
    }

    /**
     * ==================== Opening Balance Equity ====================
     */
    const openingBalanceEquityCode =
      EQUITY_LEDGER_CODES.OPENING_BALANCE_EQUITY.HEADER;
    const existingOpeningBalanceEquity = await getExistingAccounts(
      openingBalanceEquityCode
    );

    if (!existingOpeningBalanceEquity) {
      const openingBalanceEquityAccount = openingBalanceEquityLedgerEntity.make(
        {
          name: 'Opening Balance Equity',
          createdBy,
          accountingEntityId,
          currency: functionalCurrency,
        },
        null
      );
      allAccounts.push(openingBalanceEquityAccount);
    }

    const accounts: IEquityLedgerAccount[] = [];
    const events: IEvent<IEquityLedgerAccount>[] = [];

    for (const [account, accountEvents] of allAccounts) {
      accounts.push(account);
      events.push(...accountEvents);
    }

    return { accounts, events };
  };
}
