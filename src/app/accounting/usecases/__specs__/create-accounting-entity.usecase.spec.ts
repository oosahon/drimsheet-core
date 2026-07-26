import mockAccountingContextRepo from '../../../../domain/accounting/repos/__mocks__/accounting-context.repo.impl.mock';
import mockAccountingEntityRepo from '../../../../domain/accounting/repos/__mocks__/accounting-entity.repo.impl.mock';
import mockAccountingPeriodRepo from '../../../../domain/accounting/repos/__mocks__/accounting-period.repo.impl.mock';
import mockFiscalYearRepo from '../../../../domain/accounting/repos/__mocks__/fiscal-year.repo.impl.mock';
import mockReportingContextRepo from '../../../../domain/accounting/repos/__mocks__/reporting-context.repo.impl.mock';
import mockReportingPeriodRepo from '../../../../domain/accounting/repos/__mocks__/reporting-period.repo.impl.mock';
import {
  EAccountingEntityType,
  IAccountingEntity,
} from '../../../../domain/accounting/types/accounting-entity.types';
import { EPeriodUnit } from '../../../../domain/accounting/types/period.types';
import cashAndEquivalentAccountEntity from '../../../../domain/ledger/asset-account/entities/cash-and-equivalents.entity';
import mockAssetAccountService from '../../../../domain/ledger/asset-account/services/__mocks__/asset-account.service.mock';
import mockEquityAccountService from '../../../../domain/ledger/equity-account/services/__mocks__/equity-account.service.mock';
import mockExpenseAccountService from '../../../../domain/ledger/expense-account/services/__mocks__/expense-account.service.mock';
import mockLiabilityAccountService from '../../../../domain/ledger/liability-account/services/__mocks__/liability-account.service.mock';
import mockRevenueAccountService from '../../../../domain/ledger/revenue-account/services/__mocks__/revenue-account.service.mock';
import mockLedgerAccountPersistenceService from '../../../../domain/ledger/shared/services/__mocks__/ledger-account-persistence.service.mock';
import { ILedgerAccount } from '../../../../domain/ledger/shared/types/ledger.types';
import { SYSTEM_CURRENCIES } from '../../../../domain/money/config/currencies.config';
import { EAppUsageModePreference } from '../../../../domain/user/types/user-preferences.types';
import { IUser } from '../../../../domain/user/types/user.types';
import mockEventBus from '../../../../shared/contracts/__mocks__/event-bus.contract.mock';
import mockRepoService from '../../../../shared/contracts/__mocks__/repo.contract.mock';
import mockReporter from '../../../../shared/contracts/__mocks__/reporter.contract.mock';
import { IEntityDelta } from '../../../../shared/history/types/history.types';
import { TEntityId } from '../../../../shared/types/uuid';
import generateUUID from '../../../../shared/utils/uuid-generator';
import mockAppContext from '../../../_internal/contracts/__mocks__/app-context.contract.mock';
import { IAccountingEntityCreationDto } from '../../dtos/accounting/accounting.dto';
import createAccountingEntityUseCase from '../create-accounting-entity.usecase';

describe('createAccountingEntityUseCase', () => {
  const correlationId = 'test-corr-id';
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;

  const getUseCase = () =>
    createAccountingEntityUseCase({
      appContext: mockAppContext,
      repoService: mockRepoService,
      accountingEntityRepo: mockAccountingEntityRepo,
      fiscalYearRepo: mockFiscalYearRepo,
      accountingPeriodRepo: mockAccountingPeriodRepo,
      accountingContextRepo: mockAccountingContextRepo,
      reportingPeriodRepo: mockReportingPeriodRepo,
      reportingContextRepo: mockReportingContextRepo,
      ledgerAccountPersistenceService: mockLedgerAccountPersistenceService,
      eventBus: mockEventBus,
      reporter: mockReporter,
      assetAccountService: mockAssetAccountService,
      liabilityAccountService: mockLiabilityAccountService,
      equityAccountService: mockEquityAccountService,
      revenueAccountService: mockRevenueAccountService,
      expenseAccountService: mockExpenseAccountService,
    });

  const validPayload: IAccountingEntityCreationDto = {
    name: 'Test Business',
    entityType: EAccountingEntityType.Individual,
    accountingStandardCode: 'US_GAAP',
    functionalCurrencyCode: 'USD',
    reportingCurrencyCode: 'USD',
    jurisdictionCode: 'US',
    appUsageMode: EAppUsageModePreference.NonPowerUser,
    fiscalYear: {
      startDate: new Date('2026-01-01T00:00:00.000Z'),
      endDate: new Date('2026-12-31T23:59:59.999Z'),
    },
    accountingPeriod: {
      unit: EPeriodUnit.Month,
      count: 1,
    },
    reportingPeriod: {
      unit: EPeriodUnit.Quarter,
      count: 1,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockAppContext.get.mockReturnValue({
      correlationId,
      user: { id: mockUserId } as unknown as IUser,
      idempotencyKey: 'mock-idempotency-key',
      clientSession: {
        setRefreshToken: jest.fn(),
        getRefreshToken: jest.fn(),
        clearRefreshToken: jest.fn(),
      },
    } as unknown as ReturnType<typeof mockAppContext.get>);

    mockAccountingEntityRepo.findByUserId.mockResolvedValue([]);

    const [mockAccount, , mockAccountAudit] =
      cashAndEquivalentAccountEntity.makeHeader({
        name: 'Cash',
        accountingEntityId: generateUUID(),
        currency: SYSTEM_CURRENCIES.USD,
        createdBy: mockUserId,
      });

    mockAssetAccountService.bootstrapHeaderAccounts.mockResolvedValue({
      accounts: [mockAccount],
      events: [],
      audits: [mockAccountAudit],
    });
    mockLiabilityAccountService.bootstrapHeaderAccounts.mockResolvedValue({
      accounts: [],
      events: [],
      audits: [],
    });
    mockEquityAccountService.bootstrapHeaderAccounts.mockResolvedValue({
      accounts: [],
      events: [],
      audits: [],
    });
    mockRevenueAccountService.bootstrapHeaderAccounts.mockResolvedValue({
      accounts: [],
      events: [],
      audits: [],
    });
    mockExpenseAccountService.bootstrapHeaderAccounts.mockResolvedValue({
      accounts: [],
      events: [],
      audits: [],
    });
    mockEventBus.publish.mockResolvedValue();
  });

  it('throws ErrorBadRequest for unsupported entity type', async () => {
    const useCase = getUseCase();
    const payload = {
      ...validPayload,
      entityType: EAccountingEntityType.PrivateCompany,
    };

    await expect(useCase(payload)).rejects.toThrow('app_error_bad_request');
  });

  it('throws ErrorConflict if accounting entity already exists', async () => {
    mockAccountingEntityRepo.findByUserId.mockResolvedValue([
      { id: 'existing-id' },
    ] as unknown as IAccountingEntity[]);
    const useCase = getUseCase();

    await expect(useCase(validPayload)).rejects.toThrow('app_error_conflict');
  });

  it('successfully creates accounting entity and related domain objects', async () => {
    const useCase = getUseCase();

    await useCase(validPayload);

    expect(mockAccountingEntityRepo.findByUserId).toHaveBeenCalledWith(
      mockUserId,
      { correlationId },
      EAccountingEntityType.Individual
    );

    expect(mockRepoService.runInTransaction).toHaveBeenCalled();
    expect(mockAccountingEntityRepo.create).toHaveBeenCalled();
    expect(mockFiscalYearRepo.create).toHaveBeenCalled();
    expect(mockAccountingPeriodRepo.create).toHaveBeenCalled();
    expect(mockAccountingContextRepo.create).toHaveBeenCalled();
    expect(mockReportingPeriodRepo.create).toHaveBeenCalled();
    expect(mockReportingContextRepo.create).toHaveBeenCalled();
    expect(mockLedgerAccountPersistenceService.create).toHaveBeenCalled();

    expect(mockEventBus.publish).toHaveBeenCalled();
  });

  it('successfully creates accounting entity when fiscal year is in the future', async () => {
    const useCase = getUseCase();

    const futurePayload: IAccountingEntityCreationDto = {
      ...validPayload,
      fiscalYear: {
        startDate: new Date('2030-01-01T00:00:00.000Z'),
        endDate: new Date('2030-12-31T23:59:59.999Z'),
      },
    };

    await useCase(futurePayload);

    expect(mockAccountingEntityRepo.findByUserId).toHaveBeenCalledWith(
      mockUserId,
      { correlationId },
      EAccountingEntityType.Individual
    );

    expect(mockRepoService.runInTransaction).toHaveBeenCalled();
    expect(mockAccountingEntityRepo.create).toHaveBeenCalled();
  });

  it('successfully creates accounting entity in PowerUser mode (shouldBootstrapPostingAccounts is false)', async () => {
    const useCase = getUseCase();

    const powerUserPayload: IAccountingEntityCreationDto = {
      ...validPayload,
      appUsageMode: EAppUsageModePreference.PowerUser,
    };

    await useCase(powerUserPayload);

    expect(mockRepoService.runInTransaction).toHaveBeenCalled();
    expect(mockAccountingEntityRepo.create).toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalled();
    expect(
      mockAssetAccountService.bootstrapHeaderAccounts
    ).toHaveBeenCalledWith(expect.any(Object), { correlationId }, false);
    expect(
      mockLiabilityAccountService.bootstrapHeaderAccounts
    ).toHaveBeenCalledWith(expect.any(Object), { correlationId }, false);
    expect(
      mockEquityAccountService.bootstrapHeaderAccounts
    ).toHaveBeenCalledWith(expect.any(Object), { correlationId });
  });

  it('maps ledger account audits into history entries when account services return non-empty audits', async () => {
    const [mockAccount] = cashAndEquivalentAccountEntity.makeHeader({
      name: 'Cash',
      accountingEntityId: generateUUID(),
      currency: SYSTEM_CURRENCIES.USD,
      createdBy: mockUserId,
    });

    const mockAudit = {
      entityId: mockAccount.id,
      action: 'created',
      diff: {
        before: null,
        after: mockAccount,
      },
      occurredAt: new Date(),
    } as unknown as IEntityDelta<ILedgerAccount>;

    mockAssetAccountService.bootstrapHeaderAccounts.mockResolvedValue({
      accounts: [mockAccount],
      events: [],
      audits: [mockAudit],
    });

    const useCase = getUseCase();

    await useCase(validPayload);

    const ledgerCreateCall =
      mockLedgerAccountPersistenceService.create.mock.calls[0];
    const options = ledgerCreateCall[2];
    const histories = options.history as unknown[];

    expect(histories).toHaveLength(1);
    expect(histories[0]).toMatchObject({
      action: 'created',
      actor: {
        type: 'user',
        userId: mockUserId,
      },
      correlationId,
    });
  });

  it('persists exactly one matching history for each ledger account', async () => {
    const [secondAccount, , secondAudit] =
      cashAndEquivalentAccountEntity.makeHeader({
        name: 'Bank',
        accountingEntityId: generateUUID(),
        currency: SYSTEM_CURRENCIES.USD,
        createdBy: mockUserId,
      });
    const [firstAccount, , firstAudit] =
      cashAndEquivalentAccountEntity.makeHeader({
        name: 'Cash',
        accountingEntityId: generateUUID(),
        currency: SYSTEM_CURRENCIES.USD,
        createdBy: mockUserId,
      });

    mockAssetAccountService.bootstrapHeaderAccounts.mockResolvedValue({
      accounts: [firstAccount, secondAccount],
      events: [],
      audits: [firstAudit, secondAudit],
    });

    await getUseCase()(validPayload);

    expect(mockLedgerAccountPersistenceService.create).toHaveBeenCalledTimes(2);
    for (const [account, , options] of mockLedgerAccountPersistenceService
      .create.mock.calls) {
      expect(options.history).toHaveLength(1);
      expect(options.history[0].entityId).toBe(account.id);
      expect(options).toMatchObject({ correlationId, tx: 'mock-tx' });
    }
  });

  it('rejects inconsistent ledger bootstrap output before persistence', async () => {
    const [, , orphanAudit] = cashAndEquivalentAccountEntity.makeHeader({
      name: 'Orphan account audit',
      accountingEntityId: generateUUID(),
      currency: SYSTEM_CURRENCIES.USD,
      createdBy: mockUserId,
    });

    mockAssetAccountService.bootstrapHeaderAccounts.mockResolvedValue({
      accounts: [],
      events: [],
      audits: [orphanAudit],
    });

    await expect(getUseCase()(validPayload)).rejects.toThrow(
      'app_error_internal_server_error'
    );
    expect(mockRepoService.runInTransaction).not.toHaveBeenCalled();
  });

  it('does not update context or publish events when persistence fails', async () => {
    mockAccountingEntityRepo.create.mockRejectedValueOnce(
      new Error('database failure')
    );

    await expect(getUseCase()(validPayload)).rejects.toThrow(
      'database failure'
    );

    expect(mockAppContext.set).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('updates context after commit and awaits successful event publication', async () => {
    let resolvePublication: (() => void) | undefined;
    mockEventBus.publish.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolvePublication = resolve;
      })
    );

    const resultPromise = getUseCase()(validPayload);
    await new Promise(process.nextTick);

    expect(mockAppContext.set).toHaveBeenCalledWith({
      accountingEntity: expect.any(Object),
    });

    let settled = false;
    void resultPromise.then(() => {
      settled = true;
    });
    await new Promise(process.nextTick);
    expect(settled).toBe(false);

    resolvePublication?.();
    await expect(resultPromise).resolves.toMatchObject({
      ownerId: mockUserId,
      type: EAccountingEntityType.Individual,
    });
    expect(
      mockRepoService.runInTransaction.mock.invocationCallOrder[0]
    ).toBeLessThan(mockAppContext.set.mock.invocationCallOrder[0]);
    expect(mockAppContext.set.mock.invocationCallOrder[0]).toBeLessThan(
      mockEventBus.publish.mock.invocationCallOrder[0]
    );
  });

  it('reports event publication failures and still returns the committed entity', async () => {
    const publicationError = new Error('event bus unavailable');
    mockEventBus.publish.mockRejectedValueOnce(publicationError);

    await expect(getUseCase()(validPayload)).resolves.toMatchObject({
      ownerId: mockUserId,
    });

    expect(mockReporter.report).toHaveBeenCalledWith(
      publicationError,
      expect.objectContaining({
        correlationId,
        accountingEntityId: expect.any(String),
        eventTypes: expect.arrayContaining([
          expect.stringMatching(/accounting:entity/i),
        ]),
      })
    );
  });

  it('throws InternalServerError when bootstrapped ledger accounts and history mapping keys do not match', async () => {
    const [mockAccount] = cashAndEquivalentAccountEntity.makeHeader({
      name: 'Cash',
      accountingEntityId: generateUUID(),
      currency: SYSTEM_CURRENCIES.USD,
      createdBy: mockUserId,
    });

    const mismatchedAudit = {
      entityId: generateUUID(),
      action: 'created',
      diff: {
        before: null,
        after: mockAccount,
      },
      occurredAt: new Date(),
    } as unknown as IEntityDelta<ILedgerAccount>;

    mockAssetAccountService.bootstrapHeaderAccounts.mockResolvedValue({
      accounts: [mockAccount],
      events: [],
      audits: [mismatchedAudit],
    });

    await expect(getUseCase()(validPayload)).rejects.toThrow(
      'app_error_internal_server_error'
    );
  });
});
