import mockEventBus from '@shared/contracts/__mocks__/event-bus.mock';
import mockRepoService from '@shared/contracts/__mocks__/repo.mock';
import { ITransactionContext } from '@shared/types/repo.types';
import { TEntityId } from '@shared/types/uuid';

import accountingEntityError from '@domain/accounting/errors/accounting-entity.error';
import makeAccountingEntityService from '@domain/accounting/services/accounting-entity.service';
import { IAccountingEntityCreationResult } from '@domain/accounting/types/accounting-entity.service.types';
import {
  EAccountingEntityType,
  IAccountingEntity,
} from '@domain/accounting/types/accounting-entity.types';
import { EPeriodUnit } from '@domain/accounting/types/period.types';
import makeCashAccountService from '@domain/ledger/services/asset-account/cash-account.service';
import { EAppUsageModePreference } from '@domain/user/types/user-preferences.types';
import { IUser } from '@domain/user/types/user.types';

import { mockAccountingEntityService } from '@app/accounting/contracts/__mocks__/accounting.domain.services.mock';
import {
  mockAccountingContextRepo,
  mockAccountingEntityRepo,
  mockAccountingPeriodRepo,
  mockFiscalYearRepo,
  mockReportingContextRepo,
  mockReportingPeriodRepo,
} from '@app/accounting/contracts/__mocks__/accounting.repos.mock';
import { IAccountingEntityCreationDto } from '@app/accounting/dtos/accounting/accounting.dto';
import createAccountingEntityUseCase from '@app/accounting/usecases/create-accounting-entity.usecase';
import mockAppContext from '@app/context/contracts/__mocks__/app-context.mock';
import mockHeaderAccountsBootstrapService from '@app/ledger/contracts/__mocks__/header-accounts-bootstrap.service.mock';
import mockLedgerAccountPersistenceService from '@app/ledger/contracts/__mocks__/ledger-account-persistence.service.mock';
import { mockLedgerAccountRepo } from '@app/ledger/contracts/__mocks__/ledger.repos.mock';
import mockPostingAccountBootstrapService from '@app/ledger/contracts/__mocks__/posting-account-bootstrap.service.mock';
import mockSuspenseAccountBootstrapService from '@app/ledger/contracts/__mocks__/suspense-account-bootstrap.service.mock';

const mockAccountingDomainServices = Object.freeze({
  accountingEntity: mockAccountingEntityService,
});

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
  let accounting: IAccountingEntityCreationResult;
  let accountingEntity: IAccountingEntity;
  const cashAccountService = makeCashAccountService({
    ledgerAccountRepo: mockLedgerAccountRepo,
  });
  let mockAccount: Awaited<
    ReturnType<typeof cashAccountService.createHeader>
  >[0];
  let ledger: Awaited<
    ReturnType<typeof mockHeaderAccountsBootstrapService.bootstrap>
  >;
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
      headerAccountsBootstrapService: mockHeaderAccountsBootstrapService,
      postingAccountBootstrapService: mockPostingAccountBootstrapService,
      suspenseAccountBootstrapService: mockSuspenseAccountBootstrapService,
      eventBus: mockEventBus,
    });

  beforeEach(async () => {
    mockAccountingEntityRepo.findByUserId.mockResolvedValue([]);
    accounting = await makeAccountingEntityService({
      accountingEntityRepo: mockAccountingEntityRepo,
    }).create(
      {
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
      },
      { correlationId }
    );
    accountingEntity = accounting.accountingEntity[0];

    jest.clearAllMocks();
    const auditedAccount = await cashAccountService.createHeader(
      {
        name: 'Cash',
        accountingEntity,
        userId,
      },
      { correlationId }
    );
    [mockAccount] = auditedAccount;
    const mockAudit = auditedAccount[2];
    ledger = {
      entries: [{ account: mockAccount, audit: mockAudit }],
      events: [],
    };
    mockRepoService.runInTransaction
      .mockReset()
      .mockImplementation(async (transactionFn) =>
        transactionFn('mock-tx' as unknown as ITransactionContext)
      );
    mockAppContext.get.mockReturnValue({
      correlationId,
      user: { id: userId } as IUser,
    } as ReturnType<typeof mockAppContext.get>);
    mockAccountingDomainServices.accountingEntity.create.mockResolvedValue(
      accounting
    );
    mockHeaderAccountsBootstrapService.bootstrap.mockResolvedValue(ledger);
    mockPostingAccountBootstrapService.bootstrap.mockResolvedValue(ledger);
    mockSuspenseAccountBootstrapService.bootstrap.mockResolvedValue(ledger);
    mockEventBus.publish.mockResolvedValue();
  });

  it('validates the request before accessing dependencies', async () => {
    await expect(
      getUseCase()({ ...validPayload, name: 1 as unknown as string })
    ).rejects.toThrow();
    expect(mockAppContext.get).not.toHaveBeenCalled();
  });

  it('creates a private company through the existing workflow', async () => {
    const privateCompanyPayload = {
      ...validPayload,
      entityType: EAccountingEntityType.PrivateCompany,
    };
    const privateCompanyAccounting = await makeAccountingEntityService({
      accountingEntityRepo: mockAccountingEntityRepo,
    }).create(
      {
        name: privateCompanyPayload.name,
        type: privateCompanyPayload.entityType,
        ownerId: userId,
        functionalCurrencyCode: privateCompanyPayload.functionalCurrencyCode,
        reportingCurrencyCode: privateCompanyPayload.reportingCurrencyCode,
        jurisdictionCode: privateCompanyPayload.jurisdictionCode,
        accountingStandardCode: privateCompanyPayload.accountingStandardCode,
        fiscalYear: privateCompanyPayload.fiscalYear,
        accountingPeriod: privateCompanyPayload.accountingPeriod,
        reportingPeriod: privateCompanyPayload.reportingPeriod,
      },
      { correlationId }
    );
    const privateCompanyEntity = privateCompanyAccounting.accountingEntity[0];

    mockAccountingDomainServices.accountingEntity.create.mockResolvedValueOnce(
      privateCompanyAccounting
    );

    await expect(getUseCase()(privateCompanyPayload)).resolves.toBe(
      privateCompanyEntity
    );

    expect(
      mockAccountingDomainServices.accountingEntity.create
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        type: EAccountingEntityType.PrivateCompany,
        ownerId: userId,
      }),
      { correlationId }
    );
    expect(mockRepoService.runInTransaction).toHaveBeenCalledTimes(1);
    expect(mockHeaderAccountsBootstrapService.bootstrap).toHaveBeenCalledWith(
      privateCompanyEntity,
      { correlationId, tx: 'mock-tx' }
    );
    expect(mockAppContext.set).toHaveBeenCalledWith({
      accountingEntity: privateCompanyEntity,
    });
  });

  it('propagates the existing individual accounting entity error', async () => {
    mockAccountingDomainServices.accountingEntity.create.mockRejectedValueOnce(
      new accountingEntityError.OnlyOneIndividualAccountingEntityAllowed({
        ownerId: userId,
      })
    );

    await expect(getUseCase()(validPayload)).rejects.toThrow(
      'accounting_error_accounting_entity_only_one_individual_accounting_entity_allowed'
    );
    expect(mockRepoService.runInTransaction).not.toHaveBeenCalled();
  });

  it('orchestrates creation, bootstrap, and transactional persistence', async () => {
    await expect(getUseCase()(validPayload)).resolves.toBe(accountingEntity);

    expect(
      mockAccountingDomainServices.accountingEntity.create
    ).toHaveBeenCalledWith(expect.objectContaining({ ownerId: userId }), {
      correlationId,
    });
    expect(mockHeaderAccountsBootstrapService.bootstrap).toHaveBeenCalledWith(
      accountingEntity,
      { correlationId, tx: 'mock-tx' }
    );
    expect(mockPostingAccountBootstrapService.bootstrap).toHaveBeenCalledWith(
      accountingEntity,
      { correlationId, tx: 'mock-tx' }
    );
    expect(mockSuspenseAccountBootstrapService.bootstrap).toHaveBeenCalledWith(
      accountingEntity,
      { correlationId, tx: 'mock-tx' }
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
    expect(mockLedgerAccountPersistenceService.create).toHaveBeenCalledTimes(2);
    expect(
      mockLedgerAccountPersistenceService.create.mock.calls.every(
        ([, , options]) => options.history.length === 1
      )
    ).toBe(true);
    expect(mockAppContext.set).toHaveBeenCalledWith({ accountingEntity });
  });

  it('persists foundational accounts before posting and completes posting before suspense', async () => {
    await getUseCase()(validPayload);

    const headerPersistenceOrder =
      mockLedgerAccountPersistenceService.create.mock.invocationCallOrder[0];
    const postingOrder =
      mockPostingAccountBootstrapService.bootstrap.mock.invocationCallOrder[0];
    const suspenseOrder =
      mockSuspenseAccountBootstrapService.bootstrap.mock.invocationCallOrder[0];

    expect(headerPersistenceOrder).toBeLessThan(postingOrder);
    expect(postingOrder).toBeLessThan(suspenseOrder);
  });

  it('persists foundational accounts but skips posting and suspense defaults for power users', async () => {
    await getUseCase()({
      ...validPayload,
      appUsageMode: EAppUsageModePreference.PowerUser,
    });

    expect(mockHeaderAccountsBootstrapService.bootstrap).toHaveBeenCalled();
    expect(mockLedgerAccountPersistenceService.create).toHaveBeenCalledTimes(1);
    expect(mockPostingAccountBootstrapService.bootstrap).not.toHaveBeenCalled();
    expect(
      mockSuspenseAccountBootstrapService.bootstrap
    ).not.toHaveBeenCalled();
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

  it('does not update context or publish when ledger persistence fails', async () => {
    mockLedgerAccountPersistenceService.create.mockRejectedValueOnce(
      new Error('ledger persistence failed')
    );

    await expect(getUseCase()(validPayload)).rejects.toThrow(
      'ledger persistence failed'
    );
    expect(mockAppContext.set).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('aggregates ledger events from all three bootstrap capabilities', async () => {
    const makeLedgerEvent = (type: string) => ({
      type,
      data: mockAccount,
      occurredAt: new Date('2026-01-01T00:00:00.000Z'),
      enrichedAt: null,
    });
    mockHeaderAccountsBootstrapService.bootstrap.mockResolvedValueOnce({
      ...ledger,
      events: [makeLedgerEvent('header-created')],
    });
    mockPostingAccountBootstrapService.bootstrap.mockResolvedValue({
      ...ledger,
      events: [makeLedgerEvent('posting-created')],
    });
    mockSuspenseAccountBootstrapService.bootstrap.mockResolvedValueOnce({
      ...ledger,
      events: [makeLedgerEvent('suspense-created')],
    });

    await getUseCase()(validPayload);

    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ type: 'header-created', correlationId }),
        expect.objectContaining({ type: 'posting-created', correlationId }),
        expect.objectContaining({ type: 'suspense-created', correlationId }),
      ])
    );
  });

  it.each([
    ['header', mockHeaderAccountsBootstrapService.bootstrap],
    ['posting', mockPostingAccountBootstrapService.bootstrap],
    ['suspense', mockSuspenseAccountBootstrapService.bootstrap],
  ])(
    'does not update context or publish when %s bootstrap fails',
    async (_name, bootstrapMock) => {
      bootstrapMock.mockRejectedValueOnce(new Error('bootstrap failed'));

      await expect(getUseCase()(validPayload)).rejects.toThrow(
        'bootstrap failed'
      );
      expect(mockAppContext.set).not.toHaveBeenCalled();
      expect(mockEventBus.publish).not.toHaveBeenCalled();
    }
  );

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
});
