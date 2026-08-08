import IAccountingPeriodService from '../../accounting/types/accounting-period.service.types';
import ILedgerAccountBalanceRepo from '../../ledger/repos/ledger-account-balance.repo';
import ILedgerAccountRepo from '../../ledger/repos/ledger-account.repo';
import { EEquitySubType } from '../../ledger/types/equity-account.types';
import { ELedgerType } from '../../ledger/types/ledger.types';
import currencyEntity from '../../money/entities/currency.entity';
import journalEntryEntity from '../entities/journal-entry.entity';
import journalLineEntity from '../entities/journal-line.entity';
import journalEntryError from '../errors/journal-entry.error';
import openingBalanceEntryRule from '../rules/opening-balance-entry.rule';
import { IJournalEntryService } from '../types/journal-entry.service.types';
import { EJournalEntrySourceType } from '../types/journal-entry.types';
import {
  EJournalSide,
  IJournalLineMakePayload,
} from '../types/journal-line.types';
import helpers from './helpers/journal-entry.service.helpers';

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
      account,
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
    const { header, sourceLine, destinationLines } = payload;

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

    const sourceLinesPayload: IJournalLineMakePayload = {
      accountId: sourceLine.account.id,
      counterpartyId: sourceLine.counterparty?.id,
      sequenceOrder: sourceLine.sequenceOrder,
      amount: sourceLine.amount,
      exchangeRate: sourceLine.exchangeRate,
      side: EJournalSide.Credit,
      description: sourceLine.description,
      functionalCurrency,
    };
    const destinationLinesPayload: IJournalLineMakePayload[] =
      destinationLines.map((line) => ({
        accountId: line.account.id,
        counterpartyId: line.counterparty?.id,
        sequenceOrder: line.sequenceOrder,
        amount: line.amount,
        exchangeRate: line.exchangeRate,
        side: EJournalSide.Debit,
        description: line.description,
        functionalCurrency,
      }));

    return journalEntryEntity.make({
      accountingEntityId: header.accountingEntityId,
      sourceType: EJournalEntrySourceType.Receipt,
      effectiveDate: header.effectiveDate,
      postedAt: header.postedAt,
      memo: header.memo,
      createdBy: header.createdBy,
      functionalCurrency,
      lines: [sourceLinesPayload, ...destinationLinesPayload],
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
