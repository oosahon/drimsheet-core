import {
  IEvent,
  TAuditedEntity,
} from '../../../../shared/events/types/event.types';
import { IEntityDelta } from '../../../../shared/history/types/history.types';
import currencyEntity from '../../../money/entities/currency.entity';
import ILedgerAccountRepo from '../../shared/repos/ledger-account.repo';
import { TEquityLedgerCode } from '../../shared/types/ledger-code.types';
import { ILedgerAccount } from '../../shared/types/ledger.types';
import { EQUITY_LEDGER_CODES } from '../config/equity-codes.config';
import openingBalanceEquityLedgerEntity from '../entities/opening-balance-equity.entity';
import retainedEarningAccountEntity from '../entities/retained-earning.entity';
import IEquityAccountService from '../types/equity-account.service.types';
import { IEquityLedgerAccount } from '../types/equity-account.types';

type TBootstrapHeaders = IEquityAccountService['bootstrapHeaderAccounts'];

interface IDependencies {
  ledgerAccountRepo: ILedgerAccountRepo;
}

export default function makeEquityAccountService(
  deps: IDependencies
): IEquityAccountService {
  /**
   * Bootstraps header equity accounts for a new accounting entity
   *  - Retained Earnings:         301000
   *  - Opening Balance Equity:    399000
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

    const getExistingAccounts = async <T extends IEquityLedgerAccount>(
      code: TEquityLedgerCode
    ) => {
      return (await deps.ledgerAccountRepo.findByCode(
        code,
        accountingEntityId,
        repoOptions
      )) as T | null;
    };

    const allAccounts: TAuditedEntity<
      IEquityLedgerAccount,
      IEquityLedgerAccount,
      ILedgerAccount
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
    const audits: IEntityDelta<ILedgerAccount>[] = [];

    for (const [account, accountEvents, audit] of allAccounts) {
      accounts.push(account);
      events.push(...accountEvents);
      audits.push(audit);
    }

    return { accounts, events, audits };
  };

  return Object.freeze({
    bootstrapHeaderAccounts,
  });
}
