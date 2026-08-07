import { EAccountingEntityType } from '../../../../domain/accounting/types/accounting-entity.types';
import makeCashAccountService from '../../../../domain/ledger/services/cash-account.service';
import { TEntityId } from '../../../../shared/types/uuid';
import generateUUID from '../../../../shared/utils/uuid-generator';
import { mockAssetAccountService } from '../../contracts/__mocks__/ledger.domain.services.mock';
import { mockLedgerAccountRepo } from '../../contracts/__mocks__/ledger.repos.mock';
import IAccountsBootstrapService from '../../contracts/accounts-bootstrap.service.contract';
import makeAccountsBootstrapService from '../accounts-bootstrap.service';
import makeAssetAccountsBootstrapHelper from '../helpers/asset-accounts-bootstrap.helper';
import makeEquityAccountsBootstrapHelper from '../helpers/equity-accounts-bootstrap.helper';
import makeExpenseAccountsBootstrapHelper from '../helpers/expense-accounts-bootstrap.helper';
import makeLiabilityAccountsBootstrapHelper from '../helpers/liability-accounts-bootstrap.helper';
import makeRevenueAccountsBootstrapHelper from '../helpers/revenue-accounts-bootstrap.helper';

jest.mock('../helpers/asset-accounts-bootstrap.helper');
jest.mock('../helpers/equity-accounts-bootstrap.helper');
jest.mock('../helpers/expense-accounts-bootstrap.helper');
jest.mock('../helpers/liability-accounts-bootstrap.helper');
jest.mock('../helpers/revenue-accounts-bootstrap.helper');

const mockMakeAssetAccountsBootstrapHelper = jest.mocked(
  makeAssetAccountsBootstrapHelper
);
const mockMakeEquityAccountsBootstrapHelper = jest.mocked(
  makeEquityAccountsBootstrapHelper
);
const mockMakeExpenseAccountsBootstrapHelper = jest.mocked(
  makeExpenseAccountsBootstrapHelper
);
const mockMakeLiabilityAccountsBootstrapHelper = jest.mocked(
  makeLiabilityAccountsBootstrapHelper
);
const mockMakeRevenueAccountsBootstrapHelper = jest.mocked(
  makeRevenueAccountsBootstrapHelper
);

const mockBootstrapAssetAccounts: jest.MockedFunction<
  ReturnType<typeof makeAssetAccountsBootstrapHelper>
> = jest.fn();
const mockBootstrapEquityAccounts: jest.MockedFunction<
  ReturnType<typeof makeEquityAccountsBootstrapHelper>
> = jest.fn();
const mockBootstrapExpenseAccounts: jest.MockedFunction<
  ReturnType<typeof makeExpenseAccountsBootstrapHelper>
> = jest.fn();
const mockBootstrapLiabilityAccounts: jest.MockedFunction<
  ReturnType<typeof makeLiabilityAccountsBootstrapHelper>
> = jest.fn();
const mockBootstrapRevenueAccounts: jest.MockedFunction<
  ReturnType<typeof makeRevenueAccountsBootstrapHelper>
> = jest.fn();

describe('accountsBootstrapService', () => {
  const cashAccountService = makeCashAccountService({
    ledgerAccountRepo: mockLedgerAccountRepo,
  });
  const userId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
  const accountingEntity = {
    id: generateUUID(),
    name: 'Test Business',
    type: EAccountingEntityType.Individual,
    ownerId: userId,
    functionalCurrencyCode: 'USD' as const,
    jurisdictionCode: 'US' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const repoOptions = { correlationId: 'correlation-id' };

  let service: IAccountsBootstrapService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockMakeAssetAccountsBootstrapHelper.mockReturnValue(
      mockBootstrapAssetAccounts
    );
    mockMakeLiabilityAccountsBootstrapHelper.mockReturnValue(
      mockBootstrapLiabilityAccounts
    );
    mockMakeEquityAccountsBootstrapHelper.mockReturnValue(
      mockBootstrapEquityAccounts
    );
    mockMakeRevenueAccountsBootstrapHelper.mockReturnValue(
      mockBootstrapRevenueAccounts
    );
    mockMakeExpenseAccountsBootstrapHelper.mockReturnValue(
      mockBootstrapExpenseAccounts
    );

    const [account, , audit] = await cashAccountService.createHeader({
      name: 'Cash',
      accountingEntity,
      userId,
    });
    mockBootstrapAssetAccounts.mockResolvedValue({
      accounts: [account],
      events: [],
      audits: [audit],
    });
    mockBootstrapLiabilityAccounts.mockResolvedValue({
      accounts: [],
      events: [],
      audits: [],
    });
    mockBootstrapEquityAccounts.mockResolvedValue({
      accounts: [],
      events: [],
      audits: [],
    });
    mockBootstrapRevenueAccounts.mockResolvedValue({
      accounts: [],
      events: [],
      audits: [],
    });
    mockBootstrapExpenseAccounts.mockResolvedValue({
      accounts: [],
      events: [],
      audits: [],
    });

    service = makeAccountsBootstrapService({
      ledgerAccountRepo: mockLedgerAccountRepo,
      cashAccountService: mockAssetAccountService,
    });
  });

  it('constructs and coordinates all ledger-family helpers in order', async () => {
    const result = await service.bootstrap(accountingEntity, repoOptions, true);

    expect(mockMakeAssetAccountsBootstrapHelper).toHaveBeenCalledWith({
      ledgerAccountRepo: mockLedgerAccountRepo,
      cashAccountService: mockAssetAccountService,
    });
    expect(mockMakeLiabilityAccountsBootstrapHelper).toHaveBeenCalledWith({
      ledgerAccountRepo: mockLedgerAccountRepo,
    });
    expect(mockMakeEquityAccountsBootstrapHelper).toHaveBeenCalledWith({
      ledgerAccountRepo: mockLedgerAccountRepo,
    });
    expect(mockMakeRevenueAccountsBootstrapHelper).toHaveBeenCalledWith({
      ledgerAccountRepo: mockLedgerAccountRepo,
    });
    expect(mockMakeExpenseAccountsBootstrapHelper).toHaveBeenCalledWith({
      ledgerAccountRepo: mockLedgerAccountRepo,
    });
    expect(mockBootstrapAssetAccounts).toHaveBeenCalledWith({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: true,
    });
    expect(mockBootstrapEquityAccounts).toHaveBeenCalledWith({
      accountingEntity,
      repoOptions,
    });
    expect(mockBootstrapAssetAccounts.mock.invocationCallOrder[0]).toBeLessThan(
      mockBootstrapLiabilityAccounts.mock.invocationCallOrder[0]
    );
    expect(
      mockBootstrapLiabilityAccounts.mock.invocationCallOrder[0]
    ).toBeLessThan(mockBootstrapEquityAccounts.mock.invocationCallOrder[0]);
    expect(
      mockBootstrapEquityAccounts.mock.invocationCallOrder[0]
    ).toBeLessThan(mockBootstrapRevenueAccounts.mock.invocationCallOrder[0]);
    expect(
      mockBootstrapRevenueAccounts.mock.invocationCallOrder[0]
    ).toBeLessThan(mockBootstrapExpenseAccounts.mock.invocationCallOrder[0]);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].audit.entityId).toBe(result.entries[0].account.id);
  });

  it('rejects inconsistent accounts and audits', async () => {
    const orphanAccount = await cashAccountService.createHeader({
      name: 'Orphan',
      accountingEntity,
      userId,
    });
    mockBootstrapAssetAccounts.mockResolvedValue({
      accounts: [],
      events: [],
      audits: [orphanAccount[2]],
    });

    await expect(
      service.bootstrap(accountingEntity, repoOptions, false)
    ).rejects.toThrow('app_error_ledger_inconsistent_bootstrap');
  });

  it('rejects accounts without matching audit entity IDs', async () => {
    const [account] = await cashAccountService.createHeader({
      name: 'Cash',
      accountingEntity,
      userId,
    });

    mockBootstrapAssetAccounts.mockResolvedValue({
      accounts: [account],
      events: [],
      audits: [],
    });

    await expect(
      service.bootstrap(accountingEntity, repoOptions, false)
    ).rejects.toThrow('app_error_ledger_inconsistent_bootstrap');
  });
});
