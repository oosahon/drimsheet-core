import generateUUID from '../../../../shared/utils/uuid-generator';
import cashAndEquivalentAccountEntity from '../../../ledger/asset-account/entities/cash-and-equivalents.entity';
import {
  EAssetAccountBehavior,
  EAssetSubType,
} from '../../../ledger/types/asset-account.types';
import { ELedgerType } from '../../../ledger/types/ledger.types';
import { SYSTEM_CURRENCIES } from '../../../money/config/currencies.config';
import { IJournalEntryRulePermits } from '../../types/entry.rules.types';
import journalEntryRuleValidator from '../entry-rule.validator';

describe('journalEntryRuleValidator', () => {
  const [account] = cashAndEquivalentAccountEntity.make(
    {
      name: 'Cash on Hand',
      accountingEntityId: generateUUID(),
      currency: SYSTEM_CURRENCIES.NGN,
      isControlAccount: false,
      controlAccountId: null,
      behavior: EAssetAccountBehavior.DefaultCash,
      meta: null,
      createdBy: generateUUID(),
    },
    null
  );

  it('permits an account when all restrictions are wildcards', () => {
    const permits: IJournalEntryRulePermits = {
      permittedTypes: '*',
      permittedSubTypes: '*',
      permittedBehaviors: '*',
    };

    expect(journalEntryRuleValidator(account, permits)).toBe(true);
  });

  it('permits an account when all of its attributes are explicitly permitted', () => {
    const permits: IJournalEntryRulePermits = {
      permittedTypes: new Set([ELedgerType.Asset]),
      permittedSubTypes: new Set([EAssetSubType.CashAndCashEquivalent]),
      permittedBehaviors: new Set([EAssetAccountBehavior.DefaultCash]),
    };

    expect(journalEntryRuleValidator(account, permits)).toBe(true);
  });

  it('rejects an account with a non-permitted type', () => {
    const permits: IJournalEntryRulePermits = {
      permittedTypes: new Set([ELedgerType.Revenue]),
      permittedSubTypes: '*',
      permittedBehaviors: '*',
    };

    expect(journalEntryRuleValidator(account, permits)).toBe(false);
  });

  it('rejects an account with a non-permitted subtype', () => {
    const permits: IJournalEntryRulePermits = {
      permittedTypes: '*',
      permittedSubTypes: new Set([EAssetSubType.Receivables]),
      permittedBehaviors: '*',
    };

    expect(journalEntryRuleValidator(account, permits)).toBe(false);
  });

  it('rejects an account with a non-permitted behavior', () => {
    const permits: IJournalEntryRulePermits = {
      permittedTypes: '*',
      permittedSubTypes: '*',
      permittedBehaviors: new Set([EAssetAccountBehavior.PettyCash]),
    };

    expect(journalEntryRuleValidator(account, permits)).toBe(false);
  });
});
