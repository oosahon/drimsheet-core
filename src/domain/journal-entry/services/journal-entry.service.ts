import IAccountingPeriodService from '@domain/accounting/types/accounting-period.service.types';
import journalEntryEntity from '@domain/journal-entry/entities/journal-entry.entity';
import journalLineEntity from '@domain/journal-entry/entities/journal-line.entity';
import journalEntryError from '@domain/journal-entry/errors/journal-entry.error';
import openingBalanceEntryRule from '@domain/journal-entry/rules/opening-balance-entry.rule';
import receiptEntryRule from '@domain/journal-entry/rules/receipt-entry.rule';
import helpers from '@domain/journal-entry/services/helpers/journal-entry.service.helpers';
import { IJournalEntryService } from '@domain/journal-entry/types/journal-entry.service.types';
import { EJournalEntrySourceType } from '@domain/journal-entry/types/journal-entry.types';
import {
  EJournalSide,
  IJournalLineMakePayload,
} from '@domain/journal-entry/types/journal-line.types';
import ILedgerAccountBalanceRepo from '@domain/ledger/repos/ledger-account-balance.repo';
import ILedgerAccountRepo from '@domain/ledger/repos/ledger-account.repo';
import { EEquitySubType } from '@domain/ledger/types/equity-account.types';
import { ELedgerType } from '@domain/ledger/types/ledger.types';
import currencyEntity from '@domain/money/entities/currency.entity';

interface IDependencies {
  accountingPeriodService: IAccountingPeriodService;
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo;
  ledgerAccountRepo: ILedgerAccountRepo;
}

function makeCreateOpeningBalance(
  deps: IDependencies
): IJournalEntryService['createOpeningBalance'] {
  return async (payload, repoOptions) => {
    const {
      accountingEntityId,
      account,
      functionalCurrencyCode,
      amount,
      effectiveDate,
      exchangeRate,
      createdBy,
    } = payload;

    if (account.isControlAccount) {
      throw new journalEntryError.ControlAccountOpeningBalanceNotAllowed({
        accountId: account.id,
      });
    }

    if (account.openingBalanceDate !== null) {
      throw new journalEntryError.ExistingOpeningBalance({
        accountId: account.id,
      });
    }

    const [existingBalanceAdjustment] =
      await deps.ledgerAccountBalanceRepo.findAdjustmentsByAccountId(
        account.id,
        repoOptions
      );

    if (existingBalanceAdjustment) {
      throw new journalEntryError.ExistingOpeningBalance({
        accountId: account.id,
      });
    }

    const [equityAccount] = await deps.ledgerAccountRepo.findBySubType(
      accountingEntityId,
      ELedgerType.Equity,
      EEquitySubType.OpeningBalance,
      repoOptions
    );

    if (!equityAccount) {
      throw new journalEntryError.UnConfiguredOpeningBalanceAccount();
    }

    helpers.validateAccountsAgainstRule(
      [account],
      [equityAccount],
      openingBalanceEntryRule
    );

    const functionalCurrency = currencyEntity.getByCode(functionalCurrencyCode);

    const accountSide: IJournalLineMakePayload = {
      accountId: account.id,
      counterpartyId: null,
      functionalCurrency,
      amount,
      exchangeRate,
      sequenceOrder: 1,
      side: account.normalBalance,
      description: 'Opening balance',
    };

    const equitySide: IJournalLineMakePayload = {
      accountId: equityAccount.id,
      counterpartyId: null,
      functionalCurrency,
      amount,
      exchangeRate,
      sequenceOrder: 2,
      description: null,
      side: journalLineEntity.getOppositeSide(account.normalBalance),
    };

    return journalEntryEntity.make({
      accountingEntityId,
      sourceType: EJournalEntrySourceType.OpeningBalance,
      effectiveDate,
      postedAt: effectiveDate,
      memo: 'Opening balance',
      createdBy,
      functionalCurrency,
      lines: [accountSide, equitySide],
    });
  };
}

function makeCreateReceipt(
  deps: IDependencies
): IJournalEntryService['createReceipt'] {
  return async (payload, repoOptions) => {
    const { header, sourceLines, destinationLine, attachments } = payload;

    const sourceLineAccounts = sourceLines.map((line) => line.account);

    // validate receipt rule
    helpers.validateAccountsAgainstRule(
      sourceLineAccounts,
      [destinationLine.account],
      receiptEntryRule
    );

    await helpers.validateAccounts(payload);

    await deps.accountingPeriodService.validatePostingPeriod(
      header.accountingEntityId,
      header.effectiveDate,
      repoOptions
    );

    await helpers.validateCounterparties(payload);

    const functionalCurrency = currencyEntity.getByCode(
      header.functionalCurrencyCode
    );

    const sourceLinesPayload: IJournalLineMakePayload[] = sourceLines.map(
      (line) => ({
        accountId: line.account.id,
        counterpartyId: line.counterparty?.id,
        sequenceOrder: line.sequenceOrder,
        amount: line.amount,
        exchangeRate: line.exchangeRate,
        side: EJournalSide.Credit,
        description: line.description,
        functionalCurrency,
      })
    );
    const destinationLinePayload: IJournalLineMakePayload = {
      accountId: destinationLine.account.id,
      counterpartyId: destinationLine.counterparty?.id,
      sequenceOrder: destinationLine.sequenceOrder,
      amount: destinationLine.amount,
      exchangeRate: destinationLine.exchangeRate,
      description: destinationLine.description,
      functionalCurrency,
      side: EJournalSide.Debit,
    };

    return journalEntryEntity.make({
      accountingEntityId: header.accountingEntityId,
      sourceType: EJournalEntrySourceType.Receipt,
      effectiveDate: header.effectiveDate,
      postedAt: header.postedAt,
      memo: header.memo,
      createdBy: header.createdBy,
      functionalCurrency,
      attachments,
      lines: [...sourceLinesPayload, destinationLinePayload],
    });
  };
}

export default function makeJournalEntryService(deps: IDependencies) {
  const service: IJournalEntryService = {
    createOpeningBalance: makeCreateOpeningBalance(deps),

    createReceipt: makeCreateReceipt(deps),
  };

  return Object.freeze(service);
}
