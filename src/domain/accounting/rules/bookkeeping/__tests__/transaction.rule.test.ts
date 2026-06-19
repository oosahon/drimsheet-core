import generateUUID from '../../../../../shared/utils/uuid-generator';
import { SYSTEM_CURRENCIES } from '../../../../currency/config/currencies.config';
import journalEntryError from '../../../../journal-entry/errors/journal-entry.error';
import { EJournalEntrySourceType } from '../../../../journal-entry/types/journal-entry.types';
import ledgerAccountEntity from '../../../../ledger/entities/shared/ledger-account.entity';
import {
  EAssetAccountBehavior,
  EAssetSubType,
} from '../../../../ledger/types/asset-account.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ILedgerAccount,
} from '../../../../ledger/types/ledger.types';
import accountingError from '../../../errors/accounting.error';
import enforceTransactionAccountsRule from '../transaction.rule';

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

describe('enforceTransactionAccountsRule', () => {
  it('should route to transferTransactionRule when sourceType is Transfer', () => {
    const source = createMockAccount({
      behavior: EAssetAccountBehavior.Bank,
      subType: EAssetSubType.CashAndCashEquivalent,
    });
    const destination = createMockAccount({
      behavior: EAssetAccountBehavior.PettyCash,
      subType: EAssetSubType.CashAndCashEquivalent,
      code: '101002',
    });

    // Valid transfer should not throw
    expect(() => {
      enforceTransactionAccountsRule(
        source,
        [destination],
        EJournalEntrySourceType.Transfer
      );
    }).not.toThrow();

    // Invalid transfer (different subTypes) should throw transfer error
    const invalidDestination = createMockAccount({
      behavior: EAssetAccountBehavior.TradeReceivable,
      subType: EAssetSubType.Receivables,
      code: '102001',
    });
    expect(() => {
      enforceTransactionAccountsRule(
        source,
        [invalidDestination],
        EJournalEntrySourceType.Transfer
      );
    }).toThrow(accountingError.TransferNotPermittedOnAccount);
  });

  it('should route to paymentTransactionRule when sourceType is Payment', () => {
    const source = createMockAccount({
      behavior: EAssetAccountBehavior.Bank,
      subType: EAssetSubType.CashAndCashEquivalent,
    });
    const destination = createMockAccount({
      behavior: EAssetAccountBehavior.Bank,
      subType: EAssetSubType.CashAndCashEquivalent,
      code: '101002',
    });

    // Invalid payment (destination has Asset subType which is not allowed for payments) should throw payment error
    expect(() => {
      enforceTransactionAccountsRule(
        source,
        [destination],
        EJournalEntrySourceType.Payment
      );
    }).toThrow(accountingError.PaymentNotPermittedOnAccount);
  });

  it('should throw journalEntryError.InvalidSourceType when sourceType is unsupported', () => {
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
      enforceTransactionAccountsRule(
        source,
        [destination],
        EJournalEntrySourceType.Sale
      );
    }).toThrow(journalEntryError.InvalidSourceType);
  });
});
