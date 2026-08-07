import { IAccountingEntity } from '../../../../../domain/accounting/types/accounting-entity.types';
import { LIABILITY_LEDGER_CODES } from '../../../../../domain/ledger/config/liability-codes.config';
import ledgerAccountEntity from '../../../../../domain/ledger/entities/ledger-account.entity';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
} from '../../../../../domain/ledger/types/ledger.types';
import {
  ELiabilityAccountBehavior,
  ELiabilitySubType,
  ILiabilityLedgerAccount,
  ILiabilitySuspenseAccount,
  IPayableAccount,
  IStatutoryPayableAccount,
} from '../../../../../domain/ledger/types/liability-account.types';
import { SYSTEM_CURRENCIES } from '../../../../../domain/money/config/currencies.config';
import { IReadRepoOptions } from '../../../../../shared/types/repo.types';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import {
  mockPayablesAccountService,
  mockSuspenseAccountService,
} from '../../../contracts/__mocks__/ledger.domain.services.mock';
import { mockLedgerAccountRepo } from '../../../contracts/__mocks__/ledger.repos.mock';
import makeLiabilityAccountsBootstrapHelper from '../liability-accounts-bootstrap.helper';

describe('liabilityAccountsBootstrapHelper', () => {
  const bootstrapLiabilityAccounts = makeLiabilityAccountsBootstrapHelper({
    ledgerAccountRepo: mockLedgerAccountRepo,
    suspenseAccountService: mockSuspenseAccountService,
    payablesAccountService: mockPayablesAccountService,
  });
  const repoOptions: IReadRepoOptions = {
    correlationId: 'test-correlation-id',
  };
  const accountingEntity = {
    id: generateUUID(),
    ownerId: generateUUID(),
    functionalCurrencyCode: 'USD',
  } as IAccountingEntity;
  const liabilitySuspense = ledgerAccountEntity.make<ILiabilitySuspenseAccount>(
    {
      name: 'Liability Suspense Account',
      code: LIABILITY_LEDGER_CODES.SUSPENSE_ACCOUNTS.INITIAL,
      materializedPath: LIABILITY_LEDGER_CODES.SUSPENSE_ACCOUNTS.INITIAL,
      accountingEntityId: accountingEntity.id,
      normalBalance: ledgerAccountEntity.getNormalBalance(
        ELedgerType.Liability
      ),
      type: ELedgerType.Liability,
      subType: ELiabilitySubType.Suspense,
      behavior: ELiabilityAccountBehavior.Default,
      isControlAccount: false,
      controlAccountId: null,
      currency: SYSTEM_CURRENCIES.USD,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy: accountingEntity.ownerId,
    }
  );
  const makePayableAccount = (
    name: string,
    code: IPayableAccount['code'],
    materializedPath: string,
    behavior: IPayableAccount['behavior'],
    isControlAccount: boolean,
    controlAccountId: IPayableAccount['controlAccountId']
  ) =>
    ledgerAccountEntity.make<IPayableAccount>({
      name,
      code,
      materializedPath,
      accountingEntityId: accountingEntity.id,
      normalBalance: ledgerAccountEntity.getNormalBalance(
        ELedgerType.Liability
      ),
      type: ELedgerType.Liability,
      subType: ELiabilitySubType.Payable,
      behavior,
      isControlAccount,
      controlAccountId,
      currency: SYSTEM_CURRENCIES.USD,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule:
        behavior === ELiabilityAccountBehavior.TaxPayable
          ? EContraAccountRule.ContraNotPermitted
          : EContraAccountRule.ContraPermitted,
      adjunctAccountRule:
        behavior === ELiabilityAccountBehavior.TaxPayable
          ? EAdjunctAccountRule.AdjunctNotPermitted
          : EAdjunctAccountRule.AdjunctPermitted,
      createdBy: accountingEntity.ownerId,
    });
  const payablesHeader = makePayableAccount(
    'Payables',
    LIABILITY_LEDGER_CODES.PAYABLES.HEADER,
    LIABILITY_LEDGER_CODES.PAYABLES.HEADER,
    ELiabilityAccountBehavior.DefaultPayable,
    true,
    null
  );
  const tradePayables = makePayableAccount(
    'Trade Payables',
    LIABILITY_LEDGER_CODES.PAYABLES.TRADE,
    `${LIABILITY_LEDGER_CODES.PAYABLES.HEADER}.${LIABILITY_LEDGER_CODES.PAYABLES.TRADE}`,
    ELiabilityAccountBehavior.TradePayable,
    true,
    payablesHeader[0].id
  );
  const statutoryPayables = makePayableAccount(
    'Statutory Payables',
    LIABILITY_LEDGER_CODES.PAYABLES.STATUTORY,
    `${LIABILITY_LEDGER_CODES.PAYABLES.HEADER}.${LIABILITY_LEDGER_CODES.PAYABLES.STATUTORY}`,
    ELiabilityAccountBehavior.TaxPayable,
    true,
    payablesHeader[0].id
  );
  const defaultStatutoryPayables = makePayableAccount(
    'Statutory Payables (Default)',
    '201003',
    `${LIABILITY_LEDGER_CODES.PAYABLES.HEADER}.${LIABILITY_LEDGER_CODES.PAYABLES.STATUTORY}.201003`,
    ELiabilityAccountBehavior.TaxPayable,
    false,
    statutoryPayables[0].id
  );

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-15T00:00:00.000Z'));
    jest.clearAllMocks();
    mockSuspenseAccountService.createLiabilitySuspense.mockResolvedValue(
      liabilitySuspense
    );
    mockPayablesAccountService.createHeader.mockResolvedValue(payablesHeader);
    mockPayablesAccountService.createTradePayableSubAccount.mockResolvedValue(
      tradePayables
    );
    mockPayablesAccountService.createStatutoryPayableSubAccount.mockImplementation(
      async ({ name }) =>
        name === 'Statutory Payables (Default)'
          ? defaultStatutoryPayables
          : statutoryPayables
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates header accounts without posting accounts when not requested', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

    const { accounts, events, audits } = await bootstrapLiabilityAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: false,
    });

    expect(accounts).toHaveLength(4);
    expect(events.length).toBeGreaterThan(0);
    expect(audits).toHaveLength(accounts.length);
    expect(accounts.some(({ name }) => name === 'Short Term Debt')).toBe(true);
    expect(accounts.some(({ name }) => name === 'Payables')).toBe(true);
    expect(mockLedgerAccountRepo.findByCode).toHaveBeenCalledWith(
      LIABILITY_LEDGER_CODES.SHORT_TERM_DEBT.HEADER,
      accountingEntity.id,
      repoOptions
    );
  });

  it('creates posting accounts when requested', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValue(null);
    mockLedgerAccountRepo.findBySubType.mockResolvedValue([]);
    mockLedgerAccountRepo.findByBehavior.mockResolvedValue([
      {
        id: generateUUID(),
        code: LIABILITY_LEDGER_CODES.PAYABLES.STATUTORY,
        materializedPath: `${LIABILITY_LEDGER_CODES.PAYABLES.HEADER}.${LIABILITY_LEDGER_CODES.PAYABLES.STATUTORY}`,
      } as IStatutoryPayableAccount,
    ]);

    const { accounts } = await bootstrapLiabilityAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: true,
    });

    expect(accounts).toHaveLength(6);
    expect(
      accounts.some(({ name }) => name === 'Liability Suspense Account')
    ).toBe(true);
    expect(
      accounts.some(({ name }) => name === 'Statutory Payables (Default)')
    ).toBe(true);
    expect(
      mockSuspenseAccountService.createLiabilitySuspense
    ).toHaveBeenCalledWith(
      {
        accountingEntityId: accountingEntity.id,
        currency: SYSTEM_CURRENCIES.USD,
        name: 'Liability Suspense Account',
        createdBy: accountingEntity.ownerId,
      },
      repoOptions
    );
    expect(mockPayablesAccountService.createHeader).toHaveBeenCalledWith(
      {
        name: 'Payables',
        createdBy: accountingEntity.ownerId,
        accountingEntity,
        currency: SYSTEM_CURRENCIES.USD,
      },
      repoOptions
    );
    expect(
      mockPayablesAccountService.createTradePayableSubAccount
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Trade Payables',
        controlAccountCode: payablesHeader[0].code,
      }),
      repoOptions
    );
    expect(
      mockPayablesAccountService.createStatutoryPayableSubAccount
    ).toHaveBeenCalledTimes(2);
  });

  it('skips headers that already exist', async () => {
    const existingHeader = {
      id: generateUUID(),
      code: LIABILITY_LEDGER_CODES.SHORT_TERM_DEBT.HEADER,
      materializedPath: LIABILITY_LEDGER_CODES.SHORT_TERM_DEBT.HEADER,
    } as ILiabilityLedgerAccount;
    mockLedgerAccountRepo.findByCode.mockResolvedValue(existingHeader);

    const { accounts, events, audits } = await bootstrapLiabilityAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: false,
    });

    expect(accounts).toHaveLength(0);
    expect(events).toHaveLength(0);
    expect(audits).toHaveLength(0);
  });

  it('creates only a missing statutory default posting account', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValue(null);
    mockLedgerAccountRepo.findBySubType.mockResolvedValue([
      {
        id: generateUUID(),
        name: 'Liability Suspense Account',
      } as ILiabilityLedgerAccount,
    ]);
    mockLedgerAccountRepo.findByBehavior.mockResolvedValue([
      {
        id: generateUUID(),
        name: 'Statutory Payables',
      } as IStatutoryPayableAccount,
    ]);

    const { accounts } = await bootstrapLiabilityAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: true,
    });

    expect(accounts).toHaveLength(5);
    expect(
      accounts.some(({ name }) => name === 'Statutory Payables (Default)')
    ).toBe(true);
    expect(
      accounts.some(({ name }) => name === 'Liability Suspense Account')
    ).toBe(false);
  });

  it('skips a statutory default posting account that already exists', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValue(null);
    mockLedgerAccountRepo.findBySubType.mockResolvedValue([
      {
        id: generateUUID(),
        name: 'Liability Suspense Account',
      } as ILiabilityLedgerAccount,
    ]);
    mockLedgerAccountRepo.findByBehavior.mockResolvedValue([
      {
        id: generateUUID(),
        name: 'Statutory Payables',
      } as IStatutoryPayableAccount,
      {
        id: generateUUID(),
        name: 'Statutory Payables (Default)',
      } as IStatutoryPayableAccount,
    ]);

    const { accounts } = await bootstrapLiabilityAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: true,
    });

    expect(accounts).toHaveLength(4);
    expect(
      accounts.some(({ name }) => name === 'Statutory Payables (Default)')
    ).toBe(false);
  });
});
