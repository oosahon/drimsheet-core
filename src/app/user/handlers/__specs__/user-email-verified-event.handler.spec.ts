import { EUserEvents } from '../../../../domain/user/events/user.events';
import { IUser } from '../../../../domain/user/types/user.types';
import eventError from '../../../../shared/errors/event.error';
import { IEvent } from '../../../../shared/types/event.types';
import { TEntityId } from '../../../../shared/types/uuid';
import makeUserEmailVerifiedEventHandler from '../user-email-verified-event.handler';

import MockReporter from '../../../../infra/observability/__mocks__/reporter.mock';
import mockRequestContext from '../../../../infra/services/__mocks__/request-context.mock';
import { IRequestContextData } from '../../../../shared/contracts/request-context.contract';

describe('makeUserEmailVerifiedEventHandler', () => {
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
    type: EUserEvents.EmailVerified,
    correlationId,
    occurredAt: new Date(),
    enrichedAt: null,
    data: validUserData,
  });

  it('should successfully handle EmailVerified event', async () => {
    const handler = makeUserEmailVerifiedEventHandler(
      MockReporter,
      mockRequestContext
    );
    const mockEvent = getValidEvent();

    mockRequestContext.get.mockReturnValue({
      correlationId: 'default-corr-id',
    } as IRequestContextData);

    await handler(mockEvent);

    expect(mockRequestContext.set).toHaveBeenCalledWith({
      correlationId: mockEvent.correlationId,
    });
  });

  it('should generate a correlationId if not provided in the event', async () => {
    const handler = makeUserEmailVerifiedEventHandler(
      MockReporter,
      mockRequestContext
    );
    const mockEvent: IEvent<IUser> = {
      type: EUserEvents.EmailVerified,
      occurredAt: new Date(),
      enrichedAt: null,
      data: validUserData,
    };

    mockRequestContext.get.mockReturnValue({
      correlationId: 'default-corr-id',
    } as IRequestContextData);

    await handler(mockEvent);

    expect(mockRequestContext.set).toHaveBeenCalledWith({
      correlationId: expect.any(String),
    });
  });

  it('should throw if event type is invalid', async () => {
    const handler = makeUserEmailVerifiedEventHandler(
      MockReporter,
      mockRequestContext
    );
    const mockEvent = getValidEvent();
    mockEvent.type = 'INVALID_EVENT' as keyof typeof EUserEvents;

    await expect(handler(mockEvent)).rejects.toThrow(
      eventError.EventTypeMismatch
    );
  });
});
