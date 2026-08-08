import { IReadRepoOptions } from '../../../../../shared/types/repo.types';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import { IAccountingEntity } from '../../../../accounting/types/accounting-entity.types';
import { SYSTEM_CURRENCIES } from '../../../../money/config/currencies.config';
import { REVENUE_LEDGER_CODES } from '../../../config/revenue-codes.config';
import ledgerAccountEntity from '../../../entities/ledger-account.entity';
import ILedgerAccountRepo from '../../../repos/ledger-account.repo';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
  ILedgerAccount,
} from '../../../types/ledger.types';
import {
  ERevenueAccountBehavior,
  ERevenueSubType,
} from '../../../types/revenue-account.types';
import makeGainOnAssetSaleAccountService from '../gain-on-sale.service';

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

describe('gainOnAssetSaleAccountService', () => {
  const service = makeGainOnAssetSaleAccountService({
    ledgerAccountRepo: mockLedgerAccountRepo,
  });
  const createdBy = generateUUID();
  const accountingEntity = {
    id: generateUUID(),
    ownerId: createdBy,
    functionalCurrencyCode: SYSTEM_CURRENCIES.USD.code,
  } as IAccountingEntity;
  const repoOptions: IReadRepoOptions = {
    correlationId: 'test-correlation-id',
  };

  const makeControlAccount = (
    behavior: string = ERevenueAccountBehavior.GainOnAssetSale,
    overrides: Partial<ILedgerAccount> = {}
  ) =>
    ledgerAccountEntity.make<ILedgerAccount>({
      name: 'Gain on Sale of Assets',
      code: REVENUE_LEDGER_CODES.GAIN_ON_ASSET_SALE.HEADER,
      materializedPath: REVENUE_LEDGER_CODES.GAIN_ON_ASSET_SALE.HEADER,
      accountingEntityId: accountingEntity.id,
      normalBalance: ENormalBalance.Credit,
      type: ELedgerType.Revenue,
      subType: ERevenueSubType.GainOnAssetSale,
      behavior,
      isControlAccount: true,
      controlAccountId: null,
      currency: SYSTEM_CURRENCIES.USD,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy,
      ...overrides,
    })[0];

  const subAccountPayload = {
    name: 'Consulting Revenue',
    createdBy,
    accountingEntityId: accountingEntity.id,
    isControlAccount: false,
    controlAccountCode: REVENUE_LEDGER_CODES.GAIN_ON_ASSET_SALE.HEADER,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-08T00:00:00.000Z'));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates a frozen gain-on-sale header when one does not exist', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(null);

    const [account, events, audit] = await service.createHeader(
      {
        name: 'Gain on Sale of Assets',
        createdBy,
        accountingEntity,
      },
      repoOptions
    );

    expect(mockLedgerAccountRepo.findByCode).toHaveBeenCalledWith(
      REVENUE_LEDGER_CODES.GAIN_ON_ASSET_SALE.HEADER,
      accountingEntity.id,
      repoOptions
    );
    expect(account).toMatchObject({
      name: 'Gain on Sale of Assets',
      code: REVENUE_LEDGER_CODES.GAIN_ON_ASSET_SALE.HEADER,
      materializedPath: REVENUE_LEDGER_CODES.GAIN_ON_ASSET_SALE.HEADER,
      accountingEntityId: accountingEntity.id,
      normalBalance: ENormalBalance.Credit,
      type: ELedgerType.Revenue,
      subType: ERevenueSubType.GainOnAssetSale,
      behavior: ERevenueAccountBehavior.GainOnAssetSale,
      isControlAccount: true,
      controlAccountId: null,
      currency: SYSTEM_CURRENCIES.USD,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy,
    });
    expect(Object.isFrozen(service)).toBe(true);
    expect(Object.isFrozen(account)).toBe(true);
    expect(events).toHaveLength(1);
    expect(audit.entityId).toBe(account.id);
  });

  it('rejects a duplicate gain-on-sale header', async () => {
    const existingHeader = makeControlAccount();
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(existingHeader);

    await expect(
      service.createHeader(
        {
          name: 'Gain on Sale of Assets',
          createdBy,
          accountingEntity,
        },
        repoOptions
      )
    ).rejects.toMatchObject({
      errorKey: 'ledger_error_header_account_already_exists',
      cause: { existingHeader },
    });
  });

  it('creates a sub-account under a gain-on-sale control account', async () => {
    const controlAccount = makeControlAccount();
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(controlAccount);
    mockLedgerAccountRepo.findLatestBySubType.mockResolvedValueOnce({
      id: generateUUID(),
      code: '405099',
      materializedPath: `${controlAccount.materializedPath}.405099`,
    });

    const [account, events, audit] = await service.createSubAccount(
      subAccountPayload,
      repoOptions
    );

    expect(mockLedgerAccountRepo.findByCode).toHaveBeenCalledWith(
      subAccountPayload.controlAccountCode,
      accountingEntity.id,
      repoOptions
    );
    expect(account).toMatchObject({
      name: subAccountPayload.name,
      code: '405100',
      materializedPath: `${controlAccount.materializedPath}.405100`,
      accountingEntityId: accountingEntity.id,
      normalBalance: ENormalBalance.Credit,
      type: ELedgerType.Revenue,
      subType: ERevenueSubType.GainOnAssetSale,
      behavior: ERevenueAccountBehavior.GainOnAssetSale,
      isControlAccount: false,
      controlAccountId: controlAccount.id,
      currency: null,
      meta: null,
      status: ELedgerAccountStatus.Active,
      contraAccountRule: EContraAccountRule.ContraNotPermitted,
      adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
      createdBy,
    });
    expect(Object.isFrozen(account)).toBe(true);
    expect(events).toHaveLength(1);
    expect(audit.entityId).toBe(account.id);
  });

  it('allocates the first sub-account code when no later account exists', async () => {
    const controlAccount = makeControlAccount();
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(controlAccount);
    mockLedgerAccountRepo.findLatestBySubType.mockResolvedValueOnce(null);

    const [account] = await service.createSubAccount(
      subAccountPayload,
      repoOptions
    );

    expect(account.code).toBe('405001');
    expect(account.materializedPath).toBe(
      `${controlAccount.materializedPath}.405001`
    );
  });

  it('rejects a missing control account', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(null);

    await expect(
      service.createSubAccount(subAccountPayload, repoOptions)
    ).rejects.toMatchObject({
      errorKey: 'ledger_error_asset_account_control_account_not_found',
    });
    expect(mockLedgerAccountRepo.findLatestBySubType).not.toHaveBeenCalled();
  });

  it.each([
    { label: 'type', overrides: { type: ELedgerType.Asset } },
    {
      label: 'subtype',
      overrides: { subType: ERevenueSubType.Grants },
    },
    { label: 'control status', overrides: { isControlAccount: false } },
    {
      label: 'behavior',
      overrides: { behavior: ERevenueAccountBehavior.Grants },
    },
  ])(
    'rejects a control account with an invalid $label',
    async ({ overrides }) => {
      mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(
        makeControlAccount(ERevenueAccountBehavior.GainOnAssetSale, overrides)
      );

      await expect(
        service.createSubAccount(subAccountPayload, repoOptions)
      ).rejects.toMatchObject({
        errorKey: 'ledger_error_asset_account_invalid_control_account',
      });
      expect(mockLedgerAccountRepo.findLatestBySubType).not.toHaveBeenCalled();
    }
  );
});
