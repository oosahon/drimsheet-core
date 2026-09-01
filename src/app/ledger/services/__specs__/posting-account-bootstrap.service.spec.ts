import { IReadRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';
import { TAuditedEntity } from '@shared/values/events/types/event.types';

import {
  EAccountingEntityType,
  IAccountingEntity,
} from '@domain/accounting/types/accounting-entity.types';
import { ASSET_LEDGER_CODES } from '@domain/ledger/config/asset-codes.config';
import { EXPENSE_LEDGER_CODES } from '@domain/ledger/config/expense-codes.config';
import { LIABILITY_LEDGER_CODES } from '@domain/ledger/config/liability-codes.config';
import { REVENUE_LEDGER_CODES } from '@domain/ledger/config/revenue-codes.config';
import makeReceivablesAccountService from '@domain/ledger/services/asset-account/receivables-account.service';
import { ILedgerAccount } from '@domain/ledger/types/ledger.types';

import mockLedgerAccountPersistenceService from '@app/ledger/contracts/__mocks__/ledger-account-persistence.service.mock';
import {
  mockAssetDisposalLossAccountService,
  mockBankChargeAccountService,
  mockDirectCostsAccountService,
  mockEmploymentIncomeAccountService,
  mockFinanceCostAccountService,
  mockGainOnAssetSaleAccountService,
  mockGiftsAccountService,
  mockGrantsAccountService,
  mockInterestAccountService,
  mockPayablesAccountService,
  mockReceivablesAccountService,
  mockRentAndUtilitiesAccountService,
  mockServicesAccountService,
  mockTaxExpenseAccountService,
  mockUnrealizedGainAccountService,
  mockUnrealizedLossAccountService,
} from '@app/ledger/contracts/__mocks__/ledger.domain.services.mock';
import { mockLedgerAccountRepo } from '@app/ledger/contracts/__mocks__/ledger.repos.mock';
import makePostingAccountBootstrapService from '@app/ledger/services/posting-account-bootstrap.service';

const accountingEntity = {
  id: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
  ownerId: '123e4567-e89b-12d3-a456-426614174002' as TEntityId,
  type: EAccountingEntityType.Individual,
  functionalCurrencyCode: 'USD',
} as IAccountingEntity;
const repoOptions: IReadRepoOptions = {
  correlationId: 'test-correlation-id',
};
const expectedAccountNames = [
  'Trade Receivables',
  'Statutory Receivables',
  'Statutory Receivables (Default)',
  'Trade Payables',
  'Statutory Payables',
  'Statutory Payables (Default)',
  'Services (Default)',
  'Employment Income (Default)',
  'Gain on Sale of Assets (Default)',
  'Unrealized Gains (Default)',
  'Grants (Default)',
  'Gifts (Default)',
  'Direct Costs (Default)',
  'Rent and Utilities (Default)',
  'Bank Charge (Default)',
  'Finance Cost (Default)',
  'Interest (Default)',
  'Tax Expense (Default)',
  'Unrealized Loss (Default)',
  'Asset Disposal Loss (Default)',
];

function makeAuditedAccount(
  name: string,
  index: number
): TAuditedEntity<ILedgerAccount, ILedgerAccount, ILedgerAccount> {
  const account = {
    id: `123e4567-e89b-12d3-a456-4266141740${String(index).padStart(2, '0')}` as TEntityId,
    name,
  } as ILedgerAccount;
  const occurredAt = new Date('2026-01-01T00:00:00.000Z');

  return [
    account,
    [{ type: `${name}-created`, data: account, occurredAt, enrichedAt: null }],
    {
      entityId: account.id,
      entityVersion: 1,
      action: 'created',
      diff: { before: null, after: account },
      occurredAt,
    },
  ];
}

const dependencies = {
  ledgerAccountPersistenceService: mockLedgerAccountPersistenceService,
  receivablesAccountService: mockReceivablesAccountService,
  payablesAccountService: mockPayablesAccountService,
  servicesAccountService: mockServicesAccountService,
  employmentIncomeAccountService: mockEmploymentIncomeAccountService,
  gainOnAssetSaleAccountService: mockGainOnAssetSaleAccountService,
  unrealizedGainAccountService: mockUnrealizedGainAccountService,
  grantsAccountService: mockGrantsAccountService,
  giftsAccountService: mockGiftsAccountService,
  directCostsAccountService: mockDirectCostsAccountService,
  rentAndUtilitiesAccountService: mockRentAndUtilitiesAccountService,
  bankChargeAccountService: mockBankChargeAccountService,
  financeCostAccountService: mockFinanceCostAccountService,
  interestAccountService: mockInterestAccountService,
  taxExpenseAccountService: mockTaxExpenseAccountService,
  unrealizedLossAccountService: mockUnrealizedLossAccountService,
  assetDisposalLossAccountService: mockAssetDisposalLossAccountService,
};

describe('postingAccountBootstrapService', () => {
  const service = makePostingAccountBootstrapService(dependencies);
  const auditedAccounts = expectedAccountNames.map(makeAuditedAccount);

  beforeEach(() => {
    jest.clearAllMocks();
    mockReceivablesAccountService.createTradeReceivableSubAccount.mockResolvedValue(
      auditedAccounts[0] as never
    );
    mockReceivablesAccountService.createStatutoryReceivableSubAccount
      .mockResolvedValueOnce(auditedAccounts[1] as never)
      .mockResolvedValueOnce(auditedAccounts[2] as never);
    mockPayablesAccountService.createTradePayableSubAccount.mockResolvedValue(
      auditedAccounts[3] as never
    );
    mockPayablesAccountService.createStatutoryPayableSubAccount
      .mockResolvedValueOnce(auditedAccounts[4] as never)
      .mockResolvedValueOnce(auditedAccounts[5] as never);
    mockServicesAccountService.createSubAccount.mockResolvedValue(
      auditedAccounts[6] as never
    );
    mockEmploymentIncomeAccountService.createSubAccount.mockResolvedValue(
      auditedAccounts[7] as never
    );
    mockGainOnAssetSaleAccountService.createSubAccount.mockResolvedValue(
      auditedAccounts[8] as never
    );
    mockUnrealizedGainAccountService.createSubAccount.mockResolvedValue(
      auditedAccounts[9] as never
    );
    mockGrantsAccountService.createSubAccount.mockResolvedValue(
      auditedAccounts[10] as never
    );
    mockGiftsAccountService.createSubAccount.mockResolvedValue(
      auditedAccounts[11] as never
    );
    mockDirectCostsAccountService.createSubAccount.mockResolvedValue(
      auditedAccounts[12] as never
    );
    mockRentAndUtilitiesAccountService.createSubAccount.mockResolvedValue(
      auditedAccounts[13] as never
    );
    mockBankChargeAccountService.createSubAccount.mockResolvedValue(
      auditedAccounts[14] as never
    );
    mockFinanceCostAccountService.createSubAccount.mockResolvedValue(
      auditedAccounts[15] as never
    );
    mockInterestAccountService.createSubAccount.mockResolvedValue(
      auditedAccounts[16] as never
    );
    mockTaxExpenseAccountService.createSubAccount.mockResolvedValue(
      auditedAccounts[17] as never
    );
    mockUnrealizedLossAccountService.createSubAccount.mockResolvedValue(
      auditedAccounts[18] as never
    );
    mockAssetDisposalLossAccountService.createSubAccount.mockResolvedValue(
      auditedAccounts[19] as never
    );
    mockLedgerAccountPersistenceService.create.mockResolvedValue();
  });

  it('owns and bootstraps the complete posting catalog in dependency order', async () => {
    const result = await service.bootstrap(accountingEntity, repoOptions);

    expect(result.entries.map(({ account }) => account.name)).toEqual(
      expectedAccountNames
    );
    expect(result.events.map(({ type }) => type)).toEqual(
      expectedAccountNames.map((name) => `${name}-created`)
    );
    expect(mockLedgerAccountPersistenceService.create).toHaveBeenCalledTimes(
      expectedAccountNames.length
    );
    expect(
      mockLedgerAccountPersistenceService.create.mock.calls.map(
        ([account]) => account.name
      )
    ).toEqual(expectedAccountNames);
    expect(
      mockLedgerAccountPersistenceService.create.mock.calls.every(
        ([, currencyCode, options]) =>
          currencyCode === accountingEntity.functionalCurrencyCode &&
          options.correlationId === repoOptions.correlationId &&
          options.history.length === 1
      )
    ).toBe(true);
  });

  it('persists each prerequisite before creating its dependent account', async () => {
    await service.bootstrap(accountingEntity, repoOptions);

    expect(
      mockLedgerAccountPersistenceService.create.mock.invocationCallOrder[0]
    ).toBeLessThan(
      mockReceivablesAccountService.createStatutoryReceivableSubAccount.mock
        .invocationCallOrder[0]
    );
    expect(
      mockLedgerAccountPersistenceService.create.mock.invocationCallOrder[1]
    ).toBeLessThan(
      mockReceivablesAccountService.createStatutoryReceivableSubAccount.mock
        .invocationCallOrder[1]
    );
    expect(
      mockLedgerAccountPersistenceService.create.mock.invocationCallOrder[3]
    ).toBeLessThan(
      mockPayablesAccountService.createStatutoryPayableSubAccount.mock
        .invocationCallOrder[0]
    );
    expect(
      mockLedgerAccountPersistenceService.create.mock.invocationCallOrder[4]
    ).toBeLessThan(
      mockPayablesAccountService.createStatutoryPayableSubAccount.mock
        .invocationCallOrder[1]
    );
  });

  it('supplies the configured control accounts for every ledger family', async () => {
    await service.bootstrap(accountingEntity, repoOptions);

    expect(
      mockReceivablesAccountService.createTradeReceivableSubAccount
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        controlAccountCode: ASSET_LEDGER_CODES.RECEIVABLES.HEADER,
      }),
      repoOptions
    );
    expect(
      mockPayablesAccountService.createTradePayableSubAccount
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        controlAccountCode: LIABILITY_LEDGER_CODES.PAYABLES.HEADER,
      }),
      repoOptions
    );
    expect(mockServicesAccountService.createSubAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        controlAccountCode: REVENUE_LEDGER_CODES.SERVICES.HEADER,
      }),
      repoOptions
    );
    expect(mockDirectCostsAccountService.createSubAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        controlAccountCode: EXPENSE_LEDGER_CODES.DIRECT_COSTS.HEADER,
      }),
      repoOptions
    );
  });

  it('stops immediately when persistence fails', async () => {
    const persistenceFailure = new Error('posting persistence failed');
    mockLedgerAccountPersistenceService.create.mockRejectedValueOnce(
      persistenceFailure
    );

    await expect(service.bootstrap(accountingEntity, repoOptions)).rejects.toBe(
      persistenceFailure
    );
    expect(
      mockReceivablesAccountService.createStatutoryReceivableSubAccount
    ).not.toHaveBeenCalled();
  });

  it('propagates domain failures without continuing', async () => {
    const domainFailure = new Error('allocation failed');
    mockServicesAccountService.createSubAccount.mockRejectedValueOnce(
      domainFailure
    );

    await expect(service.bootstrap(accountingEntity, repoOptions)).rejects.toBe(
      domainFailure
    );
    expect(
      mockEmploymentIncomeAccountService.createSubAccount
    ).not.toHaveBeenCalled();
  });

  it('rejects through the domain service when the required header is not persisted', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(null);
    const realReceivablesService = makeReceivablesAccountService({
      ledgerAccountRepo: mockLedgerAccountRepo,
    });
    const serviceWithoutHeader = makePostingAccountBootstrapService({
      ...dependencies,
      receivablesAccountService: realReceivablesService,
    });

    await expect(
      serviceWithoutHeader.bootstrap(accountingEntity, repoOptions)
    ).rejects.toMatchObject({
      errorKey:
        'ledger_error_asset_account_control_account_not_found_unexpected',
      cause: {
        controlAccountLedgerCode: ASSET_LEDGER_CODES.RECEIVABLES.HEADER,
      },
    });
    expect(mockLedgerAccountPersistenceService.create).not.toHaveBeenCalled();
  });
});
