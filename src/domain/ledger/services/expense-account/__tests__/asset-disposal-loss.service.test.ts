import { IReadRepoOptions } from '../../../../../shared/types/repo.types';
import generateUUID from '../../../../../shared/utils/uuid-generator';
import { IAccountingEntity } from '../../../../accounting/types/accounting-entity.types';
import { SYSTEM_CURRENCIES } from '../../../../money/config/currencies.config';
import { EXPENSE_LEDGER_CODES } from '../../../config/expense-codes.config';
import ledgerAccountEntity from '../../../entities/ledger-account.entity';
import ILedgerAccountRepo from '../../../repos/ledger-account.repo';
import {
  EExpenseAccountBehavior,
  EExpenseSubType,
} from '../../../types/expense-account.types';
import {
  EAdjunctAccountRule,
  EContraAccountRule,
  ELedgerAccountStatus,
  ELedgerType,
  ENormalBalance,
  ILedgerAccount,
} from '../../../types/ledger.types';
import makeAssetDisposalService from '../asset-disposal-loss.service';

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

describe('assetDisposalLossAccountService', () => {
  const service = makeAssetDisposalService({
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
    behavior: string = EExpenseAccountBehavior.AssetDisposalLoss,
    overrides: Partial<ILedgerAccount> = {}
  ) =>
    ledgerAccountEntity.make<ILedgerAccount>({
      name: 'Asset Disposal Loss',
      code: EXPENSE_LEDGER_CODES.ASSET_DISPOSAL_LOSS.HEADER,
      materializedPath: EXPENSE_LEDGER_CODES.ASSET_DISPOSAL_LOSS.HEADER,
      accountingEntityId: accountingEntity.id,
      normalBalance: ENormalBalance.Debit,
      type: ELedgerType.Expense,
      subType: EExpenseSubType.LossOnAssetDisposal,
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
    name: 'Loss on Vehicle Disposal',
    createdBy,
    accountingEntityId: accountingEntity.id,
    currency: SYSTEM_CURRENCIES.USD,
    isControlAccount: false,
    controlAccountCode: EXPENSE_LEDGER_CODES.ASSET_DISPOSAL_LOSS.HEADER,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-08-08T00:00:00.000Z'));
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates a frozen asset-disposal-loss header when one does not exist', async () => {
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(null);

    const [account, events, audit] = await service.createHeader(
      {
        name: 'Asset Disposal Loss',
        createdBy,
        accountingEntity,
      },
      repoOptions
    );

    expect(mockLedgerAccountRepo.findByCode).toHaveBeenCalledWith(
      EXPENSE_LEDGER_CODES.ASSET_DISPOSAL_LOSS.HEADER,
      accountingEntity.id,
      repoOptions
    );
    expect(account).toMatchObject({
      name: 'Asset Disposal Loss',
      code: EXPENSE_LEDGER_CODES.ASSET_DISPOSAL_LOSS.HEADER,
      materializedPath: EXPENSE_LEDGER_CODES.ASSET_DISPOSAL_LOSS.HEADER,
      accountingEntityId: accountingEntity.id,
      normalBalance: ENormalBalance.Debit,
      type: ELedgerType.Expense,
      subType: EExpenseSubType.LossOnAssetDisposal,
      behavior: EExpenseAccountBehavior.AssetDisposalLoss,
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

  it('rejects a duplicate asset-disposal-loss header', async () => {
    const existingHeader = makeControlAccount();
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(existingHeader);

    await expect(
      service.createHeader(
        {
          name: 'Asset Disposal Loss',
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

  it.each([
    EExpenseAccountBehavior.AssetDisposalLoss,
    EExpenseAccountBehavior.Default,
  ])(
    'creates a sub-account under a %s control account',
    async (controlAccountBehavior) => {
      const controlAccount = makeControlAccount(controlAccountBehavior);
      mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(controlAccount);
      mockLedgerAccountRepo.findLatestBySubType.mockResolvedValueOnce({
        id: generateUUID(),
        code: '512099',
        materializedPath: `${controlAccount.materializedPath}.512099`,
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
        code: '512100',
        materializedPath: `${controlAccount.materializedPath}.512100`,
        accountingEntityId: accountingEntity.id,
        normalBalance: ENormalBalance.Debit,
        type: ELedgerType.Expense,
        subType: EExpenseSubType.LossOnAssetDisposal,
        behavior: EExpenseAccountBehavior.AssetDisposalLoss,
        isControlAccount: false,
        controlAccountId: controlAccount.id,
        currency: SYSTEM_CURRENCIES.USD,
        meta: null,
        status: ELedgerAccountStatus.Active,
        contraAccountRule: EContraAccountRule.ContraNotPermitted,
        adjunctAccountRule: EAdjunctAccountRule.AdjunctNotPermitted,
        createdBy,
      });
      expect(Object.isFrozen(account)).toBe(true);
      expect(events).toHaveLength(1);
      expect(audit.entityId).toBe(account.id);
    }
  );

  it('allocates the first sub-account code when no later account exists', async () => {
    const controlAccount = makeControlAccount();
    mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(controlAccount);
    mockLedgerAccountRepo.findLatestBySubType.mockResolvedValueOnce(null);

    const [account] = await service.createSubAccount(
      subAccountPayload,
      repoOptions
    );

    expect(account.code).toBe('512001');
    expect(account.materializedPath).toBe(
      `${controlAccount.materializedPath}.512001`
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
      overrides: { subType: EExpenseSubType.UnrealizedLoss },
    },
    { label: 'control status', overrides: { isControlAccount: false } },
    {
      label: 'behavior',
      overrides: { behavior: EExpenseAccountBehavior.UnrealizedLoss },
    },
  ])(
    'rejects a control account with an invalid $label',
    async ({ overrides }) => {
      mockLedgerAccountRepo.findByCode.mockResolvedValueOnce(
        makeControlAccount(EExpenseAccountBehavior.AssetDisposalLoss, overrides)
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
