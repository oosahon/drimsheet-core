import generateUUID from '../../../../shared/utils/uuid-generator';
import cashAndEquivalentAccountEntity from '../../../ledger/asset-account/entities/cash-and-equivalents.entity';
import receivablesAccountEntity from '../../../ledger/asset-account/entities/receivables.entity';
import openingBalanceEquityLedgerEntity from '../../../ledger/equity-account/entities/opening-balance-equity.entity';
import payableAccountEntity from '../../../ledger/liability-account/entities/payables.entity';
import servicesAccountEntity from '../../../ledger/revenue-account/entities/services.entity';
import { SYSTEM_CURRENCIES } from '../../../money/config/currencies.config';
import journalEntryRuleValidator from '../entry-rule.validator';
import openingBalanceEntryRule from '../opening-balance-entry.rule';
import receiptEntryRule from '../receipt-entry.rule';

describe('journal entry rules', () => {
  const accountingEntityId = generateUUID();
  const createdBy = generateUUID();
  const currency = SYSTEM_CURRENCIES.NGN;

  const [cashAccount] = cashAndEquivalentAccountEntity.make(
    {
      name: 'Cash on Hand',
      accountingEntityId,
      currency,
      isControlAccount: false,
      controlAccountId: null,
      behavior: cashAndEquivalentAccountEntity.makeHeader({
        name: 'Cash Header',
        accountingEntityId,
        currency,
        createdBy,
      })[0].behavior,
      meta: null,
      createdBy,
    },
    null
  );

  const [receivableAccount] = receivablesAccountEntity.makeHeader({
    name: 'Receivables',
    accountingEntityId,
    currency,
    createdBy,
  });

  const [openingBalanceEquityAccount] = openingBalanceEquityLedgerEntity.make(
    {
      name: 'Opening Balance Equity',
      accountingEntityId,
      currency,
      createdBy,
    },
    null
  );

  const [revenueAccount] = servicesAccountEntity.makeHeader({
    name: 'Service Revenue',
    accountingEntityId,
    currency,
    createdBy,
  });

  const [liabilityAccount] = payableAccountEntity.makeHeader({
    name: 'Accounts Payable',
    accountingEntityId,
    currency,
    createdBy,
  });

  describe('openingBalanceEntryRule', () => {
    it('permits any source account', () => {
      expect(
        journalEntryRuleValidator(cashAccount, openingBalanceEntryRule.source)
      ).toBe(true);

      expect(
        journalEntryRuleValidator(
          revenueAccount,
          openingBalanceEntryRule.source
        )
      ).toBe(true);
    });

    it('permits only opening balance equity as the destination account', () => {
      expect(
        journalEntryRuleValidator(
          openingBalanceEquityAccount,
          openingBalanceEntryRule.destination
        )
      ).toBe(true);

      expect(
        journalEntryRuleValidator(
          cashAccount,
          openingBalanceEntryRule.destination
        )
      ).toBe(false);
    });
  });

  describe('receiptEntryRule', () => {
    it('permits revenue and liability accounts as source accounts', () => {
      expect(
        journalEntryRuleValidator(revenueAccount, receiptEntryRule.source)
      ).toBe(true);

      expect(
        journalEntryRuleValidator(liabilityAccount, receiptEntryRule.source)
      ).toBe(true);
    });

    it('rejects non-revenue and non-liability accounts as source accounts', () => {
      expect(
        journalEntryRuleValidator(cashAccount, receiptEntryRule.source)
      ).toBe(false);
    });

    it('permits only cash and cash equivalent accounts as destination accounts', () => {
      expect(
        journalEntryRuleValidator(cashAccount, receiptEntryRule.destination)
      ).toBe(true);

      expect(
        journalEntryRuleValidator(
          receivableAccount,
          receiptEntryRule.destination
        )
      ).toBe(false);
    });
  });
});
