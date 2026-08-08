import generateUUID from '@shared/utils/uuid-generator';

import { IAccountingEntity } from '@domain/accounting/types/accounting-entity.types';
import journalEntryRuleValidator from '@domain/journal-entry/rules/entry-rule.validator';
import openingBalanceEntryRule from '@domain/journal-entry/rules/opening-balance-entry.rule';
import receiptEntryRule from '@domain/journal-entry/rules/receipt-entry.rule';
import ILedgerAccountRepo from '@domain/ledger/repos/ledger-account.repo';
import makeCashAccountService from '@domain/ledger/services/asset-account/cash-account.service';
import makeReceivablesAccountService from '@domain/ledger/services/asset-account/receivables-account.service';
import makeEquityAccountService from '@domain/ledger/services/equity-account/equity-account.service';
import makePayablesAccountService from '@domain/ledger/services/liability-account/payables.service';
import makeServicesAccountService from '@domain/ledger/services/revenue-account/services.service';
import { ILedgerAccount } from '@domain/ledger/types/ledger.types';
import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';

describe('journal entry rules', () => {
  const accountingEntityId = generateUUID();
  const createdBy = generateUUID();
  const currency = SYSTEM_CURRENCIES.NGN;

  const accountingEntity = {
    id: accountingEntityId,
    ownerId: createdBy,
    functionalCurrencyCode: currency.code,
  } as IAccountingEntity;
  const ledgerAccountRepo: jest.Mocked<ILedgerAccountRepo> = {
    create: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
    findAllByIds: jest.fn(),
    findByCode: jest.fn(),
    findBySubType: jest.fn(),
    findByBehavior: jest.fn(),
    findLatestBySubType: jest.fn(),
    findAll: jest.fn(),
  };
  const cashAccountService = makeCashAccountService({ ledgerAccountRepo });
  const receivablesAccountService = makeReceivablesAccountService({
    ledgerAccountRepo,
  });
  const payablesAccountService = makePayablesAccountService({
    ledgerAccountRepo,
  });
  const equityAccountService = makeEquityAccountService({ ledgerAccountRepo });
  const servicesAccountService = makeServicesAccountService({
    ledgerAccountRepo,
  });
  const repoOptions = { correlationId: 'test-correlation-id' };
  let cashAccount: ILedgerAccount;
  let receivableAccount: ILedgerAccount;
  let liabilityAccount: ILedgerAccount;
  let openingBalanceEquityAccount: ILedgerAccount;
  let revenueAccount: ILedgerAccount;

  beforeAll(async () => {
    [cashAccount] = await cashAccountService.createHeader(
      {
        name: 'Cash on Hand',
        userId: createdBy,
        accountingEntity,
      },
      repoOptions
    );

    [receivableAccount] = await receivablesAccountService.createHeader(
      {
        name: 'Receivables',
        userId: createdBy,
        accountingEntity,
      },
      repoOptions
    );

    [liabilityAccount] = await payablesAccountService.createHeader(
      {
        name: 'Accounts Payable',
        createdBy,
        accountingEntity,
      },
      repoOptions
    );

    [openingBalanceEquityAccount] =
      await equityAccountService.createOpeningBalanceAccount(
        {
          name: 'Opening Balance Equity',
          createdBy,
          accountingEntity,
        },
        repoOptions
      );

    ledgerAccountRepo.findByCode.mockResolvedValueOnce(null);
    [revenueAccount] = await servicesAccountService.createHeader(
      {
        name: 'Service Revenue',
        accountingEntity,
        createdBy,
      },
      repoOptions
    );
  });

  describe('openingBalanceEntryRule', () => {
    it('permits any source account', () => {
      expect(
        journalEntryRuleValidator(cashAccount, openingBalanceEntryRule.source)
      ).toBe(true);

      expect(
        journalEntryRuleValidator(
          revenueAccount,
          openingBalanceEntryRule.source
        )
      ).toBe(true);
    });

    it('permits only opening balance equity as the destination account', () => {
      expect(
        journalEntryRuleValidator(
          openingBalanceEquityAccount,
          openingBalanceEntryRule.destination
        )
      ).toBe(true);

      expect(
        journalEntryRuleValidator(
          cashAccount,
          openingBalanceEntryRule.destination
        )
      ).toBe(false);
    });
  });

  describe('receiptEntryRule', () => {
    it('permits revenue and liability accounts as source accounts', () => {
      expect(
        journalEntryRuleValidator(revenueAccount, receiptEntryRule.source)
      ).toBe(true);

      expect(
        journalEntryRuleValidator(liabilityAccount, receiptEntryRule.source)
      ).toBe(true);
    });

    it('rejects non-revenue and non-liability accounts as source accounts', () => {
      expect(
        journalEntryRuleValidator(cashAccount, receiptEntryRule.source)
      ).toBe(false);
    });

    it('permits only cash and cash equivalent accounts as destination accounts', () => {
      expect(
        journalEntryRuleValidator(cashAccount, receiptEntryRule.destination)
      ).toBe(true);

      expect(
        journalEntryRuleValidator(
          receivableAccount,
          receiptEntryRule.destination
        )
      ).toBe(false);
    });
  });
});
