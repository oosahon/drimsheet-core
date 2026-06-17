import _ from 'lodash';
import { IMoney } from '../../../shared/types/money.types';
import moneyValue from '../../../shared/value-objects/money.vo';
import currencyEntity from '../../currency/entities/currency.entity';
import ledgerAccountEntity from '../../ledger/entities/shared/ledger-account.entity';
import ILedgerAccountBalanceRepo from '../../ledger/repos/ledger-account-balance.repo';
import ILedgerAccountRepo from '../../ledger/repos/ledger-account.repo';
import { EEquitySubType } from '../../ledger/types/equity-account.types';
import { ELedgerAccountBalanceEffect } from '../../ledger/types/ledger-account-balance.types';
import { ELedgerType } from '../../ledger/types/ledger.types';
import journalEntryEntity from '../entities/journal-entry.entity';
import journalLineEntity from '../entities/journal-line.entity';
import journalEntryError from '../errors/journal-entry.error';
import journalEntryRules from '../rules/journal-entry.rule';
import IService from '../types/journal-entry.service.types';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
} from '../types/journal-entry.types';
import { IJournalLineMakePayload } from '../types/journal-line.types';
import journalEntryServiceHelpers from './helpers/journal-entry.service.helpers';

export default function makeJournalEntryService(
  ledgerAccountRepo: ILedgerAccountRepo,
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo
): IService {
  /**
   * Creates an opening balance journal entry for a ledger account.
   */
  const recordOpeningBalance: IService['recordOpeningBalance'] = async (
    payload,
    repoOptions
  ) => {
    const { account, amount, accountingEntity, exchangeRate } = payload;
    if (account.isControlAccount) {
      throw new journalEntryError.ControlAccountOpeningBalanceNotAllowed({
        accountId: account.id,
      });
    }

    const functionalCurrency = currencyEntity.getByCode(
      accountingEntity.functionalCurrencyCode
    );

    const [existingBalanceAdjustment] =
      await ledgerAccountBalanceRepo.findAdjustmentsByAccountId(
        payload.account.id,
        repoOptions
      );

    if (existingBalanceAdjustment) {
      throw new journalEntryError.ExistingOpeningBalance({
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
      throw new journalEntryError.UnconfiguredOpeningBalanceAccount();
    }

    const accountSide: IJournalLineMakePayload = {
      accountId: account.id,
      // TODO: use current reporting context currency
      functionalCurrency,
      amount,
      exchangeRate,
      sequenceOrder: 1,
      side: account.normalBalance,
      description: 'Opening balance',
    };

    const equitySide: IJournalLineMakePayload = {
      accountId: equityAccount.id,
      // TODO: use current reporting context currency
      functionalCurrency,
      amount,
      exchangeRate,
      sequenceOrder: 2,
      description: null,
      side: journalLineEntity.getOppositeSide(account.normalBalance),
    };

    const timestamp = new Date();

    const journalEntry = journalEntryEntity.make({
      accountingEntityId: account.accountingEntityId,
      sourceType: EJournalEntrySourceType.OpeningBalance,
      counterPartyId: null,
      status: EJournalEntryStatus.Posted,
      effectiveDate: timestamp,
      postedAt: timestamp,
      voidedAt: null,
      voidingEntryId: null,
      memo: 'Opening balance',
      createdBy: account.createdBy,
      functionalCurrency,
      lines: [accountSide, equitySide],
    });

    return journalEntry;
  };

  /**
   * Record transfer journal entry
   */
  const recordTransaction: IService['recordTransaction'] = async (
    payload,
    repoOptions
  ) => {
    const { sourceLine, destinationLines, header } = payload;

    const invalidDestinationSides = destinationLines.filter(
      (line) => line.side === sourceLine.side
    );

    if (invalidDestinationSides.length > 0) {
      throw new journalEntryError.InvalidJournalEntry();
    }

    const sourceAccount = await ledgerAccountRepo.findById(
      sourceLine.accountId,
      repoOptions
    );

    if (!sourceAccount) {
      throw new journalEntryError.AccountNotFound({
        cause: { accountId: sourceLine.accountId },
      });
    }
    if (sourceAccount.isControlAccount) {
      throw new journalEntryError.ControlAccountOpeningBalanceNotAllowed({
        accountId: sourceLine.accountId,
      });
    }

    const destinationAccountIds = destinationLines.map(
      (line) => line.accountId
    );
    const destinationAccounts = await ledgerAccountRepo.findAllByIds(
      destinationAccountIds,
      repoOptions
    );

    const missingDestinationAccountIds = _.difference(
      destinationAccountIds,
      destinationAccounts.map((account) => account.id)
    );

    if (missingDestinationAccountIds.length > 0) {
      throw new journalEntryError.AccountNotFound({
        cause: { accountIds: missingDestinationAccountIds },
      });
    }

    journalEntryServiceHelpers.validateTransactionAccounts(
      sourceAccount,
      destinationAccounts,
      payload.header.sourceType
    );

    return journalEntryEntity.make({
      ...header,
      lines: [sourceLine, ...destinationLines],
    });
  };

  /**
   * Calculates the balance effect delta of a set of journal lines on a ledger account.
   */
  const getBalanceEffectDelta: IService['getBalanceEffectDelta'] = async (
    accountId,
    journalLines,
    repoOptions
  ) => {
    const account = await ledgerAccountRepo.findById(accountId, repoOptions);

    if (!account) {
      throw new journalEntryError.AccountNotFound({ cause: { accountId } });
    }

    if (!journalLines || journalLines.length === 0) {
      throw new journalEntryError.EmptyJournalLines({
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
      throw new journalEntryError.MismatchedJournalLines({
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
      const effect = journalEntryRules.getBalanceEffect(account, line.side);

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
    recordOpeningBalance,
    recordTransaction,
    getBalanceEffectDelta,
  });
}
