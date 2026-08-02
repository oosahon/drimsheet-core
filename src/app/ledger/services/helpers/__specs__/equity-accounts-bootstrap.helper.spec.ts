import { IAccountingEntity } from '../../../../../domain/accounting/types/accounting-entity.types';
import { EQUITY_LEDGER_CODES } from '../../../../../domain/ledger/equity-account/config/equity-codes.config';
import { IEquityLedgerAccount } from '../../../../../domain/ledger/equity-account/types/equity-account.types';
import ILedgerAccountRepo from '../../../../../domain/ledger/shared/repos/ledger-account.repo';
import { IReadRepoOptions } from '../../../../../shared/types/repo.types';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import makeEquityAccountsBootstrapHelper from '../equity-accounts-bootstrap.helper';

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

describe('equityAccountsBootstrapHelper', () => {
  const bootstrapEquityAccounts = makeEquityAccountsBootstrapHelper({
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
      EQUITY_LEDGER_CODES.RETAINED_EARNINGS.HEADER,
      accountingEntity.id,
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
  });
});
