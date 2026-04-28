import accountingEntityEvents from '../../../../domain/accounting-entity/events/accounting-entity.events';
import {
  EAccountingEntityType,
  IAccountingEntity,
} from '../../../../domain/accounting-entity/types/accounting-entity.types';
import {
  EAppUsageModePreference,
  IUserPreferences,
} from '../../../../domain/user/types/user-preferences.types';
import { IUser } from '../../../../domain/user/types/user.types';
import mockEventBus from '../../../../infra/messaging/__mock__/event-bus.mock';
import mockAccountingEntityRepo from '../../../../infra/persistence/repos/__mocks__/accounting-entity.repo.impl.mock';
import mockLedgerAccountRepo from '../../../../infra/persistence/repos/__mocks__/ledger-account.repo.impl.mock';
import mockUserPreferencesRepo from '../../../../infra/persistence/repos/__mocks__/user-preferences.repo.impl.mock';
import mockDomainServices from '../../../../infra/services/__mocks__/domain.service.mock';
import mockRepoService from '../../../../infra/services/__mocks__/repo.service.mock';
import { IEvent } from '../../../../shared/types/event.types';
import { TEntityId } from '../../../../shared/types/uuid';
import {
  ErrorResourceNotFound,
  ErrorUnauthorized,
  ErrorUnprocessableEntity,
} from '../../../../shared/value-objects/error';
import MockRequestContext from '../../../contracts/app/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../contracts/app/request-context.contract';
import makeOnboardAccountingEntityUseCase from '../onboard-accounting-entity.usecase';

describe('makeOnboardAccountingEntityUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockAccountingEntityRepo.findByUserId.mockResolvedValue([]);
    mockUserPreferencesRepo.findById.mockResolvedValue(null);
    mockDomainServices.userPreferences.update.mockResolvedValue([
      { id: 'mock-pref-id' } as unknown as IUserPreferences,
      [{ type: 'mock-event' } as unknown as IEvent<IUserPreferences>],
    ]);
    mockRepoService.runInTransaction.mockImplementation(async (cb) => {
      await cb('mock-tx' as never);
    });
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
    const mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174000' as TEntityId,
    } as unknown as IUser;

    MockRequestContext.get.mockReturnValue({
      correlationId,
      user: mockUser,
    } as unknown as IRequestContextData);

    const usecase = makeOnboardAccountingEntityUseCase(
      MockRequestContext,
      mockAccountingEntityRepo,
      mockUserPreferencesRepo,
      mockLedgerAccountRepo,
      mockDomainServices.userPreferences,
      mockRepoService,
      mockEventBus
    );

    await usecase(validPayload);

    expect(mockRepoService.runInTransaction).toHaveBeenCalledTimes(1);

    expect(mockAccountingEntityRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: validPayload.name,
        operatingCountryCode: validPayload.operatingCountryCode,
        type: validPayload.entityType,
        ownerId: mockUser.id,
      }),
      { tx: 'mock-tx', correlationId }
    );

    expect(mockLedgerAccountRepo.save).toHaveBeenCalledWith(expect.any(Array), {
      tx: 'mock-tx',
      correlationId,
    });

    expect(mockDomainServices.userPreferences.update).toHaveBeenCalledWith(
      mockUser.id,
      expect.objectContaining({
        appPreferences: expect.objectContaining({
          appUsageMode: validPayload.appUsageMode,
        }),
      }),
      expect.objectContaining({ correlationId })
    );

    expect(mockUserPreferencesRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'mock-pref-id' }),
      {
        tx: 'mock-tx',
        correlationId,
      }
    );

    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ correlationId })])
    );

    expect(mockEventBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        type: accountingEntityEvents.bootstrapIndividualPostingAccounts(
          {} as unknown as IAccountingEntity
        ).type,
      })
    );
  });

  it('should not publish bootstrap event for power user', async () => {
    const correlationId = 'test-corr-id';
    const mockUser = {
      id: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
    } as unknown as IUser;

    MockRequestContext.get.mockReturnValue({
      correlationId,
      user: mockUser,
    } as unknown as IRequestContextData);

    const usecase = makeOnboardAccountingEntityUseCase(
      MockRequestContext,
      mockAccountingEntityRepo,
      mockUserPreferencesRepo,
      mockLedgerAccountRepo,
      mockDomainServices.userPreferences,
      mockRepoService,
      mockEventBus
    );

    await usecase({
      ...validPayload,
      appUsageMode: EAppUsageModePreference.PowerUser,
    });

    expect(mockEventBus.publish).toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalledWith(
      expect.objectContaining({
        type: accountingEntityEvents.bootstrapIndividualPostingAccounts(
          {} as unknown as IAccountingEntity
        ).type,
      })
    );
  });

  it('should throw ErrorUnauthorized if no user in context', async () => {
    MockRequestContext.get.mockReturnValue({
      correlationId: 'test-corr-id',
    } as unknown as IRequestContextData);

    const usecase = makeOnboardAccountingEntityUseCase(
      MockRequestContext,
      mockAccountingEntityRepo,
      mockUserPreferencesRepo,
      mockLedgerAccountRepo,
      mockDomainServices.userPreferences,
      mockRepoService,
      mockEventBus
    );

    await expect(usecase(validPayload)).rejects.toThrow(ErrorUnauthorized);
  });

  it('should throw ErrorUnprocessableEntity if entity type is not supported', async () => {
    MockRequestContext.get.mockReturnValue({
      correlationId: 'test-corr-id',
      user: {
        id: '123e4567-e89b-12d3-a456-426614174002' as TEntityId,
      } as unknown as IUser,
    } as unknown as IRequestContextData);

    const usecase = makeOnboardAccountingEntityUseCase(
      MockRequestContext,
      mockAccountingEntityRepo,
      mockUserPreferencesRepo,
      mockLedgerAccountRepo,
      mockDomainServices.userPreferences,
      mockRepoService,
      mockEventBus
    );

    await expect(
      usecase({
        ...validPayload,
        entityType:
          'Company' as unknown as typeof EAccountingEntityType.Individual,
      })
    ).rejects.toThrow(ErrorUnprocessableEntity);
  });

  it('should throw ErrorResourceNotFound if functional currency code is invalid', async () => {
    MockRequestContext.get.mockReturnValue({
      correlationId: 'test-corr-id',
      user: {
        id: '123e4567-e89b-12d3-a456-426614174003' as TEntityId,
      } as unknown as IUser,
    } as unknown as IRequestContextData);

    const usecase = makeOnboardAccountingEntityUseCase(
      MockRequestContext,
      mockAccountingEntityRepo,
      mockUserPreferencesRepo,
      mockLedgerAccountRepo,
      mockDomainServices.userPreferences,
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

  it('should throw Zod error for unsupported operating country code', async () => {
    const usecase = makeOnboardAccountingEntityUseCase(
      MockRequestContext,
      mockAccountingEntityRepo,
      mockUserPreferencesRepo,
      mockLedgerAccountRepo,
      mockDomainServices.userPreferences,
      mockRepoService,
      mockEventBus
    );

    await expect(
      usecase({
        ...validPayload,
        operatingCountryCode:
          'UNKNOWN' as unknown as typeof validPayload.operatingCountryCode,
      })
    ).rejects.toThrow(ErrorUnprocessableEntity);
  });
});
