import { EAccountingEntityType } from '../../../../domain/accounting/types/accounting-entity.types';
import cashAndEquivalentAccountEntity from '../../../../domain/ledger/asset-account/entities/cash-and-equivalents.entity';
import mockAssetAccountService from '../../../../domain/ledger/asset-account/services/__mocks__/asset-account.service.mock';
import mockEquityAccountService from '../../../../domain/ledger/equity-account/services/__mocks__/equity-account.service.mock';
import mockExpenseAccountService from '../../../../domain/ledger/expense-account/services/__mocks__/expense-account.service.mock';
import mockLiabilityAccountService from '../../../../domain/ledger/liability-account/services/__mocks__/liability-account.service.mock';
import mockRevenueAccountService from '../../../../domain/ledger/revenue-account/services/__mocks__/revenue-account.service.mock';
import { SYSTEM_CURRENCIES } from '../../../../domain/money/config/currencies.config';
import { TEntityId } from '../../../../shared/types/uuid';
import generateUUID from '../../../../shared/utils/uuid-generator';
import makeAccountsBootstrapService from '../accounts-bootstrap.service';

describe('accountsBootstrapService', () => {
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
  const service = makeAccountsBootstrapService({
    assetAccountService: mockAssetAccountService,
    liabilityAccountService: mockLiabilityAccountService,
    equityAccountService: mockEquityAccountService,
    revenueAccountService: mockRevenueAccountService,
    expenseAccountService: mockExpenseAccountService,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    const [account, , audit] = cashAndEquivalentAccountEntity.makeHeader({
      name: 'Cash',
      accountingEntityId: accountingEntity.id,
      currency: SYSTEM_CURRENCIES.USD,
      createdBy: userId,
    });
    mockAssetAccountService.bootstrapHeaderAccounts.mockResolvedValue({
      accounts: [account],
      events: [],
      audits: [audit],
    });
    for (const mock of [
      mockLiabilityAccountService,
      mockEquityAccountService,
      mockRevenueAccountService,
      mockExpenseAccountService,
    ]) {
      mock.bootstrapHeaderAccounts.mockResolvedValue({
        accounts: [],
        events: [],
        audits: [],
      });
    }
  });

  it('combines all ledger families and passes bootstrap policy', async () => {
    const result = await service.bootstrap(
      accountingEntity,
      { correlationId: 'correlation-id' },
      true
    );

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].audit.entityId).toBe(result.entries[0].account.id);
    expect(
      mockAssetAccountService.bootstrapHeaderAccounts
    ).toHaveBeenCalledWith(
      accountingEntity,
      { correlationId: 'correlation-id' },
      true
    );
    expect(
      mockEquityAccountService.bootstrapHeaderAccounts
    ).toHaveBeenCalledWith(accountingEntity, {
      correlationId: 'correlation-id',
    });
  });

  it('rejects inconsistent accounts and audits', async () => {
    mockAssetAccountService.bootstrapHeaderAccounts.mockResolvedValue({
      accounts: [],
      events: [],
      audits: [
        cashAndEquivalentAccountEntity.makeHeader({
          name: 'Orphan',
          accountingEntityId: accountingEntity.id,
          currency: SYSTEM_CURRENCIES.USD,
          createdBy: userId,
        })[2],
      ],
    });

    await expect(
      service.bootstrap(
        accountingEntity,
        { correlationId: 'correlation-id' },
        false
      )
    ).rejects.toThrow('app_error_ledger_inconsistent_bootstrap');
  });

  it('rejects when accounts are returned without matching audit entity IDs', async () => {
    const [account] = cashAndEquivalentAccountEntity.makeHeader({
      name: 'Cash',
      accountingEntityId: accountingEntity.id,
      currency: SYSTEM_CURRENCIES.USD,
      createdBy: userId,
    });

    mockAssetAccountService.bootstrapHeaderAccounts.mockResolvedValue({
      accounts: [account],
      events: [],
      audits: [],
    });

    await expect(
      service.bootstrap(
        accountingEntity,
        { correlationId: 'correlation-id' },
        false
      )
    ).rejects.toThrow('app_error_ledger_inconsistent_bootstrap');
  });
});
