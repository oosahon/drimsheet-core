import mockEventBus from '@shared/contracts/__mocks__/event-bus.mock';
import { TEntityId } from '@shared/types/uuid';
import appError from '@shared/values/errors/app.error';
import { IEvent } from '@shared/values/events/types/event.types';

import { IAccountingEntity } from '@domain/accounting/types/accounting-entity.types';
import { IUserPreferences } from '@domain/user/types/user-preferences.types';
import { IUser } from '@domain/user/types/user.types';

import accountingAppError from '@app/accounting/errors/accounting.error';
import makeSwitchAccountingEntityUsecase from '@app/accounting/usecases/switch-accounting-entity.usecase';
import mockAppContext from '@app/context/contracts/__mocks__/app-context.mock';
import mockUserPreferencesAppService from '@app/user/contracts/__mocks__/user-preferences-app.service.mock';

describe('switchAccountingEntityUsecase', () => {
  const correlationId = 'test-correlation-id';
  const userId = '123e4567-e89b-12d3-a456-426614174000' as TEntityId;
  const currentAccountingEntity: IAccountingEntity = {
    id: '123e4567-e89b-12d3-a456-426614174001' as TEntityId,
    ownerId: userId,
    name: 'Current Entity',
    type: 'individual',
    functionalCurrencyCode: 'USD',
    jurisdictionCode: 'US',
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date('2026-08-01T00:00:00.000Z'),
  };
  const targetAccountingEntity: IAccountingEntity = {
    ...currentAccountingEntity,
    id: '123e4567-e89b-12d3-a456-426614174002' as TEntityId,
    name: 'Target Entity',
  };
  const selectionEvent: IEvent<IUserPreferences> = {
    type: 'domain:user:preferences-updated',
    data: {
      id: userId,
      appPreferences: {},
      lastActiveAccountingEntityId: targetAccountingEntity.id,
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
      updatedAt: new Date('2026-08-02T00:00:00.000Z'),
    },
    occurredAt: new Date('2026-08-02T00:00:00.000Z'),
    enrichedAt: null,
  };

  const getUsecase = () =>
    makeSwitchAccountingEntityUsecase({
      appContext: mockAppContext,
      userPreferencesAppService: mockUserPreferencesAppService,
      eventBus: mockEventBus,
    });

  beforeEach(() => {
    jest.clearAllMocks();

    mockAppContext.get.mockReset().mockReturnValue({
      user: { id: userId } as IUser,
      accountingEntity: currentAccountingEntity,
      correlationId,
    } as ReturnType<typeof mockAppContext.get>);
    mockAppContext.set.mockReset();
    mockUserPreferencesAppService.setActiveAccountingEntity
      .mockReset()
      .mockResolvedValue({
        accountingEntity: targetAccountingEntity,
        events: [selectionEvent],
      });
    mockEventBus.publish.mockReset().mockResolvedValue();
  });

  it('switches the request context to an owned accounting entity', async () => {
    const result = await getUsecase()({
      accountingEntityId: targetAccountingEntity.id,
    });

    expect(result).toBe(targetAccountingEntity);
    expect(
      mockUserPreferencesAppService.setActiveAccountingEntity
    ).toHaveBeenCalledWith(userId, targetAccountingEntity.id, {
      correlationId,
    });
    expect(mockAppContext.set).toHaveBeenCalledWith({
      accountingEntity: targetAccountingEntity,
    });
    expect(mockEventBus.publish).toHaveBeenCalledWith([
      expect.objectContaining({
        type: selectionEvent.type,
        correlationId,
        data: selectionEvent.data,
      }),
    ]);
    expect(mockAppContext.set.mock.invocationCallOrder[0]).toBeLessThan(
      mockEventBus.publish.mock.invocationCallOrder[0]
    );
  });

  it('resolves and sets an entity that is already current', async () => {
    mockAppContext.get.mockReturnValue({
      user: { id: userId } as IUser,
      accountingEntity: targetAccountingEntity,
      correlationId,
    } as ReturnType<typeof mockAppContext.get>);

    const result = await getUsecase()({
      accountingEntityId: targetAccountingEntity.id,
    });

    expect(result).toBe(targetAccountingEntity);
    expect(
      mockUserPreferencesAppService.setActiveAccountingEntity
    ).toHaveBeenCalledTimes(1);
    expect(mockAppContext.set).toHaveBeenCalledWith({
      accountingEntity: targetAccountingEntity,
    });
  });

  it('rejects malformed input before reading or mutating dependencies', async () => {
    await expect(
      getUsecase()({ accountingEntityId: 'not-a-uuid' })
    ).rejects.toThrow(appError.UnprocessableEntity);

    expect(mockAppContext.get).not.toHaveBeenCalled();
    expect(
      mockUserPreferencesAppService.setActiveAccountingEntity
    ).not.toHaveBeenCalled();
    expect(mockAppContext.set).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('does not disclose an unknown or inaccessible accounting entity', async () => {
    mockUserPreferencesAppService.setActiveAccountingEntity.mockRejectedValue(
      new accountingAppError.ActiveEntityNotFound()
    );

    await expect(
      getUsecase()({ accountingEntityId: targetAccountingEntity.id })
    ).rejects.toThrow(accountingAppError.ActiveEntityNotFound);

    expect(
      mockUserPreferencesAppService.setActiveAccountingEntity
    ).toHaveBeenCalledWith(userId, targetAccountingEntity.id, {
      correlationId,
    });
    expect(mockAppContext.set).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });

  it('leaves context unchanged when preference persistence fails', async () => {
    const persistenceFailure = new Error('preference persistence failed');
    mockUserPreferencesAppService.setActiveAccountingEntity.mockRejectedValue(
      persistenceFailure
    );

    await expect(
      getUsecase()({ accountingEntityId: targetAccountingEntity.id })
    ).rejects.toBe(persistenceFailure);

    expect(mockAppContext.set).not.toHaveBeenCalled();
    expect(mockEventBus.publish).not.toHaveBeenCalled();
  });
});
