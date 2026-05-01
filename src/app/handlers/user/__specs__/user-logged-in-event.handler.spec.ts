import { EUserEvents } from '../../../../domain/user/events/user.events';
import { IUser } from '../../../../domain/user/types/user.types';
import eventError from '../../../../shared/errors/event.error';
import { IEvent } from '../../../../shared/types/event.types';
import { TEntityId } from '../../../../shared/types/uuid';
import makeUserLoggedInEventHandler from '../user-logged-in-event.handler';

import MockReporter from '../../../../infra/observability/__mocks__/reporter.mock';
import mockRequestContext from '../../../contracts/app/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../contracts/app/request-context.contract';
import userUseCase from '../../../usecases/user';

jest.mock('../../../usecases/user', () => ({
  __esModule: true,
  default: {
    saveActivity: jest.fn(),
  },
}));

describe('makeUserLoggedInEventHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validUserId = '00000000-0000-0000-0000-000000000001' as TEntityId;

  const validUserData: IUser = {
    id: validUserId,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const getValidEvent = (correlationId = 'corr-id-1'): IEvent<IUser> => ({
    type: EUserEvents.LoggedIn,
    correlationId,
    occurredAt: new Date(),
    enrichedAt: null,
    data: validUserData,
  });

  it('should successfully handle LoggedIn event', async () => {
    const handler = makeUserLoggedInEventHandler(
      MockReporter,
      mockRequestContext
    );
    const mockEvent = getValidEvent();

    mockRequestContext.get.mockReturnValue({
      correlationId: 'default-corr-id',
    } as IRequestContextData);

    (userUseCase.saveActivity as jest.Mock).mockResolvedValue(undefined);

    await handler(mockEvent);

    expect(mockRequestContext.set).toHaveBeenCalledWith({
      correlationId: mockEvent.correlationId,
    });
    expect(userUseCase.saveActivity).toHaveBeenCalledWith(
      mockEvent.data.id,
      mockEvent
    );
  });

  it('should generate a correlationId if not provided in the event', async () => {
    const handler = makeUserLoggedInEventHandler(
      MockReporter,
      mockRequestContext
    );
    const mockEvent: IEvent<IUser> = {
      type: EUserEvents.LoggedIn,
      occurredAt: new Date(),
      enrichedAt: null,
      data: validUserData,
    };

    mockRequestContext.get.mockReturnValue({
      correlationId: 'default-corr-id',
    } as IRequestContextData);

    (userUseCase.saveActivity as jest.Mock).mockResolvedValue(undefined);

    await handler(mockEvent);

    expect(mockRequestContext.set).toHaveBeenCalledWith({
      correlationId: expect.any(String),
    });
    expect(userUseCase.saveActivity).toHaveBeenCalledWith(
      mockEvent.data.id,
      mockEvent
    );
  });

  it('should throw and report if event type is invalid', async () => {
    const handler = makeUserLoggedInEventHandler(
      MockReporter,
      mockRequestContext
    );
    const mockEvent = getValidEvent();
    mockEvent.type = 'INVALID_EVENT' as keyof typeof EUserEvents;

    await handler(mockEvent);

    expect(MockReporter.report).toHaveBeenCalledTimes(1);
    expect(MockReporter.report.mock.calls[0][0]).toBeInstanceOf(
      eventError.EventTypeMismatch
    );

    expect(userUseCase.saveActivity).not.toHaveBeenCalled();
  });

  it('should report an error if saveActivity fails', async () => {
    const handler = makeUserLoggedInEventHandler(
      MockReporter,
      mockRequestContext
    );
    const mockEvent = getValidEvent();

    const error = new Error('DB Error');
    (userUseCase.saveActivity as jest.Mock).mockRejectedValue(error);

    await handler(mockEvent);

    expect(MockReporter.report).toHaveBeenCalledWith(error);
  });
});
