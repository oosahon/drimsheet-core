import MockReporter from '@shared/contracts/__mocks__/reporter.mock';
import { TEntityId } from '@shared/types/uuid';
import eventError from '@shared/values/events/event.error';
import { IEvent } from '@shared/values/events/types/event.types';

import { EUserEvents } from '@domain/user/events/user.events';
import { IUser } from '@domain/user/types/user.types';

import mockAppContext from '@app/context/contracts/__mocks__/app-context.mock';
import { IAppContextData } from '@app/context/contracts/app-context.contract';
import makeUserEmailVerifiedEventHandler from '@app/user/handlers/user-email-verified-event.handler';

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
    const handler = makeUserEmailVerifiedEventHandler({
      reporter: MockReporter,
      appContext: mockAppContext,
    });
    const mockEvent = getValidEvent();

    mockAppContext.get.mockReturnValue({
      correlationId: 'default-corr-id',
    } as IAppContextData);

    await handler(mockEvent);

    expect(mockAppContext.set).toHaveBeenCalledWith({
      correlationId: mockEvent.correlationId,
    });
  });

  it('should generate a correlationId if not provided in the event', async () => {
    const handler = makeUserEmailVerifiedEventHandler({
      reporter: MockReporter,
      appContext: mockAppContext,
    });
    const mockEvent: IEvent<IUser> = {
      type: EUserEvents.EmailVerified,
      occurredAt: new Date(),
      enrichedAt: null,
      data: validUserData,
    };

    mockAppContext.get.mockReturnValue({
      correlationId: 'default-corr-id',
    } as IAppContextData);

    await handler(mockEvent);

    expect(mockAppContext.set).toHaveBeenCalledWith({
      correlationId: expect.any(String),
    });
  });

  it('should throw if event type is invalid', async () => {
    const handler = makeUserEmailVerifiedEventHandler({
      reporter: MockReporter,
      appContext: mockAppContext,
    });
    const mockEvent = getValidEvent();
    mockEvent.type = 'INVALID_EVENT' as keyof typeof EUserEvents;

    await expect(handler(mockEvent)).rejects.toThrow(
      eventError.EventTypeMismatch
    );
  });
});
