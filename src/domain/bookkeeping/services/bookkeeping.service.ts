import { IMoney } from '../../../shared/types/money.types';
import moneyValue from '../../../shared/value-objects/money.vo';
import currencyEntity from '../../currency/entities/currency.entity';
import journalEntryEntity from '../../journal-entry/entities/journal-entry.entity';
import { IMakePayload as IJournalLineMakePayload } from '../../journal-entry/entities/journal-line.entity';
import { EJournalEntryStatus } from '../../journal-entry/types/journal-entry.types';
import ledgerAccountEntity from '../../ledger/entities/shared/ledger-account.entity';
import ILedgerAccountRepo from '../../ledger/repos/ledger-account.repo';
import { EEquitySubType } from '../../ledger/types/equity-account.types';
import { ELedgerType } from '../../ledger/types/ledger.types';
import bookkeepingError from '../errors/bookkeeping.error';
import ILedgerAccountBalanceRepo from '../repos/ledger-account-balance.repo';
import journalEntryRules from '../rules/journal-entry.rule';
import IBookkeepingService from '../types/bookkeeping.service.types';
import { ELedgerAccountBalanceEffect } from '../types/ledger-account-balance.types';

type TCreateOpeningBalanceJournalEntry =
  IBookkeepingService['createOpeningBalanceJournalEntry'];
type TGetBalanceEffectDelta = IBookkeepingService['getBalanceEffectDelta'];

export default function makeBookkeepingService(
  ledgerAccountRepo: ILedgerAccountRepo,
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo
): IBookkeepingService {
  const createOpeningBalanceJournalEntry: TCreateOpeningBalanceJournalEntry =
    async (payload, repoOptions) => {
      const { account, amount, accountingEntity, exchangeRate } = payload;
      if (account.isControlAccount) {
        throw new bookkeepingError.ControlAccountOpeningBalanceNotAllowed({
          accountId: account.id,
        });
      }

      const functionalCurrency = currencyEntity.getByCode(
        accountingEntity.functionalCurrencyCode
      );

      const [existingBalanceAdjustment] =
        await ledgerAccountBalanceRepo.findAdjustmentsByAccountId(
          payload.account.id,
          { ...repoOptions, limit: 1 }
        );

      if (existingBalanceAdjustment) {
        throw new bookkeepingError.ExistingOpeningBalance({
          accountId: payload.account.id,
        });
      }

      const [equityAccount] = await ledgerAccountRepo.findBySubType(
        account.accountingEntityId,
        ELedgerType.Equity,
        EEquitySubType.OpeningBalance,
        repoOptions
      );

      if (!equityAccount) {
        throw new bookkeepingError.UnconfiguredOpeningBalanceAccount();
      }

      const { targetAccountSide, equityAccountSide } =
        journalEntryRules.getOpeningBalanceSides({
          normalBalance: account.normalBalance,
        });

      const debitLinePayload: IJournalLineMakePayload = {
        accountId: account.id,
        // TODO: use current reporting context currency
        functionalCurrency,
        amount,
        exchangeRate,
        sequenceOrder: 1,
        side: targetAccountSide,
        description: 'Opening balance',
      };

      const creditLinePayload: IJournalLineMakePayload = {
        accountId: equityAccount.id,
        // TODO: use current reporting context currency
        functionalCurrency,
        amount,
        exchangeRate,
        sequenceOrder: 2,
        side: equityAccountSide,
      };

      const timestamp = new Date();

      const journalEntry = journalEntryEntity.make({
        accountingEntityId: account.accountingEntityId,
        transactionId: null,
        status: EJournalEntryStatus.Posted,
        effectiveDate: timestamp,
        postedAt: timestamp,
        voidedAt: null,
        voidingEntryId: null,
        memo: 'Opening balance',
        createdBy: account.createdBy,
        functionalCurrency,
        lines: [debitLinePayload, creditLinePayload],
      });

      return journalEntry;
    };

  const getBalanceEffectDelta: TGetBalanceEffectDelta = async (
    accountId,
    journalLines,
    repoOptions
  ) => {
    const account = await ledgerAccountRepo.findById(accountId, repoOptions);

    if (!account) {
      throw new bookkeepingError.AccountNotFound({ cause: { accountId } });
    }

    if (!journalLines || journalLines.length === 0) {
      throw new bookkeepingError.EmptyJournalLines({
        cause: { accountId },
      });
    }

    const isSame = journalLines.every((line) => {
      const prototype = journalLines[0];

      const isSameAccount = line.accountId === accountId;

      const isSameFunctionalCurrency =
        line.functionalAmount.currency.code ===
        prototype.functionalAmount.currency.code;

      const isSameCurrencyAsAccount =
        line.amount.currency.code === account.currency.code;

      return (
        isSameAccount && isSameFunctionalCurrency && isSameCurrencyAsAccount
      );
    });

    if (!isSame) {
      throw new bookkeepingError.MismatchedJournalLines({
        cause: journalLines.map((v) => ({
          accountId: v.accountId,
          functionalCurrency: v.functionalAmount.currency,
          currency: v.amount.currency,
        })),
      });
    }

    let balanceDelta: IMoney = moneyValue.makeZeroAmount(account.currency);
    let functionalBalanceDelta: IMoney = moneyValue.makeZeroAmount(
      journalLines[0].functionalAmount.currency
    );

    for (const line of journalLines) {
      const effect = journalEntryRules.getBalanceEffect({
        accountType: account.type,
        normalBalance: account.normalBalance,
        journalSide: line.side,
      });

      if (effect === ELedgerAccountBalanceEffect.Increase) {
        balanceDelta = moneyValue.add(balanceDelta, line.amount);
        functionalBalanceDelta = moneyValue.add(
          functionalBalanceDelta,
          line.functionalAmount
        );
      } else {
        balanceDelta = moneyValue.subtract(balanceDelta, line.amount);
        functionalBalanceDelta = moneyValue.subtract(
          functionalBalanceDelta,
          line.functionalAmount
        );
      }
    }

    return {
      balanceDelta,
      functionalBalanceDelta,
      affectedLedgerCodes:
        ledgerAccountEntity.getAncestryCodesFromMaterializedPath(
          account.materializedPath
        ),
    };
  };

  return Object.freeze({
    createOpeningBalanceJournalEntry,
    getBalanceEffectDelta,
  });
}
