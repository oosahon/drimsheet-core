import { IAccountingEntity } from '../../../../../domain/accounting/types/accounting-entity.types';
import { EXPENSE_LEDGER_CODES } from '../../../../../domain/ledger/expense-account/config/expense-codes.config';
import { IExpenseLedgerAccount } from '../../../../../domain/ledger/expense-account/types/expense-account.types';
import ILedgerAccountRepo from '../../../../../domain/ledger/shared/repos/ledger-account.repo';
import { IReadRepoOptions } from '../../../../../shared/types/repo.types';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import makeExpenseAccountsBootstrapHelper from '../expense-accounts-bootstrap.helper';

const mockLedgerAccountRepo: jest.Mocked<ILedgerAccountRepo> = {
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

describe('expenseAccountsBootstrapHelper', () => {
  const bootstrapExpenseAccounts = makeExpenseAccountsBootstrapHelper({
    ledgerAccountRepo: mockLedgerAccountRepo,
  });
  const repoOptions: IReadRepoOptions = {
    correlationId: 'test-correlation-id',
  };
  const accountingEntity = {
    id: generateUUID(),
    ownerId: generateUUID(),
    functionalCurrencyCode: 'USD',
  } as IAccountingEntity;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-15T00:00:00.000Z'));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates header accounts without posting accounts when not requested', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

    const { accounts, events, audits } = await bootstrapExpenseAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: false,
    });

    expect(accounts).toHaveLength(8);
    expect(events.length).toBeGreaterThan(0);
    expect(audits).toHaveLength(accounts.length);
    expect(accounts.some(({ name }) => name === 'Direct Costs')).toBe(true);
    expect(mockLedgerAccountRepo.findByCode).toHaveBeenCalledWith(
      EXPENSE_LEDGER_CODES.DIRECT_COSTS.HEADER,
      accountingEntity.id,
      repoOptions
    );
  });

  it('creates posting accounts when requested', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

    const { accounts } = await bootstrapExpenseAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: true,
    });

    expect(accounts).toHaveLength(16);
    expect(accounts.some(({ name }) => name === 'Direct Costs (Default)')).toBe(
      true
    );
  });

  it('skips header accounts that already exist', async () => {
    const existingAccount = {
      id: generateUUID(),
      code: EXPENSE_LEDGER_CODES.DIRECT_COSTS.HEADER,
      materializedPath: EXPENSE_LEDGER_CODES.DIRECT_COSTS.HEADER,
    } as IExpenseLedgerAccount;
    mockLedgerAccountRepo.findByCode.mockResolvedValue(existingAccount);

    const { accounts, events, audits } = await bootstrapExpenseAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: false,
    });

    expect(accounts).toHaveLength(0);
    expect(events).toHaveLength(0);
    expect(audits).toHaveLength(0);
  });
});
