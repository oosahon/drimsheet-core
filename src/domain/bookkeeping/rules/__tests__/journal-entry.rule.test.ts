import { ELedgerAccountBalanceEffect } from '../../../bookkeeping/types/ledger-account-balance.types';
import { EJournalSide } from '../../../journal-entry/types/journal-line.types';
import {
  ELedgerType,
  ENormalBalance,
} from '../../../ledger/types/ledger.types';
import journalEntryRules from '../journal-entry.rule';

describe('journalEntryRules', () => {
  describe('getBalanceEffect', () => {
    describe('Asset Account', () => {
      it('should increase on normal debit', () => {
        expect(
          journalEntryRules.getBalanceEffect({
            accountType: ELedgerType.Asset,
            journalSide: EJournalSide.Debit,
            normalBalance: ENormalBalance.Debit,
          })
        ).toBe(ELedgerAccountBalanceEffect.Increase);
      });

      it('should decrease on normal credit', () => {
        expect(
          journalEntryRules.getBalanceEffect({
            accountType: ELedgerType.Asset,
            journalSide: EJournalSide.Credit,
            normalBalance: ENormalBalance.Debit,
          })
        ).toBe(ELedgerAccountBalanceEffect.Decrease);
      });

      it('should decrease on contra debit', () => {
        expect(
          journalEntryRules.getBalanceEffect({
            accountType: ELedgerType.Asset,
            journalSide: EJournalSide.Debit,
            normalBalance: ENormalBalance.Credit,
          })
        ).toBe(ELedgerAccountBalanceEffect.Decrease);
      });

      it('should increase on contra credit', () => {
        expect(
          journalEntryRules.getBalanceEffect({
            accountType: ELedgerType.Asset,
            journalSide: EJournalSide.Credit,
            normalBalance: ENormalBalance.Credit,
          })
        ).toBe(ELedgerAccountBalanceEffect.Increase);
      });
    });

    describe('Liability Account', () => {
      it('should increase on normal credit', () => {
        expect(
          journalEntryRules.getBalanceEffect({
            accountType: ELedgerType.Liability,
            journalSide: EJournalSide.Credit,
            normalBalance: ENormalBalance.Credit,
          })
        ).toBe(ELedgerAccountBalanceEffect.Increase);
      });

      it('should decrease on normal debit', () => {
        expect(
          journalEntryRules.getBalanceEffect({
            accountType: ELedgerType.Liability,
            journalSide: EJournalSide.Debit,
            normalBalance: ENormalBalance.Credit,
          })
        ).toBe(ELedgerAccountBalanceEffect.Decrease);
      });

      it('should decrease on contra credit', () => {
        expect(
          journalEntryRules.getBalanceEffect({
            accountType: ELedgerType.Liability,
            journalSide: EJournalSide.Credit,
            normalBalance: ENormalBalance.Debit,
          })
        ).toBe(ELedgerAccountBalanceEffect.Decrease);
      });

      it('should increase on contra debit', () => {
        expect(
          journalEntryRules.getBalanceEffect({
            accountType: ELedgerType.Liability,
            journalSide: EJournalSide.Debit,
            normalBalance: ENormalBalance.Debit,
          })
        ).toBe(ELedgerAccountBalanceEffect.Increase);
      });
    });

    describe('Equity Account', () => {
      it('should increase on normal credit', () => {
        expect(
          journalEntryRules.getBalanceEffect({
            accountType: ELedgerType.Equity,
            journalSide: EJournalSide.Credit,
            normalBalance: ENormalBalance.Credit,
          })
        ).toBe(ELedgerAccountBalanceEffect.Increase);
      });

      it('should decrease on normal debit', () => {
        expect(
          journalEntryRules.getBalanceEffect({
            accountType: ELedgerType.Equity,
            journalSide: EJournalSide.Debit,
            normalBalance: ENormalBalance.Credit,
          })
        ).toBe(ELedgerAccountBalanceEffect.Decrease);
      });
    });

    describe('Revenue Account', () => {
      it('should increase on normal credit', () => {
        expect(
          journalEntryRules.getBalanceEffect({
            accountType: ELedgerType.Revenue,
            journalSide: EJournalSide.Credit,
            normalBalance: ENormalBalance.Credit,
          })
        ).toBe(ELedgerAccountBalanceEffect.Increase);
      });

      it('should decrease on normal debit', () => {
        expect(
          journalEntryRules.getBalanceEffect({
            accountType: ELedgerType.Revenue,
            journalSide: EJournalSide.Debit,
            normalBalance: ENormalBalance.Credit,
          })
        ).toBe(ELedgerAccountBalanceEffect.Decrease);
      });
    });

    describe('Expense Account', () => {
      it('should increase on normal debit', () => {
        expect(
          journalEntryRules.getBalanceEffect({
            accountType: ELedgerType.Expense,
            journalSide: EJournalSide.Debit,
            normalBalance: ENormalBalance.Debit,
          })
        ).toBe(ELedgerAccountBalanceEffect.Increase);
      });

      it('should decrease on normal credit', () => {
        expect(
          journalEntryRules.getBalanceEffect({
            accountType: ELedgerType.Expense,
            journalSide: EJournalSide.Credit,
            normalBalance: ENormalBalance.Debit,
          })
        ).toBe(ELedgerAccountBalanceEffect.Decrease);
      });

      it('should decrease on contra debit', () => {
        expect(
          journalEntryRules.getBalanceEffect({
            accountType: ELedgerType.Expense,
            journalSide: EJournalSide.Debit,
            normalBalance: ENormalBalance.Credit,
          })
        ).toBe(ELedgerAccountBalanceEffect.Decrease);
      });

      it('should increase on contra credit', () => {
        expect(
          journalEntryRules.getBalanceEffect({
            accountType: ELedgerType.Expense,
            journalSide: EJournalSide.Credit,
            normalBalance: ENormalBalance.Credit,
          })
        ).toBe(ELedgerAccountBalanceEffect.Increase);
      });
    });
  });
});
