import IAccountingPeriodService from '@domain/accounting/types/accounting-period.service.types';
import journalEntryEntity from '@domain/journal-entry/entities/journal-entry.entity';
import journalLineEntity from '@domain/journal-entry/entities/journal-line.entity';
import journalEntryError from '@domain/journal-entry/errors/journal-entry.error';
import journalEntryRuleValidator from '@domain/journal-entry/rules/entry-rule.validator';
import openingBalanceEntryRule from '@domain/journal-entry/rules/opening-balance-entry.rule';
import paymentEntryRule from '@domain/journal-entry/rules/payment-entry.rule';
import receiptEntryRule from '@domain/journal-entry/rules/receipt-entry.rule';
import transferEntryRule, {
  transferBankChargeDestinationPermit,
} from '@domain/journal-entry/rules/transfer-entry.rule';
import helpers from '@domain/journal-entry/services/helpers/journal-entry.service.helpers';
import {
  IJournalEntryBaseLinePayload,
  IJournalEntryHeaderPayload,
  IJournalEntryLinePayload,
  IJournalEntryService,
} from '@domain/journal-entry/types/journal-entry.service.types';
import { EJournalEntrySourceType } from '@domain/journal-entry/types/journal-entry.types';
import {
  EJournalSide,
  IJournalLineMakePayload,
} from '@domain/journal-entry/types/journal-line.types';
import ILedgerAccountBalanceRepo from '@domain/ledger/repos/ledger-account-balance.repo';
import ILedgerAccountRepo from '@domain/ledger/repos/ledger-account.repo';
import { EEquitySubType } from '@domain/ledger/types/equity-account.types';
import { ELedgerType, ILedgerAccount } from '@domain/ledger/types/ledger.types';
import currencyEntity from '@domain/money/entities/currency.entity';

interface IDependencies {
  accountingPeriodService: IAccountingPeriodService;
  ledgerAccountBalanceRepo: ILedgerAccountBalanceRepo;
  ledgerAccountRepo: ILedgerAccountRepo;
}

function validateTransferAccountComposition(
  sourceAccount: ILedgerAccount,
  destinationLines: IJournalEntryLinePayload[]
): ILedgerAccount {
  if (!journalEntryRuleValidator(sourceAccount, transferEntryRule.source)) {
    throw new journalEntryError.InvalidSourceType({ account: sourceAccount });
  }

  const destinationAssetAccounts: ILedgerAccount[] = [];
  const invalidDestinations: ILedgerAccount[] = [];

  for (const destinationLine of destinationLines) {
    const account = destinationLine.account;

    if (journalEntryRuleValidator(account, transferEntryRule.destination)) {
      if (destinationLine.counterparty !== null) {
        throw new journalEntryError.CounterpartyIdNotAllowed({
          accountId: account.id,
          counterpartyId: destinationLine.counterparty.id,
        });
      }

      destinationAssetAccounts.push(account);
      continue;
    }

    if (
      !journalEntryRuleValidator(account, transferBankChargeDestinationPermit)
    ) {
      invalidDestinations.push(account);
    }
  }

  if (invalidDestinations.length > 0) {
    throw new journalEntryError.InvalidDestinationAccount({
      invalidDestinations,
    });
  }

  if (destinationAssetAccounts.length !== 1) {
    throw new journalEntryError.InvalidDestinationAccount({
      destinationAccountIds: destinationLines.map((line) => line.account.id),
      destinationAssetAccountIds: destinationAssetAccounts.map(
        (account) => account.id
      ),
    });
  }

  return destinationAssetAccounts[0];
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

    const header: IJournalEntryHeaderPayload = {
      accountingEntityId,
      functionalCurrencyCode,
      effectiveDate,
      postedAt: effectiveDate,
      memo: 'Opening balance',
      createdBy,
    };
    const journalLines: IJournalEntryBaseLinePayload[] = [
      {
        account,
        sequenceOrder: 1,
        amount,
        exchangeRate,
        description: 'Opening balance',
        meta: null,
      },
      {
        account: equityAccount,
        sequenceOrder: 2,
        amount,
        exchangeRate,
        description: null,
        meta: null,
      },
    ];

    helpers.validateAccounts(header, journalLines);

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
    const journalLines = [...sourceLines, destinationLine];

    const sourceLineAccounts = sourceLines.map((line) => line.account);

    // validate receipt rule
    helpers.validateAccountsAgainstRule(
      sourceLineAccounts,
      [destinationLine.account],
      receiptEntryRule
    );

    helpers.validateAccounts(header, journalLines);

    await deps.accountingPeriodService.validatePostingPeriod(
      header.accountingEntityId,
      header.effectiveDate,
      repoOptions
    );

    helpers.validateCounterparties(header, journalLines);

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

function makeCreatePayment(
  deps: IDependencies
): IJournalEntryService['createPayment'] {
  return async (payload, repoOptions) => {
    const { header, sourceLine, destinationLines, attachments } = payload;
    const journalLines = [sourceLine, ...destinationLines];

    helpers.validateAccountsAgainstRule(
      [sourceLine.account],
      destinationLines.map((line) => line.account),
      paymentEntryRule
    );

    helpers.validateAccounts(header, journalLines);

    await deps.accountingPeriodService.validatePostingPeriod(
      header.accountingEntityId,
      header.effectiveDate,
      repoOptions
    );

    helpers.validateCounterparties(header, journalLines);

    const functionalCurrency = currencyEntity.getByCode(
      header.functionalCurrencyCode
    );

    const sourceLinePayload: IJournalLineMakePayload = {
      accountId: sourceLine.account.id,
      counterpartyId: sourceLine.counterparty?.id,
      sequenceOrder: sourceLine.sequenceOrder,
      amount: sourceLine.amount,
      exchangeRate: sourceLine.exchangeRate,
      side: EJournalSide.Credit,
      description: sourceLine.description,
      functionalCurrency,
    };
    const destinationLinePayloads: IJournalLineMakePayload[] =
      destinationLines.map((line) => ({
        accountId: line.account.id,
        counterpartyId: line.counterparty?.id,
        sequenceOrder: line.sequenceOrder,
        amount: line.amount,
        exchangeRate: line.exchangeRate,
        description: line.description,
        functionalCurrency,
        side: EJournalSide.Debit,
      }));

    return journalEntryEntity.make({
      accountingEntityId: header.accountingEntityId,
      sourceType: EJournalEntrySourceType.Payment,
      effectiveDate: header.effectiveDate,
      postedAt: header.postedAt,
      memo: header.memo,
      createdBy: header.createdBy,
      functionalCurrency,
      attachments,
      lines: [sourceLinePayload, ...destinationLinePayloads],
    });
  };
}

function makeCreateTransfer(
  deps: IDependencies
): IJournalEntryService['createTransfer'] {
  return async (payload, repoOptions) => {
    const { header, sourceLine, destinationLines, attachments } = payload;
    const journalLines = [sourceLine, ...destinationLines];

    const destinationAssetAccount = validateTransferAccountComposition(
      sourceLine.account,
      destinationLines
    );

    if (sourceLine.account.id === destinationAssetAccount.id) {
      throw new journalEntryError.DuplicateAccountsNotPermitted({
        accountIds: [sourceLine.account.id, destinationAssetAccount.id],
      });
    }

    helpers.validateAccounts(header, journalLines);

    await deps.accountingPeriodService.validatePostingPeriod(
      header.accountingEntityId,
      header.effectiveDate,
      repoOptions
    );

    helpers.validateCounterparties(header, destinationLines);

    const functionalCurrency = currencyEntity.getByCode(
      header.functionalCurrencyCode
    );
    const sourceLinePayload: IJournalLineMakePayload = {
      accountId: sourceLine.account.id,
      counterpartyId: null,
      sequenceOrder: sourceLine.sequenceOrder,
      amount: sourceLine.amount,
      exchangeRate: sourceLine.exchangeRate,
      side: EJournalSide.Credit,
      description: sourceLine.description,
      functionalCurrency,
    };
    const destinationLinePayloads: IJournalLineMakePayload[] =
      destinationLines.map((line) => ({
        accountId: line.account.id,
        counterpartyId: line.counterparty?.id,
        sequenceOrder: line.sequenceOrder,
        amount: line.amount,
        exchangeRate: line.exchangeRate,
        description: line.description,
        functionalCurrency,
        side: EJournalSide.Debit,
      }));

    const journalEntry = journalEntryEntity.make({
      accountingEntityId: header.accountingEntityId,
      sourceType: EJournalEntrySourceType.Transfer,
      effectiveDate: header.effectiveDate,
      postedAt: header.postedAt,
      memo: header.memo,
      createdBy: header.createdBy,
      functionalCurrency,
      attachments,
      lines: [sourceLinePayload, ...destinationLinePayloads],
    });

    return { journalEntry, destinationAssetAccount };
  };
}

export default function makeJournalEntryService(deps: IDependencies) {
  const service: IJournalEntryService = {
    createOpeningBalance: makeCreateOpeningBalance(deps),

    createReceipt: makeCreateReceipt(deps),

    createPayment: makeCreatePayment(deps),

    createTransfer: makeCreateTransfer(deps),
  };

  return Object.freeze(service);
}
