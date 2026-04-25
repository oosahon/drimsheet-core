import { IRepoOptions } from '../../../app/contracts/infra/repo.contract';
import { AppError } from '../../../shared/value-objects/error';
import { ICurrency } from '../../currency/types/currency.types';
import { IJournalEntry } from '../../journal-entry/types/journal-entry.types';
import ILedgerAccountRepo from '../../ledger/repos/ledger-account.repo';
import { ILedgerAccount } from '../../ledger/types/ledger.types';
import ledgerAccountBalanceEntity from '../entities/ledger-account-balance.entity';
import ILedgerAccountBalanceRepo from '../repos/ledger-account-balance.repo';
import { ILedgerAccountBalanceEffectDelta } from '../types/accounting.service.types';
import { INewLedgerAccountBalanceAndAdjustment } from '../types/ledger-account-balance.types';

interface IMakeRecursiveAdjustmentsPayload extends ILedgerAccountBalanceEffectDelta {
  journalEntry: IJournalEntry;
}

export default function makeLedgerAccountBalanceService(
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo,
  ledgerAccountRepo: ILedgerAccountRepo
) {
  const createBalance = async (
    ledgerAccount: ILedgerAccount,
    functionalCurrency: ICurrency,
    repoOptions: IRepoOptions
  ) => {
    const existing = await ledgerAccountBalanceRepo.findBalanceByAccountId(
      ledgerAccount.id,
      ledgerAccount.accountingEntityId,
      repoOptions
    );

    if (existing) return existing;

    const balance = ledgerAccountBalanceEntity.make({
      ledgerAccountId: ledgerAccount.id,
      accountingEntityId: ledgerAccount.accountingEntityId,
      accountMaterializedPath: ledgerAccount.materializedPath,
      currencyCode: ledgerAccount.currency.code,
      functionalCurrencyCode: functionalCurrency.code,
    });

    return balance;
  };

  const makeRecursiveAdjustments = async (
    payload: IMakeRecursiveAdjustmentsPayload,
    repoOptions: IRepoOptions
  ) => {
    const {
      balanceDelta,
      functionalBalanceDelta,
      affectedLedgerCodes,
      journalEntry,
    } = payload;

    const {
      accountingEntityId,
      id: journalEntryId,
      transactionId,
      createdBy,
    } = journalEntry;

    // To ensure that the propagation starts from the bottom
    const reversedCodes = affectedLedgerCodes.reverse();

    const adjustments: INewLedgerAccountBalanceAndAdjustment[] = [];

    for (const code of reversedCodes) {
      const account = await ledgerAccountRepo.findByCode(
        code,
        accountingEntityId,
        repoOptions
      );

      if (!account) {
        throw new AppError('Account does not exist', {
          cause: { code, accountingEntityId },
        });
      }

      const existingBalance =
        await ledgerAccountBalanceRepo.findBalanceByAccountId(
          account.id,
          accountingEntityId,
          repoOptions
        );

      if (!existingBalance) {
        throw new AppError('Balance not found for account', {
          cause: { code, accountingEntityId },
        });
      }

      /**
       * The following assumptions are rightly taken into consideration:
       *  - only header accounts can control sub accounts of different currencies
       *  - header accounts are always in the functional currency.
       */

      const isSameCurrency =
        payload.balanceDelta.currency.code === account.currency.code;

      const makeAdjustmentPayload = {
        ledgerAccountId: account.id,
        amount: isSameCurrency ? balanceDelta : functionalBalanceDelta,
        functionalAmount: functionalBalanceDelta,
        journalEntryId,
        transactionId,
        createdBy,
      };

      const adjustment = ledgerAccountBalanceEntity.makeAdjustment(
        existingBalance,
        makeAdjustmentPayload
      );
      adjustments.push(adjustment);
    }

    return adjustments;
  };

  return {
    createBalance,
    makeRecursiveAdjustments,
  };
}
