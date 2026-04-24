import userActivityEntity from '../../../../domain/user/entities/user-activity.entity';
import { EUserEvents } from '../../../../domain/user/events/user.events';
import mockUserActivityRepo from '../../../../infra/persistence/repos/__mocks__/user-activity.repo.impl.mock';
import { IEvent } from '../../../../shared/types/event.types';
import { TEntityId } from '../../../../shared/types/uuid';
import MockRequestContext from '../../../contracts/app/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../contracts/app/request-context.contract';
import makeSaveUserActivityUseCase from '../save-activity.usecase';

jest.mock('../../../../domain/user/entities/user-activity.entity', () => ({
  make: jest.fn(),
}));

describe('makeSaveUserActivityUseCase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save user activity successfully with description from map', async () => {
    const correlationId = 'test-corr-id';
    MockRequestContext.get.mockReturnValue({
      correlationId,
    } as IRequestContextData);

    const userId = 'user-id' as TEntityId;
    const event = {
      type: EUserEvents.Created,
      data: {},
      occurredAt: new Date(),
      enrichedAt: new Date(),
      correlationId: 'event-corr-id',
    } as IEvent<unknown>;

    const mockActivityEntity = { id: 'activity-id' };
    (userActivityEntity.make as jest.Mock).mockReturnValue(mockActivityEntity);

    const usecase = makeSaveUserActivityUseCase(
      MockRequestContext,
      mockUserActivityRepo
    );

    await usecase(userId, event);

    expect(MockRequestContext.get).toHaveBeenCalledTimes(1);
    expect(userActivityEntity.make).toHaveBeenCalledWith({
      userId,
      eventKey: event.type,
      description: 'Signed up to Purple Ledger.',
      meta: { correlationId },
    });
    expect(mockUserActivityRepo.save).toHaveBeenCalledWith(mockActivityEntity, {
      correlationId,
    });
  });

  it('should handle unmapped event types gracefully', async () => {
    const correlationId = 'test-corr-id';
    MockRequestContext.get.mockReturnValue({
      correlationId,
    } as IRequestContextData);

    const userId = 'user-id' as TEntityId;
    const event = {
      type: 'unknown.event',
      data: {},
      occurredAt: new Date(),
      enrichedAt: new Date(),
      correlationId: 'event-corr-id',
    } as IEvent<unknown>;

    const mockActivityEntity = { id: 'activity-id' };
    (userActivityEntity.make as jest.Mock).mockReturnValue(mockActivityEntity);

    const usecase = makeSaveUserActivityUseCase(
      MockRequestContext,
      mockUserActivityRepo
    );

    await usecase(userId, event);

    expect(userActivityEntity.make).toHaveBeenCalledWith({
      userId,
      eventKey: event.type,
      description: '',
      meta: { correlationId },
    });
    expect(mockUserActivityRepo.save).toHaveBeenCalledWith(mockActivityEntity, {
      correlationId,
    });
  });
});
