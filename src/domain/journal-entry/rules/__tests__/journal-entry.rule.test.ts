import { ELedgerAccountBalanceEffect } from '../../../ledger/types/ledger-account-balance.types';
import {
  ELedgerType,
  ENormalBalance,
} from '../../../ledger/types/ledger.types';
import { EJournalSide } from '../../types/journal-line.types';
import journalEntryRules from '../journal-entry.rule';

describe('journalEntryRules', () => {
  describe('getBalanceEffect', () => {
    describe('Asset Account', () => {
      it('should increase on normal debit', () => {
        expect(
          journalEntryRules.getBalanceEffect(
            {
              type: ELedgerType.Asset,
              normalBalance: ENormalBalance.Debit,
            },
            EJournalSide.Debit
          )
        ).toBe(ELedgerAccountBalanceEffect.Increase);
      });

      it('should decrease on normal credit', () => {
        expect(
          journalEntryRules.getBalanceEffect(
            {
              type: ELedgerType.Asset,
              normalBalance: ENormalBalance.Debit,
            },
            EJournalSide.Credit
          )
        ).toBe(ELedgerAccountBalanceEffect.Decrease);
      });

      it('should decrease on contra debit', () => {
        expect(
          journalEntryRules.getBalanceEffect(
            {
              type: ELedgerType.Asset,
              normalBalance: ENormalBalance.Credit,
            },
            EJournalSide.Debit
          )
        ).toBe(ELedgerAccountBalanceEffect.Decrease);
      });

      it('should increase on contra credit', () => {
        expect(
          journalEntryRules.getBalanceEffect(
            {
              type: ELedgerType.Asset,
              normalBalance: ENormalBalance.Credit,
            },
            EJournalSide.Credit
          )
        ).toBe(ELedgerAccountBalanceEffect.Increase);
      });
    });

    describe('Liability Account', () => {
      it('should increase on normal credit', () => {
        expect(
          journalEntryRules.getBalanceEffect(
            {
              type: ELedgerType.Liability,
              normalBalance: ENormalBalance.Credit,
            },
            EJournalSide.Credit
          )
        ).toBe(ELedgerAccountBalanceEffect.Increase);
      });

      it('should decrease on normal debit', () => {
        expect(
          journalEntryRules.getBalanceEffect(
            {
              type: ELedgerType.Liability,
              normalBalance: ENormalBalance.Credit,
            },
            EJournalSide.Debit
          )
        ).toBe(ELedgerAccountBalanceEffect.Decrease);
      });

      it('should decrease on contra credit', () => {
        expect(
          journalEntryRules.getBalanceEffect(
            {
              type: ELedgerType.Liability,
              normalBalance: ENormalBalance.Debit,
            },
            EJournalSide.Credit
          )
        ).toBe(ELedgerAccountBalanceEffect.Decrease);
      });

      it('should increase on contra debit', () => {
        expect(
          journalEntryRules.getBalanceEffect(
            {
              type: ELedgerType.Liability,
              normalBalance: ENormalBalance.Debit,
            },
            EJournalSide.Debit
          )
        ).toBe(ELedgerAccountBalanceEffect.Increase);
      });
    });

    describe('Equity Account', () => {
      it('should increase on normal credit', () => {
        expect(
          journalEntryRules.getBalanceEffect(
            {
              type: ELedgerType.Equity,
              normalBalance: ENormalBalance.Credit,
            },
            EJournalSide.Credit
          )
        ).toBe(ELedgerAccountBalanceEffect.Increase);
      });

      it('should decrease on normal debit', () => {
        expect(
          journalEntryRules.getBalanceEffect(
            {
              type: ELedgerType.Equity,
              normalBalance: ENormalBalance.Credit,
            },
            EJournalSide.Debit
          )
        ).toBe(ELedgerAccountBalanceEffect.Decrease);
      });
    });

    describe('Revenue Account', () => {
      it('should increase on normal credit', () => {
        expect(
          journalEntryRules.getBalanceEffect(
            {
              type: ELedgerType.Revenue,
              normalBalance: ENormalBalance.Credit,
            },
            EJournalSide.Credit
          )
        ).toBe(ELedgerAccountBalanceEffect.Increase);
      });

      it('should decrease on normal debit', () => {
        expect(
          journalEntryRules.getBalanceEffect(
            {
              type: ELedgerType.Revenue,
              normalBalance: ENormalBalance.Credit,
            },
            EJournalSide.Debit
          )
        ).toBe(ELedgerAccountBalanceEffect.Decrease);
      });
    });

    describe('Expense Account', () => {
      it('should increase on normal debit', () => {
        expect(
          journalEntryRules.getBalanceEffect(
            {
              type: ELedgerType.Expense,
              normalBalance: ENormalBalance.Debit,
            },
            EJournalSide.Debit
          )
        ).toBe(ELedgerAccountBalanceEffect.Increase);
      });

      it('should decrease on normal credit', () => {
        expect(
          journalEntryRules.getBalanceEffect(
            {
              type: ELedgerType.Expense,
              normalBalance: ENormalBalance.Debit,
            },
            EJournalSide.Credit
          )
        ).toBe(ELedgerAccountBalanceEffect.Decrease);
      });

      it('should decrease on contra debit', () => {
        expect(
          journalEntryRules.getBalanceEffect(
            {
              type: ELedgerType.Expense,
              normalBalance: ENormalBalance.Credit,
            },
            EJournalSide.Debit
          )
        ).toBe(ELedgerAccountBalanceEffect.Decrease);
      });

      it('should increase on contra credit', () => {
        expect(
          journalEntryRules.getBalanceEffect(
            {
              type: ELedgerType.Expense,
              normalBalance: ENormalBalance.Credit,
            },
            EJournalSide.Credit
          )
        ).toBe(ELedgerAccountBalanceEffect.Increase);
      });
    });
  });
});
