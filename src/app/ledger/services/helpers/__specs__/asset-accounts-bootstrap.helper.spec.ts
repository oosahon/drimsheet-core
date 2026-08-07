import { IAccountingEntity } from '../../../../../domain/accounting/types/accounting-entity.types';
import { ASSET_LEDGER_CODES } from '../../../../../domain/ledger/config/asset-codes.config';
import makeCashAccountService from '../../../../../domain/ledger/services/cash-account.service';
import {
  IAssetLedgerAccount,
  IStatutoryReceivableAccount,
} from '../../../../../domain/ledger/types/asset-account.types';
import { IReadRepoOptions } from '../../../../../shared/types/repo.types';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import { mockLedgerAccountRepo } from '../../../contracts/__mocks__/ledger.repos.mock';
import makeAssetAccountsBootstrapHelper from '../asset-accounts-bootstrap.helper';

describe('assetAccountsBootstrapHelper', () => {
  const bootstrapAssetAccounts = makeAssetAccountsBootstrapHelper({
    ledgerAccountRepo: mockLedgerAccountRepo,
    cashAccountService: makeCashAccountService({
      ledgerAccountRepo: mockLedgerAccountRepo,
    }),
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

  it('creates header and posting accounts when requested', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValue(null);
    mockLedgerAccountRepo.findBySubType.mockResolvedValue([]);
    mockLedgerAccountRepo.findByBehavior.mockResolvedValue([
      {
        id: generateUUID(),
        code: ASSET_LEDGER_CODES.RECEIVABLES.STATUTORY,
        materializedPath: `${ASSET_LEDGER_CODES.RECEIVABLES.HEADER}.${ASSET_LEDGER_CODES.RECEIVABLES.STATUTORY}`,
      } as IStatutoryReceivableAccount,
    ]);

    const { accounts, events, audits } = await bootstrapAssetAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: true,
    });

    expect(accounts).toHaveLength(6);
    expect(events.length).toBeGreaterThan(0);
    expect(audits).toHaveLength(accounts.length);
    expect(accounts.some(({ name }) => name === 'Asset Suspense Account')).toBe(
      true
    );
    expect(
      accounts.some(({ name }) => name === 'Statutory Receivables (Default)')
    ).toBe(true);
    expect(mockLedgerAccountRepo.findByCode).toHaveBeenCalledWith(
      ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
      accountingEntity.id,
      repoOptions
    );
  });

  it('skips headers that already exist', async () => {
    const existingHeader = {
      id: generateUUID(),
      code: ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
      materializedPath: ASSET_LEDGER_CODES.CASH_AND_EQUIVALENTS.HEADER,
    } as IAssetLedgerAccount;
    mockLedgerAccountRepo.findByCode.mockResolvedValue(existingHeader);

    const { accounts, events, audits } = await bootstrapAssetAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: false,
    });

    expect(accounts).toHaveLength(0);
    expect(events).toHaveLength(0);
    expect(audits).toHaveLength(0);
  });

  it('does not create posting accounts when they are not requested', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

    const { accounts } = await bootstrapAssetAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: false,
    });

    expect(accounts).toHaveLength(4);
    expect(accounts.some(({ name }) => name === 'Asset Suspense Account')).toBe(
      false
    );
  });

  it('skips posting accounts that already exist', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValue(null);
    mockLedgerAccountRepo.findBySubType.mockResolvedValue([
      {
        id: generateUUID(),
        name: 'Asset Suspense Account',
      } as IAssetLedgerAccount,
    ]);
    mockLedgerAccountRepo.findByBehavior.mockResolvedValue([
      {
        id: generateUUID(),
        name: 'Statutory Receivables',
      } as IAssetLedgerAccount,
      {
        id: generateUUID(),
        name: 'Statutory Receivables (Default)',
      } as IAssetLedgerAccount,
    ]);

    const { accounts } = await bootstrapAssetAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: true,
    });

    expect(accounts).toHaveLength(4);
    expect(accounts.some(({ name }) => name === 'Asset Suspense Account')).toBe(
      false
    );
    expect(
      accounts.some(({ name }) => name === 'Statutory Receivables (Default)')
    ).toBe(false);
  });
});
