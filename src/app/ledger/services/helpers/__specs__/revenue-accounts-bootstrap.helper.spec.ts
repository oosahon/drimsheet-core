import { TCreationOmits } from '@shared/types/creation-omits.types';
import { IReadRepoOptions } from '@shared/types/repo.types';
import generateUUID from '@shared/utils/uuid-generator';

import { IAccountingEntity } from '@domain/accounting/types/accounting-entity.types';
import ledgerAccountEntity from '@domain/ledger/entities/ledger-account.entity';
import { TRevenueLedgerCode } from '@domain/ledger/types/ledger-code.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
} from '@domain/ledger/types/ledger.types';
import {
  ERevenueAccountBehavior,
  ERevenueSubType,
  IEmploymentIncomeAccount,
  IGainOnAssetSaleAccount,
  IGiftsAccount,
  IGrantsAccount,
  IRevenueLedgerAccount,
  IServicesAccount,
  IUnrealizedGainAccount,
  URevenueAccountBehavior,
  URevenueSubType,
} from '@domain/ledger/types/revenue-account.types';
import { SYSTEM_CURRENCIES } from '@domain/money/config/currencies.config';

import {
  mockEmploymentIncomeAccountService,
  mockGainOnAssetSaleAccountService,
  mockGiftsAccountService,
  mockGrantsAccountService,
  mockServicesAccountService,
  mockUnrealizedGainAccountService,
} from '@app/ledger/contracts/__mocks__/ledger.domain.services.mock';
import { mockLedgerAccountRepo } from '@app/ledger/contracts/__mocks__/ledger.repos.mock';
import makeRevenueAccountsBootstrapHelper from '@app/ledger/services/helpers/revenue-accounts-bootstrap.helper';

describe('revenueAccountsBootstrapHelper', () => {
  const services = {
    servicesAccountService: mockServicesAccountService,
    employmentIncomeAccountService: mockEmploymentIncomeAccountService,
    gainOnAssetSaleAccountService: mockGainOnAssetSaleAccountService,
    unrealizedGainAccountService: mockUnrealizedGainAccountService,
    grantsAccountService: mockGrantsAccountService,
    giftsAccountService: mockGiftsAccountService,
  };
  const bootstrapRevenueAccounts = makeRevenueAccountsBootstrapHelper({
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

  const makeRevenueAccount = <Account extends IRevenueLedgerAccount>(
    name: string,
    code: TRevenueLedgerCode,
    subType: URevenueSubType,
    behavior: URevenueAccountBehavior,
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
      normalBalance: ENormalBalance.Credit,
      type: ELedgerType.Revenue,
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

  let headerAccounts: IRevenueLedgerAccount[];

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-03-15T00:00:00.000Z'));
    jest.clearAllMocks();

    const servicesHeader = makeRevenueAccount<IServicesAccount>(
      'Services',
      '401000',
      ERevenueSubType.Services,
      ERevenueAccountBehavior.Services,
      true,
      null
    );
    const employmentIncomeHeader = makeRevenueAccount<IEmploymentIncomeAccount>(
      'Employment Income',
      '403000',
      ERevenueSubType.EmploymentIncome,
      ERevenueAccountBehavior.EmploymentIncome,
      true,
      null
    );
    const gainOnAssetSaleHeader = makeRevenueAccount<IGainOnAssetSaleAccount>(
      'Gain on Sale of Assets',
      '405000',
      ERevenueSubType.GainOnAssetSale,
      ERevenueAccountBehavior.GainOnAssetSale,
      true,
      null
    );
    const unrealizedGainHeader = makeRevenueAccount<IUnrealizedGainAccount>(
      'Unrealized Gain',
      '406000',
      ERevenueSubType.UnrealizedGains,
      ERevenueAccountBehavior.UnrealizedGains,
      true,
      null
    );
    const grantsHeader = makeRevenueAccount<IGrantsAccount>(
      'Grants',
      '407000',
      ERevenueSubType.Grants,
      ERevenueAccountBehavior.Grants,
      true,
      null
    );
    const giftsHeader = makeRevenueAccount<IGiftsAccount>(
      'Gifts',
      '408000',
      ERevenueSubType.Gifts,
      ERevenueAccountBehavior.Gifts,
      true,
      null
    );

    headerAccounts = [
      servicesHeader[0],
      employmentIncomeHeader[0],
      gainOnAssetSaleHeader[0],
      unrealizedGainHeader[0],
      grantsHeader[0],
      giftsHeader[0],
    ];

    const servicesPosting = makeRevenueAccount<IServicesAccount>(
      'Services (Default)',
      '401001',
      ERevenueSubType.Services,
      ERevenueAccountBehavior.Services,
      false,
      servicesHeader[0].id
    );
    const employmentIncomePosting =
      makeRevenueAccount<IEmploymentIncomeAccount>(
        'Employment Income (Default)',
        '403001',
        ERevenueSubType.EmploymentIncome,
        ERevenueAccountBehavior.EmploymentIncome,
        false,
        employmentIncomeHeader[0].id
      );
    const gainOnAssetSalePosting = makeRevenueAccount<IGainOnAssetSaleAccount>(
      'Gain on Sale of Assets (Default)',
      '405001',
      ERevenueSubType.GainOnAssetSale,
      ERevenueAccountBehavior.GainOnAssetSale,
      false,
      gainOnAssetSaleHeader[0].id
    );
    const unrealizedGainPosting = makeRevenueAccount<IUnrealizedGainAccount>(
      'Unrealized Gains (Default)',
      '406001',
      ERevenueSubType.UnrealizedGains,
      ERevenueAccountBehavior.UnrealizedGains,
      false,
      unrealizedGainHeader[0].id
    );
    const grantsPosting = makeRevenueAccount<IGrantsAccount>(
      'Grants (Default)',
      '407001',
      ERevenueSubType.Grants,
      ERevenueAccountBehavior.Grants,
      false,
      grantsHeader[0].id
    );
    const giftsPosting = makeRevenueAccount<IGiftsAccount>(
      'Gifts (Default)',
      '408001',
      ERevenueSubType.Gifts,
      ERevenueAccountBehavior.Gifts,
      false,
      giftsHeader[0].id
    );

    mockServicesAccountService.createHeader.mockResolvedValue(servicesHeader);
    mockEmploymentIncomeAccountService.createHeader.mockResolvedValue(
      employmentIncomeHeader
    );
    mockGainOnAssetSaleAccountService.createHeader.mockResolvedValue(
      gainOnAssetSaleHeader
    );
    mockUnrealizedGainAccountService.createHeader.mockResolvedValue(
      unrealizedGainHeader
    );
    mockGrantsAccountService.createHeader.mockResolvedValue(grantsHeader);
    mockGiftsAccountService.createHeader.mockResolvedValue(giftsHeader);
    mockServicesAccountService.createSubAccount.mockResolvedValue(
      servicesPosting
    );
    mockEmploymentIncomeAccountService.createSubAccount.mockResolvedValue(
      employmentIncomePosting
    );
    mockGainOnAssetSaleAccountService.createSubAccount.mockResolvedValue(
      gainOnAssetSalePosting
    );
    mockUnrealizedGainAccountService.createSubAccount.mockResolvedValue(
      unrealizedGainPosting
    );
    mockGrantsAccountService.createSubAccount.mockResolvedValue(grantsPosting);
    mockGiftsAccountService.createSubAccount.mockResolvedValue(giftsPosting);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates all headers in order without posting accounts when not requested', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

    const { accounts, events, audits } = await bootstrapRevenueAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: false,
    });

    expect(accounts.map(({ name }) => name)).toEqual([
      'Services',
      'Employment Income',
      'Gain on Sale of Assets',
      'Unrealized Gain',
      'Grants',
      'Gifts',
    ]);
    expect(events).toHaveLength(6);
    expect(audits).toHaveLength(6);
    expect(mockServicesAccountService.createHeader).toHaveBeenCalledWith(
      {
        name: 'Services',
        createdBy: accountingEntity.ownerId,
        accountingEntity,
      },
      repoOptions
    );
    expect(
      mockEmploymentIncomeAccountService.createHeader
    ).toHaveBeenCalledWith(
      {
        name: 'Employment Income',
        createdBy: accountingEntity.ownerId,
        accountingEntity,
      },
      repoOptions
    );
    expect(mockGainOnAssetSaleAccountService.createHeader).toHaveBeenCalledWith(
      {
        name: 'Gain on Sale of Assets',
        createdBy: accountingEntity.ownerId,
        accountingEntity,
      },
      repoOptions
    );
    expect(mockUnrealizedGainAccountService.createHeader).toHaveBeenCalledWith(
      {
        name: 'Unrealized Gain',
        createdBy: accountingEntity.ownerId,
        accountingEntity,
      },
      repoOptions
    );
    expect(mockGrantsAccountService.createHeader).toHaveBeenCalledWith(
      {
        name: 'Grants',
        createdBy: accountingEntity.ownerId,
        accountingEntity,
      },
      repoOptions
    );
    expect(mockGiftsAccountService.createHeader).toHaveBeenCalledWith(
      {
        name: 'Gifts',
        createdBy: accountingEntity.ownerId,
        accountingEntity,
      },
      repoOptions
    );
    expect(mockServicesAccountService.createSubAccount).not.toHaveBeenCalled();
  });

  it('creates posting accounts through the six services in fixed order', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValue(null);

    const { accounts } = await bootstrapRevenueAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: true,
    });

    expect(accounts.map(({ name }) => name)).toEqual([
      ...headerAccounts.map(({ name }) => name),
      'Services (Default)',
      'Employment Income (Default)',
      'Gain on Sale of Assets (Default)',
      'Unrealized Gains (Default)',
      'Grants (Default)',
      'Gifts (Default)',
    ]);
    const basePayload = {
      createdBy: accountingEntity.ownerId,
      accountingEntityId: accountingEntity.id,
      isControlAccount: false,
    };
    expect(mockServicesAccountService.createSubAccount).toHaveBeenCalledWith(
      {
        ...basePayload,
        name: 'Services (Default)',
        controlAccountCode: '401000',
      },
      repoOptions
    );
    expect(
      mockEmploymentIncomeAccountService.createSubAccount
    ).toHaveBeenCalledWith(
      {
        ...basePayload,
        name: 'Employment Income (Default)',
        controlAccountCode: '403000',
      },
      repoOptions
    );
    expect(
      mockGainOnAssetSaleAccountService.createSubAccount
    ).toHaveBeenCalledWith(
      {
        ...basePayload,
        name: 'Gain on Sale of Assets (Default)',
        controlAccountCode: '405000',
      },
      repoOptions
    );
    expect(
      mockUnrealizedGainAccountService.createSubAccount
    ).toHaveBeenCalledWith(
      {
        ...basePayload,
        name: 'Unrealized Gains (Default)',
        controlAccountCode: '406000',
      },
      repoOptions
    );
    expect(mockGrantsAccountService.createSubAccount).toHaveBeenCalledWith(
      {
        ...basePayload,
        name: 'Grants (Default)',
        controlAccountCode: '407000',
      },
      repoOptions
    );
    expect(mockGiftsAccountService.createSubAccount).toHaveBeenCalledWith(
      {
        ...basePayload,
        name: 'Gifts (Default)',
        controlAccountCode: '408000',
      },
      repoOptions
    );
    expect(
      mockServicesAccountService.createSubAccount.mock.invocationCallOrder[0]
    ).toBeLessThan(
      mockEmploymentIncomeAccountService.createSubAccount.mock
        .invocationCallOrder[0]
    );
    expect(
      mockGrantsAccountService.createSubAccount.mock.invocationCallOrder[0]
    ).toBeLessThan(
      mockGiftsAccountService.createSubAccount.mock.invocationCallOrder[0]
    );
  });

  it('skips existing headers and returns no new accounts', async () => {
    mockLedgerAccountRepo.findByCode.mockImplementation(async (code) => {
      return headerAccounts.find((account) => account.code === code) ?? null;
    });

    const { accounts, events, audits } = await bootstrapRevenueAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: false,
    });

    expect(accounts).toHaveLength(0);
    expect(events).toHaveLength(0);
    expect(audits).toHaveLength(0);
    expect(mockServicesAccountService.createHeader).not.toHaveBeenCalled();
    expect(mockGiftsAccountService.createHeader).not.toHaveBeenCalled();
  });

  it('reuses existing headers when creating posting accounts', async () => {
    mockLedgerAccountRepo.findByCode.mockImplementation(async (code) => {
      return headerAccounts.find((account) => account.code === code) ?? null;
    });

    const { accounts } = await bootstrapRevenueAccounts({
      accountingEntity,
      repoOptions,
      shouldBootstrapPostingAccounts: true,
    });

    expect(accounts).toHaveLength(6);
    expect(mockServicesAccountService.createSubAccount).toHaveBeenCalledWith(
      expect.objectContaining({ controlAccountCode: '401000' }),
      repoOptions
    );
    expect(mockGiftsAccountService.createSubAccount).toHaveBeenCalledWith(
      expect.objectContaining({ controlAccountCode: '408000' }),
      repoOptions
    );
  });
});
