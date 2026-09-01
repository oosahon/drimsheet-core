import { IReadRepoOptions } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';
import { TAuditedEntity } from '@shared/values/events/types/event.types';

import {
  EAccountingEntityType,
  IAccountingEntity,
} from '@domain/accounting/types/accounting-entity.types';
import { ILedgerAccount } from '@domain/ledger/types/ledger.types';

import {
  mockAssetAccountService,
  mockAssetDisposalLossAccountService,
  mockBankChargeAccountService,
  mockDirectCostsAccountService,
  mockEmploymentIncomeAccountService,
  mockEquityAccountService,
  mockFinanceCostAccountService,
  mockGainOnAssetSaleAccountService,
  mockGiftsAccountService,
  mockGrantsAccountService,
  mockInterestAccountService,
  mockPayablesAccountService,
  mockReceivablesAccountService,
  mockRentAndUtilitiesAccountService,
  mockServicesAccountService,
  mockShortTermLoanAccountService,
  mockTaxExpenseAccountService,
  mockUnrealizedGainAccountService,
  mockUnrealizedLossAccountService,
} from '@app/ledger/contracts/__mocks__/ledger.domain.services.mock';
import makeHeaderAccountsBootstrapService from '@app/ledger/services/header-accounts-bootstrap.service';

const accountingEntity = {
  id: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
  ownerId: '123e4567-e89b-12d3-a456-426614174002' as TEntityId,
  type: EAccountingEntityType.Individual,
  functionalCurrencyCode: 'USD',
} as IAccountingEntity;
const repoOptions: IReadRepoOptions = { correlationId: 'test-correlation-id' };

function makeAuditedAccount(
  name: string
): TAuditedEntity<ILedgerAccount, ILedgerAccount, ILedgerAccount> {
  const account = {
    id: `${name}-id` as TEntityId,
    name,
  } as ILedgerAccount;
  const event = {
    type: `${name}-created`,
    data: account,
    occurredAt: new Date('2026-01-01T00:00:00.000Z'),
    enrichedAt: null,
  };
  const audit = {
    entityId: account.id,
    entityVersion: 1,
    action: 'created',
    diff: { before: null, after: account },
    occurredAt: event.occurredAt,
  };

  return [account, [event], audit];
}

describe('headerAccountsBootstrapService', () => {
  const service = makeHeaderAccountsBootstrapService({
    cashAccountService: mockAssetAccountService,
    receivablesAccountService: mockReceivablesAccountService,
    shortTermLoanAccountService: mockShortTermLoanAccountService,
    payablesAccountService: mockPayablesAccountService,
    equityAccountService: mockEquityAccountService,
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
  });
  const expectedHeaderNames = [
    'Cash and Cash Equivalents',
    'Receivables',
    'Short Term Debt',
    'Payables',
    'Retained Earnings',
    'Opening Balance Equity',
    'Services',
    'Employment Income',
    'Gain on Sale of Assets',
    'Unrealized Gain',
    'Grants',
    'Gifts',
    'Direct Costs',
    'Rent and Utilities',
    'Bank Charge',
    'Finance Cost',
    'Interest',
    'Tax Expense',
    'Unrealized Loss',
    'Asset Disposal Loss',
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockAssetAccountService.createHeader.mockResolvedValue(
      makeAuditedAccount(expectedHeaderNames[0]) as never
    );
    mockReceivablesAccountService.createHeader.mockResolvedValue(
      makeAuditedAccount(expectedHeaderNames[1]) as never
    );
    mockShortTermLoanAccountService.createHeader.mockResolvedValue(
      makeAuditedAccount(expectedHeaderNames[2]) as never
    );
    mockPayablesAccountService.createHeader.mockResolvedValue(
      makeAuditedAccount(expectedHeaderNames[3]) as never
    );
    mockEquityAccountService.createRetainedEarningsAccount.mockResolvedValue(
      makeAuditedAccount(expectedHeaderNames[4]) as never
    );
    mockEquityAccountService.createOpeningBalanceAccount.mockResolvedValue(
      makeAuditedAccount(expectedHeaderNames[5]) as never
    );
    mockServicesAccountService.createHeader.mockResolvedValue(
      makeAuditedAccount(expectedHeaderNames[6]) as never
    );
    mockEmploymentIncomeAccountService.createHeader.mockResolvedValue(
      makeAuditedAccount(expectedHeaderNames[7]) as never
    );
    mockGainOnAssetSaleAccountService.createHeader.mockResolvedValue(
      makeAuditedAccount(expectedHeaderNames[8]) as never
    );
    mockUnrealizedGainAccountService.createHeader.mockResolvedValue(
      makeAuditedAccount(expectedHeaderNames[9]) as never
    );
    mockGrantsAccountService.createHeader.mockResolvedValue(
      makeAuditedAccount(expectedHeaderNames[10]) as never
    );
    mockGiftsAccountService.createHeader.mockResolvedValue(
      makeAuditedAccount(expectedHeaderNames[11]) as never
    );
    mockDirectCostsAccountService.createHeader.mockResolvedValue(
      makeAuditedAccount(expectedHeaderNames[12]) as never
    );
    mockRentAndUtilitiesAccountService.createHeader.mockResolvedValue(
      makeAuditedAccount(expectedHeaderNames[13]) as never
    );
    mockBankChargeAccountService.createHeader.mockResolvedValue(
      makeAuditedAccount(expectedHeaderNames[14]) as never
    );
    mockFinanceCostAccountService.createHeader.mockResolvedValue(
      makeAuditedAccount(expectedHeaderNames[15]) as never
    );
    mockInterestAccountService.createHeader.mockResolvedValue(
      makeAuditedAccount(expectedHeaderNames[16]) as never
    );
    mockTaxExpenseAccountService.createHeader.mockResolvedValue(
      makeAuditedAccount(expectedHeaderNames[17]) as never
    );
    mockUnrealizedLossAccountService.createHeader.mockResolvedValue(
      makeAuditedAccount(expectedHeaderNames[18]) as never
    );
    mockAssetDisposalLossAccountService.createHeader.mockResolvedValue(
      makeAuditedAccount(expectedHeaderNames[19]) as never
    );
  });

  it('creates the complete foundational catalog in deterministic order', async () => {
    const result = await service.bootstrap(accountingEntity, repoOptions);

    expect(result.entries.map(({ account }) => account.name)).toEqual(
      expectedHeaderNames
    );
    expect(result.events.map(({ type }) => type)).toEqual(
      expectedHeaderNames.map((name) => `${name}-created`)
    );
    expect(
      result.entries.every(
        ({ account, audit }) => account.id === audit.entityId
      )
    ).toBe(true);
    expect([
      mockAssetAccountService.createHeader.mock.calls.length,
      mockReceivablesAccountService.createHeader.mock.calls.length,
      mockShortTermLoanAccountService.createHeader.mock.calls.length,
      mockPayablesAccountService.createHeader.mock.calls.length,
      mockEquityAccountService.createRetainedEarningsAccount.mock.calls.length,
      mockEquityAccountService.createOpeningBalanceAccount.mock.calls.length,
      mockServicesAccountService.createHeader.mock.calls.length,
      mockEmploymentIncomeAccountService.createHeader.mock.calls.length,
      mockGainOnAssetSaleAccountService.createHeader.mock.calls.length,
      mockUnrealizedGainAccountService.createHeader.mock.calls.length,
      mockGrantsAccountService.createHeader.mock.calls.length,
      mockGiftsAccountService.createHeader.mock.calls.length,
      mockDirectCostsAccountService.createHeader.mock.calls.length,
      mockRentAndUtilitiesAccountService.createHeader.mock.calls.length,
      mockBankChargeAccountService.createHeader.mock.calls.length,
      mockFinanceCostAccountService.createHeader.mock.calls.length,
      mockInterestAccountService.createHeader.mock.calls.length,
      mockTaxExpenseAccountService.createHeader.mock.calls.length,
      mockUnrealizedLossAccountService.createHeader.mock.calls.length,
      mockAssetDisposalLossAccountService.createHeader.mock.calls.length,
    ]).toEqual(Array(20).fill(1));
    expect(mockAssetAccountService.createHeader).toHaveBeenCalledWith(
      {
        name: 'Cash and Cash Equivalents',
        userId: accountingEntity.ownerId,
        accountingEntity,
      },
      repoOptions
    );
  });

  it('rejects on the first domain failure without continuing', async () => {
    mockReceivablesAccountService.createHeader.mockRejectedValueOnce(
      new Error('header failed')
    );

    await expect(
      service.bootstrap(accountingEntity, repoOptions)
    ).rejects.toThrow('header failed');
    expect(mockShortTermLoanAccountService.createHeader).not.toHaveBeenCalled();
  });
});
