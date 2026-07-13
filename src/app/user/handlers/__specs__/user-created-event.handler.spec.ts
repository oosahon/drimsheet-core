import { EUserEvents } from '../../../../domain/user/events/user.events';
import { IUser } from '../../../../domain/user/types/user.types';
import eventError from '../../../../shared/events/event.error';
import { IEvent } from '../../../../shared/events/types/event.types';
import { TEntityId } from '../../../../shared/types/uuid';
import makeUserCreatedEventHandler from '../user-created-event.handler';

import MockReporter from '../../../../shared/contracts/__mocks__/reporter.contract.mock';
import mockAppContext from '../../../_internal/contracts/__mocks__/app-context.contract.mock';
import { IAppContextData } from '../../../_internal/contracts/app-context.contract';

describe('makeUserCreatedEventHandler', () => {
  const sendEmailVerificationEmail = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const validUserId = '00000000-0000-0000-0000-000000000001' as TEntityId;

  const validUserData: IUser = {
    id: validUserId,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    emailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const getValidEvent = (correlationId = 'corr-id-1'): IEvent<IUser> => ({
    type: EUserEvents.Created,
    correlationId,
    occurredAt: new Date(),
    enrichedAt: null,
    data: validUserData,
  });

  it('should successfully handle Created event and send verification email if not verified', async () => {
    const handler = makeUserCreatedEventHandler({
      reporter: MockReporter,
      appContext: mockAppContext,
      sendEmailVerificationEmail,
    });
    const mockEvent = getValidEvent();

    mockAppContext.get.mockReturnValue({
      correlationId: 'default-corr-id',
    } as IAppContextData);

    sendEmailVerificationEmail.mockResolvedValue(undefined);

    await handler(mockEvent);

    expect(mockAppContext.set).toHaveBeenCalledWith({
      correlationId: mockEvent.correlationId,
    });
    expect(sendEmailVerificationEmail).toHaveBeenCalledWith(
      mockEvent.data.email
    );
  });

  it('should generate a correlationId if not provided in the event', async () => {
    const handler = makeUserCreatedEventHandler({
      reporter: MockReporter,
      appContext: mockAppContext,
      sendEmailVerificationEmail,
    });
    const mockEvent: IEvent<IUser> = {
      type: EUserEvents.Created,
      occurredAt: new Date(),
      enrichedAt: null,
      data: validUserData,
    };

    mockAppContext.get.mockReturnValue({
      correlationId: 'default-corr-id',
    } as IAppContextData);

    sendEmailVerificationEmail.mockResolvedValue(undefined);

    await handler(mockEvent);

    expect(mockAppContext.set).toHaveBeenCalledWith({
      correlationId: expect.any(String),
    });
    expect(sendEmailVerificationEmail).toHaveBeenCalledWith(
      mockEvent.data.email
    );
  });

  it('should successfully handle Created event and NOT send verification email if already verified', async () => {
    const handler = makeUserCreatedEventHandler({
      reporter: MockReporter,
      appContext: mockAppContext,
      sendEmailVerificationEmail,
    });
    const mockEvent = getValidEvent();
    mockEvent.data = { ...validUserData, emailVerified: true };

    mockAppContext.get.mockReturnValue({
      correlationId: 'default-corr-id',
    } as IAppContextData);

    await handler(mockEvent);

    expect(sendEmailVerificationEmail).not.toHaveBeenCalled();
  });

  it('should throw and report if event type is invalid', async () => {
    const handler = makeUserCreatedEventHandler({
      reporter: MockReporter,
      appContext: mockAppContext,
      sendEmailVerificationEmail,
    });
    const mockEvent = getValidEvent();
    mockEvent.type = 'INVALID_EVENT' as keyof typeof EUserEvents;

    await handler(mockEvent);

    expect(MockReporter.report).toHaveBeenCalledTimes(1);
    expect(MockReporter.report.mock.calls[0][0]).toBeInstanceOf(
      eventError.EventTypeMismatch
    );

    expect(sendEmailVerificationEmail).not.toHaveBeenCalled();
  });

  it('should report an error if sendEmailVerificationEmail fails', async () => {
    const handler = makeUserCreatedEventHandler({
      reporter: MockReporter,
      appContext: mockAppContext,
      sendEmailVerificationEmail,
    });
    const mockEvent = getValidEvent();

    const error = new Error('Email Error');
    sendEmailVerificationEmail.mockRejectedValue(error);

    await handler(mockEvent);

    expect(MockReporter.report).toHaveBeenCalledWith(error);
  });
});
