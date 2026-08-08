import { IAccountingEntity } from '../../../../../domain/accounting/types/accounting-entity.types';
import { EXPENSE_LEDGER_CODES } from '../../../../../domain/ledger/config/expense-codes.config';
import ledgerAccountEntity from '../../../../../domain/ledger/entities/ledger-account.entity';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
  IAssetDisposalLossAccount,
  IBankChargeAccount,
  IDirectCostsAccount,
  IExpenseLedgerAccount,
  IFinanceCostAccount,
  IIncomeTaxExpenseAccount,
  IInterestAccount,
  IRentUtilitiesAccount,
  IUnrealizedLossAccount,
  UExpenseAccountBehavior,
  UExpenseSubType,
} from '../../../../../domain/ledger/types/expense-account.types';
import { TExpenseLedgerCode } from '../../../../../domain/ledger/types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '../../../../../domain/ledger/types/ledger.types';
import { SYSTEM_CURRENCIES } from '../../../../../domain/money/config/currencies.config';
import { TCreationOmits } from '../../../../../shared/types/creation-omits.types';
import { IReadRepoOptions } from '../../../../../shared/types/repo.types';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import {
  mockAssetDisposalLossAccountService,
  mockBankChargeAccountService,
  mockDirectCostsAccountService,
  mockFinanceCostAccountService,
  mockInterestAccountService,
  mockRentAndUtilitiesAccountService,
  mockTaxExpenseAccountService,
  mockUnrealizedLossAccountService,
} from '../../../contracts/__mocks__/ledger.domain.services.mock';
import { mockLedgerAccountRepo } from '../../../contracts/__mocks__/ledger.repos.mock';
import makeExpenseAccountsBootstrapHelper from '../expense-accounts-bootstrap.helper';

describe('expenseAccountsBootstrapHelper', () => {
  const services = {
    directCostsAccountService: mockDirectCostsAccountService,
    rentAndUtilitiesAccountService: mockRentAndUtilitiesAccountService,
    bankChargeAccountService: mockBankChargeAccountService,
    financeCostAccountService: mockFinanceCostAccountService,
    interestAccountService: mockInterestAccountService,
    taxExpenseAccountService: mockTaxExpenseAccountService,
    unrealizedLossAccountService: mockUnrealizedLossAccountService,
    assetDisposalLossAccountService: mockAssetDisposalLossAccountService,
  };
  const bootstrapExpenseAccounts = makeExpenseAccountsBootstrapHelper({
    ledgerAccountRepo: mockLedgerAccountRepo,
    ...services,
  });
  const repoOptions: IReadRepoOptions = {
    correlationId: 'test-correlation-id',
  };
  const accountingEntity = {
    id: generateUUID(),
    ownerId: generateUUID(),
    functionalCurrencyCode: SYSTEM_CURRENCIES.USD.code,
  } as IAccountingEntity;

  const makeExpenseAccount = <Account extends IExpenseLedgerAccount>(
    name: string,
    code: TExpenseLedgerCode,
    subType: UExpenseSubType,
    behavior: UExpenseAccountBehavior,
    isControlAccount: boolean,
    controlAccountId: Account['controlAccountId']
  ) =>
    ledgerAccountEntity.make<Account>({
      name,
      code,
      materializedPath: isControlAccount
        ? code
        : `${code.slice(0, 3)}000.${code}`,
      accountingEntityId: accountingEntity.id,
      normalBalance: ENormalBalance.Debit,
      type: ELedgerType.Expense,
      subType,
      behavior,
      isControlAccount,
      controlAccountId,
      currency: SYSTEM_CURRENCIES.USD,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy: accountingEntity.ownerId,
    } as TCreationOmits<Account, 'openingBalanceDate'>);

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-15T00:00:00.000Z'));
    jest.clearAllMocks();

    const directHeader = makeExpenseAccount<IDirectCostsAccount>(
      'Direct Costs',
      '500000',
      EExpenseSubType.DirectCosts,
      EExpenseAccountBehavior.DefaultDirectCost,
      true,
      null
    );
    const rentHeader = makeExpenseAccount<IRentUtilitiesAccount>(
      'Rent and Utilities',
      '502000',
      EExpenseSubType.RentAndUtilities,
      EExpenseAccountBehavior.RentAndUtilities,
      true,
      null
    );
    const bankHeader = makeExpenseAccount<IBankChargeAccount>(
      'Bank Charge',
      '507000',
      EExpenseSubType.BankCharge,
      EExpenseAccountBehavior.BankCharge,
      true,
      null
    );
    const financeHeader = makeExpenseAccount<IFinanceCostAccount>(
      'Finance Cost',
      '508000',
      EExpenseSubType.FinanceCost,
      EExpenseAccountBehavior.FinanceCost,
      true,
      null
    );
    const interestHeader = makeExpenseAccount<IInterestAccount>(
      'Interest',
      '509000',
      EExpenseSubType.Interest,
      EExpenseAccountBehavior.Interest,
      true,
      null
    );
    const taxHeader = makeExpenseAccount<IIncomeTaxExpenseAccount>(
      'Tax Expense',
      '510000',
      EExpenseSubType.IncomeTaxExpense,
      EExpenseAccountBehavior.TaxExpense,
      true,
      null
    );
    const unrealizedHeader = makeExpenseAccount<IUnrealizedLossAccount>(
      'Unrealized Loss',
      '511000',
      EExpenseSubType.UnrealizedLoss,
      EExpenseAccountBehavior.UnrealizedLoss,
      true,
      null
    );
    const disposalHeader = makeExpenseAccount<IAssetDisposalLossAccount>(
      'Asset Disposal Loss',
      '512000',
      EExpenseSubType.LossOnAssetDisposal,
      EExpenseAccountBehavior.AssetDisposalLoss,
      true,
      null
    );

    mockDirectCostsAccountService.createHeader.mockResolvedValue(directHeader);
    mockRentAndUtilitiesAccountService.createHeader.mockResolvedValue(
      rentHeader
    );
    mockBankChargeAccountService.createHeader.mockResolvedValue(bankHeader);
    mockFinanceCostAccountService.createHeader.mockResolvedValue(financeHeader);
    mockInterestAccountService.createHeader.mockResolvedValue(interestHeader);
    mockTaxExpenseAccountService.createHeader.mockResolvedValue(taxHeader);
    mockUnrealizedLossAccountService.createHeader.mockResolvedValue(
      unrealizedHeader
    );
    mockAssetDisposalLossAccountService.createHeader.mockResolvedValue(
      disposalHeader
    );

    mockDirectCostsAccountService.createSubAccount.mockResolvedValue(
      makeExpenseAccount<IDirectCostsAccount>(
        'Direct Costs (Default)',
        '500001',
        EExpenseSubType.DirectCosts,
        EExpenseAccountBehavior.DefaultDirectCost,
        false,
        directHeader[0].id
      )
    );
    mockRentAndUtilitiesAccountService.createSubAccount.mockResolvedValue(
      makeExpenseAccount<IRentUtilitiesAccount>(
        'Rent and Utilities (Default)',
        '502001',
        EExpenseSubType.RentAndUtilities,
        EExpenseAccountBehavior.RentAndUtilities,
        false,
        rentHeader[0].id
      )
    );
    mockBankChargeAccountService.createSubAccount.mockResolvedValue(
      makeExpenseAccount<IBankChargeAccount>(
        'Bank Charge (Default)',
        '507001',
        EExpenseSubType.BankCharge,
        EExpenseAccountBehavior.BankCharge,
        false,
        bankHeader[0].id
      )
    );
    mockFinanceCostAccountService.createSubAccount.mockResolvedValue(
      makeExpenseAccount<IFinanceCostAccount>(
        'Finance Cost (Default)',
        '508001',
        EExpenseSubType.FinanceCost,
        EExpenseAccountBehavior.FinanceCost,
        false,
        financeHeader[0].id
      )
    );
    mockInterestAccountService.createSubAccount.mockResolvedValue(
      makeExpenseAccount<IInterestAccount>(
        'Interest (Default)',
        '509001',
        EExpenseSubType.Interest,
        EExpenseAccountBehavior.Interest,
        false,
        interestHeader[0].id
      )
    );
    mockTaxExpenseAccountService.createSubAccount.mockResolvedValue(
      makeExpenseAccount<IIncomeTaxExpenseAccount>(
        'Tax Expense (Default)',
        '510001',
        EExpenseSubType.IncomeTaxExpense,
        EExpenseAccountBehavior.TaxExpense,
        false,
        taxHeader[0].id
      )
    );
    mockUnrealizedLossAccountService.createSubAccount.mockResolvedValue(
      makeExpenseAccount<IUnrealizedLossAccount>(
        'Unrealized Loss (Default)',
        '511001',
        EExpenseSubType.UnrealizedLoss,
        EExpenseAccountBehavior.UnrealizedLoss,
        false,
        unrealizedHeader[0].id
      )
    );
    mockAssetDisposalLossAccountService.createSubAccount.mockResolvedValue(
      makeExpenseAccount<IAssetDisposalLossAccount>(
        'Asset Disposal Loss (Default)',
        '512001',
        EExpenseSubType.LossOnAssetDisposal,
        EExpenseAccountBehavior.AssetDisposalLoss,
        false,
        disposalHeader[0].id
      )
    );
  });

  afterEach(() => jest.useRealTimers());

  it('creates headers in family order without posting accounts when not requested', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

    const { accounts, events, audits } = await bootstrapExpenseAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: false,
    });

    expect(accounts.map(({ name }) => name)).toEqual([
      'Direct Costs',
      'Rent and Utilities',
      'Bank Charge',
      'Finance Cost',
      'Interest',
      'Tax Expense',
      'Unrealized Loss',
      'Asset Disposal Loss',
    ]);
    expect(events).toHaveLength(8);
    expect(audits).toHaveLength(8);
    expect(mockDirectCostsAccountService.createHeader).toHaveBeenCalledWith(
      {
        name: 'Direct Costs',
        createdBy: accountingEntity.ownerId,
        accountingEntity,
        behavior: EExpenseAccountBehavior.DefaultDirectCost,
      },
      repoOptions
    );
    expect(
      mockAssetDisposalLossAccountService.createHeader
    ).toHaveBeenCalledWith(
      {
        name: 'Asset Disposal Loss',
        createdBy: accountingEntity.ownerId,
        accountingEntity,
      },
      repoOptions
    );
    expect(
      mockDirectCostsAccountService.createSubAccount
    ).not.toHaveBeenCalled();
  });

  it('creates and aggregates posting accounts in family order when requested', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

    const { accounts, events, audits } = await bootstrapExpenseAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: true,
    });

    expect(accounts).toHaveLength(16);
    expect(events).toHaveLength(16);
    expect(audits).toHaveLength(16);
    expect(accounts.slice(8).map(({ name }) => name)).toEqual([
      'Direct Costs (Default)',
      'Rent and Utilities (Default)',
      'Bank Charge (Default)',
      'Finance Cost (Default)',
      'Interest (Default)',
      'Tax Expense (Default)',
      'Unrealized Loss (Default)',
      'Asset Disposal Loss (Default)',
    ]);
    expect(mockDirectCostsAccountService.createSubAccount).toHaveBeenCalledWith(
      {
        name: 'Direct Costs (Default)',
        createdBy: accountingEntity.ownerId,
        accountingEntityId: accountingEntity.id,
        currency: SYSTEM_CURRENCIES.USD,
        behavior: EExpenseAccountBehavior.DefaultDirectCost,
        isControlAccount: false,
        controlAccountCode: EXPENSE_LEDGER_CODES.DIRECT_COSTS.HEADER,
      },
      repoOptions
    );
    expect(
      mockAssetDisposalLossAccountService.createSubAccount
    ).toHaveBeenCalledWith(
      {
        name: 'Asset Disposal Loss (Default)',
        createdBy: accountingEntity.ownerId,
        accountingEntityId: accountingEntity.id,
        currency: SYSTEM_CURRENCIES.USD,
        isControlAccount: false,
        controlAccountCode: EXPENSE_LEDGER_CODES.ASSET_DISPOSAL_LOSS.HEADER,
      },
      repoOptions
    );
  });

  it('uses existing headers as posting-account controls without recreating them', async () => {
    mockLedgerAccountRepo.findByCode.mockImplementation(
      async (code) =>
        ({
          id: generateUUID(),
          code,
          materializedPath: code,
        }) as IExpenseLedgerAccount
    );

    const { accounts, events, audits } = await bootstrapExpenseAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: true,
    });

    expect(accounts).toHaveLength(8);
    expect(events).toHaveLength(8);
    expect(audits).toHaveLength(8);
    for (const service of Object.values(services))
      expect(service.createHeader).not.toHaveBeenCalled();
    expect(mockBankChargeAccountService.createSubAccount).toHaveBeenCalledWith(
      expect.objectContaining({
        controlAccountCode: EXPENSE_LEDGER_CODES.BANK_CHARGE.HEADER,
      }),
      repoOptions
    );
  });
});
