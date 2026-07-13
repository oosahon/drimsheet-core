import {
  EAccountingEntityType,
  IAccountingEntity,
} from '../../../../domain/accounting/types/accounting-entity.types';
import { EPeriodUnit } from '../../../../domain/accounting/types/period.types';
import { ILedgerAccount } from '../../../../domain/ledger/shared/types/ledger.types';
import { EAppUsageModePreference } from '../../../../domain/user/types/user-preferences.types';
import { IUser } from '../../../../domain/user/types/user.types';
import { TEntityId } from '../../../../shared/types/uuid';
import { IAccountingEntityCreationDto } from '../../dtos/accounting/accounting.dto';
import createAccountingEntityUseCase from '../create-accounting-entity.usecase';

import mockAccountingContextRepo from '../../../../domain/accounting/repos/__mocks__/accounting-context.repo.impl.mock';
import mockAccountingEntityRepo from '../../../../domain/accounting/repos/__mocks__/accounting-entity.repo.impl.mock';
import mockAccountingPeriodRepo from '../../../../domain/accounting/repos/__mocks__/accounting-period.repo.impl.mock';
import mockFiscalYearRepo from '../../../../domain/accounting/repos/__mocks__/fiscal-year.repo.impl.mock';
import mockReportingContextRepo from '../../../../domain/accounting/repos/__mocks__/reporting-context.repo.impl.mock';
import mockReportingPeriodRepo from '../../../../domain/accounting/repos/__mocks__/reporting-period.repo.impl.mock';
import mockLedgerDomainServices from '../../../../domain/ledger/services/__mocks__/ledger.service.mock';
import mockLedgerAccountRepo from '../../../../domain/ledger/shared/repos/__mocks__/ledger-account.repo.impl.mock';
import mockAppContext from '../../../../shared/contracts/__mocks__/app-context.contract.mock';
import mockEventBus from '../../../../shared/contracts/__mocks__/event-bus.contract.mock';
import mockRepoService from '../../../../shared/contracts/__mocks__/repo.contract.mock';
import { IEntityDelta } from '../../../../shared/history/types/history.types';
import generateUUID from '../../../../shared/utils/uuid-generator';

describe('createAccountingEntityUseCase', () => {
  const correlationId = 'test-corr-id';
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;

  const {
    assetAccount: mockAssetAccountService,
    liabilityAccount: mockLiabilityAccountService,
    equityAccount: mockEquityAccountService,
    revenueAccount: mockRevenueAccountService,
    expenseAccount: mockExpenseAccountService,
  } = mockLedgerDomainServices;

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
      ledgerAccountRepo: mockLedgerAccountRepo,
      eventBus: mockEventBus,
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

    mockAssetAccountService.bootstrapHeaderAccounts.mockResolvedValue({
      accounts: [],
      events: [],
      audits: [],
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
    expect(mockLedgerAccountRepo.create).toHaveBeenCalled();

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
  });

  it('maps ledger account audits into history entries when account services return non-empty audits', async () => {
    const mockAudit = {
      entityId: generateUUID(),
      action: 'created',
      diff: {
        before: null,
        after: { id: generateUUID(), name: 'Cash Account' },
      },
      occurredAt: new Date(),
    } as unknown as IEntityDelta<ILedgerAccount>;

    mockAssetAccountService.bootstrapHeaderAccounts.mockResolvedValue({
      accounts: [],
      events: [],
      audits: [mockAudit],
    });

    const useCase = getUseCase();

    await useCase(validPayload);

    const ledgerCreateCall = mockLedgerAccountRepo.create.mock.calls[0];
    const options = ledgerCreateCall[1];
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
});
