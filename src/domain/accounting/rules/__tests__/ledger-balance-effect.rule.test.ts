import ledgerBalanceEffectRule from '@domain/accounting/rules/ledger-balance-effect.rule';
import {
  EJournalSide,
  UJournalSide,
} from '@domain/journal-entry/types/journal-line.types';
import { ELedgerAccountBalanceEffect } from '@domain/ledger/types/ledger-account-balance.types';
import {
  ELedgerType,
  ENormalBalance,
  ULedgerType,
  UNormalBalance,
} from '@domain/ledger/types/ledger.types';

describe('ledgerBalanceEffectRule', () => {
  it('increases balance when journal side matches normal balance', () => {
    expect(
      ledgerBalanceEffectRule(
        { type: ELedgerType.Asset, normalBalance: ENormalBalance.Debit },
        EJournalSide.Debit
      )
    ).toBe(ELedgerAccountBalanceEffect.Increase);

    expect(
      ledgerBalanceEffectRule(
        { type: ELedgerType.Liability, normalBalance: ENormalBalance.Credit },
        EJournalSide.Credit
      )
    ).toBe(ELedgerAccountBalanceEffect.Increase);
  });

  it('decreases balance when journal side differs from normal balance', () => {
    expect(
      ledgerBalanceEffectRule(
        { type: ELedgerType.Asset, normalBalance: ENormalBalance.Debit },
        EJournalSide.Credit
      )
    ).toBe(ELedgerAccountBalanceEffect.Decrease);

    expect(
      ledgerBalanceEffectRule(
        { type: ELedgerType.Liability, normalBalance: ENormalBalance.Credit },
        EJournalSide.Debit
      )
    ).toBe(ELedgerAccountBalanceEffect.Decrease);
  });

  describe('validation', () => {
    it('throws if account type is invalid', () => {
      expect(() => {
        ledgerBalanceEffectRule(
          {
            type: 'invalid-type' as ULedgerType,
            normalBalance: ENormalBalance.Debit,
          },
          EJournalSide.Debit
        );
      }).toThrow();
    });

    it('throws if normal balance is invalid', () => {
      expect(() => {
        ledgerBalanceEffectRule(
          {
            type: ELedgerType.Asset,
            normalBalance: 'invalid-normal-balance' as UNormalBalance,
          },
          EJournalSide.Debit
        );
      }).toThrow();
    });

    it('throws if journal side is invalid', () => {
      expect(() => {
        ledgerBalanceEffectRule(
          {
            type: ELedgerType.Asset,
            normalBalance: ENormalBalance.Debit,
          },
          'invalid-journal-side' as UJournalSide
        );
      }).toThrow();
    });
  });
});
