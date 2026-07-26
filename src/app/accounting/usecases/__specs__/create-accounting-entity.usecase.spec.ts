import mockAccountingContextRepo from '../../../../domain/accounting/repos/__mocks__/accounting-context.repo.impl.mock';
import mockAccountingEntityRepo from '../../../../domain/accounting/repos/__mocks__/accounting-entity.repo.impl.mock';
import mockAccountingPeriodRepo from '../../../../domain/accounting/repos/__mocks__/accounting-period.repo.impl.mock';
import mockFiscalYearRepo from '../../../../domain/accounting/repos/__mocks__/fiscal-year.repo.impl.mock';
import mockReportingContextRepo from '../../../../domain/accounting/repos/__mocks__/reporting-context.repo.impl.mock';
import mockReportingPeriodRepo from '../../../../domain/accounting/repos/__mocks__/reporting-period.repo.impl.mock';
import mockAccountingDomainServices from '../../../../domain/accounting/services/__mocks__/accounting.service.mock';
import makeAccountingEntityService from '../../../../domain/accounting/services/accounting-entity.service';
import {
  EAccountingEntityType,
  IAccountingEntity,
} from '../../../../domain/accounting/types/accounting-entity.types';
import { EPeriodUnit } from '../../../../domain/accounting/types/period.types';
import cashAndEquivalentAccountEntity from '../../../../domain/ledger/asset-account/entities/cash-and-equivalents.entity';
import mockLedgerAccountPersistenceService from '../../../../domain/ledger/shared/services/__mocks__/ledger-account-persistence.service.mock';
import { SYSTEM_CURRENCIES } from '../../../../domain/money/config/currencies.config';
import { EAppUsageModePreference } from '../../../../domain/user/types/user-preferences.types';
import { IUser } from '../../../../domain/user/types/user.types';
import mockEventBus from '../../../../shared/contracts/__mocks__/event-bus.contract.mock';
import mockRepoService from '../../../../shared/contracts/__mocks__/repo.contract.mock';
import mockReporter from '../../../../shared/contracts/__mocks__/reporter.contract.mock';
import { TEntityId } from '../../../../shared/types/uuid';
import mockAppContext from '../../../_internal/contracts/__mocks__/app-context.contract.mock';
import mockAccountsBootstrapService from '../../../ledger/contracts/__mocks__/accounts-bootstrap.service.contract.mock';
import { IAccountingEntityCreationDto } from '../../dtos/accounting/accounting.dto';
import createAccountingEntityUseCase from '../create-accounting-entity.usecase';

describe('createAccountingEntityUseCase', () => {
  const correlationId = 'test-corr-id';
  const userId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
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
    accountingPeriod: { unit: EPeriodUnit.Month, count: 1 },
    reportingPeriod: { unit: EPeriodUnit.Quarter, count: 1 },
  };
  const accounting = makeAccountingEntityService().create({
    name: validPayload.name,
    type: validPayload.entityType,
    ownerId: userId,
    functionalCurrencyCode: validPayload.functionalCurrencyCode,
    reportingCurrencyCode: validPayload.reportingCurrencyCode,
    jurisdictionCode: validPayload.jurisdictionCode,
    accountingStandardCode: validPayload.accountingStandardCode,
    fiscalYear: validPayload.fiscalYear,
    accountingPeriod: validPayload.accountingPeriod,
    reportingPeriod: validPayload.reportingPeriod,
  });
  const accountingEntity = accounting.accountingEntity[0];
  const [mockAccount, , mockAudit] = cashAndEquivalentAccountEntity.makeHeader({
    name: 'Cash',
    accountingEntityId: accountingEntity.id,
    currency: SYSTEM_CURRENCIES.USD,
    createdBy: userId,
  });
  const ledger = {
    entries: [{ account: mockAccount, audit: mockAudit }],
    events: [],
  };
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
      accountingEntityService: mockAccountingDomainServices.accountingEntity,
      accountsBootstrapService: mockAccountsBootstrapService,
      eventBus: mockEventBus,
      reporter: mockReporter,
    });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAppContext.get.mockReturnValue({
      correlationId,
      user: { id: userId } as IUser,
    } as ReturnType<typeof mockAppContext.get>);
    mockAccountingEntityRepo.findByUserId.mockResolvedValue([]);
    mockAccountingDomainServices.accountingEntity.create.mockReturnValue(
      accounting
    );
    mockAccountsBootstrapService.bootstrap.mockResolvedValue(ledger);
    mockEventBus.publish.mockResolvedValue();
  });

  it('validates the request before accessing dependencies', async () => {
    await expect(
      getUseCase()({ ...validPayload, name: 1 as unknown as string })
    ).rejects.toThrow();
    expect(mockAppContext.get).not.toHaveBeenCalled();
  });

  it('rejects unsupported entity types before duplicate detection', async () => {
    await expect(
      getUseCase()({
        ...validPayload,
        entityType: EAccountingEntityType.PrivateCompany,
      })
    ).rejects.toThrow('app_error_bad_request');
    expect(mockAccountingEntityRepo.findByUserId).not.toHaveBeenCalled();
  });

  it('rejects an existing accounting entity', async () => {
    mockAccountingEntityRepo.findByUserId.mockResolvedValue([
      accountingEntity,
    ] as IAccountingEntity[]);

    await expect(getUseCase()(validPayload)).rejects.toThrow(
      'app_error_conflict'
    );
    expect(
      mockAccountingDomainServices.accountingEntity.create
    ).not.toHaveBeenCalled();
  });

  it('orchestrates creation, bootstrap, and transactional persistence', async () => {
    await expect(getUseCase()(validPayload)).resolves.toBe(accountingEntity);

    expect(
      mockAccountingDomainServices.accountingEntity.create
    ).toHaveBeenCalled();
    expect(mockAccountsBootstrapService.bootstrap).toHaveBeenCalledWith(
      accountingEntity,
      { correlationId },
      true
    );
    expect(mockRepoService.runInTransaction).toHaveBeenCalledTimes(1);
    expect(mockAccountingEntityRepo.create).toHaveBeenCalled();
    expect(mockFiscalYearRepo.create).toHaveBeenCalled();
    expect(mockAccountingPeriodRepo.create).toHaveBeenCalled();
    expect(mockAccountingContextRepo.create).toHaveBeenCalled();
    expect(mockReportingPeriodRepo.create).toHaveBeenCalled();
    expect(mockReportingContextRepo.create).toHaveBeenCalled();
    expect(mockLedgerAccountPersistenceService.create).toHaveBeenCalledWith(
      mockAccount,
      accountingEntity.functionalCurrencyCode,
      expect.objectContaining({
        correlationId,
        history: [expect.any(Object)],
      })
    );
    expect(mockAppContext.set).toHaveBeenCalledWith({ accountingEntity });
  });

  it('does not update context or publish when persistence fails', async () => {
    mockAccountingEntityRepo.create.mockRejectedValueOnce(
      new Error('persistence failed')
    );

    await expect(getUseCase()(validPayload)).rejects.toThrow(
      'persistence failed'
    );
    expect(mockAppContext.set).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('awaits publication after the transaction and context update', async () => {
    let resolvePublication: (() => void) | undefined;
    mockEventBus.publish.mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolvePublication = resolve;
      })
    );

    const result = getUseCase()(validPayload);
    await new Promise(process.nextTick);
    expect(mockAppContext.set).toHaveBeenCalled();

    let settled = false;
    void result.then(() => {
      settled = true;
    });
    await new Promise(process.nextTick);
    expect(settled).toBe(false);

    resolvePublication?.();
    await expect(result).resolves.toBe(accountingEntity);
    expect(
      mockRepoService.runInTransaction.mock.invocationCallOrder[0]
    ).toBeLessThan(mockAppContext.set.mock.invocationCallOrder[0]);
    expect(mockAppContext.set.mock.invocationCallOrder[0]).toBeLessThan(
      mockEventBus.publish.mock.invocationCallOrder[0]
    );
  });

  it('reports publication failures and returns the committed entity', async () => {
    const error = new Error('event bus unavailable');
    mockEventBus.publish.mockRejectedValueOnce(error);

    await expect(getUseCase()(validPayload)).resolves.toBe(accountingEntity);
    expect(mockReporter.report).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        correlationId,
        accountingEntityId: accountingEntity.id,
        eventTypes: expect.arrayContaining([
          expect.stringMatching(/accounting:entity/i),
        ]),
      })
    );
  });
});
