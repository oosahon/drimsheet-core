import generateUUID from '../../../../../shared/utils/uuid-generator';
import ledgerAccountEntity from '../../../../ledger/entities/ledger-account.entity';
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
import { SYSTEM_CURRENCIES } from '../../../../money/config/currencies.config';
import accountingError from '../../../errors/accounting.error';
import transferTransactionRule from '../transfer-transaction.rule';

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

describe('transferTransactionRule', () => {
  describe('Rule Configuration', () => {
    it('should have correct permitted accounts configuration', () => {
      const permitted = transferTransactionRule.getPermittedAccounts();
      expect(permitted.sources).toEqual({
        behaviors: [
          EAssetAccountBehavior.PettyCash,
          EAssetAccountBehavior.Bank,
        ],
        subtypes: [],
      });
      expect(permitted.destinations).toEqual({
        behaviors: [
          EAssetAccountBehavior.PettyCash,
          EAssetAccountBehavior.Bank,
        ],
        subtypes: [],
      });
    });

    it('should return credit for source and debit for destination', () => {
      const sides = transferTransactionRule.getSides();
      expect(sides.source).toBe('credit');
      expect(sides.destination).toBe('debit');
    });
  });

  describe('enforce', () => {
    it('should pass when source is permitted and all destinations have the same subType', () => {
      const source = createMockAccount({
        behavior: EAssetAccountBehavior.Bank,
        subType: EAssetSubType.CashAndCashEquivalent,
      });
      const destination1 = createMockAccount({
        behavior: EAssetAccountBehavior.PettyCash,
        subType: EAssetSubType.CashAndCashEquivalent,
        code: '101002',
      });
      const destination2 = createMockAccount({
        behavior: EAssetAccountBehavior.Bank,
        subType: EAssetSubType.CashAndCashEquivalent,
        code: '101003',
      });

      expect(() => {
        transferTransactionRule.enforce(source, [destination1, destination2]);
      }).not.toThrow();
    });

    it('should throw TransferNotPermittedOnAccount when source account behavior is not permitted', () => {
      const source = createMockAccount({
        behavior: EAssetAccountBehavior.TradeReceivable,
        subType: EAssetSubType.Receivables,
      });
      const destination = createMockAccount({
        behavior: EAssetAccountBehavior.Bank,
        subType: EAssetSubType.CashAndCashEquivalent,
      });

      expect(() => {
        transferTransactionRule.enforce(source, [destination]);
      }).toThrow(accountingError.TransferNotPermittedOnAccount);
    });

    it('should throw TransferNotPermittedOnAccount when a destination account has a different subType than the source', () => {
      const source = createMockAccount({
        behavior: EAssetAccountBehavior.Bank,
        subType: EAssetSubType.CashAndCashEquivalent,
      });
      const destination = createMockAccount({
        behavior: EAssetAccountBehavior.TradeReceivable,
        subType: EAssetSubType.Receivables,
        code: '102001',
      });

      expect(() => {
        transferTransactionRule.enforce(source, [destination]);
      }).toThrow(accountingError.TransferNotPermittedOnAccount);
    });
  });
});
