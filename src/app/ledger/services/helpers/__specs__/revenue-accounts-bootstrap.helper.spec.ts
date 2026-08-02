import { IAccountingEntity } from '../../../../../domain/accounting/types/accounting-entity.types';
import { REVENUE_LEDGER_CODES } from '../../../../../domain/ledger/revenue-account/config/revenue-codes.config';
import { IRevenueLedgerAccount } from '../../../../../domain/ledger/revenue-account/types/revenue-account.types';
import ILedgerAccountRepo from '../../../../../domain/ledger/shared/repos/ledger-account.repo';
import { IReadRepoOptions } from '../../../../../shared/types/repo.types';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import makeRevenueAccountsBootstrapHelper from '../revenue-accounts-bootstrap.helper';

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

describe('revenueAccountsBootstrapHelper', () => {
  const bootstrapRevenueAccounts = makeRevenueAccountsBootstrapHelper({
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

    const { accounts, events, audits } = await bootstrapRevenueAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: false,
    });

    expect(accounts).toHaveLength(4);
    expect(events.length).toBeGreaterThan(0);
    expect(audits).toHaveLength(accounts.length);
    expect(accounts.some(({ name }) => name === 'Services')).toBe(true);
    expect(mockLedgerAccountRepo.findByCode).toHaveBeenCalledWith(
      REVENUE_LEDGER_CODES.SERVICES.HEADER,
      accountingEntity.id,
      repoOptions
    );
  });

  it('creates posting accounts when requested', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

    const { accounts } = await bootstrapRevenueAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: true,
    });

    expect(accounts).toHaveLength(8);
    expect(accounts.some(({ name }) => name === 'Services (Default)')).toBe(
      true
    );
  });

  it('skips header accounts that already exist', async () => {
    const existingAccount = {
      id: generateUUID(),
      code: REVENUE_LEDGER_CODES.SERVICES.HEADER,
      materializedPath: REVENUE_LEDGER_CODES.SERVICES.HEADER,
    } as IRevenueLedgerAccount;
    mockLedgerAccountRepo.findByCode.mockResolvedValue(existingAccount);

    const { accounts, events, audits } = await bootstrapRevenueAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: false,
    });

    expect(accounts).toHaveLength(0);
    expect(events).toHaveLength(0);
    expect(audits).toHaveLength(0);
  });
});
