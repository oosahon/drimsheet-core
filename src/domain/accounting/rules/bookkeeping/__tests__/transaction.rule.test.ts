import generateUUID from '../../../../../shared/utils/uuid-generator';
import { SYSTEM_CURRENCIES } from '../../../../currency/config/currencies.config';
import journalEntryError from '../../../../journal-entry/errors/journal-entry.error';
import { EJournalEntrySourceType } from '../../../../journal-entry/types/journal-entry.types';
import {
  EAssetAccountBehavior,
  EAssetSubType,
} from '../../../../ledger/asset-account/types/asset-account.types';
import ledgerAccountEntity from '../../../../ledger/shared/entities/ledger-account.entity';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ILedgerAccount,
} from '../../../../ledger/shared/types/ledger.types';
import accountingError from '../../../errors/accounting.error';
import getTransactionRule from '../transaction.rule';

function createMockAccount(overrides: Partial<ILedgerAccount>): ILedgerAccount {
  const type = overrides.type ?? ELedgerType.Asset;
  const subType = overrides.subType ?? EAssetSubType.CashAndCashEquivalent;
  const behavior = overrides.behavior ?? EAssetAccountBehavior.Bank;
  const code = overrides.code ?? '101001';

  const [account] = ledgerAccountEntity.make({
    code,
    materializedPath: code,
    accountingEntityId: overrides.accountingEntityId ?? generateUUID(),
    type,
    subType,
    behavior,
    normalBalance: ledgerAccountEntity.getNormalBalance(type),
    isControlAccount: false,
    controlAccountId: null,
    name: overrides.name ?? 'Test Account',
    currency: SYSTEM_CURRENCIES.USD,
    status: ELedgerAccountStatus.Active,
    contraAccountRule: EContraAccountRule.ContraPermitted,
    adjunctAccountRule: EAdjunctAccountRule.AdjunctPermitted,
    meta: {},
    createdBy: generateUUID(),
    ...overrides,
  });
  return account;
}

describe('getTransactionRule', () => {
  it('should return transferTransactionRule when sourceType is Transfer', () => {
    const rule = getTransactionRule(EJournalEntrySourceType.Transfer);
    expect(rule).toBeDefined();
    expect(rule.enforce).toBeDefined();
    expect(rule.getPermittedAccounts).toBeDefined();
    expect(rule.getSides).toBeDefined();
  });

  it('should return paymentTransactionRule when sourceType is Payment', () => {
    const rule = getTransactionRule(EJournalEntrySourceType.Payment);
    expect(rule).toBeDefined();
    expect(rule.enforce).toBeDefined();
    expect(rule.getPermittedAccounts).toBeDefined();
    expect(rule.getSides).toBeDefined();
  });

  it('should return a rule that enforces transfer accounts correctly', () => {
    const rule = getTransactionRule(EJournalEntrySourceType.Transfer);
    const source = createMockAccount({
      behavior: EAssetAccountBehavior.Bank,
      subType: EAssetSubType.CashAndCashEquivalent,
    });
    const destination = createMockAccount({
      behavior: EAssetAccountBehavior.PettyCash,
      subType: EAssetSubType.CashAndCashEquivalent,
      code: '101002',
    });

    expect(() => {
      rule.enforce(source, [destination]);
    }).not.toThrow();

    const invalidDestination = createMockAccount({
      behavior: EAssetAccountBehavior.TradeReceivable,
      subType: EAssetSubType.Receivables,
      code: '102001',
    });
    expect(() => {
      rule.enforce(source, [invalidDestination]);
    }).toThrow(accountingError.TransferNotPermittedOnAccount);
  });

  it('should return a rule that enforces payment accounts correctly', () => {
    const rule = getTransactionRule(EJournalEntrySourceType.Payment);
    const source = createMockAccount({
      behavior: EAssetAccountBehavior.Bank,
      subType: EAssetSubType.CashAndCashEquivalent,
    });
    const destination = createMockAccount({
      behavior: EAssetAccountBehavior.Bank,
      subType: EAssetSubType.CashAndCashEquivalent,
      code: '101002',
    });

    expect(() => {
      rule.enforce(source, [destination]);
    }).toThrow(accountingError.PaymentNotPermittedOnAccount);
  });

  it('should throw journalEntryError.InvalidSourceType when sourceType is unsupported', () => {
    expect(() => {
      getTransactionRule(EJournalEntrySourceType.Sale);
    }).toThrow(journalEntryError.InvalidSourceType);
  });
});
