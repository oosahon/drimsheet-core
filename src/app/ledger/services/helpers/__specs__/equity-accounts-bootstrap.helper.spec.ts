import { IReadRepoOptions } from '@shared/types/repo.types';
import generateUUID from '@shared/utils/uuid-generator';

import { IAccountingEntity } from '@domain/accounting/types/accounting-entity.types';
import { EQUITY_LEDGER_CODES } from '@domain/ledger/config/equity-codes.config';
import ledgerAccountEntity from '@domain/ledger/entities/ledger-account.entity';
import {
  EEquityAccountBehavior,
  EEquitySubType,
  IEquityLedgerAccount,
  IOpeningBalanceEquityAccount,
  IRetainedEarningsAccount,
} from '@domain/ledger/types/equity-account.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '@domain/ledger/types/ledger.types';
import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';

import { mockEquityAccountService } from '@app/ledger/contracts/__mocks__/ledger.domain.services.mock';
import { mockLedgerAccountRepo } from '@app/ledger/contracts/__mocks__/ledger.repos.mock';
import makeEquityAccountsBootstrapHelper from '@app/ledger/services/helpers/equity-accounts-bootstrap.helper';

describe('equityAccountsBootstrapHelper', () => {
  const bootstrapEquityAccounts = makeEquityAccountsBootstrapHelper({
    ledgerAccountRepo: mockLedgerAccountRepo,
    equityAccountService: mockEquityAccountService,
  });
  const repoOptions: IReadRepoOptions = {
    correlationId: 'test-correlation-id',
  };
  const accountingEntity = {
    id: generateUUID(),
    ownerId: generateUUID(),
    functionalCurrencyCode: 'USD',
  } as IAccountingEntity;
  const retainedEarningsAccount =
    ledgerAccountEntity.make<IRetainedEarningsAccount>({
      name: 'Retained Earnings',
      code: EQUITY_LEDGER_CODES.RETAINED_EARNINGS,
      materializedPath: EQUITY_LEDGER_CODES.OPENING_BALANCE_EQUITY,
      accountingEntityId: accountingEntity.id,
      normalBalance: ENormalBalance.Credit,
      type: ELedgerType.Equity,
      subType: EEquitySubType.RetainedEarnings,
      behavior: EEquityAccountBehavior.RetainedEarnings,
      isControlAccount: false,
      controlAccountId: null,
      currency: SYSTEM_CURRENCIES.USD,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy: accountingEntity.ownerId,
    });
  const openingBalanceEquityAccount =
    ledgerAccountEntity.make<IOpeningBalanceEquityAccount>({
      name: 'Opening Balance Equity',
      code: EQUITY_LEDGER_CODES.OPENING_BALANCE_EQUITY,
      materializedPath: EQUITY_LEDGER_CODES.OPENING_BALANCE_EQUITY,
      accountingEntityId: accountingEntity.id,
      normalBalance: ENormalBalance.Credit,
      type: ELedgerType.Equity,
      subType: EEquitySubType.OpeningBalance,
      behavior: EEquityAccountBehavior.OpeningBalanceEquity,
      isControlAccount: false,
      controlAccountId: null,
      currency: SYSTEM_CURRENCIES.USD,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy: accountingEntity.ownerId,
    });

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-15T00:00:00.000Z'));
    jest.clearAllMocks();
    mockEquityAccountService.createRetainedEarningsAccount.mockResolvedValue(
      retainedEarningsAccount
    );
    mockEquityAccountService.createOpeningBalanceAccount.mockResolvedValue(
      openingBalanceEquityAccount
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates the configured equity accounts when none exist', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

    const { accounts, events, audits } = await bootstrapEquityAccounts({
      accountingEntity,
      repoOptions,
    });

    expect(accounts).toHaveLength(2);
    expect(events.length).toBeGreaterThan(0);
    expect(audits).toHaveLength(accounts.length);
    expect(accounts.some(({ name }) => name === 'Retained Earnings')).toBe(
      true
    );
    expect(accounts.some(({ name }) => name === 'Opening Balance Equity')).toBe(
      true
    );
    expect(mockLedgerAccountRepo.findByCode).toHaveBeenCalledWith(
      EQUITY_LEDGER_CODES.RETAINED_EARNINGS,
      accountingEntity.id,
      repoOptions
    );
    expect(
      mockEquityAccountService.createRetainedEarningsAccount
    ).toHaveBeenCalledWith(
      {
        name: 'Retained Earnings',
        createdBy: accountingEntity.ownerId,
        accountingEntity,
      },
      repoOptions
    );
    expect(
      mockEquityAccountService.createOpeningBalanceAccount
    ).toHaveBeenCalledWith(
      {
        name: 'Opening Balance Equity',
        createdBy: accountingEntity.ownerId,
        accountingEntity,
      },
      repoOptions
    );
  });

  it('skips equity accounts that already exist', async () => {
    const existingAccount = {
      id: generateUUID(),
    } as IEquityLedgerAccount;
    mockLedgerAccountRepo.findByCode.mockResolvedValue(existingAccount);

    const { accounts, events, audits } = await bootstrapEquityAccounts({
      accountingEntity,
      repoOptions,
    });

    expect(accounts).toHaveLength(0);
    expect(events).toHaveLength(0);
    expect(audits).toHaveLength(0);
    expect(
      mockEquityAccountService.createRetainedEarningsAccount
    ).not.toHaveBeenCalled();
    expect(
      mockEquityAccountService.createOpeningBalanceAccount
    ).not.toHaveBeenCalled();
  });
});
