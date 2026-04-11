import { TEntityId } from '../../../../shared/types/uuid';
import {
  ErrorBadRequest,
  ErrorResourceNotFound,
  ErrorUnauthorized,
  ErrorUnprocessableEntity,
} from '../../../../shared/value-objects/error';
import {
  EAccountingEntityType,
  IAccountingEntity,
} from '../../../../domain/accounting-entity/types/accounting-entity.types';
import {
  EAppUsageModePreference,
  IUserPreferences,
} from '../../../../domain/user/types/user-preferences.types';
import { ILedgerAccount } from '../../../../domain/ledger/types/ledger.types';
import { IEvent } from '../../../../shared/types/event.types';
import { IRepoService } from '../../../contracts/infra/repo.contract';
import MockRequestContext from '../../../contracts/app/__mocks__/request-context.mock';
import { mockAccountingEntityRepo } from '../../../../infra/persistence/repos/__mocks__/accounting-entity.repo.impl.mock';
import { MockUserPreferencesRepo } from '../../../../infra/persistence/repos/__mocks__/user-preferences.repo.impl.mock';
import mockLedgerAccountRepo from '../../../../infra/persistence/repos/__mocks__/ledger-account.repo.impl.mock';
import mockRepoService from '../../../../infra/services/__mocks__/repo.service.mock';
import mockEventBus from '../../../../infra/messaging/__mock__/event-bus.mock';
import accountingEntityService from '../../../../domain/accounting-entity/services/accounting-entity.service';
import userPreferencesService from '../../../../domain/user/services/user-preferences.service';
import ledgerService from '../../../../domain/ledger/services/ledger.service';
import onboardAccountingEntityUseCase from '../onboard-accounting-entity.usecase';
import accountingEntityEvents from '../../../../domain/accounting-entity/events/accounting-entity.events';
import { IRequestContextData } from '../../../contracts/app/request-context.contract';
import { IUser } from '../../../../domain/user/types/user.types';

jest.mock(
  '../../../../domain/accounting-entity/services/accounting-entity.service'
);
jest.mock('../../../../domain/user/services/user-preferences.service');
jest.mock('../../../../domain/ledger/services/ledger.service');

const mockAccountingEntityService =
  accountingEntityService as jest.MockedFunction<
    typeof accountingEntityService
  >;
const mockUserPreferencesService =
  userPreferencesService as jest.MockedFunction<typeof userPreferencesService>;
const mockLedgerService = ledgerService as jest.MockedFunction<
  typeof ledgerService
>;

describe('onboardAccountingEntityUseCase', () => {
  const mockAccountingEntityMake = jest.fn();
  const mockLedgerServiceSetup = jest.fn();
  const mockUserPreferencesUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockAccountingEntityService.mockReturnValue({
      make: mockAccountingEntityMake,
    } as any);

    mockLedgerService.mockReturnValue({
      setupBaseIndividualAccounts: mockLedgerServiceSetup,
      bootstrapNonPowerUserPostingAccounts: jest.fn(),
    } as any);

    mockUserPreferencesService.mockReturnValue({
      update: mockUserPreferencesUpdate,
    } as any);
  });

  const validPayload = {
    name: 'Test Entity',
    operatingCountryCode: 'US',
    entityType: EAccountingEntityType.Individual,
    functionalCurrencyCode: 'USD',
    reportingCurrencyCode: 'USD',
    fiscalYearStart: { month: 1, day: 1 },
    appUsageMode: EAppUsageModePreference.NonPowerUser,
  } as const;

  it('should successfully onboard accounting entity for non-power user', async () => {
    const correlationId = 'test-corr-id';
    const mockUser = { id: 'user-id' as TEntityId } as unknown as IUser;

    MockRequestContext.get.mockReturnValue({
      correlationId,
      user: mockUser,
    } as unknown as IRequestContextData);

    const mockAccountingEntity = {
      id: 'entity-1',
      type: EAccountingEntityType.Individual,
    } as IAccountingEntity;
    const mockEntityEvent = {
      type: 'entity.created',
      data: mockAccountingEntity,
      occurredAt: new Date(),
    } as unknown as IEvent<IAccountingEntity>;

    const mockAccount = { id: 'account-1' } as unknown as ILedgerAccount;
    const mockLedgerEvent = {
      type: 'ledger.event',
      data: mockAccount,
      occurredAt: new Date(),
    } as unknown as IEvent<ILedgerAccount>;

    const mockPreferences = { id: 'pref-1' } as unknown as IUserPreferences;
    const mockPrefEvent = {
      type: 'pref.event',
      data: mockPreferences,
      occurredAt: new Date(),
    } as unknown as IEvent<IUserPreferences>;

    mockAccountingEntityMake.mockResolvedValue([
      mockAccountingEntity,
      [mockEntityEvent],
    ]);
    mockLedgerServiceSetup.mockResolvedValue([
      [mockAccount, [mockLedgerEvent]],
    ]);
    mockUserPreferencesUpdate.mockResolvedValue([
      mockPreferences,
      [mockPrefEvent],
    ]);

    const usecase = onboardAccountingEntityUseCase(
      MockRequestContext,
      mockAccountingEntityRepo,
      MockUserPreferencesRepo,
      mockLedgerAccountRepo,
      mockRepoService,
      mockEventBus
    );

    await usecase(validPayload);

    const correlationIdObj = { correlationId };

    expect(mockAccountingEntityMake).toHaveBeenCalledWith(
      mockUser.id,
      expect.objectContaining({
        name: validPayload.name,
        operatingCountryCode: validPayload.operatingCountryCode,
        type: validPayload.entityType,
        ownerId: mockUser.id,
        fiscalYearStart: validPayload.fiscalYearStart,
      }),
      correlationIdObj
    );

    expect(mockLedgerServiceSetup).toHaveBeenCalledWith(
      mockAccountingEntity,
      correlationIdObj
    );

    expect(mockUserPreferencesUpdate).toHaveBeenCalledWith(
      mockUser.id,
      {
        appPreferences: {
          appUsageMode: validPayload.appUsageMode,
        },
      },
      correlationIdObj
    );

    expect(mockRepoService.runInTransaction).toHaveBeenCalledTimes(1);

    const transactionCallback =
      mockRepoService.runInTransaction.mock.calls[0][0];
    await transactionCallback('mock-tx' as any);

    expect(mockAccountingEntityRepo.save).toHaveBeenCalledWith(
      mockAccountingEntity,
      { tx: 'mock-tx', correlationId }
    );
    expect(mockLedgerAccountRepo.save).toHaveBeenCalledWith([mockAccount], {
      tx: 'mock-tx',
      correlationId,
    });
    expect(MockUserPreferencesRepo.save).toHaveBeenCalledWith(mockPreferences, {
      tx: 'mock-tx',
      correlationId,
    });

    const bootstrapEvent =
      accountingEntityEvents.bootstrapIndividualPostingAccounts(
        mockAccountingEntity
      );

    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ type: 'entity.created', correlationId }),
        expect.objectContaining({ type: 'ledger.event', correlationId }),
        expect.objectContaining({ type: 'pref.event', correlationId }),
      ])
    );

    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: bootstrapEvent.type })
    );
  });

  it('should not publish bootstrap event for power user', async () => {
    const correlationId = 'test-corr-id';
    const mockUser = { id: 'user-id' as TEntityId } as unknown as IUser;

    MockRequestContext.get.mockReturnValue({
      correlationId,
      user: mockUser,
    } as unknown as IRequestContextData);

    const mockAccountingEntity = {
      id: 'entity-1',
      type: EAccountingEntityType.Individual,
    } as IAccountingEntity;

    mockAccountingEntityMake.mockResolvedValue([mockAccountingEntity, []]);
    mockLedgerServiceSetup.mockResolvedValue([]);
    mockUserPreferencesUpdate.mockResolvedValue([{} as IUserPreferences, []]);

    const usecase = onboardAccountingEntityUseCase(
      MockRequestContext,
      mockAccountingEntityRepo,
      MockUserPreferencesRepo,
      mockLedgerAccountRepo,
      mockRepoService,
      mockEventBus
    );

    await usecase({
      ...validPayload,
      appUsageMode: EAppUsageModePreference.PowerUser,
    });

    expect(mockEventBus.publish).toHaveBeenCalledTimes(1);
    expect(mockEventBus.publish).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: accountingEntityEvents.bootstrapIndividualPostingAccounts(
          mockAccountingEntity
        ).type,
      })
    );
  });

  it('should throw ErrorUnauthorized if no user in context', async () => {
    MockRequestContext.get.mockReturnValue({
      correlationId: 'test-corr-id',
    } as unknown as IRequestContextData);

    const usecase = onboardAccountingEntityUseCase(
      MockRequestContext,
      mockAccountingEntityRepo,
      MockUserPreferencesRepo,
      mockLedgerAccountRepo,
      mockRepoService,
      mockEventBus
    );

    await expect(usecase(validPayload)).rejects.toThrow(ErrorUnauthorized);
  });

  it('should throw ErrorBadRequest if entity type is not supported', async () => {
    MockRequestContext.get.mockReturnValue({
      correlationId: 'test-corr-id',
      user: { id: 'user-id' as TEntityId } as unknown as IUser,
    } as unknown as IRequestContextData);

    const usecase = onboardAccountingEntityUseCase(
      MockRequestContext,
      mockAccountingEntityRepo,
      MockUserPreferencesRepo,
      mockLedgerAccountRepo,
      mockRepoService,
      mockEventBus
    );

    await expect(
      usecase({
        ...validPayload,
        entityType: EAccountingEntityType.Company as any,
      })
    ).rejects.toThrow(ErrorUnprocessableEntity);
  });

  it('should throw ErrorResourceNotFound if functional currency code is invalid', async () => {
    MockRequestContext.get.mockReturnValue({
      correlationId: 'test-corr-id',
      user: { id: 'user-id' as TEntityId } as unknown as IUser,
    } as unknown as IRequestContextData);

    const usecase = onboardAccountingEntityUseCase(
      MockRequestContext,
      mockAccountingEntityRepo,
      MockUserPreferencesRepo,
      mockLedgerAccountRepo,
      mockRepoService,
      mockEventBus
    );

    await expect(
      usecase({
        ...validPayload,
        functionalCurrencyCode: 'ZZZ',
      })
    ).rejects.toThrow(ErrorResourceNotFound);
  });

  it('should throw Zod validation error if operating country code is unsupported', async () => {
    const usecase = onboardAccountingEntityUseCase(
      MockRequestContext,
      mockAccountingEntityRepo,
      MockUserPreferencesRepo,
      mockLedgerAccountRepo,
      mockRepoService,
      mockEventBus
    );

    await expect(
      usecase({
        ...validPayload,
        operatingCountryCode: 'UNKNOWN' as any,
      })
    ).rejects.toThrow(ErrorUnprocessableEntity);
  });
});
