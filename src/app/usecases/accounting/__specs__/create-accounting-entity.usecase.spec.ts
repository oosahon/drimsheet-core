import {
  EAccountingEntityType,
  IAccountingEntity,
} from '../../../../domain/accounting/types/accounting-entity.types';
import { EPeriodUnit } from '../../../../domain/accounting/types/period.types';
import { EAppUsageModePreference } from '../../../../domain/user/types/user-preferences.types';
import { IUser } from '../../../../domain/user/types/user.types';
import { TEntityId } from '../../../../shared/types/uuid';
import { IAccountingEntityOnboardingDto } from '../../../contracts/dto/accounting.dto';
import createAccountingEntityUseCase from '../create-accounting-entity.usecase';

import mockEventBus from '../../../../infra/messaging/__mock__/event-bus.mock';
import mockAccountingContextRepo from '../../../../infra/persistence/repos/__mocks__/accounting-context.repo.impl.mock';
import mockAccountingEntityRepo from '../../../../infra/persistence/repos/__mocks__/accounting-entity.repo.impl.mock';
import mockAccountingPeriodRepo from '../../../../infra/persistence/repos/__mocks__/accounting-period.repo.impl.mock';
import mockFiscalYearRepo from '../../../../infra/persistence/repos/__mocks__/fiscal-year.repo.impl.mock';
import mockLedgerAccountRepo from '../../../../infra/persistence/repos/__mocks__/ledger-account.repo.impl.mock';
import mockReportingContextRepo from '../../../../infra/persistence/repos/__mocks__/reporting-context.repo.impl.mock';
import mockReportingPeriodRepo from '../../../../infra/persistence/repos/__mocks__/reporting-period.repo.impl.mock';
import mockDomainServices from '../../../../infra/services/__mocks__/domain.service.mock';
import mockRepoService from '../../../../infra/services/__mocks__/repo.service.mock';
import mockRequestContext from '../../../contracts/app/__mocks__/request-context.mock';

describe('createAccountingEntityUseCase', () => {
  const correlationId = 'test-corr-id';
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;

  const {
    assetAccount: mockAssetAccountService,
    liabilityAccount: mockLiabilityAccountService,
    equityAccount: mockEquityAccountService,
    revenueAccount: mockRevenueAccountService,
    expenseAccount: mockExpenseAccountService,
  } = mockDomainServices;

  const getUseCase = () =>
    createAccountingEntityUseCase(
      mockRequestContext,
      mockRepoService,
      mockAccountingEntityRepo,
      mockFiscalYearRepo,
      mockAccountingPeriodRepo,
      mockAccountingContextRepo,
      mockReportingPeriodRepo,
      mockReportingContextRepo,
      mockLedgerAccountRepo,
      mockEventBus,
      mockAssetAccountService,
      mockLiabilityAccountService,
      mockEquityAccountService,
      mockRevenueAccountService,
      mockExpenseAccountService
    );

  const validPayload: IAccountingEntityOnboardingDto = {
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

    mockRequestContext.get.mockReturnValue({
      correlationId,
      user: { id: mockUserId } as unknown as IUser,
      idempotencyKey: 'mock-idempotency-key',
      clientSession: {
        setRefreshToken: jest.fn(),
        getRefreshToken: jest.fn(),
        clearRefreshToken: jest.fn(),
      },
    } as unknown as ReturnType<typeof mockRequestContext.get>);

    mockAccountingEntityRepo.findByUserId.mockResolvedValue([]);

    mockAssetAccountService.bootstrapHeaderAccounts.mockResolvedValue({
      accounts: [],
      events: [],
    });
    mockLiabilityAccountService.bootstrapHeaderAccounts.mockResolvedValue({
      accounts: [],
      events: [],
    });
    mockEquityAccountService.bootstrapHeaderAccounts.mockResolvedValue({
      accounts: [],
      events: [],
    });
    mockRevenueAccountService.bootstrapHeaderAccounts.mockResolvedValue({
      accounts: [],
      events: [],
    });
    mockExpenseAccountService.bootstrapHeaderAccounts.mockResolvedValue({
      accounts: [],
      events: [],
    });
  });

  it('throws ErrorBadRequest for unsupported entity type', async () => {
    const useCase = getUseCase();
    const payload = {
      ...validPayload,
      entityType: EAccountingEntityType.PrivateCompany,
    };

    await expect(useCase(payload)).rejects.toThrow(
      'Unsupported accounting entity type'
    );
  });

  it('throws ErrorConflict if accounting entity already exists', async () => {
    mockAccountingEntityRepo.findByUserId.mockResolvedValue([
      { id: 'existing-id' },
    ] as unknown as IAccountingEntity[]);
    const useCase = getUseCase();

    await expect(useCase(validPayload)).rejects.toThrow(
      'Accounting entity already exists'
    );
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
    expect(mockAccountingEntityRepo.save).toHaveBeenCalled();
    expect(mockFiscalYearRepo.save).toHaveBeenCalled();
    expect(mockAccountingPeriodRepo.save).toHaveBeenCalled();
    expect(mockAccountingContextRepo.save).toHaveBeenCalled();
    expect(mockReportingPeriodRepo.save).toHaveBeenCalled();
    expect(mockReportingContextRepo.save).toHaveBeenCalled();
    expect(mockLedgerAccountRepo.save).toHaveBeenCalled();

    expect(mockEventBus.publish).toHaveBeenCalled();
  });

  it('successfully creates accounting entity when fiscal year is in the future', async () => {
    const useCase = getUseCase();

    const futurePayload: IAccountingEntityOnboardingDto = {
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
    expect(mockAccountingEntityRepo.save).toHaveBeenCalled();
  });
});
