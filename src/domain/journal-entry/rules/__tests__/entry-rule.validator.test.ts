import generateUUID from '../../../../shared/utils/uuid-generator';
import { IAccountingEntity } from '../../../accounting/types/accounting-entity.types';
import ILedgerAccountRepo from '../../../ledger/repos/ledger-account.repo';
import makeCashAccountService from '../../../ledger/services/cash-account.service';
import {
  EAssetAccountBehavior,
  EAssetSubType,
} from '../../../ledger/types/asset-account.types';
import {
  ELedgerType,
  ILedgerAccount,
} from '../../../ledger/types/ledger.types';
import { SYSTEM_CURRENCIES } from '../../../money/config/currencies.config';
import { IJournalEntryRulePermits } from '../../types/entry.rules.types';
import journalEntryRuleValidator from '../entry-rule.validator';

describe('journalEntryRuleValidator', () => {
  const userId = generateUUID();
  const accountingEntity = {
    id: generateUUID(),
    ownerId: userId,
    functionalCurrencyCode: SYSTEM_CURRENCIES.NGN.code,
  } as IAccountingEntity;
  const ledgerAccountRepo: jest.Mocked<ILedgerAccountRepo> = {
    create: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
    findAllByIds: jest.fn(),
    findByCode: jest.fn(),
    findBySubType: jest.fn(),
    findByBehavior: jest.fn(),
    findLatestBySubType: jest.fn(),
    findAll: jest.fn(),
  };
  const cashAccountService = makeCashAccountService({ ledgerAccountRepo });
  let account: ILedgerAccount;

  beforeAll(async () => {
    [account] = await cashAccountService.createHeader({
      name: 'Cash on Hand',
      userId,
      accountingEntity,
    });
  });

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
