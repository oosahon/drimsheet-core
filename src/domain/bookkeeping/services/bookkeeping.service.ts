import _ from 'lodash';
import { ELedgerAccountSubType } from '../../../app/contracts/dto/ledger-account.dto';
import { IMoney } from '../../../shared/types/money.types';
import moneyValue from '../../../shared/value-objects/money.vo';
import currencyEntity from '../../currency/entities/currency.entity';
import journalEntryEntity from '../../journal-entry/entities/journal-entry.entity';
import journalLineEntity from '../../journal-entry/entities/journal-line.entity';
import {
  EJournalEntrySourceType,
  EJournalEntryStatus,
} from '../../journal-entry/types/journal-entry.types';
import { IJournalLineMakePayload } from '../../journal-entry/types/journal-line.types';
import ledgerAccountEntity from '../../ledger/entities/shared/ledger-account.entity';
import ILedgerAccountRepo from '../../ledger/repos/ledger-account.repo';
import { EEquitySubType } from '../../ledger/types/equity-account.types';
import { ELedgerType, ILedgerAccount } from '../../ledger/types/ledger.types';
import bookkeepingError from '../errors/bookkeeping.error';
import ILedgerAccountBalanceRepo from '../repos/ledger-account-balance.repo';
import journalEntryRules from '../rules/journal-entry.rule';
import IService from '../types/bookkeeping.service.types';
import { ELedgerAccountBalanceEffect } from '../types/ledger-account-balance.types';

type TRecordTransferValidator = (
  sourceAccount: ILedgerAccount,
  destinationAccounts: ILedgerAccount[]
) => void;

const validateTransfer: TRecordTransferValidator = (
  sourceAccount,
  destinationAccounts
) => {
  const allowedTransferSubTypes: string[] = [
    ELedgerAccountSubType.CashAndCashEquivalent,
  ];

  if (!allowedTransferSubTypes.includes(sourceAccount.subType)) {
    throw new bookkeepingError.TransferNotPermittedOnAccount({
      cause: { accountId: sourceAccount.id, subType: sourceAccount.subType },
    });
  }

  const differentSubTypes = destinationAccounts
    .filter((account) => account.subType !== sourceAccount.subType)
    .map((account) => ({ id: account.id, subType: account.subType }));

  if (differentSubTypes.length > 0) {
    throw new bookkeepingError.TransferNotPermittedOnAccount({
      cause: differentSubTypes,
    });
  }
};

export default function makeBookkeepingService(
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
      throw new bookkeepingError.InvalidJournalEntry();
    }

    const sourceAccount = await ledgerAccountRepo.findById(
      sourceLine.accountId,
      repoOptions
    );

    if (!sourceAccount) {
      throw new bookkeepingError.AccountNotFound({
        cause: { accountId: sourceLine.accountId },
      });
    }
    if (sourceAccount.isControlAccount) {
      throw new bookkeepingError.ControlAccountOpeningBalanceNotAllowed({
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
      throw new bookkeepingError.AccountNotFound({
        cause: { accountIds: missingDestinationAccountIds },
      });
    }

    const validators: Record<string, TRecordTransferValidator> = {
      [EJournalEntrySourceType.Transfer]: validateTransfer,
    };

    const validator = validators[header.sourceType];
    if (!validator) {
      throw new bookkeepingError.UnsupportedSourceType({
        cause: { sourceType: header.sourceType },
      });
    }

    validator(sourceAccount, destinationAccounts);

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
